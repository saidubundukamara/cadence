"use client"

import { useState, useMemo } from "react"
import { Twitter, Instagram, Linkedin, Facebook, Youtube, ChevronDown } from "lucide-react"
import { getCharacterCount, getCountStatus, PLATFORM_LIMITS } from "@/lib/platform-limits"
import { splitIntoThread } from "@/lib/twitter-thread"
import type { Platform } from "@/types"

const PLATFORM_ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  TWITTER: Twitter,
  INSTAGRAM: Instagram,
  LINKEDIN: Linkedin,
  FACEBOOK: Facebook,
  YOUTUBE: Youtube,
}

const STATUS_COLORS: Record<string, string> = {
  ok: "text-muted-foreground",
  warning: "text-amber-500",
  danger: "text-red-500",
}

interface CharacterCountsProps {
  content: string
  platforms: Platform[]
}

export function CharacterCounts({ content, platforms }: CharacterCountsProps) {
  const [threadOpen, setThreadOpen] = useState(false)

  const twitterSelected = platforms.includes("TWITTER")
  const threadChunks = useMemo(
    () => (twitterSelected ? splitIntoThread(content) : []),
    [content, twitterSelected]
  )
  const isThread = threadChunks.length > 1

  if (platforms.length === 0 || content.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {platforms.map((platform) => {
          const count = getCharacterCount(content, platform)
          const limit = PLATFORM_LIMITS[platform]
          const status = getCountStatus(count, limit)
          const Icon = PLATFORM_ICONS[platform]

          return (
            <span
              key={platform}
              className={`flex items-center gap-1 text-xs ${STATUS_COLORS[status]}`}
            >
              <Icon className="size-3" />
              {count}/{limit}
            </span>
          )
        })}

        {isThread && (
          <button
            type="button"
            onClick={() => setThreadOpen(!threadOpen)}
            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600"
          >
            Thread: {threadChunks.length} tweets
            <ChevronDown
              className={`size-3 transition-transform ${threadOpen ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {isThread && threadOpen && (
        <div className="space-y-2 rounded-md border bg-muted/50 p-3">
          {threadChunks.map((chunk, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tweet {i + 1}</span>
                <span>{chunk.length}/280</span>
              </div>
              <p className="whitespace-pre-wrap rounded bg-background p-2 text-sm">
                {chunk}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
