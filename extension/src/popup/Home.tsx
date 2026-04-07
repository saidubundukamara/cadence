import { useEffect, useState } from "react"
import { clearAuth, getAuth } from "../lib/auth"
import { getBoards } from "../lib/api"
import type { AuthState, Board, Inspiration } from "../lib/types"

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
  const [boards, setBoards] = useState<Board[]>([])
  const [recent, setRecent] = useState<Inspiration[]>([])

  useEffect(() => {
    getAuth().then(setAuth)

    // Load cached data first, then refresh boards from API
    chrome.storage.local.get([BOARDS_CACHE_KEY, RECENT_KEY]).then((result) => {
      setBoards((result[BOARDS_CACHE_KEY] as Board[]) ?? [])
      setRecent((result[RECENT_KEY] as Inspiration[]) ?? [])
    })

    getBoards()
      .then(setBoards)
      .catch(() => {/* use cache */})
  }, [])

  async function handleLogout() {
    await clearAuth()
    onLogout()
  }

  function openDashboard() {
    getAuth().then((a) => {
      if (a?.cadenceUrl) {
        chrome.tabs.create({ url: `${a.cadenceUrl}/inspiration` })
      }
    })
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#6366f1">
            <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            <path d="M12 8v4l3 3-1.5 1.5-3.5-3.5V8H12z" />
          </svg>
          <span style={styles.logoText}>Cadence</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign out">
          ↩
        </button>
      </div>

      {auth && (
        <div style={styles.user}>
          Signed in as <strong>{auth.user.email}</strong>
        </div>
      )}

      <div style={styles.scrollArea}>
        {/* Recently Saved */}
        {recent.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Recently Saved</div>
            <div style={styles.recentList}>
              {recent.slice(0, 5).map((insp) => {
                const color = PLATFORM_COLORS[insp.sourcePlatform]
                return (
                  <a
                    key={insp.id}
                    href={insp.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.recentRow}
                  >
                    {insp.thumbnailUrl ? (
                      <img
                        src={insp.thumbnailUrl}
                        alt=""
                        style={styles.recentThumb}
                      />
                    ) : (
                      <div
                        style={{
                          ...styles.recentThumbFallback,
                          background: `${color}20`,
                          color,
                        }}
                      >
                        {PLATFORM_LABELS[insp.sourcePlatform]?.[0]}
                      </div>
                    )}
                    <div style={styles.recentContent}>
                      <span style={styles.recentText}>
                        {insp.content?.slice(0, 60) ?? insp.originalUrl}
                        {(insp.content?.length ?? 0) > 60 ? "…" : ""}
                      </span>
                      <span
                        style={{
                          ...styles.recentPlatform,
                          color,
                        }}
                      >
                        {PLATFORM_LABELS[insp.sourcePlatform]}
                        {insp.authorHandle ? ` · ${insp.authorHandle}` : ""}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Boards */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Your Boards</div>
          {boards.length === 0 ? (
            <div style={styles.empty}>No boards yet. Save a post to create one.</div>
          ) : (
            <div style={styles.boardList}>
              {boards.slice(0, 5).map((board) => (
                <div key={board.id} style={styles.boardRow}>
                  <span style={styles.boardName}>{board.name}</span>
                  <span style={styles.boardCount}>{board._count?.inspirations ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button onClick={openDashboard} style={styles.dashboardBtn}>
          Open Inspiration Library ↗
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #f3f4f6",
    flexShrink: 0,
  },
  logo: { display: "flex", alignItems: "center", gap: 6 },
  logoText: { fontSize: 16, fontWeight: 700, color: "#111827" },
  logoutBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    color: "#9ca3af",
    padding: 4,
  },
  user: {
    padding: "8px 16px",
    fontSize: 12,
    color: "#6b7280",
    background: "#f9fafb",
    borderBottom: "1px solid #f3f4f6",
    flexShrink: 0,
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
  },
  section: { padding: "14px 16px" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 8,
  },
  recentList: { display: "flex", flexDirection: "column", gap: 6 },
  recentRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px",
    background: "#f9fafb",
    borderRadius: 6,
    textDecoration: "none",
    cursor: "pointer",
  },
  recentThumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
    objectFit: "cover",
    flexShrink: 0,
  },
  recentThumbFallback: {
    width: 36,
    height: 36,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  recentContent: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflow: "hidden",
  },
  recentText: {
    fontSize: 12,
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  recentPlatform: { fontSize: 11 },
  empty: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    padding: "12px 0",
  },
  boardList: { display: "flex", flexDirection: "column", gap: 4 },
  boardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 10px",
    background: "#f9fafb",
    borderRadius: 6,
    fontSize: 13,
  },
  boardName: { color: "#111827", fontWeight: 500 },
  boardCount: { color: "#9ca3af", fontSize: 12 },
  footer: {
    padding: "12px 16px",
    borderTop: "1px solid #f3f4f6",
    flexShrink: 0,
  },
  dashboardBtn: {
    width: "100%",
    padding: "9px",
    background: "#f0f0ff",
    color: "#6366f1",
    border: "1px solid #e0e0ff",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },
}
