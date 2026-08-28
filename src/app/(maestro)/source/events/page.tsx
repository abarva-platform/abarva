import { redirect } from "next/navigation";

export const metadata = { title: "Source · Portfolio · AbarVa" };
export const dynamic = "force-dynamic";

export default function SourceEventsPage() {
  redirect("/source/preview/workspace");
}
