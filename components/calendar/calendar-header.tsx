"use client"

import { format } from "date-fns"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SchedulePopover } from "./schedule-popover"
import { CreatePostDialog } from "./create-post-dialog"

export function CalendarHeader() {
  const today = new Date()

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-sm font-semibold">
            {format(today, "EEEE, MMMM d, yyyy")}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SchedulePopover />
        <CreatePostDialog />
        <ThemeToggle />
      </div>
    </header>
  )
}
