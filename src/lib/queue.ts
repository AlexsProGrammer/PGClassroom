import { Queue, Worker, Job } from "bullmq"
import IORedis from "ioredis"
import { SubmissionStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

interface PistonStageResult {
  stdout: string
  stderr: string
  output: string
  code: number | null
  signal: string | null
  message: string | null
  status: string | null
  cpu_time: number
  wall_time: number
  memory: number
}

interface PistonResponse {
  language: string
  version: string
  run: PistonStageResult
  compile?: PistonStageResult
}

export interface ExecuteJobData {
  submissionId: number
  code: string
  language: string
  languageVersion: string
}

function deriveStatus(result: PistonResponse): SubmissionStatus {
  const compile = result.compile
  if (compile && (compile.code !== 0 || compile.status)) {
    return SubmissionStatus.COMPILATION_ERROR
  }

  const run = result.run
  if (
    run.status === "TO" ||
    run.status === "SG" ||
    run.status === "OL" ||
    run.status === "EL" ||
    run.status === "XX" ||
    run.status === "RE"
  ) {
    return SubmissionStatus.RUNTIME_ERROR
  }
  if (run.code === 0) return SubmissionStatus.ACCEPTED
  return SubmissionStatus.RUNTIME_ERROR
}

const redisUrl = process.env.REDIS_URL || "redis://localhost:6380"
const redisOpts = { maxRetriesPerRequest: null } as const

function createConnection() {
  return new IORedis(redisUrl, redisOpts)
}

export const executeQueue = new Queue<ExecuteJobData>("execute", {
  connection: createConnection(),
})

async function processExecuteJob(job: Job<ExecuteJobData>) {
  const { submissionId, code, language, languageVersion } = job.data

  // Mark as RUNNING
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: SubmissionStatus.RUNNING },
  })

  const pistonUrl = process.env.PISTON_URL || "http://piston:2000"
  const files: { name?: string; content: string }[] = [{ content: code }]

  if (language === "java") {
    files[0].name = "Main.java"
  }

  const pistonResponse = await fetch(`${pistonUrl}/api/v2/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language,
      version: languageVersion,
      files,
      run_timeout: 3000,
      compile_timeout: 10000,
      run_memory_limit: 256_000_000,
    }),
  })

  if (!pistonResponse.ok) {
    const errBody = await pistonResponse.json().catch(() => null)
    const msg =
      errBody?.message ??
      `${pistonResponse.status} ${pistonResponse.statusText}`
    throw new Error(`Piston error: ${msg}`)
  }

  const pistonResult: PistonResponse = await pistonResponse.json()

  const status = deriveStatus(pistonResult)
  const compileOutput =
    pistonResult.compile?.stderr || pistonResult.compile?.message || ""

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status,
      stdout: pistonResult.run.stdout || "",
      stderr: pistonResult.run.stderr || "",
      compile_output: compileOutput,
      runCode: pistonResult.run.code,
    },
  })

  return { submissionId, status }
}

export const executeWorker = new Worker<ExecuteJobData>(
  "execute",
  processExecuteJob,
  {
    connection: createConnection(),
    concurrency: 3,
  }
)

executeWorker.on("failed", (job, err) => {
  console.error(`[queue] Job ${job?.id} failed:`, err.message)

  if (job?.data.submissionId) {
    prisma.submission
      .update({
        where: { id: job.data.submissionId },
        data: { status: SubmissionStatus.RUNTIME_ERROR },
      })
      .catch((updateErr) =>
        console.error("[queue] Failed to update submission on error:", updateErr)
      )
  }
})

executeWorker.on("completed", (job) => {
  console.log(`[queue] Job ${job.id} completed for submission ${job.data.submissionId}`)
})
