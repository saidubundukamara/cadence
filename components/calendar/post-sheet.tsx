"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  CalendarDays,
  Clock,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PostStatusBadge } from "@/components/posts/PostStatusBadge"
import { platformConfig } from "@/lib/platform-config"
import { useCalendarStore } from "@/store/calendar-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { PostWithResults, PostStatus } from "@/types"

const statusDotColor: Record<string, string> = {
  PENDING: "bg-yellow-500",
  PUBLISHED: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-muted-foreground/50",
}

export function PostSheet() {
  const router = useRouter()
  const { selectedPostId, clearSelection } = useCalendarStore()
  const [post, setPost] = useState<PostWithResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [permanentDeleting, setPermanentDeleting] = useState(false)

  useEffect(() => {
    if (!selectedPostId) {
      setPost(null)
      return
    }

    setLoading(true)
    fetch(`/api/posts/${selectedPostId}`)
      .then((res) => res.json())
      .then(setPost)
      .finally(() => setLoading(false))
  }, [selectedPostId])

  async function handleDelete() {
    if (!post) return
    setDeleting(true)
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      toast.success("Post cancelled")
      clearSelection()
    } else {
      toast.error("Failed to cancel post")
    }
  }

  async function handlePermanentDelete() {
    if (!post) return
    if (!window.confirm("Permanently delete this post? This cannot be undone.")) return
    setPermanentDeleting(true)
    const res = await fetch(`/api/posts/${post.id}?permanent=true`, { method: "DELETE" })
    setPermanentDeleting(false)
    if (res.ok) {
      toast.success("Post deleted")
      clearSelection()
    } else {
      toast.error("Failed to delete post")
    }
  }

  return (
    <Sheet open={!!selectedPostId} onOpenChange={() => clearSelection()}>
      <SheetContent className="flex w-full flex-col sm:max-w-[480px]">
        {/* Header always rendered for accessibility */}
        <SheetHeader className="gap-1">
          <div className="flex items-center gap-2">
            {post && (
              <span
                className={cn(
                  "size-2 rounded-full",
                  statusDotColor[post.status] || statusDotColor.PENDING
                )}
              />
            )}
            <SheetTitle className="text-base">Post Details</SheetTitle>
          </div>
          {post && (
            <SheetDescription className="flex items-center gap-2">
              <CalendarDays className="size-3.5" />
              {post.scheduledAt ? format(new Date(post.scheduledAt), "EEEE, MMM d, yyyy") : "No date"}
              <span>&middot;</span>
              <Clock className="size-3.5" />
              {post.scheduledAt ? format(new Date(post.scheduledAt), "h:mm a") : "—"}
            </SheetDescription>
          )}
        </SheetHeader>

        {loading || !post ? (
          <div className="flex flex-1 items-center justify-center">
            {loading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-sm text-muted-foreground">No post selected</p>
            )}
          </div>
        ) : (
          <>

            {/* Scrollable body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-4">
              {/* Content */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {post.content}
                </p>
                {post.aiGenerated && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    AI Generated
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <PostStatusBadge status={post.status as PostStatus} />
              </div>

              {/* Platforms */}
              <div className="space-y-2.5">
                <span className="text-sm font-medium">Platforms</span>
                <div className="space-y-2">
                  {post.platforms.map((platform) => {
                    const config = platformConfig[platform]
                    const Icon = config.icon
                    const result = post.results.find(
                      (r) => r.platform === platform
                    )

                    return (
                      <div
                        key={platform}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3",
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-md bg-background",
                            config.borderColor,
                            "border"
                          )}
                        >
                          <Icon className={cn("size-4", config.color)} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{config.label}</p>
                          {result ? (
                            <div className="mt-0.5 flex items-center gap-2">
                              <PostStatusBadge
                                status={result.status as PostStatus}
                              />
                              {result.error && (
                                <span className="text-xs text-destructive">
                                  {result.error}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Awaiting publish
                            </span>
                          )}
                        </div>
                        {result?.platformPostId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            asChild
                          >
                            <a
                              href={`#${result.platformPostId}`}
                              title="View on platform"
                            >
                              <ExternalLink className="size-3.5 text-muted-foreground" />
                            </a>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Media */}
              {post.mediaUrls.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-sm font-medium">
                    Media ({post.mediaUrls.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {post.mediaUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Media"
                        className="aspect-square w-full rounded-lg border object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <SheetFooter className="flex-row gap-2 border-t pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  clearSelection()
                  router.push(`/posts/${post.id}`)
                }}
              >
                <Edit className="mr-2 size-4" />
                Edit Post
              </Button>
              {post.status === "PENDING" && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Cancel Post
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10"
                onClick={handlePermanentDelete}
                disabled={permanentDeleting}
              >
                {permanentDeleting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                Delete
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
