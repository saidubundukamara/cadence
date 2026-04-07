"use client"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { platformConfig } from "@/lib/platform-config"
import type { CalendarPost } from "@/types"

const statusDotColor: Record<string, string> = {
  DRAFT: "bg-gray-400",
  PENDING: "bg-yellow-500",
  PUBLISHED: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-muted-foreground/30",
}

interface PostCardProps {
  post: CalendarPost
  variant?: "short" | "medium" | "full"
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
  draggable?: boolean
}

export function PostCard({
  post,
  variant = "medium",
  onClick,
  style,
  className,
  draggable,
}: PostCardProps) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/post-id", post.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const dot = (
    <span
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        statusDotColor[post.status] || statusDotColor.PENDING
      )}
    />
  )

  if (variant === "short") {
    return (
      <button
        onClick={onClick}
        style={style}
        draggable={draggable}
        onDragStart={handleDragStart}
        className={cn(
          "flex w-full items-center gap-2 overflow-hidden rounded-lg border border-border bg-card px-2 py-1 text-left transition-colors hover:bg-muted",
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {dot}
        <span className="flex-1 truncate text-xs">{post.content}</span>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {format(new Date(post.scheduledAt!), "h:mm a")}
        </span>
      </button>
    )
  }

  if (variant === "full") {
    return (
      <button
        onClick={onClick}
        style={style}
        draggable={draggable}
        onDragStart={handleDragStart}
        className={cn(
          "flex w-full flex-col gap-1.5 overflow-hidden rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted",
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          {dot}
          <p className="line-clamp-2 flex-1 text-xs font-medium">{post.content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(post.scheduledAt!), "h:mm a")}
        </span>
        <div className="flex gap-1">
          {post.platforms.map((p) => {
            const config = platformConfig[p]
            const Icon = config.icon
            return (
              <Icon key={p} className={cn("size-3.5", config.color)} />
            )
          })}
        </div>
        {post.mediaUrls.length > 0 && (
          <div className="flex gap-1">
            {post.mediaUrls.slice(0, 3).map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="size-8 rounded object-cover"
              />
            ))}
          </div>
        )}
      </button>
    )
  }

  // Medium variant (default)
  return (
    <button
      onClick={onClick}
      style={style}
      draggable={draggable}
      onDragStart={handleDragStart}
      className={cn(
        "flex w-full flex-col gap-1 overflow-hidden rounded-lg border border-border bg-card px-2 py-1.5 text-left transition-colors hover:bg-muted",
        draggable && "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {dot}
        <span className="flex-1 truncate text-xs font-medium">
          {post.content}
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>{format(new Date(post.scheduledAt!), "h:mm a")}</span>
        <span>&middot;</span>
        {post.platforms.map((p) => {
          const config = platformConfig[p]
          const Icon = config.icon
          return (
            <Icon key={p} className={cn("size-3", config.color)} />
          )
        })}
      </div>
    </button>
  )
}
