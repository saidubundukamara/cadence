"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Twitter,
  Facebook,
  Instagram,
  CalendarDays,
  Edit,
  Trash2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PostStatusBadge } from "@/components/posts/PostStatusBadge"
import { useCalendarStore } from "@/store/calendar-store"
import { toast } from "sonner"
import type { PostWithResults, Platform, PostStatus } from "@/types"

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  TWITTER: Twitter,
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
}

const platformNames: Record<Platform, string> = {
  TWITTER: "X (Twitter)",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
}

export function PostSheet() {
  const router = useRouter()
  const { selectedPostId, clearSelection } = useCalendarStore()
  const [post, setPost] = useState<PostWithResults | null>(null)
  const [loading, setLoading] = useState(false)

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
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Post cancelled")
      clearSelection()
    } else {
      toast.error("Failed to cancel post")
    }
  }

  return (
    <Sheet open={!!selectedPostId} onOpenChange={() => clearSelection()}>
      <SheetContent className="w-full sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>Post Details</SheetTitle>
        </SheetHeader>

        {loading || !post ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            {loading ? "Loading..." : "No post selected"}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Content */}
            <div className="space-y-2">
              <p className="whitespace-pre-wrap text-sm">{post.content}</p>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 text-muted-foreground" />
              <span>
                {format(new Date(post.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            <Separator />

            {/* Platform Results */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Platforms</h4>
              {post.platforms.map((platform) => {
                const Icon = platformIcons[platform]
                const result = post.results.find(
                  (r) => r.platform === platform
                )

                return (
                  <div
                    key={platform}
                    className="flex items-start justify-between rounded-md border p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 size-4" />
                      <div>
                        <p className="text-sm font-medium">
                          {platformNames[platform]}
                        </p>
                        {result ? (
                          <div className="mt-1">
                            <PostStatusBadge
                              status={result.status as PostStatus}
                            />
                            {result.platformPostId && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                ID: {result.platformPostId}
                              </p>
                            )}
                            {result.error && (
                              <p className="mt-1 text-xs text-destructive">
                                {result.error}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="mt-1">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Media */}
            {post.mediaUrls.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.mediaUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Media"
                        className="size-20 rounded-md object-cover"
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* AI indicator */}
            {post.aiGenerated && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4" />
                  AI Generated
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearSelection()
                  router.push(`/posts/${post.id}`)
                }}
              >
                <Edit className="mr-2 size-4" />
                Edit
              </Button>
              {post.status === "PENDING" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 size-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
