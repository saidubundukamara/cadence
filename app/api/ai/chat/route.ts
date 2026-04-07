import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import OpenAI from "openai"
import { Redis } from "@upstash/redis"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const SYSTEM_PROMPT = `You are Cadence AI, a social media content assistant. You help users:

1. **Write posts** for Twitter/X (280 chars), Facebook, Instagram (2200 chars), LinkedIn (3000 chars), and YouTube.
2. **Refine content** - rewrite, change tone, shorten, expand, or adapt content.
3. **Extract content from URLs** - when given a URL, summarize the page and suggest social media posts about it.
4. **Split into threads** - break long content into Twitter thread format.
5. **Brainstorm ideas** - suggest post topics based on themes or industries.

Guidelines:
- Be concise and direct.
- When generating post content, format it ready to copy-paste.
- Label each platform clearly when generating multi-platform content.
- Respect platform character limits.
- When the user shares a URL, acknowledge it and create relevant social posts.`

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    })
  }

  // Rate limiting
  const rateLimitKey = `ai_rate_limit:${session.user.id}`
  const currentCount = (await redis.get<number>(rateLimitKey)) || 0
  if (currentCount >= 20) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again in an hour." }),
      { status: 429 }
    )
  }

  const { messages, extractUrl } = (await req.json()) as {
    messages: ChatMessage[]
    extractUrl?: string
  }

  // If a URL is provided, fetch its content and include it
  let urlContext = ""
  if (extractUrl) {
    try {
      const res = await fetch(extractUrl, {
        headers: { "User-Agent": "Cadence-Bot/1.0" },
      })
      const html = await res.text()
      // Extract text content (simple approach)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000)

      urlContext = `\n\n[Extracted content from ${extractUrl}]:\n${textContent}`
    } catch {
      urlContext = `\n\n[Could not fetch content from ${extractUrl}]`
    }
  }

  const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content + (m.role === "user" && urlContext ? urlContext : ""),
    })),
  ]

  // Only add URL context to the last user message
  if (urlContext && chatMessages.length > 1) {
    const lastMsg = chatMessages[chatMessages.length - 1]
    if (lastMsg.role === "user" && typeof lastMsg.content === "string") {
      lastMsg.content = lastMsg.content + urlContext
    }
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: chatMessages,
    stream: true,
    temperature: 0.7,
  })

  // Increment rate limit
  await redis.incr(rateLimitKey)
  if (currentCount === 0) {
    await redis.expire(rateLimitKey, 3600)
  }

  // Return streaming response
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
