import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateTagSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const data = updateTagSchema.parse(body)

    const tag = await db.tag.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    const updated = await db.tag.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Tag with this name already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const tag = await db.tag.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 })
  }

  await db.tag.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
