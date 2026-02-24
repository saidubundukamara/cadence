import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { randomBytes } from "crypto"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if Instagram scopes are requested
  const { searchParams } = new URL(req.url)
  const includeInstagram = searchParams.get("instagram") === "true"

  const state = randomBytes(32).toString("hex")
  const cookieStore = await cookies()
  cookieStore.set("fb_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  })

  if (includeInstagram) {
    cookieStore.set("fb_include_instagram", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
      sameSite: "lax",
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  let scopes = "pages_manage_posts,pages_read_engagement,pages_show_list"
  if (includeInstagram) {
    scopes += ",instagram_basic,instagram_content_publish"
  }

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${baseUrl}/api/social/callback/facebook`,
    scope: scopes,
    state,
    response_type: "code",
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
  )
}
