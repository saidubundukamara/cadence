import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  // Dynamic import for cloudinary signing
  const { createHash } = await import("crypto")
  const paramsToSign = `folder=cadence&timestamp=${timestamp}`
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex")

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  })
}
