"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarDays, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

export function SchedulePopover() {
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

  async function handleSchedule() {
    if (!content.trim() || selectedPlatforms.length === 0 || !date) {
      toast.error("Fill in all fields")
      return
    }

    const [hours, minutes] = time.split(":").map(Number)
    const scheduledAt = new Date(date)
    scheduledAt.setHours(hours, minutes, 0, 0)

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
        toast.success("Post scheduled")
        setOpen(false)
        setContent("")
        setSelectedPlatforms([])
        setDate(undefined)
        // Refresh the page to show new post
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to schedule")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarDays className="mr-2 size-4" />
          Schedule
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-4">
        <h4 className="text-sm font-medium">Quick Schedule</h4>
        <div className="space-y-2">
          {platforms.map((p) => (
            <label key={p.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedPlatforms.includes(p.value)}
                onCheckedChange={() => togglePlatform(p.value)}
              />
              {p.label}
            </label>
          ))}
        </div>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-20"
        />
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <CalendarIcon className="mr-2 size-3" />
                {date ? format(date, "MMM d") : "Date"}
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
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-24"
          />
        </div>
        <Button
          onClick={handleSchedule}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          {loading ? "Scheduling..." : "Schedule"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
