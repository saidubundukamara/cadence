import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { destroyAsset } from "@/lib/cloudinary"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const force = new URL(req.url).searchParams.get("force") === "true"

  const media = await db.media.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: { select: { posts: true } },
      posts: { select: { id: true, mediaUrls: true } },
    },
  })

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 })
  }

  if (media._count.posts > 0 && !force) {
    return NextResponse.json(
      {
        error: "In use",
        message: `This file is used in ${media._count.posts} post${media._count.posts !== 1 ? "s" : ""}. Pass ?force=true to delete anyway.`,
        postCount: media._count.posts,
      },
      { status: 409 }
    )
  }

  // Strip URL from any linked posts' mediaUrls
  if (media.posts.length > 0) {
    await Promise.all(
      media.posts.map((p) =>
        db.post.update({
          where: { id: p.id },
          data: { mediaUrls: p.mediaUrls.filter((u) => u !== media.url) },
        })
      )
    )
  }

  await db.media.delete({ where: { id } })

  if (media.publicId) {
    await destroyAsset(
      media.publicId,
      media.type === "VIDEO" ? "video" : "image"
    )
  }

  return NextResponse.json({ success: true })
}
