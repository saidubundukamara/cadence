import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateContent } from "@/lib/openai"
import { Redis } from "@upstash/redis"
import { z } from "zod"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const generateSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  tone: z.string().default("professional"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  existingContent: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting: 20 requests per hour per user
  const rateLimitKey = `ai_rate_limit:${session.user.id}`
  const currentCount = (await redis.get<number>(rateLimitKey)) || 0

  if (currentCount >= 20) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in an hour." },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const data = generateSchema.parse(body)

    const content = await generateContent(
      data.topic,
      data.tone,
      data.platforms,
      data.existingContent
    )

    // Increment rate limit counter
    await redis.incr(rateLimitKey)
    if (currentCount === 0) {
      await redis.expire(rateLimitKey, 3600) // 1 hour TTL
    }

    return NextResponse.json(content)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("AI generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    )
  }
}
