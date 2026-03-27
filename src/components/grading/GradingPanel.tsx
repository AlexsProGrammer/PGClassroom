"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, MessageSquare } from "lucide-react"

interface GradingPanelProps {
  submissionId: number
  assignmentId: number
  currentStatus: string
  currentPoints: number | null
  currentFeedback: string | null
  aiFeedback: string | null
}

export function GradingPanel({
  submissionId,
  assignmentId,
  currentStatus,
  currentPoints,
  currentFeedback,
  aiFeedback,
}: GradingPanelProps) {
  const router = useRouter()
  const [points, setPoints] = useState(
    currentPoints != null ? String(currentPoints) : ""
  )
  const [feedback, setFeedback] = useState(currentFeedback ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  async function handleGrade() {
    const parsedPoints = Number(points)
    if (points === "" || Number.isNaN(parsedPoints) || parsedPoints < 0) {
      setError("Points must be a non-negative number")
      return
    }

    setSaving(true)
    setError("")
    setSaved(false)

    try {
      const res = await fetch(`/api/grading/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          points: parsedPoints,
          tutorFeedback: feedback,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save grade")
        return
      }

      setSaved(true)
      router.refresh()
    } catch {
      setError("Failed to save grade")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Grade Submission</CardTitle>
          <CardDescription>
            Submission #{submissionId} &middot;{" "}
            <Badge
              variant={
                currentStatus === "MANUALLY_GRADED" ||
                currentStatus === "AI_GRADED" ||
                currentStatus === "ACCEPTED"
                  ? "default"
                  : "secondary"
              }
              className="ml-1"
            >
              {currentStatus.replace("_", " ")}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Tutor Feedback</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              placeholder="Write feedback for the student..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {saved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="size-4" />
              Grade saved successfully
            </div>
          )}

          <Button
            onClick={handleGrade}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save & Mark as Graded"
            )}
          </Button>
        </CardContent>
      </Card>

      {aiFeedback && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4" />
              AI Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {aiFeedback}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
