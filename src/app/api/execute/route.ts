import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { executeQueue } from '@/lib/queue'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = Number(session.user.id)
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

    // Upsert a submission in PENDING state (one per user per assignment)
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_userId: { assignmentId: Number(assignmentId), userId },
      },
      update: {
        code,
        status: 'PENDING',
        stdout: null,
        stderr: null,
        compile_output: null,
        runCode: null,
      },
      create: {
        assignmentId: Number(assignmentId),
        userId,
        code,
      },
    })

    // Enqueue the execution job
    const job = await executeQueue.add('execute', {
      submissionId: submission.id,
      code,
      language: assignment.language,
      languageVersion: assignment.languageVersion,
    })

    return NextResponse.json(
      {
        jobId: job.id,
        submissionId: submission.id,
        status: 'PENDING',
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('Error enqueuing execution:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to enqueue execution'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
