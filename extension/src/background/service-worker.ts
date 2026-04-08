import { createBoard, getBoards, saveInspiration } from "../lib/api"
import { isAuthenticated, readUserScoped, writeUserScoped } from "../lib/auth"
import type { Board, Inspiration, SaveInspirationPayload } from "../lib/types"

const BOARDS_CACHE_KEY = "cadence_boards_cache"
const RECENT_KEY = "cadence_recent_inspirations"
const RECENT_MAX = 5

async function refreshBoardsCache(): Promise<void> {
  try {
    const boards = await getBoards()
    await writeUserScoped(BOARDS_CACHE_KEY, boards)
  } catch {
    // Silently fail — cache stays stale
  }
}

// Refresh boards cache on startup if authenticated
chrome.runtime.onStartup.addListener(async () => {
  if (await isAuthenticated()) {
    await refreshBoardsCache()
  }
})

chrome.runtime.onInstalled.addListener(async () => {
  if (await isAuthenticated()) {
    await refreshBoardsCache()
  }
})

// Message handler for content scripts
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    if (message.type === "SAVE_INSPIRATION") {
      handleSaveInspiration(message.payload as SaveInspirationPayload)
        .then((result) => sendResponse({ success: true, inspiration: result }))
        .catch((err: Error) => sendResponse({ success: false, error: err.message }))
      return true // keep channel open for async response
    }

    if (message.type === "GET_BOARDS") {
      readUserScoped<Board[]>(BOARDS_CACHE_KEY)
        .then((boards) => {
          sendResponse({ boards: boards ?? [] })
        })
      return true
    }

    if (message.type === "CREATE_BOARD") {
      createBoard((message.payload as { name: string }).name)
        .then(async (board) => {
          await refreshBoardsCache()
          sendResponse({ success: true, board })
        })
        .catch((err: Error) => sendResponse({ success: false, error: err.message }))
      return true
    }

    if (message.type === "AUTH_SUCCESS") {
      refreshBoardsCache()
      sendResponse({ ok: true })
      return false
    }
  }
)

async function handleSaveInspiration(payload: SaveInspirationPayload): Promise<Inspiration> {
  const inspiration = await saveInspiration(payload)

  // Prepend to recent inspirations cache, keep last N
  const recent = (await readUserScoped<Inspiration[]>(RECENT_KEY)) ?? []
  const updated = [inspiration, ...recent].slice(0, RECENT_MAX)
  await writeUserScoped(RECENT_KEY, updated)

  // Refresh boards cache so popup shows the updated board counts
  // and the save lands against the correct (up-to-date) board record.
  await refreshBoardsCache()

  return inspiration
}
