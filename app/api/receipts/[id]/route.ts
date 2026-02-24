/* ==========================================================
   OUTFLO — RECEIPT BY ID API
   File: app/api/receipts/[id]/route.ts
   Scope: Fetch single receipt (user-scoped, cloud truth)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/* ------------------------------
   Metadata
-------------------------------- */
export const dynamic = "force-dynamic";

/* ------------------------------
   Helpers
-------------------------------- */
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

function jsonNoStore(payload: unknown, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/* ------------------------------
   Route Handler
-------------------------------- */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonNoStore({ error: "unauthorized" }, 401);
  }

  const { id } = await context.params;
  const decodedId = id ? decodeURIComponent(id) : "";

  if (!decodedId) {
    return jsonNoStore({ error: "missing id" }, 400);
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("id, ts, place, amount")
    .eq("user_id", user.id)
    .eq("id", decodedId)
    .single();

  if (error || !data) {
    return jsonNoStore({ error: "not found" }, 404);
  }

  return jsonNoStore({ receipt: data });
}