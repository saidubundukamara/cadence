import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/api-auth"

const createSchema = z.object({
  boardId: z.string().min(1),
  originalUrl: z.string().url(),
  sourcePlatform: z.enum(["twitter", "linkedin", "reddit"]),
  content: z.string().optional(),
  authorName: z.string().optional(),
  authorHandle: z.string().optional(),
  authorAvatar: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  note: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get("boardId")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
  const skip = (page - 1) * limit

  const where = {
    userId,
    ...(boardId ? { boardId } : {}),
  }

  const [inspirations, total] = await Promise.all([
    db.inspiration.findMany({
      where,
      orderBy: { savedAt: "desc" },
      skip,
      take: limit,
      include: { board: { select: { id: true, name: true } } },
    }),
    db.inspiration.count({ where }),
  ])

  return NextResponse.json({ inspirations, total, page, limit })
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUser(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Verify board ownership
    const board = await db.board.findUnique({ where: { id: data.boardId } })
    if (!board || board.userId !== userId) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const inspiration = await db.inspiration.create({
      data: { userId, ...data },
      include: { board: { select: { id: true, name: true } } },
    })

    // Set board cover image if not already set
    if (!board.coverImage && data.thumbnailUrl) {
      await db.board.update({
        where: { id: data.boardId },
        data: { coverImage: data.thumbnailUrl },
      })
    }

    return NextResponse.json(inspiration, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error("Create inspiration error:", error)
    return NextResponse.json({ error: "Failed to save inspiration" }, { status: 500 })
  }
}
