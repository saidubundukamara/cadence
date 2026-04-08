import { getAuth, getToken } from "./auth"
import type { Board, Inspiration, SaveInspirationPayload } from "./types"

async function getBaseUrl(): Promise<string> {
  const auth = await getAuth()
  return auth?.cadenceUrl ?? import.meta.env.VITE_CADENCE_URL ?? "http://localhost:3000"
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
