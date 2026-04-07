"use client"

import { useState, useEffect } from "react"
import { Plus, X, Tag as TagIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import type { PostTag } from "@/types"

const TAG_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
]

interface TagSelectorProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<(PostTag & { _count?: { posts: number } })[]>([])
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .catch(() => {})
  }, [])

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id))

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  function removeTag(tagId: string) {
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  async function createTag() {
    if (!newTagName.trim()) return

    setCreating(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to create tag")
        return
      }

      const tag = await res.json()
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      onChange([...selectedTagIds, tag.id])
      setNewTagName("")
      setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)])
    } catch {
      toast.error("Failed to create tag")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1"
            style={{ borderColor: tag.color, borderWidth: 1 }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
            >
              <TagIcon className="size-3" />
              {selectedTags.length === 0 ? "Add tags" : "Edit"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Select tags
              </p>

              {/* Existing tags */}
              {tags.length > 0 && (
                <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Create new tag */}
              <div className="space-y-2 border-t pt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Create new
                </p>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        createTag()
                      }
                    }}
                    className="h-7 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2"
                    onClick={createTag}
                    disabled={creating || !newTagName.trim()}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`size-5 rounded-full border-2 transition-transform ${
                        newTagColor === color
                          ? "scale-110 border-foreground"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
