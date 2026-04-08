import { auth } from "@/lib/auth"
import { verifyExtensionToken } from "@/lib/extension-auth"

/**
 * Returns the authenticated userId from either a NextAuth session
 * or an extension Bearer token. Returns null if unauthenticated.
 */
export async function getAuthUser(req: Request): Promise<string | null> {
  // If a Bearer token is present, it is authoritative (extension request).
  // Do NOT fall back to the browser session — otherwise a different user's
  // NextAuth cookie on the same origin would hijack the extension's identity.
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice(7)
    return verifyExtensionToken(raw)
  }

  // No Bearer token → dashboard request, use NextAuth session.
  const session = await auth()
  return session?.user?.id ?? null
}
