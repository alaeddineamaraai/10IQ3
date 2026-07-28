import { NextResponse, type NextRequest } from "next/server";

// Supabase's confirmation/recovery/invite links can redirect back with a
// PKCE `?code=` query param instead of the implicit `#access_token=` hash
// (AuthHashHandler covers the hash case). If the project's Site URL is the
// marketing root, that `code` lands on `/` and nothing ever reads it — the
// user sees the plain landing page, signed out. Catch it here, before any
// page renders, and forward to /auth/callback, which already exchanges the
// code for a session and redirects into onboarding/dashboard.
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|auth/callback).*)"],
};
