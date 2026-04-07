import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const media = await db.media.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 })
  }

  await db.media.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
