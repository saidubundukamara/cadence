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
import { clearAuth, getAuth } from "@/lib/auth"
import { getBoards } from "@/lib/api"
import type { AuthState, Board, Inspiration } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./components/EmptyState"
import { ChevronRight } from "lucide-react"

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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAuth().then(setAuth)
    chrome.storage.local.get([BOARDS_CACHE_KEY, RECENT_KEY]).then((result) => {
      setBoards((result[BOARDS_CACHE_KEY] as Board[]) ?? [])
      setRecent((result[RECENT_KEY] as Inspiration[]) ?? [])
    })
    getBoards().then(setBoards).catch(() => {})
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
              hint="Hit the Cadence button on any post to get started."
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
          <SectionTitle icon={<FolderHeart className="size-3" />} label="Your boards" />
          {boards === null ? (
            <div className="space-y-1.5">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : boards.length === 0 ? (
            <EmptyState
              icon={<FolderHeart className="size-5" />}
              title="No boards yet"
              hint="Boards appear here as soon as you save something."
            />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {boards.slice(0, 9).map((board, i) => {
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

