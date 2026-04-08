import { useState, useRef, useEffect } from "react"
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
  const mountedRef = useRef(true)

  useEffect(() => () => { mountedRef.current = false }, [])

  const defaultBoardId =
    lastBoardId ??
    boards.find((b) => b.isDefault)?.id ??
    boards[0]?.id ??
    null

  async function handleSave(boardId: string) {
    setState("saving")
    setShowPopover(false)
    try {
      await onSave(boardId)
      if (!mountedRef.current) return
      setState("saved")
      setTimeout(() => {
        if (mountedRef.current) onClose()
      }, 1500)
    } catch {
      if (!mountedRef.current) return
      setState("error")
      setTimeout(() => {
        if (mountedRef.current) setState("idle")
      }, 2000)
    }
  }

  function handleClick() {
    if (state === "saving" || state === "saved") return
    setShowPopover((prev) => !prev)
  }

  return (
    <div
      style={{
        position: "relative",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        pointerEvents: "none",
      }}
    >
      <button
        onClick={handleClick}
        title={state === "saved" ? "Saved to Cadence!" : "Save to Cadence"}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background:
            state === "saved"
              ? "#16a34a"
              : state === "error"
                ? "#dc2626"
                : state === "saving"
                  ? "#4f46e5"
                  : "#6366f1",
          border: "none",
          cursor: state === "saving" ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          transition: "background 0.2s, transform 0.1s",
          padding: 0,
          flexShrink: 0,
          pointerEvents: "auto",
        }}
      >
        {state === "saved" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : state === "saving" ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            style={{ animation: "cadence-spin 0.8s linear infinite" }}
          >
            <circle cx="12" cy="12" r="9" strokeDasharray="28 56" />
          </svg>
        ) : state === "error" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        )}
      </button>

      {showPopover && state !== "saved" && (
        <Popover
          boards={boards}
          selectedBoardId={defaultBoardId}
          onSelect={(boardId) => {
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
