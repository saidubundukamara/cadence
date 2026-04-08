"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Bookmark, Plus, Twitter, Linkedin, Globe, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DashboardLayout from "@/components/dashboard-layout"

interface Board {
  id: string
  name: string
  description?: string | null
  coverImage?: string | null
  isDefault: boolean
  _count: { inspirations: number }
}

interface Inspiration {
  id: string
  boardId: string
  originalUrl: string
  sourcePlatform: "twitter" | "linkedin" | "reddit"
  content?: string | null
  authorName?: string | null
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

export default function InspirationPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [loadingInspirations, setLoadingInspirations] = useState(false)
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchBoards()
  }, [])

  useEffect(() => {
    if (selectedBoardId) fetchInspirations(selectedBoardId)
  }, [selectedBoardId])

  async function fetchBoards() {
    setLoadingBoards(true)
    try {
      const res = await fetch("/api/boards")
      const data: Board[] = await res.json()
      setBoards(data)
      if (data.length > 0) setSelectedBoardId(data[0].id)
    } finally {
      setLoadingBoards(false)
    }
  }

  async function fetchInspirations(boardId: string) {
    setLoadingInspirations(true)
    try {
      const res = await fetch(`/api/inspirations?boardId=${boardId}&limit=50`)
      const data = await res.json()
      setInspirations(data.inspirations ?? [])
    } finally {
      setLoadingInspirations(false)
    }
  }

  async function createBoard() {
    if (!newBoardName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName.trim() }),
      })
      const board: Board = await res.json()
      setBoards((prev) => [...prev, board])
      setSelectedBoardId(board.id)
      setNewBoardName("")
      setShowNewBoard(false)
    } finally {
      setCreating(false)
    }
  }

  async function deleteInspiration(id: string) {
    await fetch(`/api/inspirations/${id}`, { method: "DELETE" })
    setInspirations((prev) => prev.filter((i) => i.id !== id))
    // Update board count
    setBoards((prev) =>
      prev.map((b) =>
        b.id === selectedBoardId
          ? { ...b, _count: { inspirations: b._count.inspirations - 1 } }
          : b
      )
    )
  }

  const selectedBoard = boards.find((b) => b.id === selectedBoardId)

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left panel — board list */}
        <aside className="w-60 shrink-0 border-r flex flex-col">
          <div className="p-4 border-b">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setShowNewBoard(true)}
            >
              <Plus className="mr-2 size-4" />
              New Board
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {loadingBoards ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 mb-1 rounded-md" />
              ))
            ) : boards.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                No boards yet. Save a post from X, LinkedIn, or Reddit using the extension.
              </p>
            ) : (
              boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => setSelectedBoardId(board.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors mb-0.5 ${
                    board.id === selectedBoardId
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-accent/50 text-muted-foreground"
                  }`}
                >
                  <span className="truncate">{board.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground shrink-0">
                    {board._count.inspirations}
                  </span>
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {selectedBoard ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Bookmark className="size-5 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">{selectedBoard.name}</h1>
                    <span className="text-sm text-muted-foreground">
                      {selectedBoard._count.inspirations} saved
                    </span>
                  </div>
                </div>

                {loadingInspirations ? (
                  <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-48 mb-4 rounded-xl break-inside-avoid" />
                    ))}
                  </div>
                ) : inspirations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Bookmark className="size-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No inspirations in this board yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use the Chrome extension to save posts from X, LinkedIn, or Reddit.
                    </p>
                  </div>
                ) : (
                  <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                    {inspirations.map((insp) => (
                      <InspirationCard
                        key={insp.id}
                        inspiration={insp}
                        onDelete={deleteInspiration}
                        onUseAsInspiration={() =>
                          router.push(`/posts/new?inspiration=${insp.id}`)
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            ) : !loadingBoards ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Bookmark className="size-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Select or create a board to get started.</p>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* New Board dialog */}
      <Dialog open={showNewBoard} onOpenChange={setShowNewBoard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Board</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createBoard()}
              autoFocus
            />
            <Button onClick={createBoard} disabled={creating || !newBoardName.trim()}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function InspirationCard({
  inspiration,
  onDelete,
  onUseAsInspiration,
}: {
  inspiration: Inspiration
  onDelete: (id: string) => void
  onUseAsInspiration: () => void
}) {
  const color = PLATFORM_COLORS[inspiration.sourcePlatform]

  return (
    <div className="break-inside-avoid mb-4 rounded-xl border bg-card overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
      {inspiration.thumbnailUrl ? (
        <img
          src={inspiration.thumbnailUrl}
          alt=""
          className="w-full object-cover"
        />
      ) : (
        <div
          className="h-12 flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <PlatformIcon platform={inspiration.sourcePlatform} size={20} />
        </div>
      )}

      <div className="p-3">
        {inspiration.content && (
          <p className="text-sm text-foreground line-clamp-3 mb-2">
            {inspiration.content}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <Badge
            variant="secondary"
            className="text-xs shrink-0"
            style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
          >
            {PLATFORM_LABELS[inspiration.sourcePlatform]}
          </Badge>
          {inspiration.authorHandle && (
            <span className="text-xs text-muted-foreground truncate">
              {inspiration.authorHandle}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(inspiration.savedAt), { addSuffix: true })}
        </p>

        {/* Actions — shown on hover */}
        <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={onUseAsInspiration}
          >
            Use as inspiration
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(inspiration.id)}
          >
            <Trash2 className="size-3" />
          </Button>
          <a
            href={inspiration.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground">
              <ExternalLink className="size-3" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
