import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createHash } from "crypto"

// Signature endpoint for next-cloudinary's CldUploadWidget.
// The widget POSTs { paramsToSign: {...} } and expects { signature }.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const paramsToSign: Record<string, string | number> = body?.paramsToSign ?? {}

  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&")

  const signature = createHash("sha1")
    .update(sortedParams + apiSecret)
    .digest("hex")

  return NextResponse.json({ signature })
}
