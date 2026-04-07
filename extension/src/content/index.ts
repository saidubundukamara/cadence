import { createRoot } from "react-dom/client"
import { createElement } from "react"
import { Overlay } from "./overlay"
import { extractTweet, TWEET_SELECTOR } from "./platforms/twitter"
import { extractLinkedInPost, LINKEDIN_POST_SELECTOR } from "./platforms/linkedin"
import { extractRedditPost, REDDIT_POST_SELECTOR } from "./platforms/reddit"
import type { Board, ExtractedPost } from "../lib/types"

const LAST_BOARD_KEY = "cadence_last_board_id"

const hostname = window.location.hostname
const isTwitter = hostname === "twitter.com" || hostname === "x.com"
const isLinkedIn = hostname === "www.linkedin.com"
const isReddit = hostname === "www.reddit.com"

function getSelector(): string | null {
  if (isTwitter) return TWEET_SELECTOR
  if (isLinkedIn) return LINKEDIN_POST_SELECTOR
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

const injected = new WeakSet<Element>()

async function attachOverlay(postEl: Element) {
  if (injected.has(postEl)) return
  injected.add(postEl)

  let overlayHost: HTMLElement | null = null
  let removeTimeout: ReturnType<typeof setTimeout> | null = null

  function removeOverlay() {
    if (overlayHost) {
      overlayHost.remove()
      overlayHost = null
    }
  }

  postEl.addEventListener("mouseenter", async () => {
    if (removeTimeout) clearTimeout(removeTimeout)
    if (overlayHost) return

    const post = extractPost(postEl)
    if (!post) return

    const boards = await getBoards()
    const stored = await chrome.storage.local.get(LAST_BOARD_KEY)
    const lastBoardId = (stored[LAST_BOARD_KEY] as string) ?? null

    // Mount into shadow DOM
    overlayHost = document.createElement("div")
    ;(postEl as HTMLElement).style.position = "relative"
    postEl.appendChild(overlayHost)

    const shadow = overlayHost.attachShadow({ mode: "open" })
    const container = document.createElement("div")
    shadow.appendChild(container)

    const root = createRoot(container)
    root.render(
      createElement(Overlay, {
        post,
        boards,
        lastBoardId,
        onSave: async (boardId: string) => {
          await chrome.storage.local.set({ [LAST_BOARD_KEY]: boardId })
          await saveInspiration(post, boardId)
        },
        onNewBoard: createBoard,
        onClose: removeOverlay,
      })
    )
  })

  postEl.addEventListener("mouseleave", (e) => {
    const related = (e as MouseEvent).relatedTarget as Node | null
    if (overlayHost && related && overlayHost.contains(related)) return
    removeTimeout = setTimeout(removeOverlay, 300)
  })
}

function scanAndAttach(root: Element | Document = document) {
  const selector = getSelector()
  if (!selector) return
  root.querySelectorAll(selector).forEach(attachOverlay)
}

// Initial scan
scanAndAttach()

// Watch for new posts added to the DOM
const observer = new MutationObserver((mutations) => {
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
