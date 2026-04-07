import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing-token", req.url))
  }

  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
  }

  if (verificationToken.expiresAt < new Date()) {
    await db.verificationToken.delete({ where: { id: verificationToken.id } })
    return NextResponse.redirect(new URL("/login?error=expired-token", req.url))
  }

  // Mark user as verified
  await db.user.update({
    where: { email: verificationToken.email },
    data: { emailVerified: new Date() },
  })

  // Clean up token
  await db.verificationToken.delete({ where: { id: verificationToken.id } })

  return NextResponse.redirect(new URL("/login?verified=true", req.url))
}
