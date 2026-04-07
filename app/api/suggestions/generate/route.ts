import { NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { getAuthUser } from "@/lib/api-auth"
import { generateSuggestionsForUser } from "@/lib/suggestions"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const RATE_LIMIT_TTL = 24 * 60 * 60 // 24 hours in seconds

export async function POST(req: NextRequest) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const key = `suggestions:generate:${userId}`
  const existing = await redis.get(key)
  if (existing) {
    return NextResponse.json(
      { error: "You can only generate suggestions once per 24 hours" },
      { status: 429 }
    )
  }

  // Monday of the current week
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  try {
    await generateSuggestionsForUser(userId, monday)
    await redis.set(key, "1", { ex: RATE_LIMIT_TTL })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Manual generate error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
