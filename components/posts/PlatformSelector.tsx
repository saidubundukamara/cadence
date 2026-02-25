"use client"

import { Twitter, Facebook, Instagram, Linkedin, Youtube, Link } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Platform } from "@/types"

const platforms = [
  {
    value: "TWITTER" as Platform,
    label: "Twitter",
    shortLabel: "𝕏",
    icon: Twitter,
    activeClasses: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    iconColor: "text-sky-500",
  },
  {
    value: "FACEBOOK" as Platform,
    label: "Facebook",
    shortLabel: "FB",
    icon: Facebook,
    activeClasses: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-600",
  },
  {
    value: "INSTAGRAM" as Platform,
    label: "Instagram",
    shortLabel: "IG",
    icon: Instagram,
    activeClasses: "border-pink-500/50 bg-pink-500/10 text-pink-700 dark:text-pink-400",
    iconColor: "text-pink-500",
  },
  {
    value: "LINKEDIN" as Platform,
    label: "LinkedIn",
    shortLabel: "LI",
    icon: Linkedin,
    activeClasses: "border-blue-700/50 bg-blue-700/10 text-blue-800 dark:text-blue-300",
    iconColor: "text-blue-700",
  },
  {
    value: "YOUTUBE" as Platform,
    label: "YouTube",
    shortLabel: "YT",
    icon: Youtube,
    activeClasses: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
    iconColor: "text-red-500",
  },
]

interface PlatformSelectorProps {
  selected: Platform[]
  onChange: (platforms: Platform[]) => void
  connectedPlatforms?: Platform[]
}

export function PlatformSelector({
  selected,
  onChange,
  connectedPlatforms,
}: PlatformSelectorProps) {
  function toggle(platform: Platform) {
    if (selected.includes(platform)) {
      onChange(selected.filter((p) => p !== platform))
    } else {
      onChange([...selected, platform])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => {
        const isConnected =
          !connectedPlatforms || connectedPlatforms.includes(platform.value)
        const isActive = selected.includes(platform.value)
        const Icon = platform.icon

        if (!isConnected) {
          return (
            <a
              key={platform.value}
              href="/settings/connections"
              className="group inline-flex items-center gap-2 rounded-full border border-dashed border-muted-foreground/30 px-3.5 py-1.5 text-sm text-muted-foreground/60 transition-colors hover:border-muted-foreground/50 hover:text-muted-foreground"
            >
              <Icon className="size-3.5" />
              <span>{platform.label}</span>
              <Link className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          )
        }

        return (
          <button
            key={platform.value}
            type="button"
            onClick={() => toggle(platform.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
              isActive
                ? platform.activeClasses
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon
              className={cn("size-3.5", isActive ? "" : platform.iconColor)}
            />
            <span>{platform.label}</span>
          </button>
        )
      })}
    </div>
  )
}
