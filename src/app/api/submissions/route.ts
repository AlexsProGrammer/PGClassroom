import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.user.id)

  const body = await request.json()
  const { assignmentId, answers } = body as {
    assignmentId: unknown
    answers: unknown
  }

  if (
    typeof assignmentId !== "number" ||
    !answers ||
    typeof answers !== "object"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid assignmentId / answers" },
      { status: 400 }
    )
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  })

  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  if (assignment.type !== "QUIZ") {
    return NextResponse.json(
      { error: "Assignment is not a quiz" },
      { status: 400 }
    )
  }

  // Auto-grade quiz: compare answers with config.questions[].correctIndex
  const config = assignment.config as {
    questions?: { id: string; correctIndex: number }[]
  } | null

  let points: number | null = null
  let status: "AI_GRADED" | "PENDING" = "PENDING"

  if (config?.questions && config.questions.length > 0) {
    const total = config.questions.length
    let correct = 0
    const typedAnswers = answers as Record<string, number>
    for (const q of config.questions) {
      if (typedAnswers[q.id] === q.correctIndex) correct++
    }
    points = Math.round((correct / total) * 100)
    status = "AI_GRADED"
  }

  const submission = await prisma.submission.upsert({
    where: {
      assignmentId_userId: { assignmentId, userId },
    },
    update: {
      code: JSON.stringify({ answers }),
      status,
      points,
    },
    create: {
      assignmentId,
      userId,
      code: JSON.stringify({ answers }),
      status,
      points,
    },
  })

  return NextResponse.json(
    {
      submissionId: submission.id,
      status: submission.status,
      points: submission.points,
    },
    { status: 201 }
  )
}
