import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getValidToken } from "@/lib/social/tokenRefresh"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, description, mimeType } = await req.json()

    // Find user's YouTube account
    const account = await db.socialAccount.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "YOUTUBE",
        },
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: "YouTube account not connected" },
        { status: 400 }
      )
    }

    const accessToken = await getValidToken(account)

    // Create resumable upload session on YouTube
    const res = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType || "video/*",
        },
        body: JSON.stringify({
          snippet: {
            title: title || "Untitled Video",
            description: description || "",
          },
          status: {
            privacyStatus: "private",
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error("YouTube init upload failed:", err)
      return NextResponse.json(
        { error: "Failed to initialize YouTube upload" },
        { status: 500 }
      )
    }

    const uploadUrl = res.headers.get("Location")

    if (!uploadUrl) {
      return NextResponse.json(
        { error: "No upload URL returned from YouTube" },
        { status: 500 }
      )
    }

    return NextResponse.json({ uploadUrl })
  } catch (error) {
    console.error("YouTube init upload error:", error)
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 }
    )
  }
}
