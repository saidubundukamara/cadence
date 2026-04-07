"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

type Notification = {
  id: string
  type: "PUBLISH_SUCCESS" | "PUBLISH_FAILURE" | "SYSTEM"
  title: string
  message: string
  postId: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Refresh when popover opens
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const typeIcon: Record<string, string> = {
    PUBLISH_SUCCESS: "text-green-500",
    PUBLISH_FAILURE: "text-red-500",
    SYSTEM: "text-blue-500",
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={markAllRead}
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 border-b px-3 py-2.5 last:border-b-0 ${
                  !n.read ? "bg-muted/50" : ""
                }`}
              >
                <div
                  className={`mt-0.5 size-2 shrink-0 rounded-full ${
                    typeIcon[n.type] || ""
                  }`}
                  style={{
                    backgroundColor:
                      n.type === "PUBLISH_SUCCESS"
                        ? "#22c55e"
                        : n.type === "PUBLISH_FAILURE"
                          ? "#ef4444"
                          : "#3b82f6",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {n.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {n.postId && (
                      <Link
                        href={`/posts/${n.postId}`}
                        className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        View post
                        <ExternalLink className="size-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() => markRead(n.id)}
                  >
                    <Check className="size-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
