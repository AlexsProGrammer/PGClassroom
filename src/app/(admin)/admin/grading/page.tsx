import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye } from "lucide-react"

const GRADED_STATUSES = new Set([
  "ACCEPTED",
  "MANUALLY_GRADED",
  "AI_GRADED",
])

export default async function GradingListPage() {
  const session = await auth()
  if (
    !session?.user?.role ||
    !["EDITOR", "TEACHER"].includes(session.user.role)
  ) {
    redirect("/login")
  }

  const submissions = await prisma.submission.findMany({
    include: {
      user: { select: { name: true, email: true } },
      assignment: { select: { title: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const pendingCount = submissions.filter(
    (s) => !GRADED_STATUSES.has(s.status)
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grading</h1>
        <p className="text-muted-foreground">
          {pendingCount} submission{pendingCount !== 1 ? "s" : ""} awaiting
          review
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            Click a submission to open the grading view
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="w-20 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">
                      {sub.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sub.user?.name ?? sub.user?.email ?? "—"}
                    </TableCell>
                    <TableCell>{sub.assignment.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.assignment.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          GRADED_STATUSES.has(sub.status)
                            ? "default"
                            : sub.status === "PENDING" ||
                                sub.status === "RUNNING"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {sub.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {sub.points != null ? sub.points : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {sub.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/admin/grading/${sub.id}`} />}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
