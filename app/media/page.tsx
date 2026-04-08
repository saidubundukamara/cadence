"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Upload,
  Trash2,
  Film,
  Loader2,
  Image as ImageIcon,
  Video,
  Search,
  Copy,
  Download,
} from "lucide-react"
import { CldImage, CldVideoPlayer, CldUploadWidget } from "next-cloudinary"
import "next-cloudinary/dist/cld-video-player.css"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

type MediaItem = {
  id: string
  url: string
  publicId: string | null
  type: "IMAGE" | "VIDEO"
  filename: string | null
  size: number | null
  width: number | null
  height: number | null
  createdAt: string
  _count?: { posts: number }
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null)

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (sort !== "newest") params.set("sort", sort)
    if (query.trim()) params.set("q", query.trim())
    try {
      const res = await fetch(`/api/media?${params.toString()}`)
      const data = await res.json()
      setMedia(data.media || [])
      setTotal(data.total || 0)
    } catch {
      toast.error("Failed to load media")
    }
    setLoading(false)
  }, [typeFilter, sort, query])

  useEffect(() => {
    const t = setTimeout(fetchMedia, query ? 250 : 0)
    return () => clearTimeout(t)
  }, [fetchMedia, query])

  async function handleUploaded(info: {
    secure_url: string
    public_id: string
    resource_type: string
    bytes?: number
    width?: number
    height?: number
    original_filename?: string
    format?: string
  }) {
    const isVideo = info.resource_type === "video"
    await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: info.secure_url,
        publicId: info.public_id,
        type: isVideo ? "VIDEO" : "IMAGE",
        filename: info.original_filename
          ? `${info.original_filename}${info.format ? "." + info.format : ""}`
          : null,
        size: info.bytes,
        width: info.width,
        height: info.height,
      }),
    })
    toast.success("Uploaded")
    fetchMedia()
  }

  async function deleteOne(item: MediaItem, force = false) {
    const res = await fetch(
      `/api/media/${item.id}${force ? "?force=true" : ""}`,
      { method: "DELETE" }
    )
    if (res.status === 409) {
      const data = await res.json()
      if (window.confirm(`${data.message} Delete anyway?`)) {
        return deleteOne(item, true)
      }
      return false
    }
    return res.ok
  }

  async function handleDelete(ids: string[]) {
    if (!window.confirm(`Delete ${ids.length} file${ids.length !== 1 ? "s" : ""}?`))
      return

    const items = media.filter((m) => ids.includes(m.id))
    const results = await Promise.all(items.map((i) => deleteOne(i)))
    const succeeded = results.filter(Boolean).length

    if (succeeded > 0) {
      toast.success(`Deleted ${succeeded} file${succeeded !== 1 ? "s" : ""}`)
      setSelectedIds(new Set())
      setDetailItem(null)
      fetchMedia()
    }
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation()
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

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    toast.success("URL copied")
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
        <CldUploadWidget
          signatureEndpoint="/api/sign-cloudinary"
          options={{
            apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
            folder: "cadence",
            multiple: true,
            sources: ["local", "url", "camera"],
            resourceType: "auto",
          }}
          onSuccess={(result) => {
            const info = result?.info
            if (info && typeof info === "object" && "secure_url" in info) {
              handleUploaded(info as Parameters<typeof handleUploaded>[0])
            }
          }}
        >
          {({ open }) => (
            <Button onClick={() => open()}>
              <Upload className="mr-2 size-4" />
              Upload
            </Button>
          )}
        </CldUploadWidget>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={typeFilter} onValueChange={setTypeFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
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

          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search filename..."
              className="h-9 w-56 pl-8"
            />
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="largest">Largest</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            {query
              ? "No files match your search."
              : "No media files yet. Upload images or videos to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => {
            const isSelected = selectedIds.has(item.id)
            const usage = item._count?.posts ?? 0
            return (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-lg border-2 text-left transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/20"
                )}
              >
                {item.type === "VIDEO" ? (
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    <Film className="size-10 text-muted-foreground" />
                  </div>
                ) : item.publicId ? (
                  <CldImage
                    src={item.publicId}
                    width={300}
                    height={300}
                    crop="fill"
                    alt={item.filename || "Media"}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename || "Media"}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Overlay info */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white">
                    {item.filename || "Untitled"}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/70">
                    {item.size && <span>{formatSize(item.size)}</span>}
                    <span>
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                {/* Selection checkbox overlay */}
                <button
                  type="button"
                  onClick={(e) => toggleSelect(item.id, e)}
                  className={cn(
                    "absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground opacity-100"
                      : "border-white/80 bg-black/40 text-transparent opacity-0 group-hover:opacity-100"
                  )}
                  aria-label="Select"
                >
                  <span className="text-xs font-bold leading-none">&#10003;</span>
                </button>

                {/* Type badge */}
                {item.type === "VIDEO" && (
                  <Badge
                    variant="secondary"
                    className="absolute top-1.5 right-1.5 h-4 px-1 text-[9px]"
                  >
                    VIDEO
                  </Badge>
                )}

                {/* Usage badge */}
                {usage > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-1.5 left-1.5 h-4 px-1 text-[9px]"
                  >
                    {usage} post{usage !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog
        open={detailItem !== null}
        onOpenChange={(open) => !open && setDetailItem(null)}
      >
        <DialogContent className="max-w-2xl">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate pr-6">
                  {detailItem.filename || "Untitled"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg bg-muted">
                  {detailItem.type === "VIDEO" && detailItem.publicId ? (
                    <CldVideoPlayer
                      id={`media-${detailItem.id}`}
                      src={detailItem.publicId}
                      width={detailItem.width || 1280}
                      height={detailItem.height || 720}
                    />
                  ) : detailItem.type === "VIDEO" ? (
                    <video src={detailItem.url} controls className="max-h-[50vh] w-full" />
                  ) : detailItem.publicId ? (
                    <CldImage
                      src={detailItem.publicId}
                      width={detailItem.width || 1200}
                      height={detailItem.height || 800}
                      alt={detailItem.filename || "Media"}
                      className="max-h-[50vh] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={detailItem.url}
                      alt={detailItem.filename || "Media"}
                      className="max-h-[50vh] w-full object-contain"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {detailItem.size && (
                    <div>
                      <span className="font-medium text-foreground">Size:</span>{" "}
                      {formatSize(detailItem.size)}
                    </div>
                  )}
                  {detailItem.width && detailItem.height && (
                    <div>
                      <span className="font-medium text-foreground">
                        Dimensions:
                      </span>{" "}
                      {detailItem.width}×{detailItem.height}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">Uploaded:</span>{" "}
                    {formatDistanceToNow(new Date(detailItem.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Used in:</span>{" "}
                    {detailItem._count?.posts ?? 0} post
                    {(detailItem._count?.posts ?? 0) !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(detailItem.url)}
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    Copy URL
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={detailItem.url} download target="_blank" rel="noreferrer">
                      <Download className="mr-1.5 size-3.5" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete([detailItem.id])}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
