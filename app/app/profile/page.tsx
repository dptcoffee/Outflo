import { redirect } from "next/navigation";

export default function LegacyAppProfile() {
  redirect("/account/profile");
}