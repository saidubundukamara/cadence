"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, ExternalLink, RefreshCw, Unplug } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { platformConfig } from "@/lib/platform-config"
import type { Platform, SocialAccountInfo } from "@/types"

const connectUrls: Record<Platform, string> = {
  TWITTER: "/api/social/connect/twitter",
  FACEBOOK: "/api/social/connect/facebook",
  INSTAGRAM: "/api/social/connect/facebook?instagram=true",
  LINKEDIN: "/api/social/connect/linkedin",
  YOUTUBE: "/api/social/connect/youtube",
}

const platformDescriptions: Record<Platform, string> = {
  TWITTER: "Post tweets and threads to your X account.",
  FACEBOOK: "Publish to your Facebook page.",
  INSTAGRAM: "Requires a Business/Creator account linked to a Facebook Page.",
  LINKEDIN: "Share updates to your LinkedIn profile.",
  YOUTUBE: "Upload videos to your YouTube channel.",
}

const PLATFORMS: Platform[] = ["TWITTER", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE"]

function getExpirationStatus(expiresAt: Date | string | null) {
  if (!expiresAt) return null
  const expiry = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return { label: "Token expired", variant: "destructive" as const }
  if (daysLeft <= 7) return { label: `Expires in ${daysLeft}d`, variant: "warning" as const }
  return null
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<ConnectionsSkeleton />}>
      <ConnectionsContent />
    </Suspense>
  )
}

function ConnectionsContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<SocialAccountInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")
    if (connected) toast.success(`Successfully connected ${connected}`)
    if (error) toast.error(`Connection failed: ${error}`)
  }, [searchParams])

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/social/accounts")
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function disconnect(platform: string) {
    setDisconnecting(platform)
    try {
      const res = await fetch(`/api/social/disconnect/${platform.toLowerCase()}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success(`Disconnected ${platformConfig[platform as Platform]?.label ?? platform}`)
        setAccounts((prev) => prev.filter((a) => a.platform !== platform))
      } else {
        toast.error("Failed to disconnect")
      }
    } finally {
      setDisconnecting(null)
    }
  }

  const connectedPlatforms = new Map(accounts.map((a) => [a.platform, a]))
  const connectedCount = accounts.length

  if (loading) return <ConnectionsSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connections</h2>
        <p className="text-muted-foreground">
          {connectedCount > 0
            ? `${connectedCount} account${connectedCount !== 1 ? "s" : ""} connected. Connect more to expand your reach.`
            : "Connect your social accounts to post on your behalf."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const config = platformConfig[platform]
          const account = connectedPlatforms.get(platform)
          const Icon = config.icon

          if (account) {
            const expiration = getExpirationStatus(account.expiresAt)
            const isExpired = expiration?.variant === "destructive"

            return (
              <Card
                key={platform}
                className={`border-l-4 ${config.borderColor}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
                      <Icon className={`size-6 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{config.label}</h3>
                        <Badge variant="default" className="text-xs">Connected</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
                      </p>
                      {expiration && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <AlertTriangle className={`size-3.5 ${isExpired ? "text-red-500" : "text-amber-500"}`} />
                          <span className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-amber-500"}`}>
                            {expiration.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {(expiration) && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={connectUrls[platform]}>
                          <RefreshCw className="mr-1.5 size-3.5" />
                          Reconnect
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => disconnect(platform)}
                      disabled={disconnecting === platform}
                    >
                      <Unplug className="mr-1.5 size-3.5" />
                      {disconnecting === platform ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          }

          return (
            <Card
              key={platform}
              className="opacity-75 transition-opacity hover:opacity-100"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{config.label}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {platformDescriptions[platform]}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button size="sm" asChild>
                    <a href={connectUrls[platform]}>
                      <ExternalLink className="mr-1.5 size-3.5" />
                      Connect {config.label}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ConnectionsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
