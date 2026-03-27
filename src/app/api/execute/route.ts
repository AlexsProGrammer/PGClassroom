import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

function deriveStatus(result: PistonResponse): string {
  const compile = result.compile
  if (compile && (compile.code !== 0 || compile.status)) {
    return 'Compilation Error'
  }

  const run = result.run
  if (run.status === 'TO') return 'Time Limit Exceeded'
  if (run.status === 'SG') return 'Signal Error'
  if (run.status === 'RE') return 'Runtime Error'
  if (run.status === 'OL') return 'Output Limit Exceeded'
  if (run.status === 'EL') return 'Stderr Limit Exceeded'
  if (run.status === 'XX') return 'Internal Error'
  if (run.code === 0) return 'Accepted'
  return 'Runtime Error'
}

export async function POST(request: NextRequest) {
  try {
    const { code, assignmentId } = await request.json()

    if (!code || !assignmentId) {
      return NextResponse.json(
        { error: 'Missing required fields: code, assignmentId' },
        { status: 400 }
      )
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: Number(assignmentId) },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Build Piston execute request
    const pistonUrl = process.env.PISTON_URL || 'http://localhost:2000'
    const files: { name?: string; content: string }[] = [{ content: code }]

    // Java requires the file to be named Main.java
    if (assignment.language === 'java') {
      files[0].name = 'Main.java'
    }

    const pistonResponse = await fetch(`${pistonUrl}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: assignment.language,
        version: assignment.languageVersion,
        files,
        run_timeout: 3000,
        compile_timeout: 10000,
        run_memory_limit: 256_000_000,
      }),
    })

    if (!pistonResponse.ok) {
      const errBody = await pistonResponse.json().catch(() => null)
      const msg = errBody?.message ?? `${pistonResponse.status} ${pistonResponse.statusText}`
      throw new Error(`Piston error: ${msg}`)
    }

    const pistonResult: PistonResponse = await pistonResponse.json()

    const status = deriveStatus(pistonResult)
    const compileOutput =
      pistonResult.compile?.stderr || pistonResult.compile?.message || ''

    const submission = await prisma.submission.create({
      data: {
        assignmentId: Number(assignmentId),
        code,
        status,
        stdout: pistonResult.run.stdout || '',
        stderr: pistonResult.run.stderr || '',
        compile_output: compileOutput,
        runCode: pistonResult.run.code,
      },
    })

    return NextResponse.json(
      {
        submission,
        status,
        stdout: pistonResult.run.stdout,
        stderr: pistonResult.run.stderr,
        compile_output: compileOutput,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error executing code:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to execute code'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
