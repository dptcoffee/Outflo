/* ==========================================================
   OUTFLO — LEDGER HARD RESET
   File: app/api/admin/hard-reset/route.ts
   Scope: Cloud deletion of receipts and epoch, followed by epoch recreation
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   Route Handler
-------------------------------- */
export async function POST() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  /* ------------------------------
     Delete Receipts (authoritative)
  -------------------------------- */
  const { count: beforeCount, error: beforeErr } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (beforeErr) {
    return NextResponse.json({ error: beforeErr.message }, { status: 500 });
  }

  const { error: delReceiptsErr } = await supabase
    .from("receipts")
    .delete()
    .eq("user_id", userId);

  if (delReceiptsErr) {
    return NextResponse.json({ error: delReceiptsErr.message }, { status: 500 });
  }

  const { count: afterCount, error: afterErr } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (afterErr) {
    return NextResponse.json({ error: afterErr.message }, { status: 500 });
  }

  if ((afterCount ?? 0) !== 0) {
    return NextResponse.json(
      {
        error: "Hard reset failed: receipts still present after delete.",
        beforeCount: beforeCount ?? 0,
        afterCount: afterCount ?? 0,
      },
      { status: 500 }
    );
  }

  /* ------------------------------
     Delete Epoch (authoritative)
  -------------------------------- */
  const { error: delEpochErr } = await supabase
    .from("user_epochs")
    .delete()
    .eq("user_id", userId);

  if (delEpochErr) {
    return NextResponse.json({ error: delEpochErr.message }, { status: 500 });
  }

  /* ------------------------------
     Recreate Epoch (authoritative)
  -------------------------------- */
  const { error: upsertEpochErr } = await supabase
    .from("user_epochs")
    .upsert(
      { user_id: userId, epoch_ms: Date.now() },
      { onConflict: "user_id" }
    );

  if (upsertEpochErr) {
    return NextResponse.json({ error: upsertEpochErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}