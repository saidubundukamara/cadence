import OpenAI from "openai"
import { db } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { Platform } from "@/generated/prisma/client"
import type { Inspiration, StyleMemory } from "@/generated/prisma/client"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PLATFORM_LABELS: Record<Platform, string> = {
  TWITTER: "X (Twitter)",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
}

interface SuggestionResult {
  content: string
  topic: string
  tone: string
  inspirationIds: string[]
}

export function buildSuggestionPrompt(
  inspirations: Inspiration[],
  styleMemory: StyleMemory | null,
  platform: Platform
): string {
  const label = PLATFORM_LABELS[platform]

  const styleSection = styleMemory
    ? `## Style Profile for ${label}
- Preferred tones: ${styleMemory.acceptedTones.join(", ") || "not yet established"}
- Tones to avoid: ${styleMemory.rejectedTones.join(", ") || "none"}
- Favourite topics: ${styleMemory.topTopics.join(", ") || "general"}
- Typical post length: ${styleMemory.avgPostLength ?? "flexible"} characters
- Uses emoji: ${styleMemory.usesEmoji}
- Uses hashtags: ${styleMemory.usesHashtags}

## Sample posts they liked:
${styleMemory.samplePosts.slice(0, 3).map((p, i) => `${i + 1}. "${p}"`).join("\n")}`
    : `## Style Profile for ${label}
- No style history yet — infer from the inspirations below`

  const inspirationSection = `## Recent inspirations they saved:
${inspirations.map((i) => `- [${i.sourcePlatform}] ${i.content?.slice(0, 200) ?? i.originalUrl}`).join("\n")}`

  return `${styleSection}

${inspirationSection}

Generate exactly 3 suggestions for ${label}.
Return: [{ "content": "...", "topic": "...", "tone": "...", "inspirationIds": [...] }]`
}

export async function generateSuggestionsForUser(
  userId: string,
  weekOf: Date
): Promise<void> {
  const [inspirations, styleMemories, connectedAccounts] = await Promise.all([
    db.inspiration.findMany({
      where: { userId },
      orderBy: { savedAt: "desc" },
      take: 30,
    }),
    db.styleMemory.findMany({ where: { userId } }),
    db.socialAccount.findMany({
      where: { userId },
      select: { platform: true },
    }),
  ])

  if (inspirations.length < 5 || connectedAccounts.length === 0) return

  const platforms = connectedAccounts.map((a) => a.platform)

  const systemPrompt = `You are a social media strategist for a content creator.
Analyze their saved inspirations and style history to generate 3 original post suggestions.
Return a JSON array only, no other text.`

  await Promise.allSettled(
    platforms.map(async (platform) => {
      const styleMemory = styleMemories.find((s) => s.platform === platform) ?? null
      const userPrompt = buildSuggestionPrompt(inspirations, styleMemory, platform)

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      })

      const raw = response.choices[0].message.content
      if (!raw) return

      // GPT returns a JSON object wrapping the array
      const parsed = JSON.parse(raw)
      const suggestions: SuggestionResult[] = Array.isArray(parsed)
        ? parsed
        : (parsed.suggestions ?? parsed.posts ?? Object.values(parsed)[0])

      if (!Array.isArray(suggestions)) return

      await db.suggestedPost.createMany({
        data: suggestions.slice(0, 3).map((s) => ({
          userId,
          platform,
          content: s.content,
          topic: s.topic ?? null,
          tone: s.tone ?? null,
          weekOf,
          inspirationIds: Array.isArray(s.inspirationIds) ? s.inspirationIds : [],
        })),
      })
    })
  )

  // Notify user that their weekly suggestions are ready
  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Your weekly suggestions are ready",
    message: "We've generated new post suggestions based on your saved inspirations. Head to Suggestions to review them.",
  })
}
