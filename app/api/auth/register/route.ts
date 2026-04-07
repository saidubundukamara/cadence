import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { createVerificationToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/email"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: { name, email, password: hashedPassword },
    })

    // Send verification email
    try {
      const verificationToken = await createVerificationToken(email)
      await sendVerificationEmail(email, verificationToken.token)
    } catch (error) {
      console.error("Failed to send verification email:", error)
    }

    return NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email },
        message: "Account created. Please check your email to verify your account.",
      },
      { status: 201 }
    )
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
