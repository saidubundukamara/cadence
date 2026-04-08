import { useEffect, useState } from "react"
import { Check, FolderPlus, Loader2, Plus } from "lucide-react"
import { createBoard, getBoards } from "@/lib/api"
import type { Board } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  selectedBoardId: string | null
  onSelect: (id: string) => void
}

export function StepFirstBoard({ selectedBoardId, onSelect }: Props) {
  const [boards, setBoards] = useState<Board[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBoards()
      .then((b) => {
        setBoards(b)
        if (b.length === 0) setShowCreate(true)
      })
      .catch(() => {
        setBoards([])
        setError("Couldn't load your boards.")
      })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const board = await createBoard(newName.trim())
      setBoards((prev) => (prev ? [board, ...prev] : [board]))
      onSelect(board.id)
      setNewName("")
      setShowCreate(false)
    } catch {
      setError("Couldn't create that board. Try again?")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 text-center">
        <h2 className="font-heading text-[24px] font-[700] leading-[1.15] tracking-[-0.025em]">
          Pick your first board
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
          This is where your next save will land. You can change it later.
        </p>
      </div>

      {boards === null ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="flex max-h-[200px] flex-col gap-1.5 overflow-y-auto pr-1">
          {boards.slice(0, 6).map((board) => {
            const selected = board.id === selectedBoardId
            return (
              <button
                key={board.id}
                type="button"
                onClick={() => onSelect(board.id)}
                className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                  selected
                    ? "border-[var(--color-primary)] bg-[color-mix(in_oklch,var(--color-primary)_8%,transparent)] shadow-sm"
                    : "border-[var(--color-border)] bg-white hover:border-[color-mix(in_oklch,var(--color-primary)_40%,var(--color-border))] hover:bg-[var(--color-muted)]/40"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md ${
                      selected
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    <FolderPlus className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{board.name}</div>
                    <div className="text-[11px] text-[var(--color-muted-foreground)]">
                      {board._count?.inspirations ?? 0} saved
                    </div>
                  </div>
                </div>
                {selected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}

          {!showCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] p-3 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <Plus className="size-4" />
              Create a new board
            </button>
          )}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-3 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Design inspiration"
            disabled={creating}
            autoFocus
            className="h-9 text-sm"
          />
          <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="animate-spin" /> : "Create"}
          </Button>
        </form>
      )}

      {error && (
        <p className="mt-2 text-[11px] text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  )
}
