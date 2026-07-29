import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { foundationKnowledgePath } from "@/lib/auth/foundation-route-access";

export const metadata: Metadata = {
  title: "Knowledge | AbarVa",
  description: "Governed Knowledge baseline and enterprise context.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ArchivedHomeV4PreviewPage() {
  redirect(foundationKnowledgePath("airline-demo-new"));
}
