import type {
  AgentAnswer,
  AnswerBasis,
  AnswerCitation,
  ExpertRef,
} from "@/lib/intelligence/answer/agent-answer";

const TENANT_SOURCE_CLASSES = new Set<AnswerCitation["sourceClass"]>([
  "tenant-fact",
  "tenant-chunk",
  "graph",
]);

const CORPUS_SOURCE_CLASSES = new Set<AnswerCitation["sourceClass"]>([
  "corpus-pattern",
  "expert-pack",
]);

export function basisFromAnswer(input: {
  citations: AnswerCitation[];
  contributingExperts: ExpertRef[];
  groundingMode: AgentAnswer["groundingMode"];
  gaps?: string[];
}): AnswerBasis[] {
  const citationIdsByClass = (classes: Set<AnswerCitation["sourceClass"]>) =>
    input.citations
      .filter((citation) => classes.has(citation.sourceClass))
      .map((citation) => citation.id);

  const basis: AnswerBasis[] = [];
  const tenantCitationIds = citationIdsByClass(TENANT_SOURCE_CLASSES);
  if (tenantCitationIds.length > 0 || input.groundingMode === "tenant-evidence") {
    basis.push({
      kind: "tenant_fact",
      label: "Loaded tenant evidence",
      citationIds: tenantCitationIds,
    });
  }

  const corpusCitationIds = citationIdsByClass(CORPUS_SOURCE_CLASSES);
  if (corpusCitationIds.length > 0 || input.groundingMode === "industry-pattern") {
    basis.push({
      kind: "industry_pattern",
      label: "Industry corpus or pattern library",
      citationIds: corpusCitationIds,
      note:
        corpusCitationIds.length > 0
          ? undefined
          : "No tenant citation was available for this reasoning layer.",
    });
  }

  const benchmarkCitationIds = input.citations
    .filter((citation) => citation.sourceClass === "worldview")
    .map((citation) => citation.id);
  if (benchmarkCitationIds.length > 0) {
    basis.push({
      kind: "benchmark",
      label: "External benchmark or worldview corpus",
      citationIds: benchmarkCitationIds,
    });
  }

  if (input.contributingExperts.length > 0) {
    basis.push({
      kind: "expert_inference",
      label: "Consilium expert inference",
      note: input.contributingExperts.map((expert) => expert.name).join(", "),
    });
  }

  if ((input.gaps ?? []).length > 0) {
    basis.push({
      kind: "gap",
      label: "Known evidence gap",
      note: input.gaps?.slice(0, 3).join("; "),
    });
  }

  return dedupeBasis(basis);
}

export function enforceIntelligenceAdvisorDoctrine(answer: AgentAnswer): AgentAnswer {
  if (answer.surface !== "intelligence") return answer;
  const basis = basisFromAnswer({
    citations: answer.citations,
    contributingExperts: answer.contributingExperts,
    groundingMode: answer.groundingMode,
    gaps: answer.gaps,
  });
  const limits = new Set(answer.limits);
  limits.add(
    "Basis labels separate tenant facts, industry patterns, benchmarks, expert inference, and gaps.",
  );
  return {
    ...answer,
    basis,
    limits: [...limits],
  };
}

export function enforceHomeKnowAgentAnswerDoctrine(answer: AgentAnswer): AgentAnswer {
  if (answer.surface !== "home") return answer;
  const basis =
    answer.citations.length > 0
      ? [
          {
            kind: "tenant_fact" as const,
            label: "Loaded tenant context",
            citationIds: answer.citations.map((citation) => citation.id),
          },
        ]
      : [
          {
            kind: "gap" as const,
            label: "No loaded tenant evidence returned for this Home KNOW answer",
          },
        ];
  return {
    ...answer,
    expertId: null,
    contributingExperts: [],
    groundingMode: "tenant-evidence",
    basis,
  };
}

function dedupeBasis(basis: AnswerBasis[]): AnswerBasis[] {
  const seen = new Set<string>();
  return basis.filter((item) => {
    const key = `${item.kind}:${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
