import { NextResponse } from "next/server";

const COOKIE_NAME = "outflo_vault";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";

  const expected = process.env.OUTFLO_VAULT_KEY || "";
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Vault not configured" },
      { status: 500 }
    );
  }

  if (key !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: COOKIE_NAME,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}
