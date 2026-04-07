"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardLayout from "@/components/dashboard-layout"

type Platform = "TWITTER" | "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE"

interface SuggestedPost {
  id: string
  platform: Platform
  content: string
  topic?: string | null
  tone?: string | null
  weekOf: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "PUBLISHED"
}

interface StyleMemory {
  platform: Platform
  acceptedTones: string[]
  topTopics: string[]
  avgPostLength?: number | null
  samplePosts: string[]
}

const PLATFORM_LABELS: Record<Platform, string> = {
  TWITTER: "X / Twitter",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
}

const PLATFORM_COLORS: Record<Platform, string> = {
  TWITTER: "#1d9bf0",
  LINKEDIN: "#0077b5",
  FACEBOOK: "#1877f2",
  INSTAGRAM: "#e1306c",
  YOUTUBE: "#ff0000",
}

function PlatformIcon({ platform, size = 14 }: { platform: Platform; size?: number }) {
  switch (platform) {
    case "TWITTER": return <Twitter size={size} />
    case "LINKEDIN": return <Linkedin size={size} />
    case "FACEBOOK": return <Facebook size={size} />
    case "INSTAGRAM": return <Instagram size={size} />
    case "YOUTUBE": return <Youtube size={size} />
  }
}

const GENERATE_KEY = "cadence_suggestions_last_generate"

export default function SuggestionsPage() {
  const router = useRouter()
  const [weekOf, setWeekOf] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [tab, setTab] = useState("ALL")
  const [suggestions, setSuggestions] = useState<SuggestedPost[]>([])
  const [styleMemory, setStyleMemory] = useState<StyleMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateCooldown, setGenerateCooldown] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  useEffect(() => {
    // Check 24h cooldown
    const last = localStorage.getItem(GENERATE_KEY)
    if (last) {
      const diff = Date.now() - parseInt(last)
      setGenerateCooldown(diff < 24 * 60 * 60 * 1000)
    }
  }, [])

  useEffect(() => {
    fetchSuggestions()
  }, [weekOf])

  async function fetchSuggestions() {
    setLoading(true)
    try {
      const [sugRes, memRes] = await Promise.all([
        fetch(`/api/suggestions?weekOf=${weekOf.toISOString()}`),
        fetch(`/api/suggestions?weekOf=${weekOf.toISOString()}`).then(() =>
          // StyleMemory is fetched via a dedicated endpoint we'll add, for now skip
          Promise.resolve([])
        ),
      ])
      const data: SuggestedPost[] = await sugRes.json()
      setSuggestions(data)
      setStyleMemory(memRes as StyleMemory[])
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(id: string) {
    setAcceptingId(id)
    try {
      const res = await fetch(`/api/suggestions/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createPost: true }),
      })
      const data = await res.json()
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "ACCEPTED" } : s))
      )
      if (data.postId) {
        router.push(`/posts/${data.postId}`)
      }
    } finally {
      setAcceptingId(null)
    }
  }

  async function handleReject(id: string) {
    await fetch(`/api/suggestions/${id}/reject`, { method: "POST" })
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "REJECTED" } : s))
    )
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch("/api/suggestions/generate", { method: "POST" })
      if (res.ok) {
        localStorage.setItem(GENERATE_KEY, Date.now().toString())
        setGenerateCooldown(true)
        await fetchSuggestions()
      }
    } finally {
      setGenerating(false)
    }
  }

  const platforms = [...new Set(suggestions.map((s) => s.platform))]
  const tabs = ["ALL", ...platforms]

  const filtered =
    tab === "ALL"
      ? suggestions
      : suggestions.filter((s) => s.platform === tab)

  const acceptedCount = suggestions.filter((s) => s.status === "ACCEPTED").length
  const showStyleProfile = acceptedCount >= 3 && styleMemory.length > 0

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Weekly Suggestions</h1>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating || generateCooldown}
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${generating ? "animate-spin" : ""}`} />
            {generating
              ? "Generating…"
              : generateCooldown
                ? "Generated (24h cooldown)"
                : "Generate now"}
          </Button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekOf((w) => subWeeks(w, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium w-40 text-center">
            Week of {format(weekOf, "MMM d, yyyy")}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekOf((w) => addWeeks(w, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Platform tabs */}
        {tabs.length > 1 && (
          <Tabs value={tab} onValueChange={setTab} className="mb-6">
            <TabsList>
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t === "ALL" ? "All" : PLATFORM_LABELS[t as Platform]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Suggestions grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Sparkles className="size-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No suggestions for this week yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Save at least 5 inspirations and click "Generate now".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={handleAccept}
                onReject={handleReject}
                acceptingId={acceptingId}
              />
            ))}
          </div>
        )}

        {/* Style Profile footer */}
        {showStyleProfile && (
          <div className="mt-10 border rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="size-4" />
              Your Style Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {styleMemory.map((mem) => (
                <div key={mem.platform} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={mem.platform} size={14} />
                    <span className="text-sm font-medium">
                      {PLATFORM_LABELS[mem.platform]}
                    </span>
                  </div>
                  {mem.acceptedTones.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mem.acceptedTones.slice(0, 5).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {mem.avgPostLength && (
                    <p className="text-xs text-muted-foreground">
                      Avg. post length: ~{mem.avgPostLength} characters
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  acceptingId,
}: {
  suggestion: SuggestedPost
  onAccept: (id: string) => void
  onReject: (id: string) => void
  acceptingId: string | null
}) {
  const color = PLATFORM_COLORS[suggestion.platform]
  const isRejected = suggestion.status === "REJECTED"
  const isAccepted = suggestion.status === "ACCEPTED"
  const isPending = suggestion.status === "PENDING"
  const isActioning = acceptingId === suggestion.id

  return (
    <div
      className={`rounded-xl border bg-card p-4 flex flex-col gap-3 transition-opacity ${
        isRejected ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color }}
        >
          <PlatformIcon platform={suggestion.platform} size={13} />
          {PLATFORM_LABELS[suggestion.platform]}
        </div>
        {suggestion.tone && (
          <Badge variant="outline" className="text-xs">
            {suggestion.tone}
          </Badge>
        )}
      </div>

      <p className="text-sm text-foreground flex-1 overflow-y-auto max-h-40 leading-relaxed">
        {suggestion.content}
      </p>

      {suggestion.topic && (
        <p className="text-xs text-muted-foreground">Topic: {suggestion.topic}</p>
      )}

      {isPending && (
        <div className="flex gap-2 mt-auto pt-1">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onAccept(suggestion.id)}
            disabled={isActioning}
          >
            {isActioning ? "Opening…" : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-muted-foreground"
            onClick={() => onReject(suggestion.id)}
          >
            Reject
          </Button>
        </div>
      )}

      {isAccepted && (
        <Badge className="self-start bg-green-100 text-green-700 border-green-200">
          Accepted
        </Badge>
      )}

      {isRejected && (
        <Badge variant="outline" className="self-start text-muted-foreground">
          Rejected
        </Badge>
      )}
    </div>
  )
}
