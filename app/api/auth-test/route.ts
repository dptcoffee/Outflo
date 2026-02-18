import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getSession();

  return NextResponse.json({
    connected: true,
    session: data.session,
    error,
  });
}
