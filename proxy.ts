import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const EXTENSION_ORIGIN_RE = /^chrome-extension:\/\//

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const origin = req.headers.get("origin") ?? ""
  const isExtension = EXTENSION_ORIGIN_RE.test(origin)

  // Handle CORS preflight from Chrome extension
  if (isExtension && req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
  }

  // Any /api/* request that presents a Bearer token is handled by the
  // route itself (via verifyExtensionToken / NextAuth session). The proxy
  // must not session-redirect it, otherwise the route handler never runs
  // and the client sees a misleading 307 -> /login instead of 401 JSON.
  // We key off the Authorization header rather than the Origin so curl,
  // mobile clients, and tests work the same way the extension does.
  const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ")
  if (pathname.startsWith("/api/") && hasBearer) {
    const res = NextResponse.next()
    if (isExtension) {
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v))
    }
    return res
  }

  const isLoggedIn = !!req.auth

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register")
  const isApiAuthRoute = pathname.startsWith("/api/auth")
  const isPublishWebhook = pathname === "/api/publish"
  const isPublicRoute = pathname === "/"

  if (isApiAuthRoute || isPublishWebhook) {
    const res = NextResponse.next()
    if (isExtension) {
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v))
    }
    return res
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
    return NextResponse.next()
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
