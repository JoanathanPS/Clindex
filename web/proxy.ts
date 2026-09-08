import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 proxy (formerly middleware): refreshes the Supabase session
 * cookie on every request and guards protected routes.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const isPublicRoute =
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/auth");

    // Only redirect if unauthenticated and attempting to access a protected route
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Proxy auth refresh error:", error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)",
  ],
};