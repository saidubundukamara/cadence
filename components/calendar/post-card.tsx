"use client"

import { format } from "date-fns"
import { Twitter, Facebook, Instagram } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CalendarPost, Platform } from "@/types"

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  TWITTER: Twitter,
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
}

const platformColors: Record<Platform, string> = {
  TWITTER: "text-blue-400",
  FACEBOOK: "text-blue-600",
  INSTAGRAM: "text-pink-500",
}

interface PostCardProps {
  post: CalendarPost
  variant?: "short" | "medium" | "full"
  onClick?: () => void
}

export function PostCard({
  post,
  variant = "medium",
  onClick,
}: PostCardProps) {
  const statusBorder: Record<string, string> = {
    PENDING: "border-l-yellow-500",
    PUBLISHED: "border-l-green-500",
    FAILED: "border-l-red-500",
    CANCELLED: "border-l-muted-foreground/30",
  }

  if (variant === "short") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border-l-2 bg-card px-2 py-1 text-left transition-all hover:bg-accent",
          statusBorder[post.status]
        )}
      >
        <div className="flex gap-1">
          {post.platforms.map((p) => {
            const Icon = platformIcons[p]
            return (
              <Icon key={p} className={cn("size-3", platformColors[p])} />
            )
          })}
        </div>
        <span className="flex-1 truncate text-xs">{post.content}</span>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(post.scheduledAt), "h:mm a")}
        </span>
      </button>
    )
  }

  if (variant === "full") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex w-full flex-col gap-2 rounded-lg border-l-2 bg-card p-3 text-left transition-all hover:bg-accent hover:shadow-sm",
          statusBorder[post.status]
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {post.platforms.map((p) => {
              const Icon = platformIcons[p]
              return (
                <Icon key={p} className={cn("size-4", platformColors[p])} />
              )
            })}
          </div>
          <Badge
            variant={
              post.status === "PUBLISHED"
                ? "default"
                : post.status === "FAILED"
                  ? "destructive"
                  : "outline"
            }
            className="text-[10px]"
          >
            {post.status}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm">{post.content}</p>
        {post.mediaUrls.length > 0 && (
          <div className="flex gap-1">
            {post.mediaUrls.slice(0, 3).map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="size-10 rounded object-cover"
              />
            ))}
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          {format(new Date(post.scheduledAt), "h:mm a")}
        </span>
      </button>
    )
  }

  // Medium variant (default)
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1 rounded-md border-l-2 bg-card px-2 py-1.5 text-left transition-all hover:bg-accent",
        statusBorder[post.status]
      )}
    >
      <div className="flex items-center gap-1">
        {post.platforms.map((p) => {
          const Icon = platformIcons[p]
          return (
            <Icon key={p} className={cn("size-3", platformColors[p])} />
          )
        })}
        <span className="flex-1 truncate text-xs font-medium">
          {post.content}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {format(new Date(post.scheduledAt), "h:mm a")}
      </span>
    </button>
  )
}
