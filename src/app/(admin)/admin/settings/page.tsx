import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings/SettingsForm"

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>
      <SettingsForm />
    </div>
  )
}
