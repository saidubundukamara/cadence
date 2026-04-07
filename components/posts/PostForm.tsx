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
  FileEdit,
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
import { PlatformContentTabs } from "@/components/posts/PlatformContentTabs"
import { TagSelector } from "@/components/posts/TagSelector"
import { MediaUpload } from "@/components/posts/MediaUpload"
import { VideoUpload } from "@/components/posts/VideoUpload"
import { toast } from "sonner"
import type { Platform, PostWithResults } from "@/types"

const postSchema = z.object({
  scheduledAt: z.string().optional(),
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
  const [platformContents, setPlatformContents] = useState<Record<string, string>>(
    () => {
      if (!post?.platformContents?.length) return {}
      return Object.fromEntries(
        post.platformContents.map((pc) => [pc.platform, pc.content])
      )
    }
  )
  const [mediaUrls, setMediaUrls] = useState<string[]>(post?.mediaUrls ?? [])
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(
    post?.youtubeVideoId ?? null
  )
  const [tagIds, setTagIds] = useState<string[]>(
    post?.tags?.map((t) => t.id) ?? []
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
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null)

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      scheduledAt: post?.scheduledAt
        ? new Date(post.scheduledAt).toISOString()
        : "",
    },
  })

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

  function handlePlatformContentChange(platform: string, value: string) {
    setPlatformContents((prev) => ({ ...prev, [platform]: value }))
  }

  async function callAiGenerate(targetPlatforms: Platform[]): Promise<Record<string, string> | null> {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: aiTopic,
        tone: aiTone,
        platforms: targetPlatforms,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || "Generation failed")
      return null
    }

    return res.json()
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
      const generated = await callAiGenerate(platforms)
      if (!generated) return

      // Populate all platform tabs at once
      setPlatformContents((prev) => {
        const updated = { ...prev }
        for (const platform of platforms) {
          if (generated[platform]) {
            updated[platform] = generated[platform]
          }
        }
        return updated
      })

      toast.success(`Content generated for ${platforms.length} platform${platforms.length > 1 ? "s" : ""}`)
      setAiOpen(false)
      setAiTopic("")
    } catch {
      toast.error("Failed to generate content")
    } finally {
      setAiGenerating(false)
    }
  }

  async function handleRegenerate(platform: string) {
    if (!aiTopic.trim()) {
      toast.error("Enter a topic in 'Write with AI' first")
      setAiOpen(true)
      return
    }

    setRegeneratingPlatform(platform)
    try {
      const generated = await callAiGenerate([platform as Platform])
      if (!generated) return

      const newContent = generated[platform]
      if (newContent) {
        setPlatformContents((prev) => ({ ...prev, [platform]: newContent }))
        toast.success(`${platform} content regenerated`)
      }
    } catch {
      toast.error("Failed to regenerate content")
    } finally {
      setRegeneratingPlatform(null)
    }
  }

  async function onSubmit(data: PostFormData, isDraft = false) {
    const platformContentsArray = platforms
      .filter((p) => platformContents[p]?.trim())
      .map((p) => ({ platform: p, content: platformContents[p] }))

    // For drafts, only require some content written
    if (!isDraft) {
      if (platforms.length === 0) {
        toast.error("Select at least one platform")
        return
      }
      if (platformContentsArray.length === 0) {
        toast.error("Write content for at least one platform")
        return
      }
      if (!data.scheduledAt) {
        toast.error("Pick a schedule time")
        return
      }
    }

    // For drafts, build content from whatever is available
    const masterContent =
      platformContentsArray[0]?.content ||
      Object.values(platformContents).find((c) => c?.trim()) ||
      "Draft"

    setLoading(true)

    try {
      const url = mode === "edit" ? `/api/posts/${post?.id}` : "/api/posts"
      const method = mode === "edit" ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: masterContent,
          platforms,
          scheduledAt: data.scheduledAt || null,
          mediaUrls,
          youtubeVideoId,
          platformContents: platformContentsArray,
          aiGenerated: Object.keys(platformContents).length > 0,
          isDraft,
          tagIds,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || "Failed to save post")
        return
      }

      toast.success(
        isDraft
          ? "Draft saved"
          : mode === "edit"
            ? "Post updated"
            : "Post scheduled"
      )
      router.push("/posts")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-8">
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

      {/* ── Tags ── */}
      <section className="space-y-3">
        <label className="text-sm font-medium">Tags</label>
        <TagSelector selectedTagIds={tagIds} onChange={setTagIds} />
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
                  Describe your topic and we&apos;ll create a tailored version for each selected platform — optimized for its style, tone, and character limits.
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
                {platforms.length === 0 ? (
                  <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                    Select platforms above before generating.
                  </p>
                ) : (
                  <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    Will generate content for: {platforms.join(", ")}
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
                      Generate for all platforms
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <PlatformContentTabs
          platforms={platforms}
          contents={platformContents}
          onChange={handlePlatformContentChange}
          onRegenerate={handleRegenerate}
          regenerating={regeneratingPlatform}
        />
      </section>

      <Separator />

      {/* ── Media ── */}
      <section className="space-y-3">
        <label className="text-sm font-medium">Media</label>
        <MediaUpload mediaUrls={mediaUrls} onMediaChange={setMediaUrls} platforms={platforms} />
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
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            const data = { scheduledAt: undefined as string | undefined }
            if (date && time) {
              const [hours, minutes] = time.split(":").map(Number)
              const scheduled = new Date(date)
              scheduled.setHours(hours, minutes, 0, 0)
              data.scheduledAt = scheduled.toISOString()
            }
            onSubmit(data, true)
          }}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FileEdit className="mr-2 size-4" />
              Save as Draft
            </>
          )}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : mode === "edit" && post?.status === "DRAFT" ? (
            <>
              <Send className="mr-2 size-4" />
              Schedule Post
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
