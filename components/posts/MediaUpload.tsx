"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, ImagePlus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MediaUploadProps {
  mediaUrls: string[]
  onMediaChange: (urls: string[]) => void
}

export function MediaUpload({ mediaUrls, onMediaChange }: MediaUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        const signRes = await fetch("/api/upload", { method: "POST" })
        const { signature, timestamp, cloudName, apiKey } =
          await signRes.json()

        const formData = new FormData()
        formData.append("file", file)
        formData.append("signature", signature)
        formData.append("timestamp", String(timestamp))
        formData.append("api_key", apiKey)
        formData.append("folder", "cadence")

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        )

        const uploadData = await uploadRes.json()
        if (uploadData.secure_url) {
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
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    )
    if (imageFiles.length === 0) {
      toast.error("Only image files are supported")
      return
    }

    setUploading(true)
    const results = await Promise.all(imageFiles.map(uploadFile))
    const newUrls = results.filter((url): url is string => url !== null)
    if (newUrls.length > 0) {
      onMediaChange([...mediaUrls, ...newUrls])
      toast.success(
        newUrls.length === 1
          ? "Image uploaded"
          : `${newUrls.length} images uploaded`
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

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaUrls.map((url) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-lg border"
            >
              <img
                src={url}
                alt="Media"
                className="size-24 object-cover transition-opacity group-hover:opacity-75"
              />
              <button
                type="button"
                onClick={() => removeMedia(url)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
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
                {mediaUrls.length > 0 ? "Add more images" : "Add images"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse
              </p>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
