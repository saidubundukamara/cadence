"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Twitter, Facebook, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { SocialAccountInfo } from "@/types"

const platformConfig = {
  TWITTER: {
    name: "X (Twitter)",
    icon: Twitter,
    connectUrl: "/api/social/connect/twitter",
    color: "text-blue-400",
  },
  FACEBOOK: {
    name: "Facebook",
    icon: Facebook,
    connectUrl: "/api/social/connect/facebook",
    color: "text-blue-600",
  },
  INSTAGRAM: {
    name: "Instagram",
    icon: Instagram,
    connectUrl: "/api/social/connect/facebook?instagram=true",
    color: "text-pink-500",
  },
} as const

type PlatformKey = keyof typeof platformConfig

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading connections...</div>}>
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

    if (connected) {
      toast.success(`Successfully connected ${connected}`)
    }
    if (error) {
      toast.error(`Connection failed: ${error}`)
    }
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
        toast.success(`Disconnected ${platform}`)
        setAccounts((prev) => prev.filter((a) => a.platform !== platform))
      } else {
        toast.error("Failed to disconnect")
      }
    } finally {
      setDisconnecting(null)
    }
  }

  const connectedPlatforms = new Map(accounts.map((a) => [a.platform, a]))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connections</h2>
        <p className="text-muted-foreground">
          Connect your social accounts to post on your behalf.
        </p>
      </div>
      <div className="grid gap-4">
        {(Object.keys(platformConfig) as PlatformKey[]).map((platform) => {
          const config = platformConfig[platform]
          const account = connectedPlatforms.get(platform)
          const Icon = config.icon

          return (
            <Card key={platform}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <Icon className={`size-5 ${config.color}`} />
                  <div>
                    <CardTitle className="text-base">{config.name}</CardTitle>
                    <CardDescription>
                      {account
                        ? `Connected as ${account.accountName}`
                        : "Not connected"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={account ? "default" : "secondary"}>
                  {account ? "Connected" : "Disconnected"}
                </Badge>
              </CardHeader>
              <CardContent>
                {account ? (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {account.expiresAt && (
                        <span>
                          Expires:{" "}
                          {new Date(account.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      {!account.expiresAt &&
                        platform !== "TWITTER" &&
                        "Token: Never expires"}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => disconnect(platform)}
                      disabled={disconnecting === platform}
                    >
                      {disconnecting === platform
                        ? "Disconnecting..."
                        : "Disconnect"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {platform === "INSTAGRAM" && (
                      <p className="text-xs text-muted-foreground">
                        Requires a Business/Creator account linked to a Facebook
                        Page
                      </p>
                    )}
                    <Button
                      size="sm"
                      asChild
                      className={platform !== "INSTAGRAM" ? "ml-auto" : ""}
                    >
                      <a href={config.connectUrl}>
                        Connect {config.name}
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
