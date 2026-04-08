import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/api-auth"

const schema = z.object({
  createPost: z.boolean().optional().default(false),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const suggestion = await db.suggestedPost.findUnique({ where: { id } })
  if (!suggestion || suggestion.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (suggestion.status !== "PENDING") {
    return NextResponse.json({ error: "Suggestion already actioned" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const { createPost } = schema.parse(body)

  // 1. Mark accepted
  await db.suggestedPost.update({
    where: { id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  })

  // 2. Upsert StyleMemory
  const existing = await db.styleMemory.findUnique({
    where: { userId_platform: { userId, platform: suggestion.platform } },
  })

  const newSamplePosts = suggestion.content
    ? [suggestion.content, ...(existing?.samplePosts ?? [])].slice(0, 10)
    : (existing?.samplePosts ?? [])

  const newAcceptedTones =
    suggestion.tone
      ? [...new Set([...(existing?.acceptedTones ?? []), suggestion.tone])].slice(-20)
      : (existing?.acceptedTones ?? [])

  const newTopTopics =
    suggestion.topic
      ? [...new Set([...(existing?.topTopics ?? []), suggestion.topic])].slice(-20)
      : (existing?.topTopics ?? [])

  const avgPostLength =
    newSamplePosts.length > 0
      ? Math.round(newSamplePosts.reduce((sum, p) => sum + p.length, 0) / newSamplePosts.length)
      : (existing?.avgPostLength ?? null)

  await db.styleMemory.upsert({
    where: { userId_platform: { userId, platform: suggestion.platform } },
    create: {
      userId,
      platform: suggestion.platform,
      acceptedTones: newAcceptedTones,
      rejectedTones: existing?.rejectedTones ?? [],
      topTopics: newTopTopics,
      avgPostLength,
      samplePosts: newSamplePosts,
    },
    update: {
      acceptedTones: newAcceptedTones,
      topTopics: newTopTopics,
      avgPostLength,
      samplePosts: newSamplePosts,
    },
  })

  // 3. Optionally create a draft Post
  let postId: string | null = null
  if (createPost) {
    const post = await db.post.create({
      data: {
        userId,
        content: suggestion.content,
        platforms: [suggestion.platform],
        status: "DRAFT",
        aiGenerated: true,
        mediaUrls: [],
      },
    })
    postId = post.id

    await db.suggestedPost.update({
      where: { id },
      data: { convertedPostId: postId },
    })
  }

  return NextResponse.json({ success: true, ...(postId ? { postId } : {}) })
}
