"use client"

import { useRef, useEffect } from "react"
import { useCalendarStore } from "@/store/calendar-store"
import { CalendarWeekHeader } from "./calendar-week-header"
import { CalendarHoursColumn } from "./calendar-hours-column"
import { CalendarDayColumn } from "./calendar-day-column"
import { INITIAL_SCROLL_OFFSET } from "./calendar-utils"
import type { CalendarPost } from "@/types"

interface CalendarViewProps {
  posts: CalendarPost[]
  onReschedule?: (postId: string, newDate: Date) => void
}

export function CalendarView({ posts, onReschedule }: CalendarViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { getWeekDays, selectPost, getFilteredPosts } = useCalendarStore()
  const days = getWeekDays()
  const filteredPosts = getFilteredPosts(posts)

  // Auto-scroll to 9 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = INITIAL_SCROLL_OFFSET
    }
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {/* Header inside scroll container so it scrolls horizontally with columns */}
        <CalendarWeekHeader weekDays={days} />
        <div className="flex">
          <CalendarHoursColumn />
          <div className="flex flex-1">
            {days.map((day) => (
              <CalendarDayColumn
                key={day.toISOString()}
                day={day}
                posts={filteredPosts}
                onPostClick={selectPost}
                onReschedule={onReschedule}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
