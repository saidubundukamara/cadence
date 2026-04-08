"use client"

import { format } from "date-fns"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { platformConfig } from "@/lib/platform-config"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import type { CalendarPost } from "@/types"

const statusDotColor: Record<string, string> = {
  DRAFT: "bg-gray-400",
  PENDING: "bg-yellow-500",
  PUBLISHED: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-muted-foreground/30",
}

const statusDotRing: Record<string, string> = {
  DRAFT: "ring-gray-400/20",
  PENDING: "ring-yellow-500/25",
  PUBLISHED: "ring-green-500/25",
  FAILED: "ring-red-500/25",
  CANCELLED: "ring-muted-foreground/10",
}

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Scheduled",
  PUBLISHED: "Published",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
}

const platformAccent: Record<string, string> = {
  TWITTER: "bg-sky-500",
  LINKEDIN: "bg-blue-700",
  FACEBOOK: "bg-blue-600",
  INSTAGRAM: "bg-pink-500",
  YOUTUBE: "bg-red-600",
}

interface PostCardProps {
  post: CalendarPost
  variant?: "short" | "medium" | "full" | "tiny"
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

  const primaryPlatform = post.platforms[0]
  const accentColor =
    (primaryPlatform && platformAccent[primaryPlatform]) || "bg-primary"

  const dot = (
    <span
      className={cn(
        "size-1.5 shrink-0 rounded-full ring-2",
        statusDotColor[post.status] || statusDotColor.PENDING,
        statusDotRing[post.status] || statusDotRing.PENDING
      )}
    />
  )

  const ariaLabel = `${statusLabel[post.status] || "Post"} for ${post.platforms.join(", ")}${
    post.scheduledAt ? ` at ${format(new Date(post.scheduledAt), "MMM d, h:mm a")}` : ""
  }: ${post.content}`

  const baseChip =
    "group/chip relative flex w-full overflow-hidden rounded-lg border border-border/60 bg-card/80 text-left shadow-xs transition-all duration-150 hover:-translate-y-px hover:border-border hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"

  const accentBar = (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-1 left-0 w-0.5 rounded-full opacity-70 transition-opacity group-hover/chip:opacity-100",
        accentColor
      )}
    />
  )

  let trigger: React.ReactNode

  if (variant === "tiny") {
    trigger = (
      <button
        onClick={onClick}
        style={style}
        draggable={draggable}
        onDragStart={handleDragStart}
        aria-label={ariaLabel}
        className={cn(
          baseChip,
          "items-center gap-1 pl-1.5 pr-1 py-0.5",
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {accentBar}
        {dot}
        <span className="flex-1 truncate text-[10px] font-medium">
          {post.content}
        </span>
        {post.platforms.slice(0, 2).map((p) => {
          const config = platformConfig[p]
          const Icon = config.icon
          return (
            <Icon
              key={p}
              className={cn("size-2.5 shrink-0", config.color)}
            />
          )
        })}
      </button>
    )
  } else if (variant === "short") {
    trigger = (
      <button
        onClick={onClick}
        style={style}
        draggable={draggable}
        onDragStart={handleDragStart}
        aria-label={ariaLabel}
        className={cn(
          baseChip,
          "items-center gap-2 pl-2.5 pr-1.5 py-1",
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {accentBar}
        {dot}
        <span className="flex-1 truncate text-[11px] font-semibold">
          {post.content}
        </span>
        {post.aiGenerated && (
          <Sparkles className="size-2.5 shrink-0 text-violet-500" />
        )}
        {post.scheduledAt && (
          <span className="shrink-0 rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {format(new Date(post.scheduledAt), "h:mm a")}
          </span>
        )}
      </button>
    )
  } else if (variant === "full") {
    trigger = (
      <button
        onClick={onClick}
        style={style}
        draggable={draggable}
        onDragStart={handleDragStart}
        aria-label={ariaLabel}
        className={cn(
          baseChip,
          "flex-col gap-1.5 pl-3 pr-2.5 py-2",
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {accentBar}
        <div className="flex items-center gap-1.5">
          {dot}
          <p className="line-clamp-2 flex-1 text-xs font-semibold leading-snug">
            {post.content}
          </p>
          {post.aiGenerated && (
            <Sparkles className="size-3 shrink-0 text-violet-500" />
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
            {post.scheduledAt &&
              format(new Date(post.scheduledAt), "h:mm a")}
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
  } else {
    // medium (default)
    trigger = (
      <button
        onClick={onClick}
        style={style}
        draggable={draggable}
        onDragStart={handleDragStart}
        aria-label={ariaLabel}
        className={cn(
          baseChip,
          "flex-col gap-1 pl-2.5 pr-2 py-1.5",
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {accentBar}
        <div className="flex items-center gap-1.5">
          {dot}
          <span className="flex-1 truncate text-xs font-semibold leading-tight">
            {post.content}
          </span>
          {post.aiGenerated && (
            <Sparkles className="size-2.5 shrink-0 text-violet-500" />
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="tabular-nums">
            {post.scheduledAt &&
              format(new Date(post.scheduledAt), "h:mm a")}
          </span>
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

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-72 p-0 overflow-hidden"
      >
        <div className={cn("h-1 w-full", accentColor)} />
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full ring-2",
                  statusDotColor[post.status] || statusDotColor.PENDING,
                  statusDotRing[post.status] || statusDotRing.PENDING
                )}
              />
              <span className="text-xs font-semibold">
                {statusLabel[post.status] || post.status}
              </span>
            </div>
            {post.aiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                <Sparkles className="size-2.5" />
                AI
              </span>
            )}
          </div>

          {post.scheduledAt && (
            <div className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {format(new Date(post.scheduledAt), "EEE, MMM d · h:mm a")}
            </div>
          )}

          <p className="line-clamp-6 text-sm leading-relaxed">
            {post.content}
          </p>

          {post.mediaUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-1">
              {post.mediaUrls.slice(0, 4).map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
          )}

          {post.platforms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
              {post.platforms.map((p) => {
                const config = platformConfig[p]
                const Icon = config.icon
                return (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    <Icon className={cn("size-3", config.color)} />
                    {config.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
