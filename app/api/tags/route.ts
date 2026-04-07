import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#6366f1"),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tags = await db.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  })

  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createTagSchema.parse(body)

    const tag = await db.tag.create({
      data: {
        name: data.name,
        color: data.color,
        userId: session.user.id,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    // Unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Tag with this name already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    )
  }
}
