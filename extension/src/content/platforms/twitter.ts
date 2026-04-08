import type { ExtractedPost } from "../../lib/types"

export function extractTweet(article: Element): ExtractedPost | null {
  const tweetUrl = getTweetUrl(article)
  if (!tweetUrl) return null

  const content =
    article.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ?? undefined

  const authorEl = article.querySelector('[data-testid="User-Name"]')
  const authorName = authorEl?.querySelector("span")?.textContent?.trim() ?? undefined
  const authorHandle =
    authorEl?.querySelectorAll("span")?.[3]?.textContent?.trim() ?? undefined

  const avatarEl = article.querySelector('img[src*="profile_images"]') as HTMLImageElement | null
  const authorAvatar = avatarEl?.src ?? undefined

  const thumbnailEl = article.querySelector(
    'img[src*="pbs.twimg.com/media"]'
  ) as HTMLImageElement | null
  const thumbnailUrl = thumbnailEl?.src ?? undefined

  return {
    url: tweetUrl,
    platform: "twitter",
    content,
    authorName,
    authorHandle,
    authorAvatar,
    thumbnailUrl,
  }
}

function getTweetUrl(article: Element): string | null {
  const timeEl = article.querySelector("time")
  const linkEl = timeEl?.closest("a") as HTMLAnchorElement | null
  if (linkEl?.href) return linkEl.href

  // Fallback: look for a status link
  const statusLink = article.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null
  return statusLink?.href ?? null
}

export const TWEET_SELECTOR = 'article[data-testid="tweet"]'
