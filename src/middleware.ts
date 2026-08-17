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
  const sbAccessToken = request.cookies.get("sb-access-token")?.value;
  const sbAuthToken = request.cookies.getAll().find((c) => c.name.includes("auth-token"))?.value;

  const verifiedUser = await verifySessionToken(sessionToken);
  const isAuthenticated = Boolean(verifiedUser || sbAccessToken || sbAuthToken);

  // 3. Protect internal API routes
  if (pathname.startsWith("/api")) {
    const isPublicApi = pathname.startsWith("/api/public") || pathname.startsWith("/api/webhooks");
    if (!isPublicApi && !isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Always allow the login page — no auto-redirect even if cookies exist.
  // Every new browser session or device MUST present credentials explicitly.
  if (pathname.startsWith("/login")) {
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
