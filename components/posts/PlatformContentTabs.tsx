"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { EnhancedTextarea } from "@/components/posts/EnhancedTextarea"
import { platformConfig } from "@/lib/platform-config"
import type { Platform } from "@/types"

interface PlatformContentTabsProps {
  platforms: Platform[]
  contents: Record<string, string>
  onChange: (platform: string, value: string) => void
  onRegenerate?: (platform: string) => void
  regenerating?: string | null
}

export function PlatformContentTabs({
  platforms,
  contents,
  onChange,
  onRegenerate,
  regenerating,
}: PlatformContentTabsProps) {
  if (platforms.length === 0) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Select at least one platform above to start writing
      </div>
    )
  }

  return (
    <Tabs defaultValue={platforms[0]} key={platforms.join(",")}>
      <TabsList className="h-auto w-full justify-start gap-1 rounded-lg border bg-muted/40 p-1">
        {platforms.map((platform) => {
          const config = platformConfig[platform]
          const Icon = config.icon
          return (
            <TabsTrigger
              key={platform}
              value={platform}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              {config.label}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {platforms.map((platform) => {
        const config = platformConfig[platform]
        const Icon = config.icon
        const isRegenerating = regenerating === platform

        return (
          <TabsContent key={platform} value={platform} className="mt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </div>
                {onRegenerate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                    onClick={() => onRegenerate(platform)}
                    disabled={isRegenerating}
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`}
                    />
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                )}
              </div>
              <EnhancedTextarea
                value={contents[platform] ?? ""}
                onChange={(val) => onChange(platform, val)}
                platforms={[platform]}
                placeholder={getPlaceholder(platform)}
              />
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

function getPlaceholder(platform: Platform): string {
  switch (platform) {
    case "TWITTER":
      return "Write a punchy tweet (max 280 chars)..."
    case "LINKEDIN":
      return "Share professional insights, experiences, or thought leadership..."
    case "INSTAGRAM":
      return "Write a caption with hashtags and emojis..."
    case "FACEBOOK":
      return "Write an engaging post for your audience..."
    case "YOUTUBE":
      return "First line = video title. Rest = description..."
    default:
      return "Write your post content..."
  }
}
