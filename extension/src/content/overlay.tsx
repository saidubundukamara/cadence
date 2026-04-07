import { useState } from "react"
import type { Board, ExtractedPost } from "../lib/types"
import { Popover } from "./popover"

interface OverlayProps {
  post: ExtractedPost
  boards: Board[]
  lastBoardId: string | null
  onSave: (boardId: string) => Promise<void>
  onNewBoard: (name: string) => Promise<Board>
  onClose: () => void
}

export function Overlay({
  post: _post,
  boards,
  lastBoardId,
  onSave,
  onNewBoard,
  onClose,
}: OverlayProps) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [showPopover, setShowPopover] = useState(false)

  const defaultBoardId =
    lastBoardId ??
    boards.find((b) => b.isDefault)?.id ??
    boards[0]?.id ??
    null

  async function handleSave(boardId: string) {
    setState("saving")
    try {
      await onSave(boardId)
      setState("saved")
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 2000)
    }
  }

  function handleClick() {
    if (state === "saving" || state === "saved") return
    if (defaultBoardId) {
      handleSave(defaultBoardId)
    }
    setShowPopover(true)
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 9999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <button
        onClick={handleClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background:
            state === "saved"
              ? "#16a34a"
              : state === "error"
                ? "#dc2626"
                : "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: state === "saving" ? "wait" : "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          transition: "background 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        {state === "saved" ? (
          <>✓ Saved</>
        ) : state === "saving" ? (
          <>Saving…</>
        ) : state === "error" ? (
          <>Failed</>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
            Save
          </>
        )}
      </button>

      {showPopover && state !== "saved" && (
        <Popover
          boards={boards}
          selectedBoardId={defaultBoardId}
          onSelect={(boardId) => {
            setShowPopover(false)
            handleSave(boardId)
          }}
          onNewBoard={async (name) => {
            const board = await onNewBoard(name)
            return board
          }}
          onClose={() => setShowPopover(false)}
        />
      )}
    </div>
  )
}
