"use client"

import { format, isToday } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCalendarStore } from "@/store/calendar-store"
import { cn } from "@/lib/utils"

export function CalendarWeekHeader() {
  const { goToPreviousWeek, goToNextWeek, getWeekDays } = useCalendarStore()
  const days = getWeekDays()

  return (
    <div className="flex border-b">
      {/* Spacer for hours column */}
      <div className="flex w-16 shrink-0 items-center justify-center border-r">
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={goToPreviousWeek}
          >
            <ChevronLeft className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={goToNextWeek}
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
      {/* Day headers */}
      {days.map((day) => {
        const today = isToday(day)
        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex flex-1 flex-col items-center justify-center border-r py-2 last:border-r-0",
              today && "bg-primary/5"
            )}
          >
            <span className="text-[10px] font-medium uppercase text-muted-foreground">
              {format(day, "EEE")}
            </span>
            <span
              className={cn(
                "mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                today && "bg-primary text-primary-foreground"
              )}
            >
              {format(day, "d")}
            </span>
          </div>
        )
      })}
    </div>
  )
}
