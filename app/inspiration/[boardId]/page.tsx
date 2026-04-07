"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  Bookmark,
  ChevronRight,
  ExternalLink,
  Globe,
  Linkedin,
  Pencil,
  Trash2,
  Twitter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardLayout from "@/components/dashboard-layout"
import Link from "next/link"

interface Board {
  id: string
  name: string
  description?: string | null
}

interface Inspiration {
  id: string
  originalUrl: string
  sourcePlatform: "twitter" | "linkedin" | "reddit"
  content?: string | null
  authorHandle?: string | null
  thumbnailUrl?: string | null
  savedAt: string
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1d9bf0",
  linkedin: "#0077b5",
  reddit: "#ff4500",
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
}

function PlatformIcon({ platform, size = 16 }: { platform: string; size?: number }) {
  if (platform === "twitter") return <Twitter size={size} />
  if (platform === "linkedin") return <Linkedin size={size} />
  return <Globe size={size} />
}

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const router = useRouter()
  const [board, setBoard] = useState<Board | null>(null)
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [boardsRes, inspRes] = await Promise.all([
        fetch("/api/boards"),
        fetch(`/api/inspirations?boardId=${boardId}&limit=100`),
      ])
      const boards: Board[] = await boardsRes.json()
      const inspData = await inspRes.json()
      const found = boards.find((b) => b.id === boardId) ?? null
      setBoard(found)
      setEditName(found?.name ?? "")
      setInspirations(inspData.inspirations ?? [])
      setLoading(false)
    }
    load()
  }, [boardId])

  async function saveEdit() {
    if (!editName.trim() || !board) return
    setSaving(true)
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const updated = await res.json()
      setBoard(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function deleteBoard() {
    if (!confirm("Delete this board and all its inspirations?")) return
    await fetch(`/api/boards/${boardId}`, { method: "DELETE" })
    router.push("/inspiration")
  }

  async function deleteInspiration(id: string) {
    await fetch(`/api/inspirations/${id}`, { method: "DELETE" })
    setInspirations((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/inspiration" className="hover:text-foreground transition-colors">
            Inspiration
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">{board?.name ?? "…"}</span>
        </nav>

        {/* Header */}
        {loading ? (
          <Skeleton className="h-8 w-48 mb-6" />
        ) : board ? (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bookmark className="size-5 text-muted-foreground" />
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit()
                      if (e.key === "Escape") setEditing(false)
                    }}
                    className="h-8 text-lg font-semibold w-56"
                    autoFocus
                  />
                  <Button size="sm" onClick={saveEdit} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <h1 className="text-xl font-semibold">{board.name}</h1>
              )}
              <span className="text-sm text-muted-foreground">
                {inspirations.length} saved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditing(true); setEditName(board.name) }}
              >
                <Pencil className="size-3.5 mr-1.5" />
                Rename
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={deleteBoard}>
                <Trash2 className="size-3.5 mr-1.5" />
                Delete board
              </Button>
            </div>
          </div>
        ) : null}

        {/* Grid */}
        {loading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 mb-4 rounded-xl break-inside-avoid" />
            ))}
          </div>
        ) : inspirations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Bookmark className="size-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No inspirations in this board yet.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {inspirations.map((insp) => {
              const color = PLATFORM_COLORS[insp.sourcePlatform]
              return (
                <div
                  key={insp.id}
                  className="break-inside-avoid mb-4 rounded-xl border bg-card overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
                >
                  {insp.thumbnailUrl ? (
                    <img src={insp.thumbnailUrl} alt="" className="w-full object-cover" />
                  ) : (
                    <div
                      className="h-12 flex items-center justify-center"
                      style={{ background: `${color}20` }}
                    >
                      <PlatformIcon platform={insp.sourcePlatform} size={20} />
                    </div>
                  )}
                  <div className="p-3">
                    {insp.content && (
                      <p className="text-sm text-foreground line-clamp-3 mb-2">{insp.content}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
                      >
                        {PLATFORM_LABELS[insp.sourcePlatform]}
                      </Badge>
                      {insp.authorHandle && (
                        <span className="text-xs text-muted-foreground truncate">
                          {insp.authorHandle}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(insp.savedAt), { addSuffix: true })}
                    </p>
                    <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => router.push(`/posts/new?inspiration=${insp.id}`)}
                      >
                        Use as inspiration
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteInspiration(insp.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                      <a href={insp.originalUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground">
                          <ExternalLink className="size-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
