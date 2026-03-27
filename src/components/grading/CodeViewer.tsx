"use client"

import Editor from "@monaco-editor/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface CodeViewerProps {
  code: string
  language: string
  stdout: string | null
  stderr: string | null
  compileOutput: string | null
}

export function CodeViewer({
  code,
  language,
  stdout,
  stderr,
  compileOutput,
}: CodeViewerProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Student Code</CardTitle>
          <Badge variant="outline">{language}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Editor
            height="400px"
            language={mapLanguageToMonaco(language)}
            value={code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 12 },
              scrollBeyondLastLine: false,
            }}
          />
        </CardContent>
      </Card>

      {compileOutput && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Compiler Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {compileOutput}
            </pre>
          </CardContent>
        </Card>
      )}

      {stdout && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">stdout</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
              {stdout}
            </pre>
          </CardContent>
        </Card>
      )}

      {stderr && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">stderr</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-destructive/10 p-3 text-sm">
              {stderr}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
