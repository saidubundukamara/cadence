"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PostsHeader } from "@/components/posts/PostsHeader"
import { PostsToolbar } from "@/components/posts/PostsToolbar"
import { PostCardList } from "@/components/posts/PostCardList"
import { PostsLoadingSkeleton } from "@/components/posts/PostsLoadingSkeleton"
import { PostsEmptyState } from "@/components/posts/PostsEmptyState"
import type { PostWithResults, PostTag } from "@/types"

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithResults[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [tags, setTags] = useState<PostTag[]>([])
  const [tagFilter, setTagFilter] = useState("all")

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [statusFilter])

  async function fetchPosts() {
    setLoading(true)
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : ""
    const res = await fetch(`/api/posts${params}`)
    if (res.ok) {
      setPosts(await res.json())
    }
    setLoading(false)
  }

  // Status counts from the full (unfiltered-by-search) posts array
  const counts = useMemo(() => {
    return {
      all: posts.length,
      draft: posts.filter((p) => p.status === "DRAFT").length,
      pending: posts.filter((p) => p.status === "PENDING").length,
      published: posts.filter((p) => p.status === "PUBLISHED").length,
      failed: posts.filter((p) => p.status === "FAILED").length,
    }
  }, [posts])

  // Client-side search + sort
  const filteredPosts = useMemo(() => {
    let result = posts

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.content.toLowerCase().includes(q))
    }

    if (tagFilter !== "all") {
      result = result.filter((p) =>
        p.tags?.some((t) => t.id === tagFilter)
      )
    }

    result = [...result].sort((a, b) => {
      const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : new Date(b.createdAt).getTime()
      if (sortBy === "newest") {
        return dateB - dateA
      }
      if (sortBy === "oldest") {
        return dateA - dateB
      }
      // By platform — sort by first platform name
      const platA = a.platforms[0] ?? ""
      const platB = b.platforms[0] ?? ""
      return platA.localeCompare(platB)
    })

    return result
  }, [posts, search, sortBy])

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(filteredPosts.map((p) => p.id)))
      } else {
        setSelectedIds(new Set())
      }
    },
    [filteredPosts]
  )

  async function handleDelete(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Post cancelled")
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      toast.error("Failed to cancel post")
    }
  }

  async function handlePermanentDelete(id: string) {
    if (!window.confirm("Permanently delete this post? This cannot be undone.")) return
    const res = await fetch(`/api/posts/${id}?permanent=true`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Post deleted")
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      toast.error("Failed to delete post")
    }
  }

  async function handleBulkDelete() {
    const pendingIds = [...selectedIds].filter((id) => {
      const post = posts.find((p) => p.id === id)
      return post?.status === "PENDING" || post?.status === "DRAFT"
    })

    if (pendingIds.length === 0) {
      toast.error("Only pending or draft posts can be cancelled")
      return
    }

    const results = await Promise.allSettled(
      pendingIds.map((id) =>
        fetch(`/api/posts/${id}`, { method: "DELETE" })
      )
    )

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok
    ).length

    if (succeeded > 0) {
      toast.success(`Cancelled ${succeeded} post${succeeded !== 1 ? "s" : ""}`)
      setPosts((prev) => prev.filter((p) => !pendingIds.includes(p.id)))
    }

    const failed = pendingIds.length - succeeded
    if (failed > 0) {
      toast.error(`Failed to cancel ${failed} post${failed !== 1 ? "s" : ""}`)
    }

    setSelectedIds(new Set())
  }

  async function handleBulkPermanentDelete() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    if (!window.confirm(`Permanently delete ${ids.length} post${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/posts/${id}?permanent=true`, { method: "DELETE" })
      )
    )

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok
    ).length

    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} post${succeeded !== 1 ? "s" : ""}`)
      const succeededIds = ids.filter((_, i) => results[i].status === "fulfilled" && (results[i] as PromiseFulfilledResult<Response>).value.ok)
      setPosts((prev) => prev.filter((p) => !succeededIds.includes(p.id)))
    }

    const failed = ids.length - succeeded
    if (failed > 0) {
      toast.error(`Failed to delete ${failed} post${failed !== 1 ? "s" : ""}`)
    }

    setSelectedIds(new Set())
  }

  const hasFilters = search !== "" || statusFilter !== "all" || tagFilter !== "all"

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PostsHeader totalCount={posts.length} />

        <PostsToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => {
            setStatusFilter(value)
            setSelectedIds(new Set())
          }}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          tags={tags}
          counts={counts}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          onBulkPermanentDelete={handleBulkPermanentDelete}
          onClearSelection={() => setSelectedIds(new Set())}
        />

        {loading ? (
          <PostsLoadingSkeleton />
        ) : filteredPosts.length === 0 ? (
          <PostsEmptyState hasFilters={hasFilters} />
        ) : (
          <PostCardList
            posts={filteredPosts}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onDelete={handleDelete}
            onPermanentDelete={handlePermanentDelete}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
