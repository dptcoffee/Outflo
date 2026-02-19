import { supabaseServer } from "@/lib/supabase/server";

export default async function Page() {
  await supabaseServer(); // initializes session if present
  return null; // or render your actual home UI here
}











