'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Editor from '@monaco-editor/react'

type Assignment = {
  id: number
  title: string
  description: string
  language: string
  languageVersion: string
  expected_output: string
}

type ExecuteResponse = {
  status?: string
  stdout?: string | null
  stderr?: string | null
  compile_output?: string | null
  error?: string
}

type SubmissionPoll = {
  id: number
  status: string
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  runCode: number | null
}

function mapLanguageToMonaco(language: string): string {
  switch (language) {
    case 'python': return 'python'
    case 'java': return 'java'
    case 'javascript': return 'javascript'
    case 'typescript': return 'typescript'
    case 'c': return 'c'
    case 'c++': return 'cpp'
    case 'csharp': return 'csharp'
    case 'go': return 'go'
    case 'ruby': return 'ruby'
    case 'rust': return 'rust'
    default: return 'plaintext'
  }
}

function defaultCode(language: string): string {
  if (language === 'python') return 'print("Hello World")'
  if (language === 'java') {
    return [
      'public class Main {',
      '  public static void main(String[] args) {',
      '    System.out.println("Hello World");',
      '  }',
      '}',
    ].join('\n')
  }

  return ''
}

export default function StudentQuestPage() {
  const params = useParams<{ id: string }>()
  const assignmentId = Number(params.id)

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingAssignment, setIsFetchingAssignment] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ExecuteResponse | null>(null)

  useEffect(() => {
    async function loadAssignment() {
      setIsFetchingAssignment(true)
      setError('')

      try {
        const response = await fetch('/api/assignments')
        if (!response.ok) {
          throw new Error('Failed to load assignments')
        }

        const assignments: Assignment[] = await response.json()
        const foundAssignment = assignments.find((item) => item.id === assignmentId)

        if (!foundAssignment) {
          setError('Assignment not found')
          setAssignment(null)
          return
        }

        setAssignment(foundAssignment)
        setCode(defaultCode(foundAssignment.language))
      } catch {
        setError('Unable to load assignment')
      } finally {
        setIsFetchingAssignment(false)
      }
    }

    if (!Number.isNaN(assignmentId)) {
      loadAssignment()
    } else {
      setError('Invalid assignment id')
      setIsFetchingAssignment(false)
    }
  }, [assignmentId])

  const monacoLanguage = useMemo(() => {
    if (!assignment) return 'plaintext'
    return mapLanguageToMonaco(assignment.language)
  }, [assignment])

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pollSubmission = useCallback(async (submissionId: number) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}`)
      if (!res.ok) throw new Error('Failed to fetch submission')
      const data: SubmissionPoll = await res.json()

      if (data.status === 'PENDING' || data.status === 'RUNNING') {
        pollRef.current = setTimeout(() => pollSubmission(submissionId), 1000)
        return
      }

      setResult({
        status: data.status,
        stdout: data.stdout,
        stderr: data.stderr,
        compile_output: data.compile_output,
      })
      setIsLoading(false)
    } catch {
      setError('Failed to check submission status')
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  async function runCode() {
    if (!assignment) return

    setIsLoading(true)
    setError('')
    setResult(null)
    if (pollRef.current) clearTimeout(pollRef.current)

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          assignmentId: assignment.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Execution failed')
      }

      // Start polling for result
      setResult({ status: 'PENDING' })
      pollSubmission(data.submissionId)
    } catch (executionError) {
      const message =
        executionError instanceof Error ? executionError.message : 'Execution failed'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black">
      <main className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Student Workspace
          </h1>
          {isFetchingAssignment && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Loading assignment...</p>
          )}
          {!isFetchingAssignment && assignment && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Assignment #{assignment.id}
              </p>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {assignment.title}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {assignment.description || 'No description provided.'}
              </p>
            </div>
          )}
          {error && !assignment && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <Editor
            height="420px"
            language={monacoLanguage}
            value={code}
            onChange={(value) => setCode(value ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />

          <div className="mt-4">
            <button
              onClick={runCode}
              disabled={isLoading || !assignment}
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isLoading ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Terminal / Output</h3>
          {error && assignment && (
            <pre className="mt-3 overflow-x-auto rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </pre>
          )}
          {!error && result && (
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-zinc-700 dark:text-zinc-300">
                Status: <span className="font-medium">{result.status || 'Unknown'}</span>
              </p>
              {result.compile_output && (
                <div>
                  <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">Compiler Output</p>
                  <pre className="overflow-x-auto rounded-md bg-red-50 p-3 text-zinc-800 dark:bg-red-950/30 dark:text-zinc-100">
                    {result.compile_output}
                  </pre>
                </div>
              )}
              <div>
                <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">stdout</p>
                <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  {result.stdout || '(empty)'}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">stderr</p>
                <pre className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  {result.stderr || '(empty)'}
                </pre>
              </div>
            </div>
          )}
          {!error && !result && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Run your code to see output here.
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
