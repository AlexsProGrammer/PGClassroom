"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

type User = {
  id: number
  name: string | null
  email: string
}

type Submission = {
  id: number
  assignmentId: number
  userId: number | null
  code: string
  filePath: string | null
  status: string
  stdout: string | null
  stderr: string | null
  points: number | null
  tutorFeedback: string | null
  aiFeedback: string | null
  user: User | null
}

type Assignment = {
  id: number
  title: string
  description: string
  type: string
  language: string
}

export default function GradingPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selected, setSelected] = useState<Submission | null>(null)
  const [points, setPoints] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/grading/${assignmentId}`)
      if (!res.ok) {
        setError("Failed to load submissions")
        return
      }
      const data = await res.json()
      setAssignment(data.assignment)
      setSubmissions(data.submissions)
    }
    load()
  }, [assignmentId])

  function selectSubmission(sub: Submission) {
    setSelected(sub)
    setPoints(sub.points != null ? String(sub.points) : "")
    setFeedback(sub.tutorFeedback ?? "")
    setError("")
    setSuccessMsg("")
  }

  async function handleGrade() {
    if (!selected) return

    const parsedPoints = Number(points)
    if (Number.isNaN(parsedPoints) || parsedPoints < 0) {
      setError("Points must be a non-negative number")
      return
    }

    setSaving(true)
    setError("")
    setSuccessMsg("")

    try {
      const res = await fetch(`/api/grading/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selected.id,
          points: parsedPoints,
          tutorFeedback: feedback,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save grade")
        return
      }

      const updated = await res.json()

      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      )
      setSelected((prev) => (prev ? { ...prev, ...updated } : prev))
      setSuccessMsg("Grade saved")
    } catch {
      setError("Failed to save grade")
    } finally {
      setSaving(false)
    }
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "PENDING")
  const gradedSubmissions = submissions.filter((s) => s.status !== "PENDING")

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Grading: {assignment?.title ?? `Assignment #${assignmentId}`}
        </h1>
        {assignment && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Type: {assignment.type} &middot; {pendingSubmissions.length} pending
          </p>
        )}
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar: submissions list */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Pending ({pendingSubmissions.length})
            </h2>
            <ul className="mt-2 space-y-1">
              {pendingSubmissions.map((sub) => (
                <li key={sub.id}>
                  <button
                    onClick={() => selectSubmission(sub)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      selected?.id === sub.id
                        ? "bg-zinc-200 dark:bg-zinc-800"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      #{sub.id}
                    </span>
                    <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                      {sub.user?.name ?? sub.user?.email ?? `User ${sub.userId}`}
                    </span>
                  </button>
                </li>
              ))}
              {pendingSubmissions.length === 0 && (
                <li className="px-3 py-2 text-sm text-zinc-400">
                  No pending submissions
                </li>
              )}
            </ul>

            {gradedSubmissions.length > 0 && (
              <>
                <h2 className="mt-6 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Graded ({gradedSubmissions.length})
                </h2>
                <ul className="mt-2 space-y-1">
                  {gradedSubmissions.map((sub) => (
                    <li key={sub.id}>
                      <button
                        onClick={() => selectSubmission(sub)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                          selected?.id === sub.id
                            ? "bg-zinc-200 dark:bg-zinc-800"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          #{sub.id} — {sub.points}pts
                        </span>
                        <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                          {sub.user?.name ?? sub.user?.email ?? `User ${sub.userId}`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Main content: split-screen */}
        {selected ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: submission content */}
            <div className="flex-1 overflow-auto border-r border-zinc-200 dark:border-zinc-800">
              {selected.filePath ? (
                <iframe
                  src={`/api/files/${selected.filePath}`}
                  className="h-full w-full"
                  title="Submission PDF"
                />
              ) : (
                <div className="p-4">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Student Code
                  </h3>
                  <pre className="overflow-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
                    <code>{selected.code}</code>
                  </pre>
                  {selected.stdout && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Output
                      </h4>
                      <pre className="mt-1 overflow-auto rounded-lg bg-zinc-800 p-3 text-sm text-green-400">
                        {selected.stdout}
                      </pre>
                    </div>
                  )}
                  {selected.stderr && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Errors
                      </h4>
                      <pre className="mt-1 overflow-auto rounded-lg bg-zinc-800 p-3 text-sm text-red-400">
                        {selected.stderr}
                      </pre>
                    </div>
                  )}
                  {selected.aiFeedback && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        AI Feedback
                      </h4>
                      <p className="mt-1 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                        {selected.aiFeedback}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: grading form */}
            <div className="w-96 shrink-0 overflow-y-auto bg-white p-6 dark:bg-zinc-950">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Grade Submission #{selected.id}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Status: {selected.status}
              </p>

              <div className="mt-6 space-y-4">
                <label className="grid gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Points
                  <input
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>

                <label className="grid gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Tutor Feedback
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

                <button
                  onClick={handleGrade}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {saving ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-zinc-400">Select a submission to grade</p>
          </div>
        )}
      </div>
    </div>
  )
}
