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
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
