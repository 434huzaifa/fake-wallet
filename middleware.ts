import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt-edge';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // API routes that should be excluded from middleware
  const excludedApiRoutes = [
    '/api/auth/login', 
    '/api/auth/register',
    '/api/auth/logout'
  ];

  // Public routes that don't require authentication
  const publicPaths = ['/auth'];
  
  // Check if it's an excluded API route
  if (excludedApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the current path is public
  const isPublicPath = pathname === '/' || publicPaths.some(path => pathname.startsWith(path));

  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicPath) {
    const response = NextResponse.redirect(new URL('/auth', request.url));
    // Clear any stale cookies
    response.cookies.set('auth-token', '', { 
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return response;
  }

  // If user has token, verify it
  if (token) {
    try {
      const payload = await verifyJWT(token);
      
      // If token is invalid and user is trying to access protected route
      if (!payload && !isPublicPath) {
        const response = NextResponse.redirect(new URL('/auth', request.url));
        response.cookies.set('auth-token', '', { 
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        return response;
      }

      // If user is authenticated and trying to access auth page, redirect to dashboard
      if (payload && pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // If user is authenticated and trying to access root, redirect to dashboard
      if (payload && pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // If user is authenticated, allow access to protected routes
      return NextResponse.next();
    } catch (error) {
      // Token verification failed - clear cookie and redirect if accessing protected route
      console.error('JWT verification error in middleware:', error);
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/auth', request.url));
        response.cookies.set('auth-token', '', { 
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};