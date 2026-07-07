import type { ExpertRef } from "@/lib/ava-answer/contract";
import type {
  ExpertCouncilDossier,
  IntelligenceRoute,
} from "./types";

export function selectExpertCouncil(input: {
  route: IntelligenceRoute;
  question: string;
  tenantKey?: string | null;
  contributingExperts?: ExpertRef[];
}): ExpertCouncilDossier {
  void input;
  return {
    selectedExperts: [],
    excludedExperts: [],
    expertLensSummary:
      "Intelligence uses tenant evidence, corpus patterns, benchmarks, and hidden advisory lenses.",
    citations: [],
  };
}
