import { db } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/encryption"
import type { SocialAccount } from "@/generated/prisma/client"

export async function refreshTwitterToken(
  account: SocialAccount
): Promise<string> {
  if (!account.refreshToken) {
    throw new Error("No refresh token available for Twitter")
  }

  const refreshToken = decrypt(account.refreshToken)

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    throw new Error(`Twitter token refresh failed: ${await res.text()}`)
  }

  const tokens = await res.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await db.socialAccount.update({
    where: { id: account.id },
    data: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : account.refreshToken,
      expiresAt,
    },
  })

  return tokens.access_token
}

export async function refreshFacebookToken(
  account: SocialAccount
): Promise<string> {
  const accessToken = decrypt(account.accessToken)

  const url = new URL(
    "https://graph.facebook.com/v21.0/oauth/access_token"
  )
  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("client_id", process.env.META_APP_ID!)
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!)
  url.searchParams.set("fb_exchange_token", accessToken)

  const res = await fetch(url.toString())

  if (!res.ok) {
    throw new Error(`Facebook token refresh failed: ${await res.text()}`)
  }

  const { access_token: newToken } = await res.json()

  await db.socialAccount.update({
    where: { id: account.id },
    data: {
      accessToken: encrypt(newToken),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  })

  return newToken
}

export async function getValidToken(
  account: SocialAccount
): Promise<string> {
  // Check if token expires within 10 minutes
  const TEN_MINUTES = 10 * 60 * 1000

  if (account.expiresAt && account.expiresAt.getTime() - Date.now() < TEN_MINUTES) {
    if (account.platform === "TWITTER") {
      return refreshTwitterToken(account)
    } else if (account.platform === "FACEBOOK") {
      return refreshFacebookToken(account)
    }
  }

  return decrypt(account.accessToken)
}
