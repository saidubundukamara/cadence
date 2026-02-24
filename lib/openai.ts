import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const platformPrompts: Record<string, string> = {
  TWITTER:
    "Write a tweet (max 280 characters). Be punchy, use hashtags where appropriate. No markdown. No emojis unless they fit naturally.",
  FACEBOOK:
    "Write a Facebook post. Longer form, engaging, can include a call to action. Can be multiple paragraphs.",
  INSTAGRAM:
    "Write an Instagram caption (max 2200 characters). Caption style with heavy use of relevant hashtags. Emoji-friendly. Include line breaks for readability.",
}

export async function generateContent(
  topic: string,
  tone: string,
  platforms: string[],
  existingContent?: string
): Promise<Record<string, string>> {
  const platformInstructions = platforms
    .map(
      (p) =>
        `For ${p}:\n${platformPrompts[p] || "Write engaging social media content."}`
    )
    .join("\n\n")

  const systemPrompt = `You are a social media content creator. Generate platform-specific content based on the user's brief.

Tone: ${tone}

${platformInstructions}

Return a JSON object with platform names as keys and the generated content as values.
Example: { "TWITTER": "tweet text", "FACEBOOK": "facebook post text" }
Only include platforms the user requested. Return ONLY valid JSON, no markdown.`

  const userPrompt = existingContent
    ? `Topic: ${topic}\n\nAdapt this existing content for the platforms:\n${existingContent}`
    : `Topic: ${topic}`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("No content generated")

  return JSON.parse(content)
}
