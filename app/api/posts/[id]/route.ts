import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schedulePost, cancelPost } from "@/lib/queue"
import { z } from "zod"
import { Platform } from "@/generated/prisma/client"

const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  platforms: z.array(z.nativeEnum(Platform)).min(1).optional(),
  scheduledAt: z.string().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  youtubeVideoId: z.string().nullable().optional(),
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
    include: { results: true },
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

    if (post.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only edit pending posts" },
        { status: 400 }
      )
    }

    // If rescheduling, cancel old QStash job and create new one
    const needsReschedule = data.scheduledAt && data.scheduledAt !== post.scheduledAt.toISOString()

    if (needsReschedule && post.qstashId) {
      await cancelPost(post.qstashId)
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.platforms && { platforms: data.platforms }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.mediaUrls && { mediaUrls: data.mediaUrls }),
        ...(data.youtubeVideoId !== undefined && { youtubeVideoId: data.youtubeVideoId }),
      },
    })

    if (needsReschedule) {
      try {
        const qstashId = await schedulePost(
          id,
          new Date(data.scheduledAt!)
        )
        await db.post.update({
          where: { id },
          data: { qstashId },
        })
      } catch (error) {
        console.error("QStash rescheduling failed:", error)
      }
    }

    return NextResponse.json(updated)
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

  // Cancel QStash job if pending
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
