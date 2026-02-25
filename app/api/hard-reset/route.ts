/* ==========================================================
   OUTFLO — LEDGER HARD RESET
   File: app/api/admin/hard-reset/route.ts
   Scope: Cloud deletion of receipts and epoch, followed by scaffolded epoch recreation
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
     Delete Receipts
  -------------------------------- */

  const { error: delReceiptsErr } = await supabase
    .from("receipts")
    .delete()
    .eq("user_id", userId);

  if (delReceiptsErr) {
    return NextResponse.json({ error: delReceiptsErr.message }, { status: 500 });
  }

  /* ------------------------------
     Delete Epoch
  -------------------------------- */

  const { error: delEpochErr } = await supabase
    .from("user_system")
    .delete()
    .eq("user_id", userId);

  if (delEpochErr) {
    return NextResponse.json({ error: delEpochErr.message }, { status: 500 });
  }

  /* ------------------------------
     Recreate Epoch (Scaffold)
  -------------------------------- */

  const { error: insEpochErr } = await supabase
    .from("user_system")
    .insert({
      user_id: userId,
      epoch_ms: Date.now(),
    });

  if (insEpochErr) {
    return NextResponse.json({ error: insEpochErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}