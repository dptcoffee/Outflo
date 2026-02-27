/* ==========================================================
   OUTFLO — OPEN FORWARDING VERIFICATION WINDOW
   File: app/api/forwarding/open/route.ts
   Scope: Opens the one-time 2-minute verification aperture (if not already locked)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------
   Constants
-------------------------------- */
export const runtime = "nodejs";

/* ------------------------------
   Helpers
-------------------------------- */
function envOrNull(key: string): string | null {
  const v = process.env[key];
  if (!v) return null;
  const t = v.trim();
  return t.length ? t : null;
}

function isoNow(): string {
  return new Date().toISOString();
}

function supabaseService() {
  const url =
    envOrNull("SUPABASE_URL") || envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrNull("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

async function authedUserId(req: Request): Promise<string | null> {
  const supabaseUrl =
    envOrNull("SUPABASE_URL") || envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const anon = envOrNull("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anon) return null;

  const authHdr = req.headers.get("authorization");
  if (!authHdr || !authHdr.toLowerCase().startsWith("bearer ")) return null;

  const token = authHdr.slice("bearer ".length).trim();
  if (!token.length) return null;

  const supabase = createClient(supabaseUrl, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) return null;

  return data.user.id;
}

/* ------------------------------
   Handler
-------------------------------- */
export async function POST(req: Request) {
  const user_id = await authedUserId(req);
  if (!user_id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = supabaseService();
  if (!supabase) {
    return NextResponse.json({ error: "service_unavailable" }, { status: 500 });
  }

  const { data: row, error: readErr } = await supabase
    .from("forwarding_verifications")
    .select("user_id, verified_at, locked_at")
    .eq("user_id", user_id)
    .maybeSingle();

  if (readErr) {
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }

  if (row?.verified_at || row?.locked_at) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  const { error: upsertErr } = await supabase
    .from("forwarding_verifications")
    .upsert(
      {
        user_id,
        window_opened_at: isoNow(),
      } as any,
      { onConflict: "user_id" }
    );

  if (upsertErr) {
    return NextResponse.json({ error: "open_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}