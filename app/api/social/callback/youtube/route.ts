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
  const storedState = cookieStore.get("youtube_oauth_state")?.value

  cookieStore.delete("youtube_oauth_state")

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=invalid_state", baseUrl)
    )
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/social/callback/youtube`,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error("YouTube token exchange failed:", err)
      return NextResponse.redirect(
        new URL("/settings/connections?error=token_exchange", baseUrl)
      )
    }

    const tokens = await tokenRes.json()

    // Fetch YouTube channel info
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    )

    if (!channelRes.ok) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=channel_fetch", baseUrl)
      )
    }

    const channelData = await channelRes.json()

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=no_channel", baseUrl)
      )
    }

    const channel = channelData.items[0]
    const channelId = channel.id
    const channelTitle = channel.snippet?.title || "YouTube Channel"

    // Calculate expiry
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null

    // Encrypt tokens and upsert social account
    await db.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "YOUTUBE",
        },
      },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : undefined,
        accountId: channelId,
        accountName: channelTitle,
        expiresAt,
        scopes: tokens.scope?.split(" ") ?? [],
      },
      create: {
        userId: session.user.id,
        platform: "YOUTUBE",
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        accountId: channelId,
        accountName: channelTitle,
        expiresAt,
        scopes: tokens.scope?.split(" ") ?? [],
      },
    })

    return NextResponse.redirect(
      new URL("/settings/connections?connected=youtube", baseUrl)
    )
  } catch (error) {
    console.error("YouTube OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/settings/connections?error=unknown", baseUrl)
    )
  }
}
