"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, X, ImagePlus, Loader2, Film, FolderOpen } from "lucide-react"
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"]
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]

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

export function MediaUpload({ mediaUrls, onMediaChange, platforms = [] }: MediaUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        const signRes = await fetch("/api/upload", { method: "POST" })
        const { signature, timestamp, cloudName, apiKey } =
          await signRes.json()

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
          // Save to media library
          fetch("/api/media", {
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
          }).catch(() => {}) // Non-blocking

          return uploadData.secure_url as string
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
      return null
    },
    []
  )

  async function handleFiles(files: FileList | File[]) {
    const validFiles = Array.from(files).filter((f) =>
      ACCEPTED_TYPES.some((type) => f.type === type)
    )
    if (validFiles.length === 0) {
      toast.error("Supported formats: JPEG, PNG, GIF, WebP, MP4, MOV")
      return
    }

    setUploading(true)
    const results = await Promise.all(validFiles.map(uploadFile))
    const newUrls = results.filter((url): url is string => url !== null)
    if (newUrls.length > 0) {
      onMediaChange([...mediaUrls, ...newUrls])
      toast.success(
        newUrls.length === 1
          ? "File uploaded"
          : `${newUrls.length} files uploaded`
      )
    }
    setUploading(false)
  }

  function removeMedia(url: string) {
    onMediaChange(mediaUrls.filter((u) => u !== url))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
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
          {mediaUrls.map((url) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-lg border"
            >
              {isVideo(url) ? (
                <div className="flex size-24 items-center justify-center bg-muted">
                  <Film className="size-8 text-muted-foreground" />
                </div>
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
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-accent/50"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
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
                Drag & drop or click to browse. Images & MP4 video supported.
              </p>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {/* Count indicator + Library button */}
      <div className="flex items-center justify-between">
        {mediaUrls.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {mediaUrls.length} file{mediaUrls.length !== 1 ? "s" : ""} attached
            {maxMedia > 0 && ` (max ${maxMedia} for selected platforms)`}
          </p>
        )}
        <MediaLibraryPicker
          onSelect={(urls) => onMediaChange([...mediaUrls, ...urls])}
          existingUrls={mediaUrls}
        />
      </div>
    </div>
  )
}

type LibraryMedia = {
  id: string
  url: string
  type: "IMAGE" | "VIDEO"
  filename: string | null
  createdAt: string
}

function MediaLibraryPicker({
  onSelect,
  existingUrls,
}: {
  onSelect: (urls: string[]) => void
  existingUrls: string[]
}) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<LibraryMedia[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setSelected(new Set())
      fetch("/api/media?limit=50")
        .then((r) => r.json())
        .then((data) => setMedia(data.media || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open])

  function toggleSelect(url: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

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
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <FolderOpen className="size-3" />
          Browse Library
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : media.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No media in library yet. Upload files to build your library.
          </p>
        ) : (
          <>
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
              {media.map((item) => {
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
