const ONBOARDED_KEY = "cadence:onboarded"
const DEFAULT_BOARD_KEY = "cadence:defaultBoardId"
const LAST_EMAIL_KEY = "cadence:lastEmail"

export async function isOnboarded(): Promise<boolean> {
  const r = await chrome.storage.local.get(ONBOARDED_KEY)
  return r[ONBOARDED_KEY] === true
}

export async function setOnboarded(): Promise<void> {
  await chrome.storage.local.set({ [ONBOARDED_KEY]: true })
}

export async function setDefaultBoardId(id: string): Promise<void> {
  await chrome.storage.local.set({ [DEFAULT_BOARD_KEY]: id })
}

export async function getLastEmail(): Promise<string> {
  const r = await chrome.storage.local.get(LAST_EMAIL_KEY)
  return (r[LAST_EMAIL_KEY] as string) ?? ""
}

export async function setLastEmail(email: string): Promise<void> {
  await chrome.storage.local.set({ [LAST_EMAIL_KEY]: email })
}
