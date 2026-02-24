"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Plus, CalendarIcon, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import type { Platform } from "@/types"

const platforms: { value: Platform; label: string }[] = [
  { value: "TWITTER", label: "X (Twitter)" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
]

export function CreatePostDialog() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState("09:00")
  const [loading, setLoading] = useState(false)

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  async function handleCreate() {
    if (!content.trim() || selectedPlatforms.length === 0 || !date) {
      toast.error("Fill in all fields")
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
          platforms: selectedPlatforms,
          scheduledAt: scheduledAt.toISOString(),
          mediaUrls: [],
        }),
      })

      if (res.ok) {
        toast.success("Post created and scheduled")
        setOpen(false)
        setContent("")
        setSelectedPlatforms([])
        setDate(undefined)
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create post")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-3">
              {platforms.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(p.value)}
                    onCheckedChange={() => togglePlatform(p.value)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Write your post content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32"
            />
          </div>

          <div className="flex gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-40 justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {date ? format(date, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-28"
              />
            </div>
          </div>

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
