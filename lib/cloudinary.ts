import { createHash } from "crypto"

export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "video" = "image"
) {
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
  const timestamp = Math.round(Date.now() / 1000)
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const formData = new FormData()
  formData.append("public_id", publicId)
  formData.append("api_key", apiKey)
  formData.append("timestamp", String(timestamp))
  formData.append("signature", signature)

  await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body: formData }
  ).catch((err) => {
    console.error("Cloudinary destroy failed:", err)
  })
}

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
