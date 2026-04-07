import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/api-auth"

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

  await db.suggestedPost.update({
    where: { id },
    data: { status: "REJECTED", rejectedAt: new Date() },
  })

  // Append tone to StyleMemory.rejectedTones
  if (suggestion.tone) {
    const existing = await db.styleMemory.findUnique({
      where: { userId_platform: { userId, platform: suggestion.platform } },
    })

    const newRejectedTones = [
      ...new Set([...(existing?.rejectedTones ?? []), suggestion.tone]),
    ].slice(-20)

    await db.styleMemory.upsert({
      where: { userId_platform: { userId, platform: suggestion.platform } },
      create: {
        userId,
        platform: suggestion.platform,
        acceptedTones: [],
        rejectedTones: newRejectedTones,
        topTopics: [],
        samplePosts: [],
      },
      update: { rejectedTones: newRejectedTones },
    })
  }

  return NextResponse.json({ success: true })
}
