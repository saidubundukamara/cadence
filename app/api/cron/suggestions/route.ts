import { NextRequest, NextResponse } from "next/server"
import { Receiver } from "@upstash/qstash"
import { db } from "@/lib/db"
import { generateSuggestionsForUser } from "@/lib/suggestions"

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("upstash-signature")

  if (signature) {
    try {
      await receiver.verify({ signature, body })
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  // Monday 00:00:00 UTC of the current week
  const now = new Date()
  const day = now.getUTCDay()
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7))
  monday.setUTCHours(0, 0, 0, 0)

  // Eligible users: ≥5 inspirations AND ≥1 connected social account
  const eligible = await db.user.findMany({
    where: {
      inspirations: { some: {} },
      socialAccounts: { some: {} },
    },
    select: { id: true },
  })

  const userIds = eligible.map((u) => u.id)

  // Filter to those with ≥5 inspirations
  const counts = await Promise.all(
    userIds.map(async (id) => ({
      id,
      count: await db.inspiration.count({ where: { userId: id } }),
    }))
  )
  const eligibleIds = counts.filter((u) => u.count >= 5).map((u) => u.id)

  // Process in batches of 10
  const batchSize = 10
  for (let i = 0; i < eligibleIds.length; i += batchSize) {
    const batch = eligibleIds.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map((userId) => generateSuggestionsForUser(userId, monday))
    )
  }

  return NextResponse.json({ processed: eligibleIds.length, weekOf: monday.toISOString() })
}
