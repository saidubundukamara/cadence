import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schedulePost } from "@/lib/queue"
import { z } from "zod"
import { Platform } from "@/generated/prisma/client"

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  platforms: z
    .array(z.nativeEnum(Platform))
    .min(1, "Select at least one platform"),
  scheduledAt: z.string().refine(
    (val) => new Date(val) > new Date(),
    "Scheduled time must be in the future"
  ),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  aiGenerated: z.boolean().optional().default(false),
  youtubeVideoId: z.string().optional(),
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

  const where: Record<string, unknown> = { userId: session.user.id }

  if (status && status !== "all") {
    where.status = status.toUpperCase()
  }

  if (from || to) {
    where.scheduledAt = {}
    if (from) (where.scheduledAt as Record<string, Date>).gte = new Date(from)
    if (to) (where.scheduledAt as Record<string, Date>).lte = new Date(to)
  }

  const posts = await db.post.findMany({
    where,
    include: { results: true },
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

    const post = await db.post.create({
      data: {
        userId: session.user.id,
        content: data.content,
        platforms: data.platforms,
        scheduledAt: new Date(data.scheduledAt),
        mediaUrls: data.mediaUrls,
        aiGenerated: data.aiGenerated,
        youtubeVideoId: data.youtubeVideoId,
      },
    })

    // Schedule via QStash
    try {
      const qstashId = await schedulePost(post.id, new Date(data.scheduledAt))
      await db.post.update({
        where: { id: post.id },
        data: { qstashId },
      })
    } catch (error) {
      console.error("QStash scheduling failed:", error)
      // Post is created but not queued - can be retried
    }

    return NextResponse.json(post, { status: 201 })
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
