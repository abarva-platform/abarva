// ─────────────────────────────────────────────────────────────────────────────
// Governed vendor-coverage chat answer — the first live call site for
// `buildValidatedAgentContextBundle` (Context & Corpus Governance, AGENTS.md).
//
// Builds a structured `AvaAnswerPacket` (a real table, real citations) for a
// vendor-response-coverage question asked in the Source event canvas chat. The
// underlying numbers are NEVER re-derived here — they come straight from
// `buildResponseCoverageInsight`, the same builder the canvas panel renders, so
// a chat answer can never contradict what's on screen. What this module adds is
// the governance step: every fact row backing the answer is mapped to a real,
// honestly-scored `GovernedCandidate` and run through the mandatory gate before
// it may back a table the user sees.
//
// KNOWN, DELIBERATE LIMITATION (see release record): `source_event_facts` is
// never indexed anywhere, so every candidate here is honestly
// `retrievability: "not_indexed"` and `agent_readiness_status: "not_reviewed"` —
// this evidence class can never reach `agent_ready` under the current two-state
// retrievability model. The gate is called with `requireAgentReady: false`
// because `true` would permanently block this feature; that is not a
// convenience default, it is the only setting under which this feature can ever
// produce a non-blocked answer while staying honest. A `block` decision (e.g. a
// sensitive classification override) still fully suppresses the table — this
// module never silently degrades to a fabricated one.
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from '@/lib/governance/agent-context-bundle';
import {
  isCanonicalClientKey,
  type ConfidenceLevel,
} from '@/lib/governance/context-corpus-policy';
import {
  readEventFacts,
  readVendorLeverResponseFacts,
  readVendorLeverResponses,
  type VendorLeverResponseFact,
} from '@/lib/source/facts/event-facts-reader';
import type { FactConfidence } from '@/lib/source/facts/fact-types';
import { buildResponseCoverageInsight } from '@/lib/source/facts/view/step-insight-builder';
import { resolveValueArchetype } from '@/lib/source/facts/view/stage-analytics-builder';
import { composeAvaAnswer } from '@/lib/ava-answer/composeAvaAnswer';
import type {
  AnswerCitation,
  AnswerTable,
  AvaAnswerPacket,
} from '@/lib/ava-answer/contract';

/** `FactConfidence` ('low'|'med'|'high') and `ConfidenceLevel` ('low'|'medium'|
 * 'high'|'unverified') don't share string values — an explicit mapper, not a
 * cast, so a typo can't silently mis-map a confidence tier. */
export function factConfidenceToConfidenceLevel(
  confidence: FactConfidence,
): ConfidenceLevel {
  switch (confidence) {
    case 'low':
      return 'low';
    case 'med':
      return 'medium';
    case 'high':
      return 'high';
  }
}

/**
 * Map one persisted vendor-lever response fact row to the governance-relevant
 * subset the bundle gate needs. Every field is either read verbatim from the
 * fact row or an honest, conservative constant — nothing here is guessed:
 *  - `classification: "confidential"` — vendor commercial/pricing signal, the
 *    protective default for this evidence class.
 *  - `retrievability: "not_indexed"` / `agent_readiness_status: "not_reviewed"`
 *    — honestly always true today (see module doc above).
 *  - `cited_render_verified_at: null` — nothing verifies this render
 *    end-to-end yet.
 */
export function governedCandidateFromVendorLeverFact(
  fact: VendorLeverResponseFact,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
  const citation = fact.sourceCitation
    ? [`${fact.sourceCitation.doc} — ${fact.sourceCitation.locator}`]
    : [];
  return {
    id: fact.id,
    client_key: scope.clientKey,
    tenant_id: scope.tenantId,
    source_layer: 'vendor',
    source_basis: fact.sourceCitation?.doc ?? null,
    classification: 'confidential',
    retrievability: 'not_indexed',
    agent_readiness_status: 'not_reviewed',
    confidence_level: factConfidenceToConfidenceLevel(fact.confidence),
    cited_render_verified_at: null,
    title: `${fact.vendorId} · ${fact.leverKey}`,
    citations: citation,
  };
}

/** Mirrors `answerCitationsFromAskSources` (Intelligence's adapter pattern) —
 * builds real `AnswerCitation[]` from the bundle's `usable` candidates, not the
 * flattened `citations: string[]`, which lacks the structure the packet needs. */
export function avaCitationsFromGovernedCandidates(
  candidates: readonly GovernedCandidate[],
): AnswerCitation[] {
  return candidates.slice(0, 8).map((candidate, index) => ({
    id: `vc${index + 1}`,
    label: candidate.title ?? candidate.id,
    sourceClass: 'tenant-fact',
    recordId: candidate.id,
    excerpt: candidate.citations?.[0],
    confidence:
      candidate.confidence_level && candidate.confidence_level !== 'unverified'
        ? candidate.confidence_level
        : undefined,
  }));
}

