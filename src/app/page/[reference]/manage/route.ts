import { NextResponse, NextRequest } from 'next/server';
import { acceptManageToken } from '@/services/pageService';
import { cookieName } from "@/lib/verification"

export async function GET(request: NextRequest, { params }: { params: { reference: string } }) {
  const { reference } = params;
  const token = request.nextUrl.searchParams.get('token') ?? '';

  // Always redirect back to the clean page URL
  const redirectUrl = new URL(`/page/${reference}`, request.url);
  const response = NextResponse.redirect(redirectUrl, { status: 302 });

  // Security and caching headers
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex');

  if (token && await acceptManageToken(reference, token)) {
    response.cookies.set(cookieName('manage', reference), token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}
