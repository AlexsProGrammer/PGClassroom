'use client'

import { FormEvent, useEffect, useState } from 'react'

type Assignment = {
  id: number
  title: string
  description: string
  language: string
  languageVersion: string
  expected_output: string
}

type Runtime = {
  language: string
  version: string
  aliases: string[]
}

type FormState = {
  title: string
  description: string
  language: string
  languageVersion: string
  expected_output: string
}

const initialFormState: FormState = {
  title: '',
  description: '',
  language: '',
  languageVersion: '',
  expected_output: '',
}

export default function AdminDashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [runtimes, setRuntimes] = useState<Runtime[]>([])
  const [form, setForm] = useState<FormState>(initialFormState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  async function loadAssignments() {
    const response = await fetch('/api/assignments', { method: 'GET' })

    if (!response.ok) {
      throw new Error('Failed to fetch assignments')
    }

    const data: Assignment[] = await response.json()
    setAssignments(data)
  }

  async function loadRuntimes() {
    const response = await fetch('/api/runtimes', { method: 'GET' })

    if (!response.ok) {
      throw new Error('Failed to fetch runtimes')
    }

    const data: Runtime[] = await response.json()
    setRuntimes(data)

    if (data.length > 0) {
      setForm((prev) => {
        if (prev.language) return prev
        return {
          ...prev,
          language: data[0].language,
          languageVersion: data[0].version,
        }
      })
    }
  }

  useEffect(() => {
    loadAssignments().catch(() => {
      setError('Unable to load assignments')
    })
    loadRuntimes().catch(() => {
      setError('Unable to load runtimes')
    })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error('Failed to create assignment')
      }

      const createdAssignment: Assignment = await response.json()
      setAssignments((previous) => [createdAssignment, ...previous])
      setForm(initialFormState)
    } catch {
      setError('Unable to create assignment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <main className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create assignments for students.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Title
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, title: event.target.value }))
                }
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Language
              <select
                value={`${form.language}@${form.languageVersion}`}
                onChange={(event) => {
                  const [lang, ver] = event.target.value.split('@')
                  setForm((previous) => ({
                    ...previous,
                    language: lang,
                    languageVersion: ver,
                  }))
                }}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {runtimes.map((rt) => (
                  <option key={`${rt.language}@${rt.version}`} value={`${rt.language}@${rt.version}`}>
                    {rt.language} ({rt.version})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Expected Output
              <input
                value={form.expected_output}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    expected_output: event.target.value,
                  }))
                }
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isLoading ? 'Creating...' : 'Create Assignment'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Current Assignments
          </h2>

          <ul className="mt-4 space-y-3">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Assignment ID: {assignment.id}
                </p>
                <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {assignment.title}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Language: {assignment.language} ({assignment.languageVersion})
                </p>
              </li>
            ))}
            {assignments.length === 0 && (
              <li className="text-sm text-zinc-600 dark:text-zinc-400">
                No assignments yet.
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  )
}
