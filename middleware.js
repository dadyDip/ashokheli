import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Get token from cookies (or localStorage via checking)
  const token = request.cookies.get('token')?.value
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/', '/about', '/contact', '/privacy']
  
  // Admin routes
  const adminPaths = ['/admin']
  
  // Sub-agent routes
  const subAgentPaths = ['/subagent']
  
  // Check if path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Check if path is admin
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  
  // Check if path is sub-agent
  const isSubAgentPath = subAgentPaths.some(path => pathname.startsWith(path))
  
  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // If token exists and trying to access login/register, redirect to home
  if (token && (pathname === '/login' || pathname === '/register')) {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }
  
  // Note: For admin/sub-agent role checks, we'll handle them in the layout/components
  // because middleware doesn't have access to localStorage
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}