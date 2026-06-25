import { routeQuestion } from "@/lib/intelligence/answer/router";
import { expertIndustryForClientKey } from "@/lib/intelligence/answer/expert-grounding";
import { getExpertById } from "@/lib/intelligence/expert-pack/registry";
import type { ExpertRef } from "@/lib/ava-answer/contract";
import type {
  ExpertCouncilDossier,
  IntelligenceCitation,
  IntelligenceRoute,
} from "./types";

function citationFor(expert: ExpertRef, index: number): IntelligenceCitation {
  return {
    id: `expert-${index + 1}`,
    label: expert.name,
    sourceClass: "expert-pack",
    sourceId: expert.id,
    confidence: "medium",
  };
}

function lensForExpert(expert: ExpertRef): string {
  const pack = getExpertById(expert.id);
  if (!pack) return "Expert interpretation lens";
  return pack.identity.crossCuttingDomain
    ? pack.identity.crossCuttingDomain.replaceAll("-", " ")
    : `${pack.identity.industry ?? "enterprise"} ${pack.identity.functionKey ?? "domain"}`.replaceAll("_", " ");
}

export function selectExpertCouncil(input: {
  route: IntelligenceRoute;
  question: string;
  tenantKey?: string | null;
  contributingExperts?: ExpertRef[];
}): ExpertCouncilDossier {
  const industry = expertIndustryForClientKey(input.tenantKey);
  const routed = routeQuestion({
    query: input.question,
    industry,
    maxExperts: 7,
  });
  const selectedMap = new Map<string, ExpertRef>();
  for (const expert of input.contributingExperts ?? []) {
    selectedMap.set(expert.id, expert);
  }
  for (const expert of routed.experts) {
    selectedMap.set(expert.id, expert);
  }
  const selected = [...selectedMap.values()].slice(0, 7);
  const citations = selected.map(citationFor);
  const citationById = new Map(selected.map((expert, index) => [expert.id, citations[index].id]));

  return {
    selectedExperts: selected.map((expert) => {
      const pack = getExpertById(expert.id);
      return {
        expertId: expert.id,
        nameOrRole: expert.name,
        lens: lensForExpert(expert),
        whySelected: `Selected for ${input.route.intelligenceIntent} across ${input.route.primaryDimension}.`,
        expectedContribution:
          pack?.identity.scopeNote ??
          "Pressure-test tenant evidence, corpus applicability, risks, and decision criteria.",
        questionsThisExpertShouldPressureTest:
          pack?.diagnostics.discoveryQuestions.slice(0, 3) ??
          input.route.expertLensesRequired.map((lens) => `What would the ${lens} lens challenge?`).slice(0, 3),
        citationIds: [citationById.get(expert.id) ?? "expert-unknown"],
      };
    }),
    excludedExperts: routed.scores
      .filter((score) => !selectedMap.has(score.id) && score.score > 0)
      .slice(0, 6)
      .map((score) => ({
        expertId: score.id,
        nameOrRole: score.name,
        reasonExcluded: "Lower question relevance than the selected expert council.",
      })),
    expertLensSummary:
      selected.length > 0
        ? `Selected ${selected.length} expert lens${selected.length === 1 ? "" : "es"}; experts interpret and pressure-test, they do not prove tenant facts.`
        : "No expert lens matched strongly; answer must rely on tenant evidence, corpus patterns, and explicit caveats.",
    citations,
  };
}
