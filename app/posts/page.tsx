"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Plus, Twitter, Facebook, Instagram, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PostStatusBadge } from "@/components/posts/PostStatusBadge"
import { toast } from "sonner"
import type { PostWithResults, PostStatus, Platform } from "@/types"

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  TWITTER: Twitter,
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithResults[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchPosts()
  }, [filter])

  async function fetchPosts() {
    setLoading(true)
    const params = filter !== "all" ? `?status=${filter}` : ""
    const res = await fetch(`/api/posts${params}`)
    if (res.ok) {
      setPosts(await res.json())
    }
    setLoading(false)
  }

  async function deletePost(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Post cancelled")
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } else {
      toast.error("Failed to cancel post")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Posts</h2>
        <Button asChild>
          <Link href="/posts/new">
            <Plus className="mr-2 size-4" />
            New Post
          </Link>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Platforms</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No posts found.{" "}
                  <Link href="/posts/new" className="text-primary hover:underline">
                    Create one
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs truncate">
                    {post.content}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {post.platforms.map((p) => {
                        const Icon = platformIcons[p]
                        return <Icon key={p} className="size-4" />
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(post.scheduledAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <PostStatusBadge status={post.status as PostStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/posts/${post.id}`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                      {post.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
