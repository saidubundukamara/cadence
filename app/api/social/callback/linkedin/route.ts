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
  const storedState = cookieStore.get("linkedin_oauth_state")?.value

  cookieStore.delete("linkedin_oauth_state")

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=invalid_state", baseUrl)
    )
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: `${baseUrl}/api/social/callback/linkedin`,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      }
    )

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error("LinkedIn token exchange failed:", err)
      return NextResponse.redirect(
        new URL("/settings/connections?error=token_exchange", baseUrl)
      )
    }

    const tokens = await tokenRes.json()

    // Fetch user profile using OpenID Connect userinfo
    const profileRes = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    )

    if (!profileRes.ok) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=profile_fetch", baseUrl)
      )
    }

    const profile = await profileRes.json()

    // Calculate expiry
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null

    // Encrypt tokens and upsert social account
    await db.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "LINKEDIN",
        },
      },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        accountId: profile.sub,
        accountName: profile.name || profile.email || "LinkedIn User",
        expiresAt,
        scopes: tokens.scope?.split(" ") ?? [],
      },
      create: {
        userId: session.user.id,
        platform: "LINKEDIN",
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        accountId: profile.sub,
        accountName: profile.name || profile.email || "LinkedIn User",
        expiresAt,
        scopes: tokens.scope?.split(" ") ?? [],
      },
    })

    return NextResponse.redirect(
      new URL("/settings/connections?connected=linkedin", baseUrl)
    )
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/settings/connections?error=unknown", baseUrl)
    )
  }
}
