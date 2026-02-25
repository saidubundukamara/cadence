"use client"

import { useEffect, useState, use } from "react"
import { PostForm } from "@/components/posts/PostForm"
import { Skeleton } from "@/components/ui/skeleton"
import type { PostWithResults } from "@/types"

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [post, setPost] = useState<PostWithResults | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then(setPost)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!post) {
    return <div className="text-muted-foreground">Post not found</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Post</h1>
        <p className="text-sm text-muted-foreground">
          Update your scheduled post content and settings.
        </p>
      </div>
      <PostForm post={post} mode="edit" />
    </div>
  )
}
