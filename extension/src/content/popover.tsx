import { useState } from "react"
import type { Board } from "../lib/types"

interface PopoverProps {
  boards: Board[]
  selectedBoardId: string | null
  onSelect: (boardId: string) => void
  onNewBoard: (name: string) => Promise<Board>
  onClose: () => void
}

export function Popover({
  boards,
  selectedBoardId,
  onSelect,
  onNewBoard,
  onClose: _onClose,
}: PopoverProps) {
  const [newBoardName, setNewBoardName] = useState("")
  const [showNewInput, setShowNewInput] = useState(false)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!newBoardName.trim()) return
    setCreating(true)
    try {
      const board = await onNewBoard(newBoardName.trim())
      onSelect(board.id)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        width: 220,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 13,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #f3f4f6",
          fontWeight: 600,
          color: "#374151",
        }}
      >
        Save to board
      </div>

      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onSelect(board.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "8px 12px",
              background: board.id === selectedBoardId ? "#f0f0ff" : "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              color: "#111827",
            }}
          >
            <span>{board.name}</span>
            <span style={{ color: "#9ca3af", fontSize: 11 }}>
              {board._count?.inspirations ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6", padding: "6px 8px" }}>
        {showNewInput ? (
          <div style={{ display: "flex", gap: 4 }}>
            <input
              autoFocus
              type="text"
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
                if (e.key === "Escape") setShowNewInput(false)
              }}
              style={{
                flex: 1,
                padding: "4px 8px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                padding: "4px 8px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {creating ? "…" : "Add"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewInput(true)}
            style={{
              width: "100%",
              padding: "6px 8px",
              background: "transparent",
              border: "1px dashed #d1d5db",
              borderRadius: 4,
              fontSize: 12,
              color: "#6b7280",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            + New board
          </button>
        )}
      </div>
    </div>
  )
}
