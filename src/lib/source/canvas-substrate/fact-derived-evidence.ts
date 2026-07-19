import { evidenceById } from "../canonical-specs";
import type {
  SourceEventEvidence,
  SourceEventEvidenceCurrentState,
  SourceEventFactRow,
} from "./types";

type FactEvidenceMapping = {
  requirementId: string;
  currentState: Extract<SourceEventEvidenceCurrentState, "Available">;
};

const TRUSTED_FACT_METHODS = new Set(["structured_map", "parsed"]);
const TRUSTED_FACT_CONFIDENCE = new Set(["med", "high"]);

const FACT_EVIDENCE_MAP: Record<string, FactEvidenceMapping> = {
  annual_run_cost: {
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    currentState: "Available",
  },
  loaded_fte_cost: {
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    currentState: "Available",
  },
  variable_cost_share_pct: {
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    currentState: "Available",
  },
  annual_change_order_spend: {
    requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
    currentState: "Available",
  },
  recurring_avoidable_pct: {
    requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
    currentState: "Available",
  },
  projected_volume_decline_pct: {
    requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
    currentState: "Available",
  },
  automatable_effort_pool: {
    requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
    currentState: "Available",
  },
  chronic_miss_rate: {
    requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
    currentState: "Available",
  },
  response_addressed: {
    requirementId: "EVID-SRC-RESP-PROPOSALS",
    currentState: "Available",
  },
  vendor_headline_bid: {
    requirementId: "EVID-SRC-PRICE-VENDOR-PRICING",
    currentState: "Available",
  },
  vendor_retained_fte_delta: {
    requirementId: "EVID-SRC-PRICE-VENDOR-PRICING",
    currentState: "Available",
  },
  vendor_sla_credit_cap_pct: {
    requirementId: "EVID-SRC-PRICE-VENDOR-PRICING",
    currentState: "Available",
  },
};

const EVIDENCE_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

const FAILURE_STATES = new Set<SourceEventEvidenceCurrentState>([
  "Stale",
  "Low Confidence",
]);

export function deriveFactBackedEvidenceStates(
  facts: SourceEventFactRow[],
): SourceEventEvidence[] {
  const grouped = new Map<
    string,
    {
      mapping: FactEvidenceMapping;
      facts: SourceEventFactRow[];
    }
  >();

  for (const fact of facts) {
    const mapping = FACT_EVIDENCE_MAP[fact.fact_key];
    if (!mapping || !isTrustedGateFact(fact)) continue;
    if (!evidenceById(mapping.requirementId)) continue;
    const group = grouped.get(mapping.requirementId) ?? {
      mapping,
      facts: [],
    };
    group.facts.push(fact);
    grouped.set(mapping.requirementId, group);
  }

  return [...grouped.entries()].map(([requirementId, group]) => {
    const newest = newestFact(group.facts);
    const requirement = evidenceById(requirementId);
    const factIds = unique(group.facts.map((fact) => fact.id));
    const factKeys = unique(group.facts.map((fact) => fact.fact_key));
    const timestamp = newest?.captured_at ?? new Date(0).toISOString();

    return {
      id: `fact-derived:${newest?.source_event_id ?? "unknown"}:${requirementId}`,
      sourceEventId: newest?.source_event_id ?? "",
      tenantKey: newest?.client_key ?? "",
      requirementId,
      stage: requirement?.stage ?? "strategy",
      currentState: group.mapping.currentState,
      sourceArtifactId: null,
      sourceEventFactIds: factIds,
      notes: `Derived from cited source_event_facts: ${factKeys.join(", ")}.`,
      lastSyncedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

export function mergeFactBackedEvidenceStates(
  persistedEvidence: SourceEventEvidence[],
  factBackedEvidence: SourceEventEvidence[],
): SourceEventEvidence[] {
  const byRequirement = new Map(
    persistedEvidence.map((row) => [row.requirementId, row]),
  );

  for (const candidate of factBackedEvidence) {
    const existing = byRequirement.get(candidate.requirementId);
    if (!existing) {
      byRequirement.set(candidate.requirementId, candidate);
      continue;
    }
    if (FAILURE_STATES.has(existing.currentState)) continue;

    const existingRank = EVIDENCE_RANK[existing.currentState];
    const candidateRank = EVIDENCE_RANK[candidate.currentState];
    if (existingRank > candidateRank) continue;
    if (existingRank === candidateRank && existing.sourceArtifactId) continue;

    byRequirement.set(candidate.requirementId, {
      ...candidate,
      sourceEventFactIds: unique([
        ...(existing.sourceEventFactIds ?? []),
        ...(candidate.sourceEventFactIds ?? []),
      ]),
      notes: candidate.notes ?? existing.notes,
    });
  }

  return [...byRequirement.values()];
}

export function isFactBackedEvidence(
  evidence: SourceEventEvidence | undefined,
): boolean {
  return Boolean(evidence?.sourceEventFactIds?.length);
}

function isTrustedGateFact(fact: SourceEventFactRow): boolean {
  return (
    !fact.is_stale &&
    TRUSTED_FACT_METHODS.has(fact.source_method) &&
    TRUSTED_FACT_CONFIDENCE.has(fact.confidence) &&
    hasCitation(fact) &&
    hasValue(fact)
  );
}

function hasCitation(fact: SourceEventFactRow): boolean {
  const citation = fact.source_citation;
  return Boolean(citation?.doc?.trim() && citation.locator?.trim());
}

function hasValue(fact: SourceEventFactRow): boolean {
  if (typeof fact.value_numeric === "number" && Number.isFinite(fact.value_numeric)) {
    return true;
  }
  return Boolean(fact.value_text?.trim());
}

function newestFact(facts: SourceEventFactRow[]): SourceEventFactRow | undefined {
  return facts
    .slice()
    .sort(
      (a, b) =>
        new Date(b.captured_at).getTime() -
        new Date(a.captured_at).getTime(),
    )[0];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
