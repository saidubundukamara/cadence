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
}

export function CalendarView({ posts }: CalendarViewProps) {
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
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
      <CalendarWeekHeader />
      <div ref={scrollRef} className="flex flex-1 overflow-auto">
        <CalendarHoursColumn />
        <div className="flex flex-1">
          {days.map((day) => (
            <CalendarDayColumn
              key={day.toISOString()}
              day={day}
              posts={filteredPosts}
              onPostClick={selectPost}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
