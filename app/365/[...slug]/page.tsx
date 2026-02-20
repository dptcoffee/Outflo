import { redirect } from "next/navigation";

export default function Legacy365({
  params,
}: {
  params: { slug: string[] };
}) {
  const path = params.slug?.join("/") ?? "";
  redirect(`/app/money/${path}`);
}