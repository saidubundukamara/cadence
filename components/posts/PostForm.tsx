"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import {
  CalendarIcon,
  Clock,
  Sparkles,
  Loader2,
  Send,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PlatformSelector } from "@/components/posts/PlatformSelector"
import { EnhancedTextarea } from "@/components/posts/EnhancedTextarea"
import { MediaUpload } from "@/components/posts/MediaUpload"
import { VideoUpload } from "@/components/posts/VideoUpload"
import { toast } from "sonner"
import type { Platform, PostWithResults } from "@/types"

const postSchema = z.object({
  content: z.string().min(1, "Content is required"),
  scheduledAt: z.string().min(1, "Schedule time is required"),
})

type PostFormData = z.infer<typeof postSchema>

interface PostFormProps {
  post?: PostWithResults
  mode?: "create" | "edit"
}

const TONES = [
  { value: "professional", label: "Professional", emoji: "👔" },
  { value: "casual", label: "Casual", emoji: "😊" },
  { value: "humorous", label: "Humorous", emoji: "😄" },
  { value: "inspirational", label: "Inspirational", emoji: "✨" },
  { value: "urgent", label: "Urgent", emoji: "🔥" },
]

export function PostForm({ post, mode = "create" }: PostFormProps) {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>(
    post?.platforms ?? []
  )
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    post?.mediaUrls ?? []
  )
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(
    post?.youtubeVideoId ?? null
  )
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(
    post?.scheduledAt ? new Date(post.scheduledAt) : undefined
  )
  const [time, setTime] = useState(
    post?.scheduledAt
      ? format(new Date(post.scheduledAt), "HH:mm")
      : "09:00"
  )

  // AI generation state
  const [aiOpen, setAiOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiTone, setAiTone] = useState("professional")
  const [aiGenerating, setAiGenerating] = useState(false)

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: post?.content ?? "",
      scheduledAt: post?.scheduledAt
        ? new Date(post.scheduledAt).toISOString()
        : "",
    },
  })

  const watchedContent = watch("content") || ""

  useEffect(() => {
    fetch("/api/social/accounts")
      .then((res) => res.json())
      .then((accounts: { platform: Platform }[]) => {
        setConnectedPlatforms(accounts.map((a) => a.platform))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (date && time) {
      const [hours, minutes] = time.split(":").map(Number)
      const scheduled = new Date(date)
      scheduled.setHours(hours, minutes, 0, 0)
      setValue("scheduledAt", scheduled.toISOString())
    }
  }, [date, time, setValue])

  async function onSubmit(data: PostFormData) {
    if (platforms.length === 0) {
      toast.error("Select at least one platform")
      return
    }

    setLoading(true)

    try {
      const url = mode === "edit" ? `/api/posts/${post?.id}` : "/api/posts"
      const method = mode === "edit" ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          platforms,
          scheduledAt: data.scheduledAt,
          mediaUrls,
          youtubeVideoId,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || "Failed to save post")
        return
      }

      toast.success(
        mode === "edit" ? "Post updated" : "Post scheduled"
      )
      router.push("/posts")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleAiGenerate() {
    if (!aiTopic.trim()) {
      toast.error("Enter a topic")
      return
    }
    if (platforms.length === 0) {
      toast.error("Select platforms first")
      return
    }

    setAiGenerating(true)
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          tone: aiTone,
          platforms,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Generation failed")
        return
      }

      const content = await res.json()

      const firstPlatform = platforms[0]
      const generated = content[firstPlatform] || Object.values(content)[0]

      if (generated) {
        setValue("content", generated as string, {
          shouldValidate: true,
          shouldDirty: true,
        })
        toast.success("Content generated")
        setAiOpen(false)
        setAiTopic("")
      }
    } catch {
      toast.error("Failed to generate content")
    } finally {
      setAiGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Platforms ── */}
      <section className="space-y-3">
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

      {/* ── Content ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Content</label>
          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                <Sparkles className="size-3" />
                Write with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  Generate with AI
                </DialogTitle>
                <DialogDescription>
                  Describe your topic and we&apos;ll create optimized content for your selected platforms.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic</label>
                  <Input
                    placeholder="e.g. Product launch announcement for our new feature..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAiGenerate()
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={aiTone} onValueChange={setAiTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <span className="flex items-center gap-2">
                            <span>{tone.emoji}</span>
                            <span>{tone.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {platforms.length === 0 && (
                  <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                    Select platforms above before generating.
                  </p>
                )}
                <Button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || platforms.length === 0}
                  className="w-full"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Generate content
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <EnhancedTextarea
          value={watchedContent}
          onChange={(val) =>
            setValue("content", val, { shouldValidate: true, shouldDirty: true })
          }
          platforms={platforms}
        />
        {errors.content && (
          <p className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
      </section>

      <Separator />

      {/* ── Media ── */}
      <section className="space-y-3">
        <label className="text-sm font-medium">Media</label>
        <MediaUpload mediaUrls={mediaUrls} onMediaChange={setMediaUrls} />
      </section>

      {/* ── YouTube Video ── */}
      {platforms.includes("YOUTUBE") && (
        <>
          <Separator />
          <section className="space-y-3">
            <label className="text-sm font-medium">YouTube Video</label>
            <VideoUpload
              youtubeVideoId={youtubeVideoId}
              onVideoUploaded={setYoutubeVideoId}
              onVideoRemoved={() => setYoutubeVideoId(null)}
              isConnected={connectedPlatforms.includes("YOUTUBE")}
            />
          </section>
        </>
      )}

      <Separator />

      {/* ── Schedule ── */}
      <section className="space-y-3">
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
        {errors.scheduledAt && (
          <p className="text-sm text-destructive">
            {errors.scheduledAt.message}
          </p>
        )}
      </section>

      <Separator />

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/posts")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : mode === "edit" ? (
            <>
              <Save className="mr-2 size-4" />
              Update Post
            </>
          ) : (
            <>
              <Send className="mr-2 size-4" />
              Schedule Post
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
