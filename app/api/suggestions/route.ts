import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/api-auth"
import { Platform, SuggestionStatus } from "@/generated/prisma/client"

export async function GET(req: NextRequest) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const weekOf = searchParams.get("weekOf")
  const platform = searchParams.get("platform") as Platform | null
  const status = searchParams.get("status") as SuggestionStatus | null

  const where: Record<string, unknown> = { userId }
  if (weekOf) where.weekOf = new Date(weekOf)
  if (platform) where.platform = platform
  if (status) where.status = status

  const suggestions = await db.suggestedPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(suggestions)
}
