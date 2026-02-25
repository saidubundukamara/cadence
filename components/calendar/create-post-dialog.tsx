"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, CalendarIcon, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { PlatformSelector } from "@/components/posts/PlatformSelector"
import { EnhancedTextarea } from "@/components/posts/EnhancedTextarea"
import { MediaUpload } from "@/components/posts/MediaUpload"
import { toast } from "sonner"
import type { Platform } from "@/types"

export function CreatePostDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState("09:00")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch("/api/social/accounts")
      .then((res) => res.json())
      .then((accounts: { platform: Platform }[]) => {
        setConnectedPlatforms(accounts.map((a) => a.platform))
      })
      .catch(() => {})
  }, [open])

  function resetForm() {
    setContent("")
    setPlatforms([])
    setMediaUrls([])
    setDate(undefined)
    setTime("09:00")
  }

  async function handleCreate() {
    if (!content.trim()) {
      toast.error("Content is required")
      return
    }
    if (platforms.length === 0) {
      toast.error("Select at least one platform")
      return
    }
    if (!date) {
      toast.error("Pick a date")
      return
    }

    const [hours, minutes] = time.split(":").map(Number)
    const scheduledAt = new Date(date)
    scheduledAt.setHours(hours, minutes, 0, 0)

    if (scheduledAt <= new Date()) {
      toast.error("Schedule time must be in the future")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platforms,
          scheduledAt: scheduledAt.toISOString(),
          mediaUrls,
        }),
      })

      if (res.ok) {
        toast.success("Post created and scheduled")
        setOpen(false)
        resetForm()
        router.push("/posts")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create post")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Platforms */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Publish to</label>
              {platforms.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {platforms.length} platform{platforms.length !== 1 && "s"} selected
                </span>
              )}
            </div>
            <PlatformSelector
              selected={platforms}
              onChange={setPlatforms}
              connectedPlatforms={connectedPlatforms}
            />
          </section>

          <Separator />

          {/* Content */}
          <section className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <EnhancedTextarea
              value={content}
              onChange={setContent}
              platforms={platforms}
            />
          </section>

          <Separator />

          {/* Media */}
          <section className="space-y-2">
            <label className="text-sm font-medium">Media</label>
            <MediaUpload mediaUrls={mediaUrls} onMediaChange={setMediaUrls} />
          </section>

          <Separator />

          {/* Schedule */}
          <section className="space-y-2">
            <label className="text-sm font-medium">Schedule</label>
            <div className="flex flex-wrap items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-48 justify-start font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                    {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) =>
                      d < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-32 pl-9"
                />
              </div>
              {date && time && (
                <span className="text-xs text-muted-foreground">
                  {format(
                    (() => {
                      const [h, m] = time.split(":").map(Number)
                      const d = new Date(date)
                      d.setHours(h, m, 0, 0)
                      return d
                    })(),
                    "EEEE 'at' h:mm a"
                  )}
                </span>
              )}
            </div>
          </section>

          {/* Submit */}
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Schedule Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
