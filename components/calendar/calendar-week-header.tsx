"use client"

import { format, isToday } from "date-fns"
import { cn } from "@/lib/utils"

interface CalendarWeekHeaderProps {
  weekDays: Date[]
}

export function CalendarWeekHeader({ weekDays }: CalendarWeekHeaderProps) {
  return (
    <div className="sticky top-0 z-30 flex border-b bg-background">
      {/* Spacer matching hours column width */}
      <div className="w-14 shrink-0 border-r md:w-[80px] lg:w-[104px]" />
      {/* Day headers */}
      {weekDays.map((day) => {
        const today = isToday(day)
        return (
          <div
            key={day.toISOString()}
            className="flex min-w-28 flex-1 flex-col items-center justify-center border-r py-2.5 last:border-r-0 md:min-w-44"
          >
            <span
              className={cn(
                "text-xs font-medium uppercase text-muted-foreground",
                today && "text-primary"
              )}
            >
              {format(day, "dd EEE").toUpperCase()}
            </span>
            {today && (
              <span className="mt-1 size-1.5 rounded-full bg-primary" />
            )}
          </div>
        )
      })}
    </div>
  )
}
