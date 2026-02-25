// ============================================
// OUTFLO — TIME — CLOUD EPOCH (SERVER)
// ============================================
// Single source of truth for user-bound epoch.
// No localStorage.
// Cloud only.

import { supabaseServer } from "@/lib/supabase/server";

export async function getOrCreateUserEpochMs(): Promise<number | null> {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) return null;

  // Read existing epoch
  const { data: existing, error: readErr } = await supabase
    .from("user_epochs")
    .select("epoch_ms")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) throw readErr;
  if (existing?.epoch_ms != null) return Number(existing.epoch_ms);

  // Create once if missing
  const now = Date.now();

  const { data: inserted, error: insertErr } = await supabase
    .from("user_epochs")
    .insert({ user_id: user.id, epoch_ms: now })
    .select("epoch_ms")
    .single();

  if (insertErr) {
    // Race condition fallback
    const { data: again, error: againErr } = await supabase
      .from("user_epochs")
      .select("epoch_ms")
      .eq("user_id", user.id)
      .single();

    if (againErr) throw againErr;
    return Number(again.epoch_ms);
  }

  return Number(inserted.epoch_ms);
}