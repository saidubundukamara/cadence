import { getAuth, getToken, USER_SCOPED_KEYS } from "./auth"
import type { Board, Inspiration, SaveInspirationPayload } from "./types"

const STORAGE_KEY = "cadence_auth"

async function getBaseUrl(): Promise<string> {
  const auth = await getAuth()
  return auth?.cadenceUrl ?? import.meta.env.VITE_CADENCE_URL ?? "http://localhost:3000"
}

/**
 * Wipe the locally stored extension auth without calling /extension-logout.
 * Used when the server tells us the token is no longer valid (401), so the
 * popup falls back to the login screen on the next render. We skip the
 * network revoke call because the token is already dead server-side.
 */
async function wipeLocalAuth(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEY, ...USER_SCOPED_KEYS])
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const [base, token] = await Promise.all([getBaseUrl(), getToken()])

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    // Token is rejected by the server (revoked, expired, or DB row gone).
    // Drop local auth so the popup re-routes to login automatically.
    if (res.status === 401 && token) {
      await wipeLocalAuth()
    }
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? "Request failed")
  }

  return res.json()
}

export async function getBoards(): Promise<Board[]> {
  return apiFetch<Board[]>("/api/boards")
}

export async function createBoard(name: string): Promise<Board> {
  return apiFetch<Board>("/api/boards", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

interface ListInspirationsResponse {
  inspirations: Inspiration[]
  total: number
  page: number
  limit: number
}

export async function listInspirations(
  boardId: string,
  page = 1,
  limit = 50
): Promise<ListInspirationsResponse> {
  const params = new URLSearchParams({
    boardId,
    page: String(page),
    limit: String(limit),
  })
  return apiFetch<ListInspirationsResponse>(`/api/inspirations?${params}`)
}

export async function listRecentInspirations(limit = 5): Promise<Inspiration[]> {
  const params = new URLSearchParams({ page: "1", limit: String(limit) })
  const res = await apiFetch<ListInspirationsResponse>(`/api/inspirations?${params}`)
  return res.inspirations
}

export async function deleteInspiration(id: string): Promise<void> {
  return apiFetch<void>(`/api/inspirations/${id}`, { method: "DELETE" })
}

export async function moveInspiration(id: string, boardId: string): Promise<Inspiration> {
  return apiFetch<Inspiration>(`/api/inspirations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ boardId }),
  })
}

export async function updateBoard(id: string, name: string): Promise<Board> {
  return apiFetch<Board>(`/api/boards/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  })
}

export async function deleteBoard(id: string): Promise<void> {
  return apiFetch<void>(`/api/boards/${id}`, { method: "DELETE" })
}

export async function saveInspiration(
  payload: SaveInspirationPayload
): Promise<Inspiration> {
  return apiFetch<Inspiration>("/api/inspirations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
