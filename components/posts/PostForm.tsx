"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Sparkles, X, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
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
import { PlatformSelector } from "@/components/posts/PlatformSelector"
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
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
  { value: "urgent", label: "Urgent" },
]

export function PostForm({ post, mode = "create" }: PostFormProps) {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>(
    post?.platforms ?? []
  )
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    post?.mediaUrls ?? []
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
    register,
    handleSubmit,
    setValue,
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

  function removeMedia(url: string) {
    setMediaUrls((prev) => prev.filter((u) => u !== url))
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const signRes = await fetch("/api/upload", { method: "POST" })
      const { signature, timestamp, cloudName, apiKey } = await signRes.json()

      const formData = new FormData()
      formData.append("file", file)
      formData.append("signature", signature)
      formData.append("timestamp", String(timestamp))
      formData.append("api_key", apiKey)
      formData.append("folder", "cadence")

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      )

      const uploadData = await uploadRes.json()
      if (uploadData.secure_url) {
        setMediaUrls((prev) => [...prev, uploadData.secure_url])
        toast.success("Image uploaded")
      }
    } catch {
      toast.error("Failed to upload image")
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

      // Use the first platform's generated content as the main content
      const firstPlatform = platforms[0]
      const generated = content[firstPlatform] || Object.values(content)[0]

      if (generated) {
        setValue("content", generated as string)
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
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "edit" ? "Edit Post" : "Create Post"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <PlatformSelector
            selected={platforms}
            onChange={setPlatforms}
            connectedPlatforms={connectedPlatforms}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Write your post content..."
              className="min-h-32"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48 justify-start">
                    <CalendarIcon className="mr-2 size-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
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
                className="w-32"
              />
            </div>
          </div>
          {errors.scheduledAt && (
            <p className="text-sm text-destructive">
              {errors.scheduledAt.message}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Media</label>
            <div className="flex flex-wrap gap-2">
              {mediaUrls.map((url) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt="Media"
                    className="size-20 rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(url)}
                    className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <label className="flex size-20 cursor-pointer items-center justify-center rounded-md border border-dashed border-border hover:bg-accent">
                <Upload className="size-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMediaUpload}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Update Post"
                  : "Schedule Post"}
            </Button>
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  <Sparkles className="mr-2 size-4" />
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Content with AI</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic</label>
                    <Input
                      placeholder="What should the post be about?"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
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
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {platforms.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Select platforms above before generating.
                    </p>
                  )}
                  <Button
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
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
