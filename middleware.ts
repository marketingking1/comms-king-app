import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  // GA4 OAuth callback recebe redirect do Google sem cookie nosso — manter aberto
  const isOauthCallback = request.nextUrl.pathname.startsWith('/api/ga4/callback');

  // API routes anônimas retornam 401 JSON (não redirect → não quebra fetch do front)
  if (!user && request.nextUrl.pathname.startsWith('/api/') && !isOauthCallback) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }

  if (!user && !isAuthPage && !isOauthCallback && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
