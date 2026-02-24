import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { schedulePost } from "@/lib/queue"
import { z } from "zod"
import { Platform } from "@/generated/prisma/client"

const importSchema = z.object({
  posts: z.array(
    z.object({
      content: z.string().min(1),
      platforms: z.array(z.nativeEnum(Platform)).min(1),
      scheduledAt: z.string(),
      mediaUrls: z.array(z.string()).optional().default([]),
    })
  ),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { posts } = importSchema.parse(body)

    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (const postData of posts) {
      try {
        const post = await db.post.create({
          data: {
            userId: session.user.id,
            content: postData.content,
            platforms: postData.platforms,
            scheduledAt: new Date(postData.scheduledAt),
            mediaUrls: postData.mediaUrls,
          },
        })

        try {
          const qstashId = await schedulePost(
            post.id,
            new Date(postData.scheduledAt)
          )
          await db.post.update({
            where: { id: post.id },
            data: { qstashId },
          })
        } catch {
          // Post is created but scheduling failed
        }

        imported++
      } catch (e) {
        failed++
        errors.push(
          `Failed to import: ${postData.content.substring(0, 50)}...`
        )
      }
    }

    return NextResponse.json({ imported, failed, errors })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    )
  }
}
