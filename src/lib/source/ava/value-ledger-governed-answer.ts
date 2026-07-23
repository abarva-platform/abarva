// ─────────────────────────────────────────────────────────────────────────────
// Governed Source value-ledger chat answer.
//
// Projects the existing Source value ledger into an aVa `AvaAnswerPacket` with
// a value-waterfall chart and line-item table. This is read-only and event-
// scoped: it never calculates new savings, mutates ledger rows, claims realized
// value, or promotes anything into enterprise context.
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import type { ConfidenceLevel } from "@/lib/governance/context-corpus-policy";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import {
  readCommittedValueLevers,
  readRealizedValueLevers,
} from "@/lib/source/facts/event-facts-reader";
import type { ValueConfidence, ValueLedgerEntry } from "@/lib/source/types";
import { formatUsd, sumLedger } from "@/lib/source/value-ledger";
import {
  avaCitationsFromGovernedCandidates,
  governedClientKeyForSourceClientKey,
} from "@/lib/source/ava/vendor-coverage-governed-answer";

export interface BuildValueLedgerGovernedAnswerInput {
  eventId: string;
  /** Display name for the event, used only in prose — never used to scope the read. */
  eventName?: string | null;
  clientKey: string;
  tenantId: string | null;
  question: string;
}

export function looksLikeValueLedgerQuestion(
  prompt: string | undefined,
): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const hasStrongValueSignal =
    /\b(value|savings?|benefit|benefits|financial|finance|roi|waterfall|ledger|realized|realised|claimable|at stake|how much)\b/.test(
      q,
    );
  return (
    hasStrongValueSignal &&
    /\b(waterfall|ledger|value|savings?|benefit|benefits|projected|realized|realised|committed|measured|claimable|show|chart|table|status|at stake|how much)\b/.test(
      q,
    )
  );
}

export function valueConfidenceToConfidenceLevel(
  confidence: ValueConfidence,
): ConfidenceLevel {
  switch (confidence) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
  }
}

export function governedCandidateFromValueLedgerEntry(
  entry: ValueLedgerEntry,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
  const citation = `${entry.eventName} — ${entry.label} (${entry.kind}; ${entry.confidence} confidence; ${entry.evidenceCount} evidence references)`;
  return {
    id: entry.id,
    client_key: scope.clientKey,
    tenant_id: scope.tenantId,
    source_layer: "financial",
    source_basis: entry.note || entry.label,
    classification: "confidential",
    retrievability:
      entry.evidenceCount > 0 ? "committed_not_indexed" : "not_indexed",
    agent_readiness_status:
      entry.evidenceCount > 0 ? "committed_not_indexed" : "not_reviewed",
    confidence_level: valueConfidenceToConfidenceLevel(entry.confidence),
    cited_render_verified_at: null,
    title: `${entry.eventName} · ${entry.label}`,
    citations: [citation],
  };
}

/**
 * Build event-scoped ledger entries straight from `source_event_facts` —
 * the same real-facts seam `vendor-coverage-governed-answer.ts` reads,
 * never the mock event catalog. `committed_value_usd` rows back the
 * "projected" band (each lever's negotiated-and-evidenced value); `
 * realized_value_usd` rows back the "realized" band. Both are per-lever
 * `value_lever` facts, one row per canonical lever key — see
 * `readCommittedValueLevers`/`readRealizedValueLevers` in
 * `event-facts-reader.ts` for the exact read shape and staleness rules.
 * Never fabricates: an absent fact simply means that lever contributes
 * nothing to either band.
 */
