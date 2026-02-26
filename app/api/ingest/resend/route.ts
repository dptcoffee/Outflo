import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("INGEST/RESEND HIT", { at: new Date().toISOString() });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("MISSING ENV", { hasUrl: !!url, hasKey: !!key });
    return NextResponse.json({ ok: false, where: "env" }, { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, where: "json" }, { status: 400 });
  }

  const event_id = body?.data?.id ?? body?.id ?? null;

  const { data, error } = await supabase
    .from("ingest_events")
    .insert({
      provider: "resend",
      event_id,
      raw: body,
      received_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("DB INSERT FAILED", {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    return NextResponse.json(
      { ok: false, where: "db", message: error.message, code: (error as any).code },
      { status: 500 }
    );
  }

  console.log("DB INSERT OK", { inserted_id: data.id });
  return NextResponse.json({ ok: true, inserted_id: data.id });
}