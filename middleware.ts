import { updateSession } from "@/lib/supabase/middleware"
import { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-current-path", request.nextUrl.pathname)
  headers.set("x-current-query", request.nextUrl.search)
  const newRequest = new NextRequest(request, {
    headers,
  })
  return await updateSession(newRequest)
}

export const config = {
  matcher: [
    /*
     * Match all dashboard routes to ensure authentication.
     * Exclude API routes, static files, image optimization files, and common public files.
     */
    "/dashboard/:path*",

    /*
     * Match specific other routes that require authentication if any.
     * Add them here, e.g., '/account/:path*'
     */

    /*
     * The previous pattern was too broad, causing the middleware
     * to run on unnecessary routes like '/', '/login', etc., adding latency.
     * We explicitly exclude known public/static paths below if needed,
     * but focusing the matcher on protected routes is generally better.
     */
    // Negative lookaheads can be complex; prefer positive matching:
    // '/((?!_next/static|_next/image|favicon.ico|auth|login|/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
