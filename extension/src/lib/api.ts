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

export async function saveInspiration(
  payload: SaveInspirationPayload
): Promise<Inspiration> {
  return apiFetch<Inspiration>("/api/inspirations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
