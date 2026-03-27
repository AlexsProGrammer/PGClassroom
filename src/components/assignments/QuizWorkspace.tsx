"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, Send } from "lucide-react"

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
}

interface QuizWorkspaceProps {
  assignmentId: number
  questions: QuizQuestion[]
}

export function QuizWorkspace({ assignmentId, questions }: QuizWorkspaceProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{
    points: number | null
    status: string
  } | null>(null)
  const [error, setError] = useState("")

  const answeredCount = Object.keys(answers).length
  const totalCount = questions.length

  async function handleSubmit() {
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, answers }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Submission failed")
      }

      setResult({ points: data.points, status: data.status })
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted && result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle2 className="size-12 text-green-500" />
          <h2 className="text-xl font-bold">Quiz Submitted!</h2>
          <p className="text-muted-foreground">
            Your answers have been recorded.
          </p>
          {result.points != null && (
            <Badge variant="default" className="text-lg px-4 py-1">
              Score: {result.points} points
            </Badge>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {answeredCount} of {totalCount} questions answered
        </p>
      </div>

      {questions.map((question, qIndex) => (
        <Card key={question.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <span className="text-muted-foreground mr-2">Q{qIndex + 1}.</span>
              {question.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[question.id] != null ? String(answers[question.id]) : undefined}
              onValueChange={(value: string) => {
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: Number(value),
                }))
              }}
            >
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-3 py-1">
                  <RadioGroupItem value={String(optIndex)} />
                  <Label htmlFor={undefined} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || answeredCount < totalCount}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send className="mr-2 size-4" />
            Submit Quiz ({answeredCount}/{totalCount})
          </>
        )}
      </Button>
    </div>
  )
}
