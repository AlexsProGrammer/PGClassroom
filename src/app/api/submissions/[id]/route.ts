import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const submissionId = Number(id)
  if (Number.isNaN(submissionId)) {
    return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 })
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  })

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: submission.id,
    status: submission.status,
    stdout: submission.stdout,
    stderr: submission.stderr,
    compile_output: submission.compile_output,
    runCode: submission.runCode,
  })
}
