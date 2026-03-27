"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function SettingsForm() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [name, setName] = useState(session?.user?.name ?? "")
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMessage, setNameMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameLoading(true)
    setNameMessage(null)

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateName", name }),
      })
      const data = await res.json()

      if (!res.ok) {
        setNameMessage({ type: "error", text: data.error })
        return
      }

      await update({ name: data.name })
      setNameMessage({ type: "success", text: "Display name updated" })
      router.refresh()
    } catch {
      setNameMessage({ type: "error", text: "Something went wrong" })
    } finally {
      setNameLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwLoading(true)
    setPwMessage(null)

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "error", text: "Passwords do not match" })
      setPwLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setPwMessage({
        type: "error",
        text: "New password must be at least 8 characters",
      })
      setPwLoading(false)
      return
    }

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPwMessage({ type: "error", text: data.error })
        return
      }

      setPwMessage({
        type: "success",
        text: "Password changed. Please log in again with your new password.",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setPwMessage({ type: "error", text: "Something went wrong" })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            Update how your name appears across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                maxLength={100}
              />
            </div>
            {nameMessage && (
              <p
                className={
                  nameMessage.type === "success"
                    ? "text-sm text-green-600"
                    : "text-sm text-destructive"
                }
              >
                {nameMessage.text}
              </p>
            )}
            <Button type="submit" disabled={nameLoading || !name.trim()}>
              {nameLoading ? "Saving…" : "Save Name"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Enter your current password and choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {pwMessage && (
              <p
                className={
                  pwMessage.type === "success"
                    ? "text-sm text-green-600"
                    : "text-sm text-destructive"
                }
              >
                {pwMessage.text}
              </p>
            )}
            <Button
              type="submit"
              disabled={
                pwLoading || !currentPassword || !newPassword || !confirmPassword
              }
            >
              {pwLoading ? "Changing…" : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
