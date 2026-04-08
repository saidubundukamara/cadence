import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/api-auth"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const boards = await db.board.findMany({
    where: { userId },
    include: { _count: { select: { inspirations: true } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })

  return NextResponse.json(boards)
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Auto-create a Default board if this is the first request and none exist
    const existingCount = await db.board.count({ where: { userId } })
    if (existingCount === 0) {
      await db.board.create({
        data: { userId, name: "Default", isDefault: true },
      })
    }

    const board = await db.board.create({
      data: { userId, name: data.name, description: data.description },
      include: { _count: { select: { inspirations: true } } },
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error("Create board error:", error)
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 })
  }
}
