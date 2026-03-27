import { NextRequest, NextResponse } from 'next/server'
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
  try {
    const { title, description, language_id, expected_output } =
      await request.json()

    if (!title || !language_id) {
      return NextResponse.json(
        { error: 'Missing required fields: title, language_id' },
        { status: 400 }
      )
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || '',
        language_id,
        expected_output: expected_output || '',
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
