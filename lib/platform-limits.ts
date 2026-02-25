import twitter from "twitter-text"
import type { Platform } from "@/types"

export const PLATFORM_LIMITS: Record<Platform, number> = {
  TWITTER: 280,
  INSTAGRAM: 2200,
  LINKEDIN: 3000,
  FACEBOOK: 63206,
  YOUTUBE: 5000,
}

export function getCharacterCount(content: string, platform: Platform): number {
  if (platform === "TWITTER") {
    return twitter.parseTweet(content).weightedLength
  }
  return content.length
}

export type CountStatus = "ok" | "warning" | "danger"

export function getCountStatus(count: number, limit: number): CountStatus {
  if (count > limit) return "danger"
  if (count >= limit * 0.9) return "warning"
  return "ok"
}
