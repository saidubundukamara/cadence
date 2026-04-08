import { createRoot } from "react-dom/client"
import { createElement } from "react"
import { Overlay } from "./overlay"
import { extractTweet, TWEET_SELECTOR } from "./platforms/twitter"
import { extractLinkedInPost, LINKEDIN_POST_SELECTORS } from "./platforms/linkedin"
import { extractRedditPost, REDDIT_POST_SELECTOR } from "./platforms/reddit"
import { isAuthenticated, readUserScoped, writeUserScoped } from "../lib/auth"
import type { Board, ExtractedPost } from "../lib/types"

const LAST_BOARD_KEY = "cadence_last_board_id"
const AUTH_STORAGE_KEY = "cadence_auth"

let authed = false
let injected = new WeakSet<Element>()
const activeRemovers = new Set<() => void>()

const hostname = window.location.hostname
const isTwitter = hostname === "twitter.com" || hostname === "x.com"
const isLinkedIn = hostname === "www.linkedin.com"
const isReddit = hostname === "www.reddit.com"

function isOnFeedPage(): boolean {
  const path = window.location.pathname
  if (isTwitter) return path === "/" || path === "/home" || path === "/following"
  if (isLinkedIn) return path === "/feed" || path.startsWith("/feed/")
  if (isReddit) return true
  return false
}

function getSelector(): string | null {
  if (isTwitter) return TWEET_SELECTOR
  if (isLinkedIn) {
    for (const sel of LINKEDIN_POST_SELECTORS) {
      if (document.querySelector(sel)) return sel
    }
    return LINKEDIN_POST_SELECTORS[0]
  }
  if (isReddit) return REDDIT_POST_SELECTOR
  return null
}

function extractPost(el: Element): ExtractedPost | null {
  if (isTwitter) return extractTweet(el)
  if (isLinkedIn) return extractLinkedInPost(el)
  if (isReddit) return extractRedditPost(el)
  return null
}

function getBoards(): Promise<Board[]> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_BOARDS" }, (res) => {
      resolve(res?.boards ?? [])
    })
  })
}

function createBoard(name: string): Promise<Board> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "CREATE_BOARD", payload: { name } }, (res) => {
      if (res?.success) resolve(res.board)
      else reject(new Error(res?.error ?? "Failed to create board"))
    })
  })
}

function saveInspiration(post: ExtractedPost, boardId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "SAVE_INSPIRATION",
        payload: {
          boardId,
          originalUrl: post.url,
          sourcePlatform: post.platform,
          content: post.content,
          authorName: post.authorName,
          authorHandle: post.authorHandle,
          authorAvatar: post.authorAvatar,
          thumbnailUrl: post.thumbnailUrl,
        },
      },
      (res) => {
        if (res?.success) resolve()
        else reject(new Error(res?.error ?? "Failed to save"))
      }
    )
  })
}

async function attachOverlay(postEl: Element) {
  if (!authed) return
  if (injected.has(postEl)) return
  injected.add(postEl)

  let overlayHost: HTMLElement | null = null
  let removeTimeout: ReturnType<typeof setTimeout> | null = null
  let popoverOpen = false

  function removeOverlay() {
    if (overlayHost) {
      overlayHost.remove()
      overlayHost = null
    }
    activeRemovers.delete(removeOverlay)
  }

  function positionHost() {
    if (!overlayHost) return
    const rect = (postEl as HTMLElement).getBoundingClientRect()
    overlayHost.style.top = `${rect.top + 8}px`
    overlayHost.style.right = `${window.innerWidth - rect.right + 8}px`
  }

  postEl.addEventListener("mouseenter", async () => {
    if (removeTimeout) clearTimeout(removeTimeout)

    // Already mounted — just re-position in case of layout shift
    if (overlayHost) {
      positionHost()
      return
    }

    const post = extractPost(postEl)
    if (!post) return

    const boards = await getBoards()
    const lastBoardId = await readUserScoped<string>(LAST_BOARD_KEY)

    // Mount in document.body to avoid X.com/LinkedIn overflow:hidden clipping
    // and React reconciliation removing our injected child nodes
    overlayHost = document.createElement("div")
    overlayHost.style.cssText = "position:fixed;z-index:2147483647;pointer-events:none;"
    document.body.appendChild(overlayHost)
    activeRemovers.add(removeOverlay)
    positionHost()

    const shadow = overlayHost.attachShadow({ mode: "open" })

    const style = document.createElement("style")
    style.textContent = `@keyframes cadence-spin { to { transform: rotate(360deg); } }`
    shadow.appendChild(style)

    const container = document.createElement("div")
    shadow.appendChild(container)

    createRoot(container).render(
      createElement(Overlay, {
        post,
        boards,
        lastBoardId,
        onSave: async (boardId: string) => {
          await writeUserScoped(LAST_BOARD_KEY, boardId)
          await saveInspiration(post, boardId)
        },
        onNewBoard: createBoard,
        onClose: removeOverlay,
        onPopoverChange: (open: boolean) => {
          popoverOpen = open
          if (open && removeTimeout) clearTimeout(removeTimeout)
        },
      })
    )

    overlayHost.addEventListener("mouseenter", () => {
      if (removeTimeout) clearTimeout(removeTimeout)
    })
    overlayHost.addEventListener("mouseleave", (e) => {
      if (popoverOpen) return
      const related = (e as MouseEvent).relatedTarget as Node | null
      if (related && postEl.contains(related)) return
      removeTimeout = setTimeout(removeOverlay, 300)
    })
  })

  postEl.addEventListener("mouseleave", (e) => {
    if (popoverOpen) return
    const related = (e as MouseEvent).relatedTarget as Node | null
    if (related && overlayHost && overlayHost.contains(related)) return
    removeTimeout = setTimeout(removeOverlay, 300)
  })
}

function scanAndAttach(root: Element | Document = document) {
  if (!authed) return
  if (!isOnFeedPage()) return
  const selector = getSelector()
  if (!selector) return
  root.querySelectorAll(selector).forEach(attachOverlay)
}

// Initial auth check + scan
;(async () => {
  authed = await isAuthenticated()
  if (authed) scanAndAttach()
})()

// React to login/logout in any tab without requiring a page reload
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[AUTH_STORAGE_KEY]) return
  ;(async () => {
    const nowAuthed = await isAuthenticated()
    if (nowAuthed === authed) return
    authed = nowAuthed
    if (authed) {
      injected = new WeakSet<Element>()
      scanAndAttach()
    } else {
      activeRemovers.forEach((fn) => fn())
      activeRemovers.clear()
      injected = new WeakSet<Element>()
    }
  })()
})

// Watch for new posts added to the DOM
const observer = new MutationObserver((mutations) => {
  if (!authed) return
  if (!isOnFeedPage()) return
  const selector = getSelector()
  if (!selector) return

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      const el = node as Element
      if (el.matches(selector)) attachOverlay(el)
      el.querySelectorAll(selector).forEach(attachOverlay)
    }
  }
})

observer.observe(document.body, { subtree: true, childList: true })

// --- SPA navigation handling ---
if (!(history.pushState as unknown as Record<string, boolean>).__cadencePatchd) {
  const _origPush = history.pushState.bind(history)
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    _origPush(...args)
    onNavigate()
  }
  ;(history.pushState as unknown as Record<string, boolean>).__cadencePatchd = true

  const _origReplace = history.replaceState.bind(history)
  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    _origReplace(...args)
    onNavigate()
  }
}

window.addEventListener("popstate", onNavigate)

function onNavigate() {
  if (!authed) return
  if (isOnFeedPage()) {
    scanAndAttach()
  }
}
