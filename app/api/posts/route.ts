import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schedulePost } from "@/lib/queue"
import { z } from "zod"
import { Platform } from "@/generated/prisma/client"

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  platforms: z.array(z.nativeEnum(Platform)).optional().default([]),
  scheduledAt: z.string().nullable().optional(),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  aiGenerated: z.boolean().optional().default(false),
  youtubeVideoId: z.string().nullable().optional(),
  isDraft: z.boolean().optional().default(false),
  tagIds: z.array(z.string()).optional().default([]),
  platformContents: z
    .array(
      z.object({
        platform: z.nativeEnum(Platform),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const tagId = searchParams.get("tagId")

  const where: Record<string, unknown> = { userId: session.user.id }

  if (status && status !== "all") {
    where.status = status.toUpperCase()
  }

  if (from || to) {
    where.scheduledAt = {}
    if (from) (where.scheduledAt as Record<string, Date>).gte = new Date(from)
    if (to) (where.scheduledAt as Record<string, Date>).lte = new Date(to)
  }

  if (tagId) {
    where.tags = { some: { id: tagId } }
  }

  const posts = await db.post.findMany({
    where,
    include: { results: true, platformContents: true, tags: true },
    orderBy: { scheduledAt: "asc" },
  })

  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createPostSchema.parse(body)
    const isDraft = data.isDraft

    // For scheduled posts, validate platforms and scheduledAt
    if (!isDraft) {
      if (data.platforms.length === 0) {
        return NextResponse.json(
          { error: "Select at least one platform" },
          { status: 400 }
        )
      }
      if (!data.scheduledAt || new Date(data.scheduledAt) <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        )
      }

      // Verify user has connected accounts for each platform
      const connectedAccounts = await db.socialAccount.findMany({
        where: { userId: session.user.id },
        select: { platform: true },
      })
      const connectedPlatforms = new Set(connectedAccounts.map((a) => a.platform))

      const missingPlatforms = data.platforms.filter(
        (p) => !connectedPlatforms.has(p)
      )
      if (missingPlatforms.length > 0) {
        return NextResponse.json(
          {
            error: `Not connected to: ${missingPlatforms.join(", ")}. Connect in Settings > Connections.`,
          },
          { status: 400 }
        )
      }
    }

    const mediaRecords = data.mediaUrls.length > 0
      ? await db.media.findMany({
          where: { userId: session.user.id, url: { in: data.mediaUrls } },
          select: { id: true },
        })
      : []

    const post = await db.post.create({
      data: {
        userId: session.user.id,
        content: data.content,
        platforms: data.platforms,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: isDraft ? "DRAFT" : "PENDING",
        mediaUrls: data.mediaUrls,
        aiGenerated: data.aiGenerated,
        youtubeVideoId: data.youtubeVideoId,
        ...(data.tagIds.length > 0 && {
          tags: { connect: data.tagIds.map((id) => ({ id })) },
        }),
        ...(mediaRecords.length > 0 && {
          media: { connect: mediaRecords.map((m) => ({ id: m.id })) },
        }),
      },
    })

    // Save per-platform content if provided
    if (data.platformContents.length > 0) {
      await db.postPlatformContent.createMany({
        data: data.platformContents.map((pc) => ({
          postId: post.id,
          platform: pc.platform,
          content: pc.content,
        })),
      })
    }

    // Schedule via QStash only for non-draft posts
    if (!isDraft && data.scheduledAt) {
      try {
        const qstashId = await schedulePost(post.id, new Date(data.scheduledAt))
        await db.post.update({
          where: { id: post.id },
          data: { qstashId },
        })
      } catch (error) {
        console.error("QStash scheduling failed:", error)
      }
    }

    const postWithContents = await db.post.findUnique({
      where: { id: post.id },
      include: { results: true, platformContents: true, tags: true },
    })

    return NextResponse.json(postWithContents, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Create post error:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}
