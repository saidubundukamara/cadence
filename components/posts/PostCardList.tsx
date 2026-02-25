"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { PostCard } from "@/components/posts/PostCard"
import type { PostWithResults } from "@/types"

type PostCardListProps = {
  posts: PostWithResults[]
  selectedIds: Set<string>
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onDelete: (id: string) => void
  onPermanentDelete: (id: string) => void
}

export function PostCardList({
  posts,
  selectedIds,
  onSelect,
  onSelectAll,
  onDelete,
  onPermanentDelete,
}: PostCardListProps) {
  const allSelected = posts.length > 0 && selectedIds.size === posts.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < posts.length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        <span className="text-sm text-muted-foreground">
          {allSelected ? "Deselect all" : "Select all"}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            selected={selectedIds.has(post.id)}
            onSelect={onSelect}
            onDelete={onDelete}
            onPermanentDelete={onPermanentDelete}
          />
        ))}
      </div>
    </div>
  )
}
