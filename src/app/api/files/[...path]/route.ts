import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const UPLOADS_DIR = path.join(process.cwd(), "src", "uploads")

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const segments = (await params).path
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "Missing file path" }, { status: 400 })
  }

  // Validate path segments contain only safe characters (alphanumeric, dash, underscore, dot)
  const safePattern = /^[a-zA-Z0-9._-]+$/
  for (const segment of segments) {
    if (!safePattern.test(segment) || segment === ".." || segment === ".") {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }
  }

  const filePath = path.join(UPLOADS_DIR, ...segments)

  // Ensure resolved path stays within UPLOADS_DIR (prevent traversal)
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(UPLOADS_DIR)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 403 })
  }

  if (!existsSync(resolved)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const fileBuffer = await readFile(resolved)

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${segments[segments.length - 1]}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
