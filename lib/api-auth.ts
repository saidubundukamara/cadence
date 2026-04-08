import { auth } from "@/lib/auth"
import { verifyExtensionToken } from "@/lib/extension-auth"

/**
 * Returns the authenticated userId from either a NextAuth session
 * or an extension Bearer token. Returns null if unauthenticated.
 */
export async function getAuthUser(req: Request): Promise<string | null> {
  // Try NextAuth session first (dashboard)
  const session = await auth()
  if (session?.user?.id) return session.user.id

  // Fall back to extension Bearer token
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice(7)
    return verifyExtensionToken(raw)
  }

  return null
}
