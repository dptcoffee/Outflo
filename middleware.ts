/* --- VAULT MIDDLEWARE --- */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE_NAME = "outflo_vault";

function isAlwaysPublic(pathname: string) {
  // Public landing (vault door)
  if (pathname === "/") return true;

  // Unlock endpoint must remain reachable
  if (pathname === "/api/unlock") return true;

  // Next internals
  if (pathname.startsWith("/_next")) return true;

  // Public assets: anything with a file extension
  // e.g. /outflo.jpg, /favicon.png, /manifest.json, etc.
  if (pathname.includes(".")) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isAlwaysPublic(pathname)) return NextResponse.next();

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

