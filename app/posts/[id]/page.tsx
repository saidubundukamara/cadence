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
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!post) {
    return <div className="text-muted-foreground">Post not found</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PostForm post={post} mode="edit" />
    </div>
  )
}
