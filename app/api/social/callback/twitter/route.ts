import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  const cookieStore = await cookies()
  const storedState = cookieStore.get("twitter_oauth_state")?.value
  const codeVerifier = cookieStore.get("twitter_code_verifier")?.value

  cookieStore.delete("twitter_oauth_state")
  cookieStore.delete("twitter_code_verifier")

  if (!code || !state || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=invalid_state", baseUrl)
    )
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/social/callback/twitter`,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error("Twitter token exchange failed:", err)
      return NextResponse.redirect(
        new URL("/settings/connections?error=token_exchange", baseUrl)
      )
    }

    const tokens = await tokenRes.json()

    // Fetch user profile
    const userRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=profile_fetch", baseUrl)
      )
    }

    const { data: twitterUser } = await userRes.json()

    // Calculate expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Encrypt tokens and upsert social account
    await db.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "TWITTER",
        },
      },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        accountId: twitterUser.id,
        accountName: `@${twitterUser.username}`,
        expiresAt,
        scopes: tokens.scope?.split(" ") ?? [],
      },
      create: {
        userId: session.user.id,
        platform: "TWITTER",
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        accountId: twitterUser.id,
        accountName: `@${twitterUser.username}`,
        expiresAt,
        scopes: tokens.scope?.split(" ") ?? [],
      },
    })

    return NextResponse.redirect(
      new URL("/settings/connections?connected=twitter", baseUrl)
    )
  } catch (error) {
    console.error("Twitter OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/settings/connections?error=unknown", baseUrl)
    )
  }
}
