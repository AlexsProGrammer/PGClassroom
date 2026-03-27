import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { StudentSidebar } from "@/components/layout/StudentSidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { AuthProvider } from "@/components/providers/AuthProvider"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <StudentSidebar />
        <SidebarInset>
          <TopHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  )
}