async function readEntriesFromFacts(input: {
  eventId: string;
  clientKey: string;
  eventName: string;
}): Promise<{ entries: ValueLedgerEntry[]; signalPresent: boolean }> {
  const [committed, realized] = await Promise.all([
    readCommittedValueLevers({
      eventId: input.eventId,
      clientKey: input.clientKey,
    }),
    readRealizedValueLevers({
      eventId: input.eventId,
      clientKey: input.clientKey,
    }),
  ]);

  const entries: ValueLedgerEntry[] = [];
  for (const [leverKey, amountUsd] of committed.committedByLeverKey) {
    entries.push({
      id: `committed:${input.eventId}:${leverKey}`,
      eventId: input.eventId,
      eventName: input.eventName,
      kind: "projected",
      label: leverKey,
      stageKey: null,
      amountUsd,
      confidence: "high",
      evidenceCount: 1,
      note: "Committed value fact captured for this event (committed_value_usd).",
    });
  }
  for (const [leverKey, amountUsd] of realized.realizedByLeverKey) {
    entries.push({
      id: `realized:${input.eventId}:${leverKey}`,
      eventId: input.eventId,
      eventName: input.eventName,
      kind: "realized",
      label: leverKey,
      stageKey: null,
      amountUsd,
      confidence: "high",
      evidenceCount: 1,
      note: "Realized-to-date value fact captured for this event (realized_value_usd).",
    });
  }

  return {
    entries,
    signalPresent: committed.signalPresent || realized.signalPresent,
  };
}

function committedProjected(entries: readonly ValueLedgerEntry[]) {
  return entries.filter(
    (entry) => entry.confidence === "high" && entry.evidenceCount > 0,
  );
}

function measuringProjected(entries: readonly ValueLedgerEntry[]) {
  return entries.filter(
    (entry) => !(entry.confidence === "high" && entry.evidenceCount > 0),
  );
}

function buildValueWaterfallChart(args: {
  projectedUsd: number;
  committedUsd: number;
  measuringUsd: number;
  realizedUsd: number;
  citationIds: string[];
}): AnswerChart {
  return {
    id: "source-value-ledger-waterfall",
    kind: "waterfall",
    title: "Source value waterfall",
    subtitle:
      "Projected, committed, measurement-pending, and realized states stay separate.",
    data: {
      type: "waterfall",
      data: [
        { stage: "Projected", amountUsd: args.projectedUsd },
        { stage: "Committed evidence", amountUsd: args.committedUsd },
        { stage: "Needs measurement", amountUsd: args.measuringUsd },
        { stage: "Realized", amountUsd: args.realizedUsd },
      ],
      xKey: "stage",
      yKey: "amountUsd",
      unit: "USD",
    },
    xKey: "stage",
    yKey: "amountUsd",
    unit: "USD",
    citationIds: args.citationIds,
    sourceNote:
      "Amounts come from the existing Source value ledger read model; realized remains separate from projected and committed states.",
  };
}

function buildValueLedgerTable(args: {
  entries: readonly ValueLedgerEntry[];
  citationIds: string[];
}): AnswerTable {
  return {
    id: "source-value-ledger-line-items",
    title: "Value ledger line items",
    columns: [
      { key: "lineItem", label: "Line item", format: "text" },
      { key: "state", label: "State", format: "text" },
      { key: "amountUsd", label: "Amount", format: "currency", align: "right" },
      { key: "confidence", label: "Confidence", format: "text" },
      { key: "evidence", label: "Evidence", format: "number", align: "right" },
      { key: "note", label: "Basis", format: "text" },
    ],
    rows: args.entries.map((entry) => ({
      lineItem: entry.label,
      state: entry.kind,
      amountUsd: entry.amountUsd,
      confidence: entry.confidence,
      evidence: entry.evidenceCount,
      note: entry.note,
    })),
    note: "This table is event-scoped and mirrors the Source value ledger; it does not create new value claims.",
    citationIds: args.citationIds,
  };
}

function citationIdsForEntries(
  entries: readonly ValueLedgerEntry[],
  citations: readonly AnswerCitation[],
): string[] {
  const entryIds = new Set(entries.map((entry) => entry.id));
  return citations
    .filter((citation) => citation.recordId && entryIds.has(citation.recordId))
    .map((citation) => citation.id);
}

