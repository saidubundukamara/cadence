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
  const storedState = cookieStore.get("fb_oauth_state")?.value
  const includeInstagram =
    cookieStore.get("fb_include_instagram")?.value === "true"

  cookieStore.delete("fb_oauth_state")
  cookieStore.delete("fb_include_instagram")

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=invalid_state", baseUrl)
    )
  }

  try {
    // Exchange code for short-lived token
    const tokenUrl = new URL(
      "https://graph.facebook.com/v21.0/oauth/access_token"
    )
    tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!)
    tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!)
    tokenUrl.searchParams.set(
      "redirect_uri",
      `${baseUrl}/api/social/callback/facebook`
    )
    tokenUrl.searchParams.set("code", code)

    const tokenRes = await fetch(tokenUrl.toString())
    if (!tokenRes.ok) {
      console.error("FB token exchange failed:", await tokenRes.text())
      return NextResponse.redirect(
        new URL("/settings/connections?error=token_exchange", baseUrl)
      )
    }

    const { access_token: shortLivedToken } = await tokenRes.json()

    // Exchange for long-lived token
    const longLivedUrl = new URL(
      "https://graph.facebook.com/v21.0/oauth/access_token"
    )
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token")
    longLivedUrl.searchParams.set("client_id", process.env.META_APP_ID!)
    longLivedUrl.searchParams.set(
      "client_secret",
      process.env.META_APP_SECRET!
    )
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken)

    const longLivedRes = await fetch(longLivedUrl.toString())
    if (!longLivedRes.ok) {
      console.error(
        "FB long-lived token exchange failed:",
        await longLivedRes.text()
      )
      return NextResponse.redirect(
        new URL("/settings/connections?error=token_exchange", baseUrl)
      )
    }

    const { access_token: longLivedToken } = await longLivedRes.json()

    // Fetch user's pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`
    )
    if (!pagesRes.ok) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=pages_fetch", baseUrl)
      )
    }

    const { data: pages } = await pagesRes.json()

    if (!pages || pages.length === 0) {
      return NextResponse.redirect(
        new URL("/settings/connections?error=no_pages", baseUrl)
      )
    }

    // Use the first page (simplification)
    const page = pages[0]

    // Save Facebook connection
    await db.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "FACEBOOK",
        },
      },
      update: {
        accessToken: encrypt(longLivedToken),
        accountId: page.id,
        accountName: page.name,
        pageId: page.id,
        pageToken: encrypt(page.access_token),
        scopes: [
          "pages_manage_posts",
          "pages_read_engagement",
          "pages_show_list",
        ],
      },
      create: {
        userId: session.user.id,
        platform: "FACEBOOK",
        accessToken: encrypt(longLivedToken),
        accountId: page.id,
        accountName: page.name,
        pageId: page.id,
        pageToken: encrypt(page.access_token),
        scopes: [
          "pages_manage_posts",
          "pages_read_engagement",
          "pages_show_list",
        ],
      },
    })

    // If Instagram scopes were requested, try to connect Instagram too
    if (includeInstagram) {
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )
        const igData = await igRes.json()

        if (igData.instagram_business_account) {
          const igAccountId = igData.instagram_business_account.id

          // Fetch IG username
          const igProfileRes = await fetch(
            `https://graph.facebook.com/v21.0/${igAccountId}?fields=username&access_token=${page.access_token}`
          )
          const igProfile = await igProfileRes.json()

          await db.socialAccount.upsert({
            where: {
              userId_platform: {
                userId: session.user.id,
                platform: "INSTAGRAM",
              },
            },
            update: {
              accessToken: encrypt(longLivedToken),
              accountId: igAccountId,
              accountName: `@${igProfile.username || "instagram"}`,
              pageId: page.id,
              pageToken: encrypt(page.access_token),
              scopes: ["instagram_basic", "instagram_content_publish"],
            },
            create: {
              userId: session.user.id,
              platform: "INSTAGRAM",
              accessToken: encrypt(longLivedToken),
              accountId: igAccountId,
              accountName: `@${igProfile.username || "instagram"}`,
              pageId: page.id,
              pageToken: encrypt(page.access_token),
              scopes: ["instagram_basic", "instagram_content_publish"],
            },
          })
        }
      } catch (igError) {
        console.error("Instagram connection failed:", igError)
        // Continue - Facebook is still connected
      }
    }

    const connectedPlatforms = includeInstagram
      ? "facebook,instagram"
      : "facebook"
    return NextResponse.redirect(
      new URL(
        `/settings/connections?connected=${connectedPlatforms}`,
        baseUrl
      )
    )
  } catch (error) {
    console.error("Facebook OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/settings/connections?error=unknown", baseUrl)
    )
  }
}
