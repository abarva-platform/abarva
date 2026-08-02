import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Knowledge | AbarVa",
  description:
    "Governed enterprise context for the airline-demo-new/skyharbor-air design surfaces -- Brief, Explore, Relationships, and Evidence & gaps, bound to the real KnowledgeUiViewModelAssembler / ConsumptionRuntime render-gate contract.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function KnowledgePage() {
  redirect("/home");
}
