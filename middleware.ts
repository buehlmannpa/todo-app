import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, readSessionToken } from "@/lib/session-token";

const PROTECTED = ["/heute", "/eingang", "/projekte", "/archiv", "/einstellungen"];
const PUBLIC_ONLY = ["/login", "/registrieren"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await readSessionToken(token) : null;

  if (!user && PROTECTED.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("weiter", pathname);
    return NextResponse.redirect(url);
  }

  if (user && PUBLIC_ONLY.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/heute";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/heute/:path*", "/eingang/:path*", "/projekte/:path*", "/archiv/:path*", "/einstellungen/:path*", "/login", "/registrieren"],
};
