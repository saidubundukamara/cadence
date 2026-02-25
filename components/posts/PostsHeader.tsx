import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type PostsHeaderProps = {
  totalCount: number
}

export function PostsHeader({ totalCount }: PostsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Posts</h2>
        <p className="text-sm text-muted-foreground">
          Manage and schedule your social media posts
          {totalCount > 0 && (
            <span className="ml-1">
              · {totalCount} post{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>
      <Button asChild>
        <Link href="/posts/new">
          <Plus className="mr-2 size-4" />
          New Post
        </Link>
      </Button>
    </div>
  )
}
