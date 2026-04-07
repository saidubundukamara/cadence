import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { createPasswordResetToken } from "@/lib/tokens"
import { sendPasswordResetEmail } from "@/lib/email"

const schema = z.object({
  email: z.string().email("Invalid email"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const user = await db.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, you'll receive a password reset link.",
      })
    }

    const resetToken = await createPasswordResetToken(email)
    await sendPasswordResetEmail(email, resetToken.token)

    return NextResponse.json({
      message: "If an account exists with this email, you'll receive a password reset link.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
