import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ExternalLink,
  Inbox,
  MoreHorizontal,
  Trash2,
  FolderInput,
  Pencil,
  Check,
  X,
} from "lucide-react"
import {
  deleteBoard,
  deleteInspiration,
  getBoards,
  listInspirations,
  moveInspiration,
  updateBoard,
} from "@/lib/api"
import { readUserScoped, writeUserScoped } from "@/lib/auth"
import type { Board, Inspiration } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./components/EmptyState"

const BOARDS_CACHE_KEY = "cadence_boards_cache"

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

interface BoardDetailProps {
  boardId: string
  onBack: () => void
}

export function BoardDetail({ boardId, onBack }: BoardDetailProps) {
  const [items, setItems] = useState<Inspiration[] | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [moveOpenFor, setMoveOpenFor] = useState<string | null>(null)
  const [confirmingDeleteItem, setConfirmingDeleteItem] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    readUserScoped<Board[]>(BOARDS_CACHE_KEY).then((cached) => {
      if (!cached) return
      setBoards(cached)
      const found = cached.find((b) => b.id === boardId)
      if (found) {
        setBoard(found)
        setRenameValue(found.name)
      }
    })
    getBoards()
      .then((bs) => {
        setBoards(bs)
        writeUserScoped(BOARDS_CACHE_KEY, bs)
        const found = bs.find((b) => b.id === boardId)
        if (found) {
          setBoard(found)
          setRenameValue(found.name)
        }
      })
      .catch(() => {})

    listInspirations(boardId)
      .then((res) => setItems(res.inspirations))
      .catch((e) => {
        setError(e.message)
        setItems([])
      })
  }, [boardId])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmingDelete(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function handleDeleteItem(id: string) {
    if (!items) return
    const prev = items
    setItems(items.filter((i) => i.id !== id))
    try {
      await deleteInspiration(id)
    } catch (e) {
      setItems(prev)
      setError((e as Error).message)
    }
  }

  async function handleMoveItem(id: string, targetBoardId: string) {
    if (!items) return
    const prev = items
    setItems(items.filter((i) => i.id !== id))
    setMoveOpenFor(null)
    try {
      await moveInspiration(id, targetBoardId)
    } catch (e) {
      setItems(prev)
      setError((e as Error).message)
    }
  }

  async function handleRename() {
    const name = renameValue.trim()
    if (!name || !board || name === board.name) {
      setRenaming(false)
      return
    }
    try {
      const updated = await updateBoard(boardId, name)
      setBoard(updated)
      setRenaming(false)
      const refreshed = await getBoards()
      setBoards(refreshed)
      writeUserScoped(BOARDS_CACHE_KEY, refreshed)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleDeleteBoard() {
    try {
      await deleteBoard(boardId)
      const refreshed = await getBoards().catch(() => [])
      writeUserScoped(BOARDS_CACHE_KEY, refreshed)
      onBack()
    } catch (e) {
      setError((e as Error).message)
      setConfirmingDelete(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className="flex min-h-[600px] flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            <ArrowLeft className="size-4" />
          </button>
          {renaming ? (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename()
                  if (e.key === "Escape") {
                    setRenaming(false)
                    setRenameValue(board?.name ?? "")
                  }
                }}
                className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-sm font-semibold outline-none focus:border-[var(--color-mint)]"
              />
              <button onClick={handleRename} className="flex size-7 items-center justify-center rounded-md hover:bg-[var(--color-muted)]">
                <Check className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  setRenaming(false)
                  setRenameValue(board?.name ?? "")
                }}
                className="flex size-7 items-center justify-center rounded-md hover:bg-[var(--color-muted)]"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <span className="truncate font-heading text-[15px] font-[700] tracking-[-0.01em]">
              {board?.name ?? "Board"}
            </span>
          )}
        </div>

        {!renaming && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Board actions"
              className="flex size-8 items-center justify-center rounded-full text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-10 z-10 w-44 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-lg"
              >
                <button
                  onClick={() => {
                    setRenaming(true)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-[var(--color-muted)]"
                >
                  <Pencil className="size-3.5" />
                  Rename board
                </button>
                <button
                  onClick={() => {
                    if (confirmingDelete) {
                      handleDeleteBoard()
                    } else {
                      setConfirmingDelete(true)
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-destructive)] hover:bg-[var(--color-muted)]"
                >
                  <Trash2 className="size-3.5" />
                  {confirmingDelete ? "Tap again to confirm" : "Delete board"}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <div className="mb-3 rounded-md border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-3 py-2 text-[11px] text-[var(--color-destructive)]">
            {error}
          </div>
        )}
        {items === null ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" />}
            title="Nothing here yet"
            hint="Saves to this board will show up here."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {groupByDate(items).map(({ label, items: groupItems }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
                  {label}
                </div>
                {groupItems.map((insp) => (
                  <ItemRow
                    key={insp.id}
                    item={insp}
                    otherBoards={boards.filter((b) => b.id !== boardId)}
                    moveOpen={moveOpenFor === insp.id}
                    onToggleMove={() =>
                      setMoveOpenFor((cur) => (cur === insp.id ? null : insp.id))
                    }
                    onMove={(targetId) => handleMoveItem(insp.id, targetId)}
                    confirmingDelete={confirmingDeleteItem === insp.id}
                    onDelete={() => {
                      if (confirmingDeleteItem === insp.id) {
                        setConfirmingDeleteItem(null)
                        handleDeleteItem(insp.id)
                      } else {
                        setConfirmingDeleteItem(insp.id)
                      }
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function groupByDate(items: Inspiration[]): { label: string; items: Inspiration[] }[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86_400_000
  const startOfWeek = startOfToday - 6 * 86_400_000
  const startOfMonth = startOfToday - 29 * 86_400_000
  const startOfYear = startOfToday - 364 * 86_400_000

  const buckets: { label: string; cutoff: number; items: Inspiration[] }[] = [
    { label: "Today", cutoff: startOfToday, items: [] },
    { label: "Yesterday", cutoff: startOfYesterday, items: [] },
    { label: "Earlier this week", cutoff: startOfWeek, items: [] },
    { label: "This month", cutoff: startOfMonth, items: [] },
    { label: "This year", cutoff: startOfYear, items: [] },
    { label: "Older", cutoff: -Infinity, items: [] },
  ]

  const sorted = [...items].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  )

  for (const item of sorted) {
    const t = new Date(item.savedAt).getTime()
    const bucket = buckets.find((b) => t >= b.cutoff)
    if (bucket) bucket.items.push(item)
  }

  return buckets
    .filter((b) => b.items.length > 0)
    .map(({ label, items }) => ({ label, items }))
}

interface ItemRowProps {
  item: Inspiration
  otherBoards: Board[]
  moveOpen: boolean
  onToggleMove: () => void
  onMove: (boardId: string) => void
  onDelete: () => void
  confirmingDelete: boolean
}

function ItemRow({ item, otherBoards, moveOpen, onToggleMove, onMove, onDelete, confirmingDelete }: ItemRowProps) {
  const color = PLATFORM_COLORS[item.sourcePlatform]
  const [actionsOpen, setActionsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setActionsOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div className="relative rounded-lg border border-[var(--color-border)] bg-white transition-all hover:border-[color-mix(in_oklch,var(--color-primary)_40%,var(--color-border))] hover:shadow-sm">
      <div className="flex items-center gap-2.5 p-2">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold"
            style={{ background: `${color}1a`, color }}
          >
            {PLATFORM_LABELS[item.sourcePlatform]?.[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-[var(--color-foreground)]">
            {item.content?.slice(0, 70) ?? item.originalUrl}
          </div>
          <div className="text-[10px] font-medium" style={{ color }}>
            {PLATFORM_LABELS[item.sourcePlatform]}
            {item.authorHandle ? ` · ${item.authorHandle}` : ""}
          </div>
        </div>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setActionsOpen((o) => !o)}
            aria-label="Item actions"
            className="flex size-7 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
          {actionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-lg"
            >
              <a
                href={item.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-[var(--color-muted)]"
              >
                <ExternalLink className="size-3.5" />
                Open original
              </a>
              <button
                onClick={() => {
                  setActionsOpen(false)
                  onToggleMove()
                }}
                disabled={otherBoards.length === 0}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-[var(--color-muted)] disabled:opacity-40"
              >
                <FolderInput className="size-3.5" />
                Move to…
              </button>
              <button
                onClick={() => {
                  if (confirmingDelete) setActionsOpen(false)
                  onDelete()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-destructive)] hover:bg-[var(--color-muted)]"
              >
                <Trash2 className="size-3.5" />
                {confirmingDelete ? "Tap again to confirm" : "Delete"}
              </button>
            </motion.div>
          )}
        </div>
      </div>
      {moveOpen && otherBoards.length > 0 && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/30 px-2 py-1.5">
          <div className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Move to
          </div>
          <div className="flex flex-col gap-0.5">
            {otherBoards.map((b) => (
              <button
                key={b.id}
                onClick={() => onMove(b.id)}
                className="truncate rounded px-2 py-1 text-left text-[11px] font-medium hover:bg-white"
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
