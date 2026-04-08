import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
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
}

export function Home({ onLogout }: HomeProps) {
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
      className="flex min-h-[520px] flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--color-primary)_12%,transparent)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-primary)">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              <path d="M12 8v4l3 3-1.5 1.5-3.5-3.5V8H12z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">Cadence</span>
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
        <section className="px-4 pt-4">
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

        <Separator className="my-4" />

        {/* Boards */}
        <section className="px-4 pb-4">
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
            <div className="flex flex-col gap-1">
              {boards.slice(0, 6).map((board) => (
                <div
                  key={board.id}
                  className="flex items-center justify-between rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-[var(--color-muted)]"
                >
                  <span className="truncate font-medium">{board.name}</span>
                  <span className="text-[10px] font-medium text-[var(--color-muted-foreground)]">
                    {board._count?.inspirations ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] p-3">
        <Button variant="outline" onClick={openDashboard} className="w-full gap-2" size="sm">
          Open Inspiration Library
          <ExternalLink className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
      {icon}
      {label}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode
  title: string
  hint: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-5 text-center">
      <div className="text-[var(--color-muted-foreground)]">{icon}</div>
      <div className="text-xs font-semibold">{title}</div>
      <div className="text-[11px] text-[var(--color-muted-foreground)]">{hint}</div>
    </div>
  )
}
