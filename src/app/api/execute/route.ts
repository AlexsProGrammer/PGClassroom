import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Judge0Submission {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  message: string | null
  status: {
    id: number
    description: string
  }
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

    // Fetch assignment to get language_id
    const assignment = await prisma.assignment.findUnique({
      where: { id: Number(assignmentId) },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Send code to Judge0
    const judge0Url = process.env.JUDGE0_URL || 'http://localhost:2358'
    const judge0Response = await fetch(
      `${judge0Url}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: assignment.language_id,
        }),
      }
    )

    if (!judge0Response.ok) {
      throw new Error(
        `Judge0 error: ${judge0Response.status} ${judge0Response.statusText}`
      )
    }

    const judge0Result: Judge0Submission = await judge0Response.json()

    // Use message as fallback for compile_output if compile_output is empty
    const compileOutput = judge0Result.compile_output || judge0Result.message || ''

    // Create submission record in database
    const submission = await prisma.submission.create({
      data: {
        assignmentId: Number(assignmentId),
        code,
        status: judge0Result.status?.description || 'Unknown',
        stdout: judge0Result.stdout || '',
        stderr: judge0Result.stderr || '',
        compile_output: compileOutput,
      },
    })

    return NextResponse.json(
      {
        submission,
        judge0_status: judge0Result.status?.description,
        stdout: judge0Result.stdout,
        stderr: judge0Result.stderr,
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
