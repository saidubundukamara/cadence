import type { ExtractedPost } from "../../lib/types"

export function extractRedditPost(el: Element): ExtractedPost | null {
  // shreddit-post is a Web Component — attributes carry the data
  const postUrl = el.getAttribute("permalink")
    ? `https://www.reddit.com${el.getAttribute("permalink")}`
    : null

  if (!postUrl) return null

  const title = el.getAttribute("post-title") ?? undefined
  const bodyEl = el.querySelector("[slot='text-body']")
  const bodyText = bodyEl?.textContent?.trim() ?? undefined
  const content = title
    ? bodyText
      ? `${title}\n\n${bodyText}`
      : title
    : bodyText

  const authorName = el.getAttribute("author") ?? undefined
  const authorHandle = authorName ? `u/${authorName}` : undefined

  const subreddit = el.getAttribute("subreddit-prefixed-name") ?? undefined

  const thumbnailEl = el.querySelector(
    "img[src*='preview.redd.it'], img[src*='external-preview.redd.it']"
  ) as HTMLImageElement | null
  const thumbnailUrl = thumbnailEl?.src ?? undefined

  return {
    url: postUrl,
    platform: "reddit",
    content: subreddit ? `[${subreddit}] ${content ?? ""}`.trim() : content,
    authorName,
    authorHandle,
    thumbnailUrl,
  }
}

export const REDDIT_POST_SELECTOR = "shreddit-post"
