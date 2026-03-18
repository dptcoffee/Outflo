/* ==========================================================
   OUTFLO — RECEIPTS API
   File: app/api/receipts/route.ts
   Scope: List receipts and create one receipt (user-scoped, cloud truth)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   Types
-------------------------------- */
type CreateReceiptBody = {
  place?: unknown;
  amount?: unknown;
  ts?: unknown;
};

/* ------------------------------
   Helpers
-------------------------------- */
function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function parseCreateReceiptBody(body: CreateReceiptBody | null) {
  const place = typeof body?.place === "string" ? body.place.trim() : "";
  const amount = typeof body?.amount === "number" ? body.amount : NaN;
  const ts = typeof body?.ts === "number" ? body.ts : Date.now();

  return { place, amount, ts };
}

/* ------------------------------
   GET — List Receipts
-------------------------------- */
export async function GET() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return json({ error: "unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("id, ts, place, amount")
    .eq("user_id", user.id)
    .order("ts", { ascending: false })
    .limit(500);

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ receipts: data ?? [] });
}

/* ------------------------------
   POST — Create Receipt
-------------------------------- */
export async function POST(request: Request) {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return json({ error: "unauthorized" }, 401);
  }

  const body = (await request.json().catch(() => null)) as CreateReceiptBody | null;
  const { place, amount, ts } = parseCreateReceiptBody(body);

  if (!place || !Number.isFinite(amount)) {
    return json({ error: "invalid payload" }, 400);
  }

  const { data, error } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      place,
      amount,
      ts,
    })
    .select("id, ts, place, amount")
    .single();

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ receipt: data });
}