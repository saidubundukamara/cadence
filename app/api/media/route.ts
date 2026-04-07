import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createMediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  filename: z.string().optional(),
  size: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  const where: Record<string, unknown> = { userId: session.user.id }
  if (type && type !== "all") {
    where.type = type.toUpperCase()
  }

  const [media, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.media.count({ where }),
  ])

  return NextResponse.json({ media, total })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createMediaSchema.parse(body)

    const media = await db.media.create({
      data: {
        userId: session.user.id,
        url: data.url,
        type: data.type,
        filename: data.filename,
        size: data.size,
        width: data.width,
        height: data.height,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to save media" },
      { status: 500 }
    )
  }
}
