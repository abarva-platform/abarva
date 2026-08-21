import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Knowledge | AbarVa",
  description: "Governed Knowledge baseline and enterprise context.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ArchivedHomeQueuePage() {
  redirect("/home");
}
