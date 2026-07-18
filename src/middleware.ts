import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Middleware disabled - auth handled client-side
  const { NextResponse } = await import("next/server");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
