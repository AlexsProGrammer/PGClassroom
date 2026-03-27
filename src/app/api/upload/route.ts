import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const UPLOADS_DIR = path.join(process.cwd(), "src", "uploads")

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.user.id)

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const assignmentIdRaw = formData.get("assignmentId")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file field" },
        { status: 400 }
      )
    }

    if (!assignmentIdRaw || typeof assignmentIdRaw !== "string") {
      return NextResponse.json(
        { error: "Missing assignmentId field" },
        { status: 400 }
      )
    }

    const assignmentId = Number(assignmentIdRaw)
    if (Number.isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignmentId" },
        { status: 400 }
      )
    }

    // Validate assignment exists and is of type UPLOAD
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    if (assignment.type !== "UPLOAD") {
      return NextResponse.json(
        { error: "Assignment does not accept file uploads" },
        { status: 400 }
      )
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 400 }
      )
    }

    // Read file bytes and validate PDF magic bytes
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x25 || // %
      bytes[1] !== 0x50 || // P
      bytes[2] !== 0x44 || // D
      bytes[3] !== 0x46    // F
    ) {
      return NextResponse.json(
        { error: "File is not a valid PDF" },
        { status: 400 }
      )
    }

    // Build secure file path: uploads/[assignmentId]/[userId].pdf
    const dir = path.join(UPLOADS_DIR, String(assignmentId))
    await mkdir(dir, { recursive: true })

    const filename = `${userId}.pdf`
    const filePath = path.join(dir, filename)

    await writeFile(filePath, bytes)

    // Relative path stored in DB for portability
    const relativeFilePath = `${assignmentId}/${filename}`

    // Upsert submission: one upload per user per assignment
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_userId: { assignmentId, userId },
      },
      update: {
        filePath: relativeFilePath,
        status: "PENDING",
      },
      create: {
        assignmentId,
        userId,
        code: "",
        filePath: relativeFilePath,
        status: "PENDING",
      },
    })

    return NextResponse.json(
      {
        submissionId: submission.id,
        filePath: relativeFilePath,
        status: submission.status,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    )
  }
}
