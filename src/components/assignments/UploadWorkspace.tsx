"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle2, Loader2, FileText, X } from "lucide-react"

interface UploadWorkspaceProps {
  assignmentId: number
}

export function UploadWorkspace({ assignmentId }: UploadWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  function handleFileSelect(file: File | undefined) {
    if (!file) return
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10 MB limit.")
      return
    }
    setError("")
    setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("assignmentId", String(assignmentId))

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setUploaded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  if (uploaded) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle2 className="size-12 text-green-500" />
          <h2 className="text-xl font-bold">File Uploaded!</h2>
          <p className="text-muted-foreground">
            Your submission has been received and is pending review.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Upload Your Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <Upload className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drag & drop your PDF here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF files only, max 10 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>

          {selectedFile && (
            <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">PDF</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full sm:w-auto"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="mr-2 size-4" />
            Submit File
          </>
        )}
      </Button>
    </div>
  )
}
