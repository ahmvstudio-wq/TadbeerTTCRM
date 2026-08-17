import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, API endpoints, logo, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/logo") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get("tadbeer-auth")?.value;
  const sbAccessToken = request.cookies.get("sb-access-token")?.value;
  const sbAuthToken = request.cookies.getAll().find(c => c.name.includes("auth-token"))?.value;

  const isAuthenticated = Boolean(authCookie === "true" || sbAccessToken || sbAuthToken);

  // If user is accessing login page while authenticated -> redirect to dashboard
  if (pathname.startsWith("/login")) {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Strictly enforce login for all protected CRM paths including /
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
