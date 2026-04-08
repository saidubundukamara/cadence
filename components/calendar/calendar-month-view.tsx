"use client"

import { isSameDay, isSameMonth, isToday, format } from "date-fns"
import { useCalendarStore } from "@/store/calendar-store"
import { cn } from "@/lib/utils"
import { PostCard } from "./post-card"
import type { CalendarPost } from "@/types"

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface CalendarMonthViewProps {
  posts: CalendarPost[]
}

export function CalendarMonthView({ posts }: CalendarMonthViewProps) {
  const { getMonthDays, currentWeekStart, selectPost, getFilteredPosts } =
    useCalendarStore()
  const days = getMonthDays()
  const filteredPosts = getFilteredPosts(posts)
  const weeks: Date[][] = []

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-1 flex-col overflow-auto">
        {weeks.map((week, weekIdx) => (
          <div
            key={weekIdx}
            className="grid min-h-24 flex-1 grid-cols-7 border-b last:border-b-0"
          >
            {week.map((day) => {
              const dayPosts = filteredPosts.filter(
                (p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day)
              )
              const isCurrentMonth = isSameMonth(day, currentWeekStart)
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r p-1 last:border-r-0",
                    !isCurrentMonth && "bg-muted/20",
                    isCurrentDay && "bg-primary/[0.04]"
                  )}
                >
                  {/* Day number */}
                  <div className="mb-0.5 flex items-center justify-between px-1">
                    <span
                      className={cn(
                        "text-xs",
                        isCurrentDay &&
                          "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold",
                        !isCurrentMonth && "text-muted-foreground/50"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayPosts.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayPosts.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Post items (max 3 visible) */}
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        variant="tiny"
                        onClick={() => selectPost(post.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
