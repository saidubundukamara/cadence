export interface Board {
  id: string
  name: string
  description?: string | null
  coverImage?: string | null
  isDefault: boolean
  createdAt: string
  _count?: { inspirations: number }
}

export interface Inspiration {
  id: string
  userId: string
  boardId: string
  originalUrl: string
  sourcePlatform: "twitter" | "linkedin" | "reddit"
  content?: string | null
  authorName?: string | null
  authorHandle?: string | null
  authorAvatar?: string | null
  thumbnailUrl?: string | null
  note?: string | null
  savedAt: string
}

export interface AuthState {
  token: string
  expiresAt: string
  user: { name: string | null; email: string }
  cadenceUrl: string
}

export interface SaveInspirationPayload {
  boardId: string
  originalUrl: string
  sourcePlatform: "twitter" | "linkedin" | "reddit"
  content?: string
  authorName?: string
  authorHandle?: string
  authorAvatar?: string
  thumbnailUrl?: string
}

export type Platform = "TWITTER" | "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE"

export interface SuggestedPost {
  id: string
  userId: string
  platform: Platform
  content: string
  topic?: string | null
  tone?: string | null
  weekOf: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "PUBLISHED"
  inspirationIds: string[]
  acceptedAt?: string | null
  rejectedAt?: string | null
  convertedPostId?: string | null
  createdAt: string
}

export type ExtractedPost = {
  url: string
  platform: "twitter" | "linkedin" | "reddit"
  content?: string
  authorName?: string
  authorHandle?: string
  authorAvatar?: string
  thumbnailUrl?: string
}
