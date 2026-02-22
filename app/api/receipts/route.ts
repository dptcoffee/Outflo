import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function supabaseServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

// GET /api/receipts  -> list
export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("receipts")
    .select("id, ts, place, amount")
    .order("ts", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipts: data ?? [] });
}

// POST /api/receipts -> insert one
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const place = typeof body?.place === "string" ? body.place.trim() : "";
  const amount = typeof body?.amount === "number" ? body.amount : NaN;
  const ts = typeof body?.ts === "number" ? body.ts : Date.now();

  if (!place || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("receipts")
    .insert({ user_id: user.id, place, amount, ts })
    .select("id, ts, place, amount")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipt: data });
}