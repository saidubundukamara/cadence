import { createHash } from "crypto"

export function getUploadSignature() {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const paramsToSign = `folder=cadence&timestamp=${timestamp}`
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex")

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
  }
}
