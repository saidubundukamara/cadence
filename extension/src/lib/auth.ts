import type { AuthState } from "./types"

const STORAGE_KEY = "cadence_auth"

export async function getAuth(): Promise<AuthState | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] as AuthState) ?? null
}

export async function setAuth(state: AuthState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state })
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
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