export async function buildValueLedgerGovernedAnswer(
  input: BuildValueLedgerGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const governedClientKey = governedClientKeyForSourceClientKey(
    input.clientKey,
  );
  if (!governedClientKey) return null;

  const { entries, signalPresent } = await readEntriesFromFacts({
    eventId: input.eventId,
    clientKey: input.clientKey,
    eventName: input.eventName ?? input.eventId,
  });
  const scoped = {
    projected: entries.filter((entry) => entry.kind === "projected"),
    realized: entries.filter((entry) => entry.kind === "realized"),
  };

  if (!signalPresent || entries.length === 0) {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "value_ledger_waterfall",
      status: "no_data",
      tenantFencePassed: true,
      directAnswer:
        "No event-scoped Source value ledger rows are available yet. I cannot show a value waterfall until projected, committed, measured, or realized line items are persisted for this event.",
      gaps: [
        {
          id: "source-value-ledger-event-rows-missing",
          label: "No event-scoped value ledger rows",
          detail:
            "Capture projected value, contractual commitment, measurement window, or realized benefit evidence before using aVa for value-waterfall decisions.",
          severity: "high",
        },
      ],
      caveats: [
        {
          id: "source-value-ledger-no-fabrication",
          label: "No fabricated savings",
          detail:
            "This answer does not borrow value from other Source events or infer a value line from prose.",
        },
      ],
      retrievalSummary: {
        substrate: "module_read_model",
        sourceCount: 0,
        hasTenantFacts: false,
        hasCorpus: false,
        hasExperts: false,
      },
    });
  }

  const candidates = entries.map((entry) =>
    governedCandidateFromValueLedgerEntry(entry, {
      clientKey: governedClientKey,
      tenantId: input.tenantId,
    }),
  );
  const bundle = buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: false,
  });

  if (bundle.decision === "block") {
    return composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey: governedClientKey,
      question: input.question,
      intent: "value_ledger_waterfall",
      status: "blocked",
      tenantFencePassed: false,
      gaps: [
        {
          id: "source-value-ledger-governance-blocked",
          label: "Value ledger evidence blocked by governance policy",
          detail:
            bundle.blocked
              .flatMap((blocked) => blocked.errors)
              .slice(0, 3)
              .join("; ") || "The governance gate blocked every value row.",
          severity: "high",
        },
      ],
    });
  }

  const projectedUsd = sumLedger(scoped.projected);
  const realizedUsd = sumLedger(scoped.realized);
  const committedUsd = sumLedger(committedProjected(scoped.projected));
  const measuringUsd = sumLedger(measuringProjected(scoped.projected));
  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const citationIds = citationIdsForEntries(entries, citations);
  const eventName = entries[0]?.eventName ?? input.eventId;
  const realizedClause =
    realizedUsd > 0
      ? `${formatUsd(realizedUsd)} is registered as realized in the ledger, but still depends on the cited governance status before it can be used as an external realized-savings claim.`
      : "No realized value is registered for this event yet.";

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: governedClientKey,
    question: input.question,
    intent: "value_ledger_waterfall",
    status: "answered",
    tenantFencePassed: true,
    directAnswer: `${eventName} carries ${formatUsd(projectedUsd)} of projected Source value. ${formatUsd(committedUsd)} is high-confidence with evidence, ${formatUsd(measuringUsd)} still needs measurement or stronger evidence, and ${realizedClause}`,
    businessImplication:
      realizedUsd > 0
        ? "The event has a value trail, but leaders still need to check whether realized rows are finance-attested and cite-render verified before using them as claimable value."
        : "This is a planning and governance view: useful for execution focus, but not a realized-savings proof point.",
    recommendation:
      measuringUsd > 0
        ? "Convert the measurement-pending value lines into owner-attested evidence with a baseline, measurement window, and accepted source artifact before claiming the value externally."
        : "Keep the ledger tied to accepted evidence and only promote lines into enterprise context after indexing and cite-render verification are complete.",
    artifacts: [
      {
        ...buildValueWaterfallChart({
          projectedUsd,
          committedUsd,
          measuringUsd,
          realizedUsd,
          citationIds,
        }),
        artifact: "chart" as const,
      },
      {
        ...buildValueLedgerTable({ entries, citationIds }),
        artifact: "table" as const,
      },
    ],
    citations,
    caveats: [
      {
        id: "source-value-ledger-not-realized-claim",
        label: "Projected is not realized",
        detail:
          "Projected, committed, measured, and realized value are intentionally kept separate. aVa must not collapse them into one savings claim.",
      },
      {
        id: "source-value-ledger-enterprise-context-gap",
        label: "Not enterprise-context promotion",
        detail:
          "This answer confirms persisted Source ledger rows in the module read model; it does not claim vector indexing, agent_ready promotion, or Tower/enterprise-context ingestion.",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      metricCount: entries.length,
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
