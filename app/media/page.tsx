"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Upload, Trash2, Film, Loader2, Image as ImageIcon, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

type MediaItem = {
  id: string
  url: string
  type: "IMAGE" | "VIDEO"
  filename: string | null
  size: number | null
  width: number | null
  height: number | null
  createdAt: string
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    const params = typeFilter !== "all" ? `?type=${typeFilter}` : ""
    try {
      const res = await fetch(`/api/media${params}`)
      const data = await res.json()
      setMedia(data.media || [])
      setTotal(data.total || 0)
    } catch {
      toast.error("Failed to load media")
    }
    setLoading(false)
  }, [typeFilter])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  async function handleUpload(files: FileList) {
    setUploading(true)
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      try {
        const signRes = await fetch("/api/upload", { method: "POST" })
        const { signature, timestamp, cloudName, apiKey } = await signRes.json()

        const isVideo = file.type.startsWith("video/")
        const resourceType = isVideo ? "video" : "image"

        const formData = new FormData()
        formData.append("file", file)
        formData.append("signature", signature)
        formData.append("timestamp", String(timestamp))
        formData.append("api_key", apiKey)
        formData.append("folder", "cadence")

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
          { method: "POST", body: formData }
        )

        const uploadData = await uploadRes.json()
        if (uploadData.secure_url) {
          await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: uploadData.secure_url,
              type: isVideo ? "VIDEO" : "IMAGE",
              filename: file.name,
              size: file.size,
              width: uploadData.width,
              height: uploadData.height,
            }),
          })
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    toast.success(`Uploaded ${fileArray.length} file${fileArray.length !== 1 ? "s" : ""}`)
    setUploading(false)
    fetchMedia()
  }

  async function handleDelete(ids: string[]) {
    if (!window.confirm(`Delete ${ids.length} file${ids.length !== 1 ? "s" : ""}?`)) return

    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/media/${id}`, { method: "DELETE" }))
    )

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok
    ).length

    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} file${succeeded !== 1 ? "s" : ""}`)
      setMedia((prev) => prev.filter((m) => !ids.includes(m.id)))
      setSelectedIds(new Set())
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            {total} file{total !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleUpload(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              All
            </TabsTrigger>
            <TabsTrigger value="IMAGE" className="gap-1.5">
              <ImageIcon className="size-3.5" />
              Images
            </TabsTrigger>
            <TabsTrigger value="VIDEO" className="gap-1.5">
              <Video className="size-3.5" />
              Videos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete([...selectedIds])}
            >
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No media files yet. Upload images or videos to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => {
            const isSelected = selectedIds.has(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleSelect(item.id)}
                className={cn(
                  "group relative overflow-hidden rounded-lg border-2 text-left transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/20"
                )}
              >
                {item.type === "VIDEO" ? (
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    <Film className="size-10 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename || "Media"}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Overlay info */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white">
                    {item.filename || "Untitled"}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/70">
                    {item.size && <span>{formatSize(item.size)}</span>}
                    {item.width && item.height && (
                      <span>
                        {item.width}x{item.height}
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                {/* Type badge */}
                {item.type === "VIDEO" && (
                  <Badge
                    variant="secondary"
                    className="absolute top-1.5 left-1.5 h-4 px-1 text-[9px]"
                  >
                    VIDEO
                  </Badge>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-xs font-bold">&#10003;</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
