import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: { id: 'desc' },
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (
    !session?.user?.role ||
    !["EDITOR", "TEACHER"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, description, language, languageVersion, expected_output, type, config } =
      body as {
        title: string
        description: string
        language: string
        languageVersion: string
        expected_output: string
        type?: string
        config?: unknown
      }

    if (!title || !language || !languageVersion) {
      return NextResponse.json(
        { error: 'Missing required fields: title, language, languageVersion' },
        { status: 400 }
      )
    }

    const validTypes = ["CODE", "QUIZ", "UPLOAD"]
    const assignmentType = validTypes.includes(type ?? "") ? type! : "CODE"

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || '',
        language,
        languageVersion,
        expected_output: expected_output || '',
        type: assignmentType as "CODE" | "QUIZ" | "UPLOAD",
        config: config ?? undefined,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
