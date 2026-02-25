import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import LoginClient from "./login-client";

export default async function LoginPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/app/systems");
  }

  return <LoginClient />;
}





