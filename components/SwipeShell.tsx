"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSwipe } from "../hooks/useSwipe";

const ROUTES = ["/", "/365", "/time"];

function idxOf(pathname: string) {
  const i = ROUTES.indexOf(pathname);
  return i === -1 ? 0 : i;
}

export default function SwipeShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

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
        minHeight: "100vh",
        touchAction: "pan-y",
        position: "relative",
      }}
    >
      {children}

      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 18,
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
          <Pill href="/" active={pathname === "/"} label="Home" />
          <Pill href="/365" active={pathname === "/365"} label="Systems" />
          <Pill href="/time" active={pathname === "/time"} label="Time" />
        </div>
      </nav>
    </div>
  );
}

function Pill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "white",
        fontSize: 12,
        opacity: active ? 1 : 0.55,
        padding: "8px 12px",
        borderRadius: 999,
        border: active ? "1px solid rgba(255,255,255,0.20)" : "1px solid transparent",
      }}
    >
      {label}
    </Link>
  );
}


