import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await auth()
  if (!session?.user?.role || !["EDITOR", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { assignmentId } = await params
  const id = Number(assignmentId)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 })
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id },
  })

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { id: "asc" },
  })

  return NextResponse.json({ assignment, submissions })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await auth()
  if (!session?.user?.role || !["EDITOR", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { assignmentId } = await params
  const aId = Number(assignmentId)
  if (Number.isNaN(aId)) {
    return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 })
  }

  const body = await request.json()
  const { submissionId, points, tutorFeedback } = body as {
    submissionId: number
    points: number
    tutorFeedback: string
  }

  if (typeof submissionId !== "number" || typeof points !== "number") {
    return NextResponse.json(
      { error: "submissionId and points are required numbers" },
      { status: 400 }
    )
  }

  // Verify submission belongs to this assignment
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  })

  if (!submission || submission.assignmentId !== aId) {
    return NextResponse.json(
      { error: "Submission not found for this assignment" },
      { status: 404 }
    )
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      points,
      tutorFeedback: typeof tutorFeedback === "string" ? tutorFeedback : null,
      status: "MANUALLY_GRADED",
    },
  })

  return NextResponse.json(updated)
}
