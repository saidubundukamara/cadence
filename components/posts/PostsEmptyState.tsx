import Link from "next/link"
import { FileText, SearchX, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type PostsEmptyStateProps = {
  hasFilters: boolean
}

export function PostsEmptyState({ hasFilters }: PostsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No matching posts</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
        <FileText className="size-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold">No posts yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first post to get started with scheduling.
      </p>
      <Button asChild className="mt-4">
        <Link href="/posts/new">
          <Plus className="mr-2 size-4" />
          Create Post
        </Link>
      </Button>
    </div>
  )
}
