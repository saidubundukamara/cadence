import { randomBytes } from "crypto"
import { db } from "@/lib/db"

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

export async function createVerificationToken(email: string) {
  // Delete any existing tokens for this email
  await db.verificationToken.deleteMany({ where: { email } })

  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  return db.verificationToken.create({
    data: { email, token, expiresAt },
  })
}

export async function createPasswordResetToken(email: string) {
  // Delete any existing tokens for this email
  await db.passwordResetToken.deleteMany({ where: { email } })

  const token = generateToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  return db.passwordResetToken.create({
    data: { email, token, expiresAt },
  })
}
