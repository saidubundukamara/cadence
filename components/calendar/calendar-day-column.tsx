"use client"

import { useCallback } from "react"
import { isToday, isSameDay, setHours, setMinutes } from "date-fns"
import { HOUR_HEIGHT, HOURS_IN_DAY, getPostTopPosition, getPostHeight, getPostVariant } from "./calendar-utils"
import { PostCard } from "./post-card"
import { CurrentTimeIndicator } from "./current-time-indicator"
import { cn } from "@/lib/utils"
import type { CalendarPost } from "@/types"

interface CalendarDayColumnProps {
  day: Date
  posts: CalendarPost[]
  onPostClick: (postId: string) => void
  onReschedule?: (postId: string, newDate: Date) => void
}

export function CalendarDayColumn({
  day,
  posts,
  onPostClick,
  onReschedule,
}: CalendarDayColumnProps) {
  const today = isToday(day)
  const dayPosts = posts.filter((p) =>
    p.scheduledAt && isSameDay(new Date(p.scheduledAt), day)
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const postId = e.dataTransfer.getData("text/post-id")
      if (!postId || !onReschedule) return

      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top - 24 // subtract header offset
      const totalMinutes = Math.round((y / HOUR_HEIGHT) * 60)
      const hours = Math.max(0, Math.min(23, Math.floor(totalMinutes / 60)))
      const minutes = Math.max(0, Math.min(59, Math.round((totalMinutes % 60) / 15) * 15))

      const newDate = setMinutes(setHours(new Date(day), hours), minutes)
      if (newDate > new Date()) {
        onReschedule(postId, newDate)
      }
    },
    [day, onReschedule]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  return (
    <div
      className={cn(
        "relative min-w-28 flex-1 border-r pt-6 last:border-r-0 md:min-w-44",
        today && "bg-primary/[0.02]"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hour grid lines */}
      {Array.from({ length: HOURS_IN_DAY }, (_, i) => (
        <div
          key={i}
          className="border-b border-border"
          style={{ height: HOUR_HEIGHT }}
        />
      ))}

      {/* Current time indicator (today only) */}
      {today && <CurrentTimeIndicator />}

      {/* Posts */}
      {dayPosts.map((post) => {
        const top = getPostTopPosition(post.scheduledAt!)
        const rawHeight = getPostHeight(30)
        const clampedHeight = Math.max(rawHeight, 30)

        return (
          <PostCard
            key={post.id}
            post={post}
            variant={getPostVariant(clampedHeight)}
            onClick={() => onPostClick(post.id)}
            style={{ top: top + 24 + 4, height: clampedHeight - 8 }}
            className="absolute left-2 right-2 z-10"
            draggable={post.status === "PENDING" || post.status === "DRAFT"}
          />
        )
      })}
    </div>
  )
}
