import { Badge } from "@/components/ui/badge"
import type { PostStatus } from "@/types"

const statusConfig: Record<PostStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "outline" },
  PUBLISHED: { label: "Published", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const config = statusConfig[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
