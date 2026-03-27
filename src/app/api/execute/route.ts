import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { executeQueue } from '@/lib/queue'

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

    // Create a submission in PENDING state
    const submission = await prisma.submission.create({
      data: {
        assignmentId: Number(assignmentId),
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
