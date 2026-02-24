import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { Platform } from "@/generated/prisma/client"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { platform } = await params
  const platformUpper = platform.toUpperCase() as Platform

  if (!["TWITTER", "FACEBOOK", "INSTAGRAM"].includes(platformUpper)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
  }

  try {
    const account = await db.socialAccount.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: platformUpper,
        },
      },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Attempt to revoke token (best-effort)
    try {
      const accessToken = decrypt(account.accessToken)

      if (platformUpper === "TWITTER") {
        await fetch("https://api.twitter.com/2/oauth2/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            token: accessToken,
            token_type_hint: "access_token",
          }),
        })
      } else if (
        platformUpper === "FACEBOOK" ||
        platformUpper === "INSTAGRAM"
      ) {
        await fetch(
          `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`,
          { method: "DELETE" }
        )
      }
    } catch {
      // Token revocation is best-effort
    }

    // Delete the social account
    await db.socialAccount.delete({
      where: { id: account.id },
    })

    // Cancel pending posts targeting only this platform
    const pendingPosts = await db.post.findMany({
      where: {
        userId: session.user.id,
        status: "PENDING",
        platforms: { has: platformUpper },
      },
    })

    for (const post of pendingPosts) {
      if (
        post.platforms.length === 1 &&
        post.platforms[0] === platformUpper
      ) {
        await db.post.update({
          where: { id: post.id },
          data: { status: "CANCELLED" },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Disconnect error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    )
  }
}
