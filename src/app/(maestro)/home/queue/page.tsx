import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { foundationKnowledgePath } from "@/lib/auth/foundation-route-access";

export const metadata: Metadata = {
  title: "Knowledge | AbarVa",
  description: "Governed Knowledge baseline and enterprise context.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ArchivedHomeQueuePage() {
  redirect(foundationKnowledgePath("airline-demo-new"));
}
