"use client"

import { Twitter, Facebook, Instagram } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Platform } from "@/types"

const platforms = [
  { value: "TWITTER" as Platform, label: "X (Twitter)", icon: Twitter, color: "text-blue-400" },
  { value: "FACEBOOK" as Platform, label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { value: "INSTAGRAM" as Platform, label: "Instagram", icon: Instagram, color: "text-pink-500" },
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
    <div className="space-y-3">
      <label className="text-sm font-medium">Platforms</label>
      <div className="flex flex-wrap gap-4">
        {platforms.map((platform) => {
          const isConnected = !connectedPlatforms || connectedPlatforms.includes(platform.value)
          const Icon = platform.icon

          return (
            <label
              key={platform.value}
              className={`flex items-center gap-2 ${
                !isConnected ? "opacity-50" : "cursor-pointer"
              }`}
            >
              <Checkbox
                checked={selected.includes(platform.value)}
                onCheckedChange={() => toggle(platform.value)}
                disabled={!isConnected}
              />
              <Icon className={`size-4 ${platform.color}`} />
              <span className="text-sm">{platform.label}</span>
              {!isConnected && (
                <a
                  href="/settings/connections"
                  className="text-xs text-primary hover:underline"
                >
                  Connect
                </a>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}
