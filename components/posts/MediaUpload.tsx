"use client"

import { useState, useEffect, useCallback } from "react"
import { Upload, X, ImagePlus, Loader2, Film, FolderOpen } from "lucide-react"
import { CldImage, CldUploadWidget } from "next-cloudinary"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Platform } from "@/types"

const PLATFORM_MEDIA_LIMITS: Record<string, { maxImages: number; video: boolean; label: string }> = {
  TWITTER: { maxImages: 4, video: true, label: "X: up to 4 images or 1 video" },
  FACEBOOK: { maxImages: 10, video: true, label: "Facebook: up to 10 images or 1 video" },
  INSTAGRAM: { maxImages: 10, video: true, label: "Instagram: up to 10 images/videos (carousel)" },
  LINKEDIN: { maxImages: 9, video: true, label: "LinkedIn: up to 9 images or 1 video" },
  YOUTUBE: { maxImages: 0, video: false, label: "YouTube: use Video Upload below" },
}

interface MediaUploadProps {
  mediaUrls: string[]
  onMediaChange: (urls: string[]) => void
  platforms?: Platform[]
}

type UploadInfo = {
  secure_url: string
  public_id: string
  resource_type: string
  bytes?: number
  width?: number
  height?: number
  original_filename?: string
  format?: string
}

