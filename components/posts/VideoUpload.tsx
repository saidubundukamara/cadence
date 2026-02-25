"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Video, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface VideoUploadProps {
  youtubeVideoId: string | null
  onVideoUploaded: (videoId: string) => void
  onVideoRemoved: () => void
  isConnected: boolean
}

export function VideoUpload({
  youtubeVideoId,
  onVideoUploaded,
  onVideoRemoved,
  isConnected,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file")
        return
      }

      setUploading(true)
      setProgress(0)
      setFileName(file.name)

      try {
        // Step 1: Get resumable upload URL from our server
        const initRes = await fetch("/api/youtube/init-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name.replace(/\.[^.]+$/, ""),
            description: "",
            mimeType: file.type,
          }),
        })

        if (!initRes.ok) {
          const data = await initRes.json()
          throw new Error(data.error || "Failed to initialize upload")
        }

        const { uploadUrl } = await initRes.json()

        // Step 2: Upload video directly to YouTube using XMLHttpRequest for progress
        const videoId = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100))
            }
          })

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText)
                resolve(response.id)
              } catch {
                reject(new Error("Failed to parse YouTube response"))
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          })

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed"))
          })

          xhr.open("PUT", uploadUrl)
          xhr.setRequestHeader("Content-Type", file.type)
          xhr.send(file)
        })

        onVideoUploaded(videoId)
        toast.success("Video uploaded to YouTube")
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed"
        toast.error(message)
        setFileName(null)
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [onVideoUploaded]
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <AlertCircle className="size-4" />
        <span>
          Connect YouTube first in{" "}
          <a
            href="/settings/connections"
            className="text-primary underline"
          >
            Settings
          </a>
        </span>
      </div>
    )
  }

  if (youtubeVideoId) {
    return (
      <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
        <Video className="size-5 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-medium">Video uploaded</p>
          <p className="text-xs text-muted-foreground">
            {fileName || `Video ID: ${youtubeVideoId}`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => {
            onVideoRemoved()
            setFileName(null)
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  if (uploading) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span>Uploading {fileName}...</span>
          <span className="ml-auto text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    )
  }

  return (
    <div
      className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="size-6" />
      <p>Drop a video file or click to browse</p>
      <p className="text-xs">Video will be uploaded as private to YouTube</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  )
}
