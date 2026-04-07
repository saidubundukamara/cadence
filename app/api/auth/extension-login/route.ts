import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { issueExtensionToken } from "@/lib/extension-auth"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    const user = await db.user.findUnique({ where: { email } })
    if (!user?.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { token, expiresAt } = await issueExtensionToken(user.id)

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: { name: user.name, email: user.email },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error("Extension login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
