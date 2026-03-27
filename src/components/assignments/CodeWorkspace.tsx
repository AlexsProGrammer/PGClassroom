"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Loader2 } from "lucide-react"

type ExecuteResponse = {
  status?: string
  stdout?: string | null
  stderr?: string | null
  compile_output?: string | null
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
  const map: Record<string, string> = {
    python: "python",
    java: "java",
    javascript: "javascript",
    typescript: "typescript",
    c: "c",
    "c++": "cpp",
    csharp: "csharp",
    go: "go",
    ruby: "ruby",
    rust: "rust",
  }
  return map[language] ?? "plaintext"
}

function defaultCode(language: string): string {
  if (language === "python") return 'print("Hello World")'
  if (language === "java") {
    return [
      "public class Main {",
      "  public static void main(String[] args) {",
      '    System.out.println("Hello World");',
      "  }",
      "}",
    ].join("\n")
  }
  return ""
}

interface CodeWorkspaceProps {
  assignmentId: number
  language: string
  languageVersion: string
}

export function CodeWorkspace({
  assignmentId,
  language,
}: CodeWorkspaceProps) {
  const [code, setCode] = useState(() => defaultCode(language))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<ExecuteResponse | null>(null)

  const monacoLanguage = useMemo(() => mapLanguageToMonaco(language), [language])
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pollSubmission = useCallback(async (submissionId: number) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}`)
      if (!res.ok) throw new Error("Failed to fetch submission")
      const data: SubmissionPoll = await res.json()

      if (data.status === "PENDING" || data.status === "RUNNING") {
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
      setError("Failed to check submission status")
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  async function runCode() {
    setIsLoading(true)
    setError("")
    setResult(null)
    if (pollRef.current) clearTimeout(pollRef.current)

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, assignmentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Execution failed")
      }

      setResult({ status: "PENDING" })
      pollSubmission(data.submissionId)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Execution failed"
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Code Editor</CardTitle>
          <Badge variant="outline">{language}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Editor
            height="420px"
            language={monacoLanguage}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 12 },
            }}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={runCode} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Play className="mr-2 size-4" />
              Run Code
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Terminal / Output</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <pre className="overflow-x-auto rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </pre>
          )}
          {!error && result && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    result.status === "ACCEPTED"
                      ? "default"
                      : result.status === "PENDING" ||
                          result.status === "RUNNING"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {result.status?.replace("_", " ") ?? "Unknown"}
                </Badge>
              </div>
              {result.compile_output && (
                <div>
                  <p className="mb-1 font-medium">Compiler Output</p>
                  <pre className="overflow-x-auto rounded-md bg-destructive/10 p-3 text-sm">
                    {result.compile_output}
                  </pre>
                </div>
              )}
              <div>
                <p className="mb-1 font-medium">stdout</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3">
                  {result.stdout || "(empty)"}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-medium">stderr</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3">
                  {result.stderr || "(empty)"}
                </pre>
              </div>
            </div>
          )}
          {!error && !result && (
            <p className="text-sm text-muted-foreground">
              Run your code to see output here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
