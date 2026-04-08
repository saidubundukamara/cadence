import type { AuthState } from "./types"

const STORAGE_KEY = "cadence_auth"

/**
 * All chrome.storage.local keys that hold per-user data.
 * Must be wiped on logout and whenever the authenticated user changes,
 * otherwise one user can see another user's boards / recent saves.
 */
export const USER_SCOPED_KEYS = [
  "cadence_boards_cache",
  "cadence_recent_inspirations",
  "cadence_last_board",
  "cadence:onboarded",
  "cadence:defaultBoardId",
  "cadence:lastEmail",
]

export async function getAuth(): Promise<AuthState | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] as AuthState) ?? null
}

export async function setAuth(state: AuthState): Promise<void> {
  // If a different user is signing in, wipe the previous user's cached data
  // before writing the new auth record.
  const prev = await getAuth()
  if (prev && prev.user.email !== state.user.email) {
    await chrome.storage.local.remove(USER_SCOPED_KEYS)
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: state })
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEY, ...USER_SCOPED_KEYS])
}

export async function isAuthenticated(): Promise<boolean> {
  const auth = await getAuth()
  if (!auth) return false
  return new Date(auth.expiresAt) > new Date()
}

export async function getToken(): Promise<string | null> {
  const auth = await getAuth()
  if (!auth) return null
  if (new Date(auth.expiresAt) <= new Date()) return null
  return auth.token
}
