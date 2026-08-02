import type { Metadata } from "next";

import { AiSuccessCommandCenter } from "@/components/home/ai-success-command-center/AiSuccessCommandCenter";
import { readSkyHarborAiSuccessHome } from "@/lib/home/readSkyHarborAiSuccessHome";

export const metadata: Metadata = {
  title: "AI Success Command Center | AbarVa",
  description:
    "SkyHarbor AI Success Home command center with evidence-bound posture, current-state architecture, Tower value proof, Source gaps, and leadership decisions.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  const data = readSkyHarborAiSuccessHome();
  return <AiSuccessCommandCenter data={data} />;
}
