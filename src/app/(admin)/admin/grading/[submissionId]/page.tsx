import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import { CodeViewer } from "@/components/grading/CodeViewer"
import { GradingPanel } from "@/components/grading/GradingPanel"

export default async function GradingDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>
}) {
  const session = await auth()
  if (
    !session?.user?.role ||
    !["EDITOR", "TEACHER"].includes(session.user.role)
  ) {
    redirect("/login")
  }

  const { submissionId: rawId } = await params
  const submissionId = Number(rawId)
  if (Number.isNaN(submissionId)) notFound()

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: { select: { name: true, email: true } },
      assignment: true,
    },
  })

  if (!submission) notFound()

  const assignment = submission.assignment

  // Parse quiz answers if QUIZ
  let quizAnswers: Record<string, number> | null = null
  let quizQuestions: { id: string; text: string; options: string[]; correctIndex?: number }[] = []
  if (assignment.type === "QUIZ") {
    try {
      const parsed = JSON.parse(submission.code)
      quizAnswers = parsed.answers ?? null
    } catch {
      quizAnswers = null
    }
    const config = assignment.config as {
      questions?: { id: string; text: string; options: string[]; correctIndex?: number }[]
    } | null
    quizQuestions = config?.questions ?? []
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/admin/grading" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">
            {assignment.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Submission #{submission.id} &middot;{" "}
            {submission.user?.name ?? submission.user?.email ?? "Unknown student"}{" "}
            &middot; {submission.createdAt.toLocaleDateString()}
          </p>
        </div>
        <Badge variant="outline">{assignment.type}</Badge>
      </div>

      {/* Split-screen layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Content View (2/3 width) */}
        <div className="lg:col-span-2">
          {assignment.type === "CODE" && (
            <CodeViewer
              code={submission.code}
              language={assignment.language}
              stdout={submission.stdout}
              stderr={submission.stderr}
              compileOutput={submission.compile_output}
            />
          )}

          {assignment.type === "QUIZ" && (
            <div className="space-y-4">
              {quizQuestions.map((question, qIndex) => {
                const studentAnswer = quizAnswers?.[question.id]
                const isCorrect =
                  question.correctIndex != null &&
                  studentAnswer === question.correctIndex

                return (
                  <Card key={question.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        <span className="text-muted-foreground mr-2">
                          Q{qIndex + 1}.
                        </span>
                        {question.text}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isSelected = studentAnswer === optIndex
                          const isCorrectOption =
                            question.correctIndex === optIndex

                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                                isSelected && isCorrectOption
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                  : isSelected && !isCorrectOption
                                    ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                                    : isCorrectOption
                                      ? "border-green-300 bg-green-50/50 dark:bg-green-950/10"
                                      : ""
                              }`}
                            >
                              <div
                                className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && "●"}
                              </div>
                              <span>{option}</span>
                              {isCorrectOption && (
                                <Badge
                                  variant="default"
                                  className="ml-auto text-xs"
                                >
                                  Correct
                                </Badge>
                              )}
                              {isSelected && !isCorrect && !isCorrectOption && (
                                <Badge
                                  variant="destructive"
                                  className="ml-auto text-xs"
                                >
                                  Wrong
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {quizQuestions.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Quiz config not available. Raw submission:
                    <pre className="mt-2 rounded bg-muted p-3 text-left text-xs">
                      {submission.code}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {assignment.type === "UPLOAD" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uploaded File</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.filePath ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        render={
                          <a
                            href={`/api/files/${submission.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <Download className="mr-2 size-4" />
                        View / Download PDF
                      </Button>
                    </div>
                    <iframe
                      src={`/api/files/${submission.filePath}`}
                      className="h-150 w-full rounded-lg border"
                      title="Submission PDF"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No file was uploaded for this submission.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Grading Panel (1/3 width, sticky) */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <GradingPanel
            submissionId={submission.id}
            assignmentId={submission.assignmentId}
            currentStatus={submission.status}
            currentPoints={submission.points}
            currentFeedback={submission.tutorFeedback}
            aiFeedback={submission.aiFeedback}
          />
        </div>
      </div>
    </div>
  )
}
