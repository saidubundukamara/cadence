import type { Platform, PostStatus } from "@/generated/prisma/client"

export type { Platform, PostStatus }

export type PostWithResults = {
  id: string
  userId: string
  content: string
  platforms: Platform[]
  scheduledAt: Date | null
  status: PostStatus
  mediaUrls: string[]
  aiGenerated: boolean
  qstashId: string | null
  youtubeVideoId: string | null
  createdAt: Date
  updatedAt: Date
  results: {
    id: string
    postId: string
    platform: Platform
    status: PostStatus
    platformPostId: string | null
    error: string | null
    publishedAt: Date | null
  }[]
  platformContents?: {
    id: string
    postId: string
    platform: Platform
    content: string
  }[]
  tags?: PostTag[]
}

export type SocialAccountInfo = {
  id: string
  platform: Platform
  accountName: string
  accountId: string
  pageId: string | null
  expiresAt: Date | null
  scopes: string[]
  createdAt: Date
}

export type CalendarPost = {
  id: string
  content: string
  platforms: Platform[]
  scheduledAt: string | null
  status: PostStatus
  mediaUrls: string[]
  aiGenerated: boolean
}

export type PostTag = {
  id: string
  name: string
  color: string
}

export type PostStats = {
  total: number
  published: number
  scheduled: number
  failed: number
}
