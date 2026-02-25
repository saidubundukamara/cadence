"use client"

import { isToday, isSameDay } from "date-fns"
import { HOUR_HEIGHT, HOURS_IN_DAY, getPostTopPosition, getPostHeight, getPostVariant } from "./calendar-utils"
import { PostCard } from "./post-card"
import { CurrentTimeIndicator } from "./current-time-indicator"
import { cn } from "@/lib/utils"
import type { CalendarPost } from "@/types"

interface CalendarDayColumnProps {
  day: Date
  posts: CalendarPost[]
  onPostClick: (postId: string) => void
}

export function CalendarDayColumn({
  day,
  posts,
  onPostClick,
}: CalendarDayColumnProps) {
  const today = isToday(day)
  const dayPosts = posts.filter((p) =>
    isSameDay(new Date(p.scheduledAt), day)
  )

  return (
    <div
      className={cn(
        "relative min-w-28 flex-1 border-r pt-6 last:border-r-0 md:min-w-44",
        today && "bg-primary/[0.02]"
      )}
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
        const top = getPostTopPosition(post.scheduledAt)
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
          />
        )
      })}
    </div>
  )
}
