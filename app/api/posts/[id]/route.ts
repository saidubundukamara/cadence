import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schedulePost, cancelPost } from "@/lib/queue"
import { z } from "zod"
import { Platform } from "@/generated/prisma/client"

const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  scheduledAt: z.string().nullable().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  youtubeVideoId: z.string().nullable().optional(),
  isDraft: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
  platformContents: z
    .array(
      z.object({
        platform: z.nativeEnum(Platform),
        content: z.string(),
      })
    )
    .optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const post = await db.post.findFirst({
    where: { id, userId: session.user.id },
    include: { results: true, platformContents: true, tags: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const data = updatePostSchema.parse(body)

    const post = await db.post.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.status !== "PENDING" && post.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only edit pending or draft posts" },
        { status: 400 }
      )
    }

    const isDraft = data.isDraft ?? (post.status === "DRAFT")
    const isConvertingToScheduled = post.status === "DRAFT" && !isDraft

    // If converting from draft to scheduled, validate required fields
    if (isConvertingToScheduled) {
      const platforms = data.platforms ?? post.platforms
      const scheduledAt = data.scheduledAt
      if (!platforms || platforms.length === 0) {
        return NextResponse.json(
          { error: "Select at least one platform to schedule" },
          { status: 400 }
        )
      }
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        )
      }
    }

    // If rescheduling, cancel old QStash job and create new one
    const needsReschedule = !isDraft && data.scheduledAt && (
      !post.scheduledAt || data.scheduledAt !== post.scheduledAt.toISOString()
    )

    if (needsReschedule && post.qstashId) {
      await cancelPost(post.qstashId)
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.platforms && { platforms: data.platforms }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }),
        ...(data.mediaUrls && { mediaUrls: data.mediaUrls }),
        ...(data.youtubeVideoId !== undefined && { youtubeVideoId: data.youtubeVideoId }),
        status: isDraft ? "DRAFT" : "PENDING",
        ...(data.tagIds && {
          tags: { set: data.tagIds.map((tagId) => ({ id: tagId })) },
        }),
      },
    })

    // Upsert per-platform content if provided
    if (data.platformContents && data.platformContents.length > 0) {
      await Promise.all(
        data.platformContents.map((pc) =>
          db.postPlatformContent.upsert({
            where: { postId_platform: { postId: id, platform: pc.platform } },
            create: { postId: id, platform: pc.platform, content: pc.content },
            update: { content: pc.content },
          })
        )
      )
    }

    // Schedule via QStash when converting to scheduled or rescheduling
    if (needsReschedule || isConvertingToScheduled) {
      const scheduleTime = data.scheduledAt ? new Date(data.scheduledAt) : null
      if (scheduleTime) {
        try {
          const qstashId = await schedulePost(id, scheduleTime)
          await db.post.update({
            where: { id },
            data: { qstashId },
          })
        } catch (error) {
          console.error("QStash scheduling failed:", error)
        }
      }
    }

    const postWithContents = await db.post.findUnique({
      where: { id },
      include: { results: true, platformContents: true, tags: true },
    })

    return NextResponse.json(postWithContents)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const permanent = searchParams.get("permanent") === "true"

  const post = await db.post.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  // Cancel QStash job if pending (drafts don't have QStash jobs)
  if (post.status === "PENDING" && post.qstashId) {
    await cancelPost(post.qstashId)
  }

  if (permanent) {
    await db.post.delete({ where: { id } })
  } else {
    await db.post.update({
      where: { id },
      data: { status: "CANCELLED" },
    })
  }

  return NextResponse.json({ success: true })
}
