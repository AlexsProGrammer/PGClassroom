import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const pistonUrl = process.env.PISTON_URL || 'http://localhost:2000'
    const response = await fetch(`${pistonUrl}/api/v2/runtimes`)

    if (!response.ok) {
      throw new Error(`Piston error: ${response.status} ${response.statusText}`)
    }

    const runtimes = await response.json()
    return NextResponse.json(runtimes)
  } catch (error) {
    console.error('Error fetching runtimes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch runtimes' },
      { status: 500 }
    )
  }
}
