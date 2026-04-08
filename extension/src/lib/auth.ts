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
  "cadence_last_board_id",
  "cadence:onboarded",
  "cadence:defaultBoardId",
  "cadence:lastEmail",
]

/**
 * Wrapper used by readUserScoped/writeUserScoped so cached payloads
 * carry the identity of the user they were fetched for.
 */
interface ScopedEntry<T> {
  owner: string
  value: T
}

async function getCurrentOwner(): Promise<string | null> {
  const auth = await getAuth()
  return auth?.user.email ?? null
}

/**
 * Read a per-user cached value. Returns null if there is no current user,
 * if the cache is missing, or if the cached payload belongs to a different
 * user — in which case the stale entry is also deleted.
 */
export async function readUserScoped<T>(key: string): Promise<T | null> {
  const owner = await getCurrentOwner()
  if (!owner) return null
  const result = await chrome.storage.local.get(key)
  const entry = result[key] as ScopedEntry<T> | undefined
  if (!entry || typeof entry !== "object" || !("owner" in entry)) {
    // Untagged or missing — treat as cold start, and clean up legacy data.
    if (entry !== undefined) await chrome.storage.local.remove(key)
    return null
  }
  if (entry.owner !== owner) {
    await chrome.storage.local.remove(key)
    return null
  }
  return entry.value
}

/**
 * Write a per-user cached value tagged with the current user's identity.
 * No-op if no user is currently authenticated.
 */
export async function writeUserScoped<T>(key: string, value: T): Promise<void> {
  const owner = await getCurrentOwner()
  if (!owner) return
  const entry: ScopedEntry<T> = { owner, value }
  await chrome.storage.local.set({ [key]: entry })
}

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
  // Best-effort: tell the server to revoke the token row before we drop it
  // locally. We must do this BEFORE wiping storage, otherwise we lose the
  // token we need to authenticate the revoke call. Network failures are
  // swallowed — the user is still considered logged out locally.
  const prev = await getAuth()
  if (prev?.token && prev.cadenceUrl) {
    try {
      await fetch(`${prev.cadenceUrl}/api/auth/extension-logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${prev.token}` },
      })
    } catch {
      // Ignore — we still wipe local state below.
    }
  }
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
