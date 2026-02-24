"use client"

import { isToday, isSameDay } from "date-fns"
import { HOUR_HEIGHT, HOURS_IN_DAY, getPostTopPosition, getPostHeight } from "./calendar-utils"
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
        "relative flex-1 border-r last:border-r-0",
        today && "bg-primary/[0.02]"
      )}
    >
      {/* Hour grid lines */}
      {Array.from({ length: HOURS_IN_DAY }, (_, i) => (
        <div
          key={i}
          className="border-b border-border/50"
          style={{ height: HOUR_HEIGHT }}
        />
      ))}

      {/* Current time indicator (today only) */}
      {today && <CurrentTimeIndicator />}

      {/* Posts */}
      {dayPosts.map((post) => {
        const top = getPostTopPosition(post.scheduledAt)
        const height = getPostHeight(30) // Default 30-min duration

        const statusColors: Record<string, string> = {
          PENDING: "border-l-muted-foreground/50 bg-muted/50",
          PUBLISHED: "border-l-green-500 bg-green-500/10",
          FAILED: "border-l-red-500 bg-red-500/10",
          CANCELLED: "border-l-muted-foreground/30 bg-muted/30 opacity-50",
        }

        return (
          <button
            key={post.id}
            className={cn(
              "absolute right-1 left-1 z-10 cursor-pointer overflow-hidden rounded-md border-l-2 px-2 py-1 text-left transition-all hover:shadow-md",
              statusColors[post.status] || statusColors.PENDING
            )}
            style={{ top, height: Math.max(height, 30) }}
            onClick={() => onPostClick(post.id)}
          >
            <p className="truncate text-xs font-medium">{post.content}</p>
            <div className="mt-0.5 flex gap-1">
              {post.platforms.map((p) => (
                <span
                  key={p}
                  className="text-[9px] font-medium uppercase text-muted-foreground"
                >
                  {p === "TWITTER" ? "X" : p.slice(0, 2)}
                </span>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
