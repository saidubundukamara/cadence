import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unread") === "true"
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

  const where: Record<string, unknown> = { userId: session.user.id }
  if (unreadOnly) {
    where.read = false
  }

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { ids, all } = body as { ids?: string[]; all?: boolean }

  if (all) {
    await db.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    })
  } else if (ids && ids.length > 0) {
    await db.notification.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { read: true },
    })
  }

  return NextResponse.json({ success: true })
}
