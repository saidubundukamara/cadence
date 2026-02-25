"use client"

import { format } from "date-fns"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CreatePostDialog } from "./create-post-dialog"
import { useCalendarStore } from "@/store/calendar-store"

export function CalendarHeader() {
  const { currentWeekStart, stats } = useCalendarStore()

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-sm font-semibold md:text-base lg:text-lg">
            {format(currentWeekStart, "MMMM dd, yyyy")}
          </h1>
          <p className="hidden text-xs text-muted-foreground md:block">
            {stats.total} posts this week &middot; {stats.published} published &middot; {stats.scheduled} scheduled
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CreatePostDialog />
        <ThemeToggle />
      </div>
    </header>
  )
}
