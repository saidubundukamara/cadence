import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { randomBytes, createHash } from "crypto"
import { cookies } from "next/headers"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = randomBytes(32).toString("hex")
  const codeVerifier = randomBytes(32).toString("base64url")
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url")

  const cookieStore = await cookies()
  cookieStore.set("twitter_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  })
  cookieStore.set("twitter_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  })

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/social/callback/twitter`,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })

  return NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  )
}
