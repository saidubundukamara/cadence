import { Client } from "@upstash/qstash"

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function schedulePost(
  postId: string,
  scheduledAt: Date
): Promise<string> {
  const delay = Math.max(
    0,
    Math.floor((scheduledAt.getTime() - Date.now()) / 1000)
  )

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const res = await qstash.publishJSON({
    url: `${baseUrl}/api/publish`,
    body: { postId },
    delay,
    retries: 3,
  })

  return res.messageId
}

export async function cancelPost(qstashId: string): Promise<void> {
  try {
    await qstash.messages.delete(qstashId)
  } catch (error) {
    console.error("Failed to cancel QStash message:", error)
  }
}

export async function scheduleWeeklySuggestions(): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  await qstash.schedules.create({
    destination: `${baseUrl}/api/cron/suggestions`,
    cron: "0 6 * * 1",
    retries: 2,
  })
}
