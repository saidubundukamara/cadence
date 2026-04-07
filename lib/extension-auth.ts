import { createHash, randomBytes } from "crypto"
import { db } from "@/lib/db"

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

function hashToken(raw: string): string {
  const secret = process.env.EXTENSION_TOKEN_SECRET ?? ""
  return createHash("sha256").update(raw + secret).digest("hex")
}

export async function issueExtensionToken(userId: string): Promise<{
  token: string
  expiresAt: Date
}> {
  const raw = randomBytes(32).toString("hex")
  const tokenHash = hashToken(raw)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  await db.extensionToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  return { token: raw, expiresAt }
}

export async function verifyExtensionToken(raw: string): Promise<string | null> {
  const tokenHash = hashToken(raw)

  const record = await db.extensionToken.findUnique({
    where: { tokenHash },
  })

  if (!record) return null
  if (record.expiresAt < new Date()) return null

  return record.userId
}
