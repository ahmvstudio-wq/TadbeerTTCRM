import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth-guard";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logo") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Validate cryptographically signed session token
  const sessionToken = request.cookies.get("tadbeer-session")?.value;
  const legacyAuthCookie = request.cookies.get("tadbeer-auth")?.value;
  const userEmail = request.cookies.get("tadbeer-user-email")?.value;
  const sbAccessToken = request.cookies.get("sb-access-token")?.value;
  const sbAuthToken = request.cookies.getAll().find((c) => c.name.includes("auth-token"))?.value;

  const verifiedUser = await verifySessionToken(sessionToken);
  const isAuthenticated = Boolean(
    verifiedUser ||
    (legacyAuthCookie === "true" && userEmail) ||
    sbAccessToken ||
    sbAuthToken
  );

  // 3. Protect internal API routes
  if (pathname.startsWith("/api")) {
    // Whitelist public webhook paths if added in the future
    const isPublicApi = pathname.startsWith("/api/public") || pathname.startsWith("/api/webhooks");
    if (!isPublicApi && !isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Redirect logged-in users away from login page
  if (pathname.startsWith("/login")) {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 5. Strictly enforce login for all protected CRM paths including /
  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
