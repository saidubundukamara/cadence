import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  AudioWaveform,
  ExternalLink,
  FolderHeart,
  Inbox,
  LogOut,
  Sparkles,
} from "lucide-react"
import { clearAuth, getAuth, readUserScoped, writeUserScoped } from "@/lib/auth"
import { createBoard, getBoards, listRecentInspirations } from "@/lib/api"
import type { AuthState, Board, Inspiration } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./components/EmptyState"
import { ChevronRight, Loader2, Plus } from "lucide-react"

const BOARDS_CACHE_KEY = "cadence_boards_cache"
const RECENT_KEY = "cadence_recent_inspirations"

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1d9bf0",
  linkedin: "#0077b5",
  reddit: "#ff4500",
}
const PLATFORM_LABELS: Record<string, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  reddit: "Reddit",
}

interface HomeProps {
  onLogout: () => void
  onOpenBoard: (boardId: string) => void
}

export function Home({ onLogout, onOpenBoard }: HomeProps) {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [boards, setBoards] = useState<Board[] | null>(null)
  const [recent, setRecent] = useState<Inspiration[] | null>(null)
  const [boardsError, setBoardsError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault()
    const name = newBoardName.trim()
    if (!name) return
    setCreating(true)
    setCreateError(null)
    try {
      const board = await createBoard(name)
      const next = boards ? [board, ...boards] : [board]
      setBoards(next)
      writeUserScoped(BOARDS_CACHE_KEY, next)
      setNewBoardName("")
      setShowCreate(false)
    } catch (err) {
      setCreateError((err as Error).message || "Couldn't create board.")
    } finally {
      setCreating(false)
    }
  }
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    getAuth().then((a) => {
      if (!cancelled) setAuth(a)
    })

    // Read user-scoped cache; helper rejects entries that belong to a
    // different user, so we won't briefly flash the previous user's data.
    Promise.all([
      readUserScoped<Board[]>(BOARDS_CACHE_KEY),
      readUserScoped<Inspiration[]>(RECENT_KEY),
    ]).then(([cachedBoards, cachedRecent]) => {
      if (cancelled) return
      if (cachedBoards) setBoards(cachedBoards)
      if (cachedRecent) setRecent(cachedRecent)
    })

    getBoards()
      .then((bs) => {
        if (cancelled) return
        setBoards(bs)
        setBoardsError(null)
        writeUserScoped(BOARDS_CACHE_KEY, bs)
      })
      .catch((e) => {
        if (cancelled) return
        setBoards((prev) => prev ?? [])
        setBoardsError((e as Error).message || "Couldn't load your boards.")
      })

    listRecentInspirations(5)
      .then((items) => {
        if (cancelled) return
        setRecent(items)
        writeUserScoped(RECENT_KEY, items)
      })
      .catch(() => {
        if (cancelled) return
        setRecent((prev) => prev ?? [])
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function handleLogout() {
    await clearAuth()
    onLogout()
  }

  function openDashboard() {
    if (auth?.cadenceUrl) {
      chrome.tabs.create({ url: `${auth.cadenceUrl}/inspiration` })
    }
  }

  const initials =
    auth?.user.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    auth?.user.email?.[0]?.toUpperCase() ??
    "?"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="flex min-h-[600px] flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 items-center justify-center rounded-xl"
            style={{ background: "var(--color-mint)" }}
          >
            <AudioWaveform className="size-4 text-[var(--color-foreground)]" strokeWidth={2.25} />
          </div>
          <span className="font-heading text-[17px] font-[700] tracking-[-0.02em]">Cadence</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-[11px] font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[color-mix(in_oklch,var(--color-primary)_14%,var(--color-muted))]"
          >
            {initials}
          </button>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-10 z-10 w-48 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-lg"
            >
              {auth && (
                <div className="border-b border-[var(--color-border)] px-3 py-2.5">
                  <div className="truncate text-xs font-medium">
                    {auth.user.name ?? "Signed in"}
                  </div>
                  <div className="truncate text-[11px] text-[var(--color-muted-foreground)]">
                    {auth.user.email}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Recently Saved */}
        <section className="px-6 pt-6">
          <SectionTitle icon={<Sparkles className="size-3" />} label="Recently saved" />
          {recent === null ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-5" />}
              title="Nothing saved yet"
              hint="Hit the Cadence button on a post and it shows up here."
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {recent.slice(0, 4).map((insp) => {
                const color = PLATFORM_COLORS[insp.sourcePlatform]
                return (
                  <a
                    key={insp.id}
                    href={insp.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-white p-2 transition-all hover:border-[color-mix(in_oklch,var(--color-primary)_40%,var(--color-border))] hover:shadow-sm"
                  >
                    {insp.thumbnailUrl ? (
                      <img
                        src={insp.thumbnailUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold"
                        style={{ background: `${color}1a`, color }}
                      >
                        {PLATFORM_LABELS[insp.sourcePlatform]?.[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-[var(--color-foreground)]">
                        {insp.content?.slice(0, 70) ?? insp.originalUrl}
                      </div>
                      <div className="text-[10px] font-medium" style={{ color }}>
                        {PLATFORM_LABELS[insp.sourcePlatform]}
                        {insp.authorHandle ? ` · ${insp.authorHandle}` : ""}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </section>

        <Separator className="my-6" />

        {/* Boards */}
        <section className="px-6 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={<FolderHeart className="size-3" />} label="Your boards" />
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)]"
            >
              <Plus className="size-3" />
              New
            </button>
          </div>
          {showCreate && (
            <form onSubmit={handleCreateBoard} className="mb-3 flex gap-2">
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name"
                disabled={creating}
                autoFocus
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" disabled={creating || !newBoardName.trim()} className="h-8 px-3 text-xs">
                {creating ? <Loader2 className="size-3 animate-spin" /> : "Add"}
              </Button>
            </form>
          )}
          {createError && (
            <div className="mb-2 text-[11px] text-[var(--color-destructive)]">{createError}</div>
          )}
          {boardsError && (
            <div className="mb-2 rounded-md border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-3 py-2 text-[11px] text-[var(--color-destructive)]">
              {boardsError}
            </div>
          )}
          {boards === null ? (
            <div className="space-y-1.5">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : boards.length === 0 ? (
            <EmptyState
              icon={<FolderHeart className="size-5" />}
              title="No boards yet"
              hint="Save something and your first board lands here."
            />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(boards.length > 9 ? boards.slice(0, 8) : boards.slice(0, 9)).map((board, i) => {
                const count = board._count?.inspirations ?? 0
                return (
                  <motion.button
                    key={board.id}
                    onClick={() => onOpenBoard(board.id)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.03 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-border)] bg-white p-2.5 text-left transition-shadow hover:border-[color-mix(in_oklch,var(--color-primary)_45%,var(--color-border))] hover:shadow-md"
                  >
                    {board.coverImage ? (
                      <>
                        <img
                          src={board.coverImage}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      </>
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(135deg, color-mix(in oklch, var(--color-mint) 55%, white) 0%, color-mix(in oklch, var(--color-mint) 25%, white) 100%)",
                        }}
                      />
                    )}

                    <div className="relative flex items-start justify-between">
                      <div
                        className={`flex size-6 items-center justify-center rounded-md backdrop-blur-sm ${
                          board.coverImage ? "bg-white/25" : "bg-white/70"
                        }`}
                      >
                        <FolderHeart
                          className={`size-3 ${
                            board.coverImage ? "text-white" : "text-[var(--color-foreground)]"
                          }`}
                          strokeWidth={2.25}
                        />
                      </div>
                      <ChevronRight
                        className={`size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 ${
                          board.coverImage ? "text-white" : "text-[var(--color-foreground)]"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <div
                        className={`truncate text-[13px] font-semibold tracking-[-0.01em] ${
                          board.coverImage ? "text-white" : "text-[var(--color-foreground)]"
                        }`}
                      >
                        {board.name}
                      </div>
                      <div
                        className={`mt-0.5 text-[10px] font-medium ${
                          board.coverImage
                            ? "text-white/80"
                            : "text-[var(--color-foreground)]/65"
                        }`}
                      >
                        {count} {count === 1 ? "item" : "items"}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
              {boards.length > 9 && (
                <button
                  onClick={openDashboard}
                  className="group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2.5 text-center transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]"
                >
                  <span className="font-heading text-[15px] font-[700] tracking-[-0.01em] text-[var(--color-foreground)]">
                    +{boards.length - 8}
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    more
                  </span>
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] px-6 py-5">
        <button
          onClick={openDashboard}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[13px] font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
        >
          Open Inspiration Library
          <ExternalLink className="size-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
      {icon}
      {label}
    </div>
  )
}

