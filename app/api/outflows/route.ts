import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    primitive: "Outflō",
    note: "v0 placeholder — this will become money-out events (and later other substrates).",
  });
}

