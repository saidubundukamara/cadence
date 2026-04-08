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

  // Extension API calls use Bearer token auth — skip session redirect logic
  // and let the API route handle authentication itself
  if (isExtension && pathname.startsWith("/api/")) {
    const res = NextResponse.next()
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  const isLoggedIn = !!req.auth

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register")
  const isApiAuthRoute = pathname.startsWith("/api/auth")
  const isPublishWebhook = pathname === "/api/publish"
  const isPublicRoute = pathname === "/"

  if (isApiAuthRoute || isPublishWebhook) {
    return NextResponse.next()
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
