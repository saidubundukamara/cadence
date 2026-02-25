import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { randomBytes } from "crypto"
import { cookies } from "next/headers"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = randomBytes(32).toString("hex")

  const cookieStore = await cookies()
  cookieStore.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  })

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/social/callback/linkedin`,
    scope: "openid profile email w_member_social",
    state,
  })

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  )
}
