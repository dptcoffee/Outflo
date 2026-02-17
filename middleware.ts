import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE_NAME = "outflo_vault";

function isPublic(pathname: string) {
  if (pathname === "/") return true;

  // allow Next internals + static assets needed for PWA
  if (pathname.startsWith("/_next")) return true;

  if (
    pathname === "/manifest.json" ||
    pathname === "/favicon.png" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/icon-192.png" ||
    pathname === "/icon-512.png"
  ) {
    return true;
  }

  // allow unlock endpoint
  if (pathname === "/api/unlock") return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const unlocked = req.cookies.get(COOKIE_NAME)?.value === "1";
  if (unlocked) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