export function MediaUpload({ mediaUrls, onMediaChange, platforms = [] }: MediaUploadProps) {
  const [pendingPublicIds, setPendingPublicIds] = useState<Record<string, string>>({})

  async function handleUploaded(info: UploadInfo) {
    const isVideo = info.resource_type === "video"
    setPendingPublicIds((prev) => ({ ...prev, [info.secure_url]: info.public_id }))
    fetch("/api/media", {
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
    }).catch(() => {})
    onMediaChange([...mediaUrls, info.secure_url])
    toast.success("File uploaded")
  }

  function removeMedia(url: string) {
    onMediaChange(mediaUrls.filter((u) => u !== url))
  }

  function isVideo(url: string) {
    return /\.(mp4|mov|avi|wmv)$/i.test(url)
  }

  // Calculate the most restrictive limit across selected platforms
  const maxMedia = platforms.length > 0
    ? Math.max(
        ...platforms
          .filter((p) => p !== "YOUTUBE")
          .map((p) => PLATFORM_MEDIA_LIMITS[p]?.maxImages ?? 4)
      )
    : 10

  return (
    <div className="space-y-3">
      {/* Platform limits hint */}
      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {platforms
            .filter((p) => PLATFORM_MEDIA_LIMITS[p])
            .map((p) => (
              <span key={p} className="text-[10px] text-muted-foreground">
                {PLATFORM_MEDIA_LIMITS[p].label}
              </span>
            ))}
        </div>
      )}

      {/* Thumbnails */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaUrls.map((url) => {
            const publicId = pendingPublicIds[url]
            return (
              <div
                key={url}
                className="group relative overflow-hidden rounded-lg border"
              >
                {isVideo(url) ? (
                  <div className="flex size-24 items-center justify-center bg-muted">
                    <Film className="size-8 text-muted-foreground" />
                  </div>
                ) : publicId ? (
                  <CldImage
                    src={publicId}
                    width={96}
                    height={96}
                    crop="fill"
                    alt="Media"
                    className="size-24 object-cover transition-opacity group-hover:opacity-75"
                  />
                ) : (
                  <img
                    src={url}
                    alt="Media"
                    className="size-24 object-cover transition-opacity group-hover:opacity-75"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(url)}
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
                {isVideo(url) && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white">
                    VIDEO
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add media — opens library picker (with embedded uploader) */}
      <MediaLibraryPicker
        onSelect={(urls) => onMediaChange([...mediaUrls, ...urls])}
        onUploaded={handleUploaded}
        existingUrls={mediaUrls}
        maxMedia={maxMedia}
        trigger={
          <button
            type="button"
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
              "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-accent/50"
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              {mediaUrls.length > 0 ? (
                <ImagePlus className="size-5 text-muted-foreground" />
              ) : (
                <Upload className="size-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/80">
                {mediaUrls.length > 0 ? "Add more files" : "Add images or video"}
              </p>
              <p className="text-xs text-muted-foreground">
                Pick from your library or upload new.
              </p>
            </div>
          </button>
        }
      />

      {mediaUrls.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {mediaUrls.length} file{mediaUrls.length !== 1 ? "s" : ""} attached
          {maxMedia > 0 && ` (max ${maxMedia} for selected platforms)`}
        </p>
      )}
    </div>
  )
}

type LibraryMedia = {
  id: string
  url: string
  publicId: string | null
  type: "IMAGE" | "VIDEO"
  filename: string | null
  createdAt: string
}

function MediaLibraryPicker({
  onSelect,
  onUploaded,
  existingUrls,
  maxMedia,
  trigger,
}: {
  onSelect: (urls: string[]) => void
  onUploaded?: (info: UploadInfo) => void | Promise<void>
  existingUrls: string[]
  maxMedia: number
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<LibraryMedia[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  const loadMedia = useCallback(() => {
    setLoading(true)
    return fetch("/api/media?limit=50")
      .then((r) => r.json())
      .then((data) => setMedia(data.media || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (open) {
      setSelected(new Set())
      setQuery("")
      loadMedia()
    }
  }, [open, loadMedia])

  const remainingSlots = Math.max(0, maxMedia - existingUrls.length)

  function toggleSelect(url: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        if (next.size >= remainingSlots) {
          toast.error(`You can only add ${remainingSlots} more file${remainingSlots !== 1 ? "s" : ""}`)
          return prev
        }
        next.add(url)
      }
      return next
    })
  }

  const filtered = query.trim()
    ? media.filter((m) =>
        (m.filename || "").toLowerCase().includes(query.trim().toLowerCase())
      )
    : media

  function handleInsert() {
    const urls = [...selected].filter((u) => !existingUrls.includes(u))
    if (urls.length > 0) {
      onSelect(urls)
      toast.success(`${urls.length} file${urls.length !== 1 ? "s" : ""} added`)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <FolderOpen className="size-3" />
            Browse Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename..."
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <CldUploadWidget
            signatureEndpoint="/api/sign-cloudinary"
            options={{
              apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
              folder: "cadence",
              multiple: true,
              sources: ["local", "url", "camera"],
              resourceType: "auto",
              clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
            }}
            onSuccess={async (result) => {
              const info = result?.info
              if (info && typeof info === "object" && "secure_url" in info) {
                await onUploaded?.(info as UploadInfo)
                loadMedia()
              }
            }}
          >
            {({ open: openWidget }) => (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openWidget()}
                className="h-8 gap-1"
              >
                <Upload className="size-3.5" />
                Upload new
              </Button>
            )}
          </CldUploadWidget>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : media.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No media yet — click <span className="font-medium">Upload new</span> to add your first file.
          </p>
        ) : (
          <>
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No files match.
              </p>
            ) : (
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
              {filtered.map((item) => {
                const isSelected = selected.has(item.url)
                const isAlreadyUsed = existingUrls.includes(item.url)
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isAlreadyUsed}
                    onClick={() => toggleSelect(item.url)}
                    className={cn(
                      "relative overflow-hidden rounded-lg border-2 transition-colors",
                      isSelected
                        ? "border-primary"
                        : isAlreadyUsed
                          ? "border-muted opacity-50"
                          : "border-transparent hover:border-muted-foreground/30"
                    )}
                  >
                    {item.type === "VIDEO" ? (
                      <div className="flex aspect-square items-center justify-center bg-muted">
                        <Film className="size-6 text-muted-foreground" />
                      </div>
                    ) : item.publicId ? (
                      <CldImage
                        src={item.publicId}
                        width={120}
                        height={120}
                        crop="fill"
                        alt={item.filename || "Media"}
                        className="aspect-square object-cover"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.filename || "Media"}
                        className="aspect-square object-cover"
                      />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <span className="text-xs font-bold">&#10003;</span>
                        </div>
                      </div>
                    )}
                    {isAlreadyUsed && (
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[8px] text-white">
                        In use
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleInsert}
                disabled={selected.size === 0}
              >
                Insert {selected.size > 0 && `(${selected.size})`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
