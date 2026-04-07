"use client"

import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Clock, Edit, MoreHorizontal, Sparkles, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PostStatusBadge } from "@/components/posts/PostStatusBadge"
import { PostMediaPreview } from "@/components/posts/PostMediaPreview"
import { PostResultsSummary } from "@/components/posts/PostResultsSummary"
import { platformConfig } from "@/lib/platform-config"
import type { PostWithResults, PostStatus } from "@/types"

type PostCardProps = {
  post: PostWithResults
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onPermanentDelete: (id: string) => void
}

export function PostCard({ post, selected, onSelect, onDelete, onPermanentDelete }: PostCardProps) {
  const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null
  const isPending = post.status === "PENDING"
  const isDraft = post.status === "DRAFT"
  const showResults = post.status !== "PENDING" && post.results.length > 0

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <CardContent className="space-y-3 p-5">
        {/* Header: checkbox + content */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(post.id, !!checked)}
            className="mt-0.5"
          />
          <p className="line-clamp-3 flex-1 text-sm leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium"
                style={{ borderColor: tag.color }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Platform badges */}
        <div className="flex flex-wrap gap-1.5">
          {post.platforms.map((platform) => {
            const config = platformConfig[platform]
            const Icon = config.icon
            return (
              <span
                key={platform}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.bgColor} ${config.borderColor} ${config.color}`}
              >
                <Icon className="size-3" />
                {config.label}
              </span>
            )
          })}
        </div>

        {/* Media thumbnails */}
        <PostMediaPreview mediaUrls={post.mediaUrls} />

        {/* Footer: time + status + actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {scheduledDate ? (
              <>
                <span>{format(scheduledDate, "MMM d 'at' h:mm a")}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{formatDistanceToNow(scheduledDate, { addSuffix: true })}</span>
              </>
            ) : (
              <span>No schedule</span>
            )}
            {post.aiGenerated && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Sparkles className="size-3" />
                  AI
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <PostStatusBadge status={post.status as PostStatus} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/posts/${post.id}`}>
                    <Edit className="mr-2 size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {(isPending || isDraft) && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {isDraft ? "Delete Draft" : "Cancel Post"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onPermanentDelete(post.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Publish results */}
        {showResults && <PostResultsSummary results={post.results} />}
      </CardContent>
    </Card>
  )
}
