"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Code2,
  FileQuestion,
  Upload,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react"

type AssignmentType = "CODE" | "QUIZ" | "UPLOAD"

interface QuizQuestion {
  id: string
  text: string
  options: string[]
  correctIndex: number
}

const LANGUAGES = [
  { value: "python", version: "3.12.0", label: "Python" },
  { value: "java", version: "15.0.2", label: "Java" },
  { value: "javascript", version: "18.15.0", label: "JavaScript" },
]

const TYPE_CONFIG: Record<
  AssignmentType,
  { label: string; icon: typeof Code2; description: string }
> = {
  CODE: {
    label: "Code",
    icon: Code2,
    description: "Students write and execute code against expected output",
  },
  QUIZ: {
    label: "Quiz",
    icon: FileQuestion,
    description: "Multiple-choice questions with auto-grading",
  },
  UPLOAD: {
    label: "File Upload",
    icon: Upload,
    description: "Students upload a PDF document for manual review",
  },
}

export function CreateAssignmentDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Shared fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<AssignmentType>("CODE")
  const [language, setLanguage] = useState("python")

  // CODE-specific
  const [expectedOutput, setExpectedOutput] = useState("")

  // QUIZ-specific
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { id: "q1", text: "", options: ["", "", "", ""], correctIndex: 0 },
  ])

  const selectedLang = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0]

  function resetForm() {
    setTitle("")
    setDescription("")
    setType("CODE")
    setLanguage("python")
    setExpectedOutput("")
    setQuestions([
      { id: "q1", text: "", options: ["", "", "", ""], correctIndex: 0 },
    ])
    setError("")
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q${prev.length + 1}`,
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
      },
    ])
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function updateQuestion(index: number, field: string, value: string | number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    )
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === optIndex ? value : o)) }
          : q
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    // Validation
    if (!title.trim()) {
      setError("Title is required")
      setSaving(false)
      return
    }

    if (type === "QUIZ") {
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].text.trim()) {
          setError(`Question ${i + 1} text is required`)
          setSaving(false)
          return
        }
        const filledOptions = questions[i].options.filter((o) => o.trim())
        if (filledOptions.length < 2) {
          setError(`Question ${i + 1} needs at least 2 options`)
          setSaving(false)
          return
        }
      }
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      type,
      language: selectedLang.value,
      languageVersion: selectedLang.version,
      expected_output: type === "CODE" ? expectedOutput : "",
    }

    if (type === "QUIZ") {
      payload.config = {
        questions: questions.map((q, i) => ({
          id: `q${i + 1}`,
          text: q.text.trim(),
          options: q.options.filter((o) => o.trim()),
          correctIndex: q.correctIndex,
        })),
      }
    }

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create assignment")
      }

      resetForm()
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="size-4 mr-1" />
        New Assignment
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Choose a type and fill in the details for the new assignment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type selector */}
          <div className="space-y-2">
            <Label>Assignment Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(TYPE_CONFIG) as [AssignmentType, typeof TYPE_CONFIG.CODE][]).map(
                ([key, cfg]) => {
                  const Icon = cfg.icon
                  const isActive = type === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
                        isActive
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40 hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-5" />
                      <span className="text-sm font-medium">{cfg.label}</span>
                      <span className="text-xs text-muted-foreground leading-tight">
                        {cfg.description}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          </div>

          <Separator />

          {/* Shared fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python Hello World"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for the student…"
                rows={3}
              />
            </div>

            {type !== "QUIZ" && (
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label} ({l.version})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* CODE-specific fields */}
          {type === "CODE" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="expectedOutput">
                  Expected Output{" "}
                  <span className="text-muted-foreground font-normal">
                    (used for auto-grading)
                  </span>
                </Label>
                <Textarea
                  id="expectedOutput"
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  placeholder="Hello World"
                  rows={2}
                  className="font-mono text-sm"
                />
              </div>
            </>
          )}

          {/* QUIZ-specific fields */}
          {type === "QUIZ" && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>
                    Questions{" "}
                    <Badge variant="secondary" className="ml-1">
                      {questions.length}
                    </Badge>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                  >
                    <Plus className="size-3 mr-1" />
                    Add Question
                  </Button>
                </div>
                {questions.map((q, qi) => (
                  <div
                    key={qi}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Question {qi + 1}
                      </span>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeQuestion(qi)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(qi, "text", e.target.value)
                      }
                      placeholder="Enter the question…"
                    />
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correctIndex === oi}
                            onChange={() =>
                              updateQuestion(qi, "correctIndex", oi)
                            }
                            className="accent-primary"
                          />
                          <Input
                            value={opt}
                            onChange={(e) =>
                              updateOption(qi, oi, e.target.value)
                            }
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        Select the radio button next to the correct answer
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* UPLOAD-specific info */}
          {type === "UPLOAD" && (
            <>
              <Separator />
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                <Upload className="mx-auto mb-2 size-8 opacity-50" />
                <p>
                  Students will be able to upload a PDF file for this
                  assignment. You can review and grade submissions manually
                  from the Grading panel.
                </p>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Assignment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
