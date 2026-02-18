/* --- VAULT MIDDLEWARE (dev-only) --- */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* --- config --- */
const COOKIE_NAME = "outflo_vault";

/* --- helpers --- */
function isAlwaysPublic(pathname: string) {
  // Public landing (vault door)
  if (pathname === "/") return true;

  // Login + auth must remain reachable
  if (pathname === "/login") return true;
  if (pathname.startsWith("/auth")) return true;

  // Unlock endpoint must remain reachable
  if (pathname === "/api/unlock") return true;

  // All API routes must remain reachable (no vault redirect)
  if (pathname.startsWith("/api")) return true;

  // Next internals
  if (pathname.startsWith("/_next")) return true;

  // Public assets: anything with a file extension
  // e.g. /outflo.jpg, /favicon.png, /manifest.json, etc.
  if (pathname.includes(".")) return true;

  return false;
}

/* --- middleware --- */
export function middleware(req: NextRequest) {
  // Disable vault in production (Vercel)
  if (process.env.NODE_ENV === "production") return NextResponse.next();

  const { pathname, search } = req.nextUrl;

  if (isAlwaysPublic(pathname)) return NextResponse.next();

  const unlocked = req.cookies.get(COOKIE_NAME)?.value === "1";
  if (unlocked) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(url);
}

/* --- matcher --- */
export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};


