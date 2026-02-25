import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().max(50).optional(),
  defaultPostTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notifyOnPublish: z.boolean().optional(),
  notifyOnFail: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      timezone: true,
      defaultPostTime: true,
      notifyOnPublish: true,
      notifyOnFail: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ ...user, id: session.user.id })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.issues },
      { status: 400 }
    )
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: result.data,
    select: {
      name: true,
      email: true,
      timezone: true,
      defaultPostTime: true,
      notifyOnPublish: true,
      notifyOnFail: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}
