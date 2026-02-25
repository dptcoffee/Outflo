/* ==========================================================
   OUTFLO — SWIPE SHELL
   File: components/SwipeShell.tsx
   Scope: Global swipe navigation wrapper + bottom nav pills
   ========================================================== */

"use client";

/* ------------------------------
   Imports
-------------------------------- */
import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSwipe } from "../hooks/useSwipe";

/* ------------------------------
   Constants
-------------------------------- */
const ROUTES = ["app/home", "/app/systems", "/time"];

/* ------------------------------
   Helpers
-------------------------------- */
function idxOf(pathname: string) {
  const i = ROUTES.indexOf(pathname);
  return i === -1 ? 0 : i;
}

/* ------------------------------
   Component
-------------------------------- */
export default function SwipeShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Hide bottom nav on drill-down pages (e.g. receipt detail)
  const hideNav = pathname.startsWith("/app/money/receipts/");

  const { left, right } = useMemo(() => {
    const i = idxOf(pathname);
    const left = ROUTES[Math.min(i + 1, ROUTES.length - 1)];
    const right = ROUTES[Math.max(i - 1, 0)];
    return { left, right };
  }, [pathname]);

  const swipe = useSwipe(() => router.push(left), () => router.push(right));

  return (
    <div
      {...swipe}
      style={{
        minHeight: "100dvh",
        width: "100%",
        overflowX: "hidden",
        touchAction: "pan-y",
        position: "relative",
      }}
    >
      {children}

      {!hideNav && (
        <nav
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: "calc(18px + env(safe-area-inset-bottom))",
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              display: "flex",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Pill href="app/home" active={pathname === "app/home"} label="Home" />
            <Pill
              href="/app/systems"
              active={pathname === "/app/systems"}
              label="Systems"
            />
            <Pill href="/time" active={pathname === "/time"} label="Time" />
          </div>
        </nav>
      )}
    </div>
  );
}

/* ------------------------------
   Subcomponents
-------------------------------- */
function Pill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "#fffefa", // ✅ was black
        fontSize: 12,
        opacity: active ? 1 : 0.55,
        padding: "8px 12px",
        borderRadius: 999,
        border: active
          ? "1px solid rgba(255,255,255,0.20)"
          : "1px solid transparent",
        background: active ? "rgba(255,255,255,0.06)" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}



