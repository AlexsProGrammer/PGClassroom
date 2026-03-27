import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Swords, Trophy, Star, BookOpen } from "lucide-react"

const XP_PER_LEVEL = 500

function getLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

function getLevelProgress(xp: number) {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100
}

export default async function StudentDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = Number(session.user.id)

  const [xpResult, completedCount, pendingQuests, recentSubmissions] =
    await Promise.all([
      prisma.submission.aggregate({
        where: {
          userId,
          status: { in: ["MANUALLY_GRADED", "AI_GRADED", "ACCEPTED"] },
          points: { not: null },
        },
        _sum: { points: true },
      }),
      prisma.submission.count({
        where: {
          userId,
          status: { in: ["MANUALLY_GRADED", "AI_GRADED", "ACCEPTED"] },
        },
      }),
      prisma.assignment.findMany({
        where: {
          submissions: { none: { userId } },
        },
        orderBy: { id: "desc" },
        take: 10,
      }),
      prisma.submission.findMany({
        where: { userId },
        include: { assignment: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

  const totalXP = xpResult._sum.points ?? 0
  const level = getLevel(totalXP)
  const levelProgress = getLevelProgress(totalXP)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name ?? "Student"}! Here&apos;s your
          learning overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Points earned from graded submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {level}</div>
            <Progress value={levelProgress} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(levelProgress)}% to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Quests
            </CardTitle>
            <Swords className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Assignments submitted & graded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Quests</CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingQuests.length}</div>
            <p className="text-xs text-muted-foreground">
              Assignments awaiting your submission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Quests */}
      <Card>
        <CardHeader>
          <CardTitle>Open Quests</CardTitle>
          <CardDescription>
            Assignments you haven&apos;t submitted yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingQuests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All caught up! No pending assignments.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingQuests.map((quest) => (
                <a
                  key={quest.id}
                  href={`/student/quest/${quest.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {quest.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {quest.description.length > 80
                        ? quest.description.slice(0, 80) + "…"
                        : quest.description}
                    </p>
                  </div>
                  <Badge variant="outline">{quest.type}</Badge>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Your latest activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {sub.assignment.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.points != null && (
                      <span className="text-sm font-medium">
                        {sub.points} XP
                      </span>
                    )}
                    <Badge
                      variant={
                        sub.status === "ACCEPTED" ||
                        sub.status === "MANUALLY_GRADED" ||
                        sub.status === "AI_GRADED"
                          ? "default"
                          : sub.status === "PENDING" ||
                              sub.status === "RUNNING"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {sub.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
