import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

