import { SessionProvider } from "next-auth/react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar"
import { CalendarHeader } from "@/components/calendar/calendar-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <CalendarSidebar />
        <SidebarInset>
          <CalendarHeader />
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
