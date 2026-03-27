import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { CodeWorkspace } from "@/components/assignments/CodeWorkspace"
import { QuizWorkspace } from "@/components/assignments/QuizWorkspace"
import type { QuizQuestion } from "@/components/assignments/QuizWorkspace"
import { UploadWorkspace } from "@/components/assignments/UploadWorkspace"

export default async function StudentQuestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const assignmentId = Number(id)
  if (Number.isNaN(assignmentId)) notFound()

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  })
  if (!assignment) notFound()

  // For QUIZ: strip correctIndex before sending config to client
  let quizQuestions: QuizQuestion[] = []
  if (assignment.type === "QUIZ" && assignment.config) {
    const config = assignment.config as {
      questions?: { id: string; text: string; options: string[] }[]
    }
    quizQuestions = (config.questions ?? []).map(({ id: qId, text, options }) => ({
      id: qId,
      text,
      options,
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {assignment.title}
          </h1>
          <Badge variant="outline">{assignment.type}</Badge>
        </div>
        <p className="mt-1 text-muted-foreground">
          {assignment.description || "No description provided."}
        </p>
      </div>

      {assignment.type === "CODE" && (
        <CodeWorkspace
          assignmentId={assignment.id}
          language={assignment.language}
          languageVersion={assignment.languageVersion}
        />
      )}

      {assignment.type === "QUIZ" && (
        <QuizWorkspace
          assignmentId={assignment.id}
          questions={quizQuestions}
        />
      )}

      {assignment.type === "UPLOAD" && (
        <UploadWorkspace assignmentId={assignment.id} />
      )}
    </div>
  )
}
