// app/deposit/middleware.js or add to existing middleware
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if user is authenticated
  // You can check for token in cookies or localStorage via headers
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/deposit',
};