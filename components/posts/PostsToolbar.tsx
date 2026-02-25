"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type StatusCounts = {
  all: number
  pending: number
  published: number
  failed: number
}

type PostsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  sortBy: string
  onSortByChange: (value: string) => void
  counts: StatusCounts
  selectedCount: number
  onBulkDelete: () => void
  onBulkPermanentDelete: () => void
  onClearSelection: () => void
}

export function PostsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  counts,
  selectedCount,
  onBulkDelete,
  onBulkPermanentDelete,
  onClearSelection,
}: PostsToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Search + Status tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              All
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="gap-1.5">
              Pending
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                {counts.pending}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="PUBLISHED" className="gap-1.5">
              Published
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                {counts.published}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="FAILED" className="gap-1.5">
              Failed
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                {counts.failed}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Row 2: Sort + Bulk actions */}
      <div className="flex items-center justify-between">
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="platform">By platform</SelectItem>
          </SelectContent>
        </Select>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
            >
              Cancel Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={onBulkPermanentDelete}
            >
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="mr-1 size-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
