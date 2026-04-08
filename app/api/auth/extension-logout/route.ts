import { NextRequest, NextResponse } from "next/server"
import { revokeExtensionToken } from "@/lib/extension-auth"

/**
 * Revoke the extension Bearer token presented in the Authorization header.
 * Always returns 200 — revocation is best-effort and idempotent.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice(7)
    try {
      await revokeExtensionToken(raw)
    } catch (error) {
      console.error("Extension logout error:", error)
      // Fall through — we still want the client to clear local state.
    }
  }
  return NextResponse.json({ ok: true })
}
