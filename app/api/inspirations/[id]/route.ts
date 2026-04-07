import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/api-auth"

const updateSchema = z.object({
  note: z.string().max(500).nullable().optional(),
  boardId: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const inspiration = await db.inspiration.findUnique({ where: { id } })
  if (!inspiration || inspiration.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    // Verify new board ownership if moving boards
    if (data.boardId) {
      const board = await db.board.findUnique({ where: { id: data.boardId } })
      if (!board || board.userId !== userId) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 })
      }
    }

    const updated = await db.inspiration.update({
      where: { id },
      data,
      include: { board: { select: { id: true, name: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update inspiration" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const inspiration = await db.inspiration.findUnique({ where: { id } })
  if (!inspiration || inspiration.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.inspiration.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
