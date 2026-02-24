import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await db.socialAccount.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      platform: true,
      accountName: true,
      accountId: true,
      pageId: true,
      expiresAt: true,
      scopes: true,
      createdAt: true,
    },
  })

  return NextResponse.json(accounts)
}
