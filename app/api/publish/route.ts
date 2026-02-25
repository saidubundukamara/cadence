import { NextRequest, NextResponse } from "next/server"
import { Receiver } from "@upstash/qstash"
import { db } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { getValidToken } from "@/lib/social/tokenRefresh"
import { publishToTwitter } from "@/lib/social/twitter"
import { publishToFacebook } from "@/lib/social/facebook"
import { publishToInstagram } from "@/lib/social/instagram"
import { publishToLinkedIn } from "@/lib/social/linkedin"
import { publishToYouTube } from "@/lib/social/youtube"

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

export async function POST(req: NextRequest) {
  // Verify QStash signature
  const body = await req.text()
  const signature = req.headers.get("upstash-signature")

  if (signature) {
    try {
      await receiver.verify({
        signature,
        body,
      })
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  const { postId } = JSON.parse(body)

  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 })
  }

  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          include: { socialAccounts: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.status !== "PENDING") {
      return NextResponse.json({ error: "Post already processed" }, { status: 400 })
    }

    const results: { platform: string; success: boolean; postId?: string; error?: string }[] = []

    for (const platform of post.platforms) {
      const account = post.user.socialAccounts.find(
        (a) => a.platform === platform
      )

      if (!account) {
        results.push({
          platform,
          success: false,
          error: `No ${platform} account connected`,
        })
        continue
      }

      try {
        // Get valid (refreshed if needed) token
        const accessToken = await getValidToken(account)
        let result

        switch (platform) {
          case "TWITTER":
            result = await publishToTwitter(
              post.content,
              post.mediaUrls,
              accessToken
            )
            break
          case "FACEBOOK":
            if (!account.pageId || !account.pageToken) {
              result = { error: "Missing Facebook Page configuration" }
              break
            }
            result = await publishToFacebook(
              post.content,
              post.mediaUrls,
              account.pageId,
              decrypt(account.pageToken)
            )
            break
          case "INSTAGRAM":
            if (!account.pageToken) {
              result = { error: "Missing Instagram configuration" }
              break
            }
            result = await publishToInstagram(
              post.content,
              post.mediaUrls,
              account.accountId,
              decrypt(account.pageToken)
            )
            break
          case "LINKEDIN":
            result = await publishToLinkedIn(
              post.content,
              post.mediaUrls,
              accessToken,
              account.accountId
            )
            break
          case "YOUTUBE":
            result = await publishToYouTube(
              post.content,
              post.youtubeVideoId,
              accessToken
            )
            break
        }

        // Create PostResult record
        await db.postResult.create({
          data: {
            postId: post.id,
            platform,
            status: result?.error ? "FAILED" : "PUBLISHED",
            platformPostId: result?.platformPostId || null,
            error: result?.error || null,
            publishedAt: result?.error ? null : new Date(),
          },
        })

        results.push({
          platform,
          success: !result?.error,
          postId: result?.platformPostId,
          error: result?.error,
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error"

        await db.postResult.create({
          data: {
            postId: post.id,
            platform,
            status: "FAILED",
            error: message,
          },
        })

        results.push({ platform, success: false, error: message })
      }
    }

    // Update post status
    const allSucceeded = results.every((r) => r.success)
    const anyFailed = results.some((r) => !r.success)

    await db.post.update({
      where: { id: post.id },
      data: {
        status: allSucceeded ? "PUBLISHED" : anyFailed ? "FAILED" : "PUBLISHED",
      },
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Publish webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
