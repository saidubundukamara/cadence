import type { ExtractedPost } from "../../lib/types"

export function extractLinkedInPost(el: Element): ExtractedPost | null {
  const postUrl = getPostUrl(el)
  if (!postUrl) return null

  const content =
    el.querySelector(".feed-shared-update-v2__description-wrapper")?.textContent?.trim() ??
    el.querySelector(".update-components-text")?.textContent?.trim() ??
    undefined

  const authorName =
    el.querySelector(".update-components-actor__name span[aria-hidden='true']")?.textContent?.trim() ??
    el.querySelector(".feed-shared-actor__name")?.textContent?.trim() ??
    undefined

  const authorHandle = undefined // LinkedIn doesn't always expose handles

  const avatarEl = el.querySelector(
    ".update-components-actor__avatar-image, .feed-shared-actor__avatar img"
  ) as HTMLImageElement | null
  const authorAvatar = avatarEl?.src ?? undefined

  const thumbnailEl = el.querySelector(
    ".feed-shared-image__image, .update-components-image__image"
  ) as HTMLImageElement | null
  const thumbnailUrl = thumbnailEl?.src ?? undefined

  return {
    url: postUrl,
    platform: "linkedin",
    content,
    authorName,
    authorHandle,
    authorAvatar,
    thumbnailUrl,
  }
}

function getPostUrl(el: Element): string | null {
  // Timestamp link is the most reliable permalink
  const timeLink = el.querySelector(
    "a.update-components-actor__sub-description-link, a[href*='/feed/update/']"
  ) as HTMLAnchorElement | null
  if (timeLink?.href) return timeLink.href

  const ugcLink = el.querySelector(
    "a[href*='ugcPost'], a[href*='activity']"
  ) as HTMLAnchorElement | null
  return ugcLink?.href ?? null
}

export const LINKEDIN_POST_SELECTOR = ".feed-shared-update-v2"