export interface BuildVendorCoverageGovernedAnswerInput {
  eventId: string;
  /** Canonical tenant key — validated against CANONICAL_TENANT_KEYS before use. */
  clientKey: string;
  tenantId: string | null;
  question: string;
  /** The event's raw event_type, used to resolve the value archetype. */
  eventType?: string | null;
}

/**
 * Build the governed vendor-coverage answer, or `null` when there's nothing
 * honest to say: no response signal yet, no archetype, or the archetype has no
 * vendor rows. `null` means the caller falls through to the existing prose-only
 * chat behavior — never a fabricated placeholder table.
 */
export async function buildVendorCoverageGovernedAnswer(
  input: BuildVendorCoverageGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  if (!isCanonicalClientKey(input.clientKey)) return null;

  const [factsRead, vendorResponses, vendorLeverFacts] = await Promise.all([
    readEventFacts({ eventId: input.eventId, clientKey: input.clientKey }),
    readVendorLeverResponses({
      eventId: input.eventId,
      clientKey: input.clientKey,
    }),
    readVendorLeverResponseFacts({
      eventId: input.eventId,
      clientKey: input.clientKey,
    }),
  ]);

  if (!vendorResponses.signalPresent) return null;

  const archetype = resolveValueArchetype(input.eventType);
  if (!archetype) return null;

  const insight = buildResponseCoverageInsight(
    archetype,
    factsRead.inputs,
    vendorResponses,
  );
  if (insight.isModel || !insight.vendors || insight.vendors.length === 0) {
    return null;
  }

  const candidates = vendorLeverFacts.map((fact) =>
    governedCandidateFromVendorLeverFact(fact, {
      clientKey: input.clientKey,
      tenantId: input.tenantId,
    }),
  );
  const bundle = buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: false,
  });

  if (bundle.decision === 'block') {
    return composeAvaAnswer({
      surface: 'source',
      mode: 'SOURCE',
      tenantKey: input.clientKey,
      question: input.question,
      intent: 'vendor_response_coverage',
      status: 'blocked',
      tenantFencePassed: false,
      gaps: [
        {
          id: 'vendor-coverage-governance-blocked',
          label: 'Vendor-response evidence blocked by governance policy',
          detail:
            bundle.blocked
              .flatMap((b) => b.errors)
              .slice(0, 3)
              .join('; ') || 'The governance gate blocked every candidate.',
        },
      ],
    });
  }

  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const table: AnswerTable = {
    id: 'vendor-response-coverage',
    title: 'Vendor response coverage',
    columns: [
      { key: 'vendor', label: 'Vendor', format: 'text' },
      { key: 'addressed', label: 'Addressed', format: 'number', align: 'right' },
      { key: 'partial', label: 'Partial', format: 'number', align: 'right' },
      { key: 'dodged', label: 'Dodged', format: 'number', align: 'right' },
      {
        key: 'notYetAnswered',
        label: 'Not yet answered',
        format: 'number',
        align: 'right',
      },
      {
        key: 'exposedHighUsd',
        label: '$ at stake exposed',
        format: 'currency',
        align: 'right',
      },
    ],
    rows: insight.vendors.map((vendor) => ({
      vendor: vendor.vendorId,
      addressed: vendor.addressed,
      partial: vendor.partial,
      dodged: vendor.dodged,
      notYetAnswered: vendor.notYetAnswered,
      exposedHighUsd: vendor.exposedHighUsd,
    })),
    note: insight.headline,
    citationIds: citations.map((c) => c.id),
  };

  return composeAvaAnswer({
    surface: 'source',
    mode: 'SOURCE',
    tenantKey: input.clientKey,
    question: input.question,
    intent: 'vendor_response_coverage',
    status: 'answered',
    // The block branch above already returned, so reaching here means the
    // gate's decision is 'pass' or 'warn' — either way the fence passed.
    tenantFencePassed: true,
    directAnswer: insight.headline,
    artifacts: [{ ...table, artifact: 'table' as const }],
    citations,
    caveats: [
      {
        id: 'vendor-coverage-governance-known-gap',
        label: 'Governance coverage, not indexing',
        detail:
          'These rows passed the mandatory context-and-corpus gate (not_reviewed / not_indexed by design — vendor response facts are not indexed anywhere yet), not full agent-ready promotion.',
      },
    ],
    retrievalSummary: {
      substrate: 'module_read_model',
      sourceCount: citations.length,
      hasTenantFacts: citations.length > 0,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
