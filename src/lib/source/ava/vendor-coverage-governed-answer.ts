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
import { canonicalTenantKey } from '@/lib/tenant/aliases';
import {
  readEventFacts,
  readVendorLeverResponseFacts,
  readVendorLeverResponses,
  type VendorLeverResponseFact,
} from '@/lib/source/facts/event-facts-reader';
import type { FactConfidence } from '@/lib/source/facts/fact-types';
import { buildResponseCoverageInsight } from '@/lib/source/facts/view/step-insight-builder';
import { resolveValueArchetype } from '@/lib/source/facts/view/stage-analytics-builder';
import {
  buildVendorResponseMveProfiles,
  type VendorResponseProfileEventRef,
} from '@/lib/source/proposal-intelligence/mve-profile';
import type {
  VendorExtractionCard,
  VendorResponseProfile,
} from '@/lib/source/proposal-intelligence/types';
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
  /**
   * Source data-plane client key. Many Source tables still use app-era aliases
   * such as `meridian`; governance candidates must use the canonical tenant key.
   */
  clientKey: string;
  tenantId: string | null;
  question: string;
  /** The event's raw event_type, used to resolve the value archetype. */
  eventType?: string | null;
  /** Event display identity for response-stage proposal-profile grounding. */
  event?: VendorResponseProfileEventRef | null;
}

/**
 * Normalize an app/data-plane client key to the canonical governance key. Source
 * fact reads must still use the raw app key, but `GovernedCandidate.client_key`
 * is validated against `CANONICAL_TENANT_KEYS`.
 */
export function governedClientKeyForSourceClientKey(
  clientKey: string,
): string | null {
  const governedClientKey = canonicalTenantKey(clientKey);
  return isCanonicalClientKey(governedClientKey) ? governedClientKey : null;
}

function proposalCardConfidenceToConfidenceLevel(
  confidence: VendorExtractionCard['confidence'],
): ConfidenceLevel {
  switch (confidence) {
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
  }
}

function governedCandidateFromProposalCard(
  profile: VendorResponseProfile,
  card: VendorExtractionCard,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
  const sourceBasis = card.evidenceReference ?? profile.packageSummary;
  return {
    id: `${profile.vendorId}:${card.cardId}`,
    client_key: scope.clientKey,
    tenant_id: scope.tenantId,
    source_layer: 'vendor',
    source_basis: sourceBasis,
    classification: 'confidential',
    retrievability: 'not_indexed',
    agent_readiness_status: 'not_reviewed',
    confidence_level: proposalCardConfidenceToConfidenceLevel(card.confidence),
    cited_render_verified_at: null,
    title: `${profile.vendorName} · ${card.title}`,
    citations: sourceBasis ? [sourceBasis] : [],
  };
}

function firstMissingOrPartial(profile: VendorResponseProfile): string {
  const openSections = [
    ...profile.responseCompleteness.missingSections.map(
      (section) => `Missing: ${section}`,
    ),
    ...profile.responseCompleteness.partialSections.map(
      (section) => `Partial: ${section}`,
    ),
  ];
  return openSections[0] ?? 'No missing or partial response sections';
}

function buildProfileGroundedVendorCoverageAnswer(
  input: BuildVendorCoverageGovernedAnswerInput & {
    governedClientKey: string;
    profiles: readonly VendorResponseProfile[];
  },
): AvaAnswerPacket | null {
  if (input.profiles.length === 0) return null;

  const candidates = input.profiles.flatMap((profile) =>
    profile.extractionCards.map((card) =>
      governedCandidateFromProposalCard(profile, card, {
        clientKey: input.governedClientKey,
        tenantId: input.tenantId,
      }),
    ),
  );
  const bundle = buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: false,
  });

  if (bundle.decision === 'block') {
    return composeAvaAnswer({
      surface: 'source',
      mode: 'SOURCE',
      tenantKey: input.governedClientKey,
      question: input.question,
      intent: 'vendor_response_coverage',
      status: 'blocked',
      tenantFencePassed: false,
      gaps: [
        {
          id: 'vendor-profile-governance-blocked',
          label: 'Vendor-response profile evidence blocked by governance policy',
          detail:
            bundle.blocked
              .flatMap((b) => b.errors)
              .slice(0, 3)
              .join('; ') || 'The governance gate blocked every profile row.',
        },
      ],
    });
  }

  const citations = avaCitationsFromGovernedCandidates(bundle.usable);
  const unresolvedProfiles = input.profiles.filter(
    (profile) =>
      profile.readyForEvaluation !== 'yes' ||
      profile.unsupportedClaims.length > 0 ||
      profile.responseCompleteness.missingSections.length > 0 ||
      profile.responseCompleteness.partialSections.length > 0,
  );
  const unresolvedNames = unresolvedProfiles
    .slice(0, 3)
    .map((profile) => profile.vendorName)
    .join(', ');
  const headline = unresolvedProfiles.length
    ? `${unresolvedNames} still need evidence closure before their claims can be treated as clean.`
    : 'All visible response profiles are complete enough for evaluation setup.';

  const table: AnswerTable = {
    id: 'vendor-response-profile-coverage',
    title: 'Vendor response profile coverage',
    columns: [
      { key: 'vendor', label: 'Vendor', format: 'text' },
      {
        key: 'readiness',
        label: 'Readiness',
        format: 'text',
      },
      {
        key: 'unsupportedClaims',
        label: 'Unsupported claims',
        format: 'number',
        align: 'right',
      },
      {
        key: 'responseCompleteness',
        label: 'Response complete',
        format: 'percent',
        align: 'right',
      },
      { key: 'openEvidence', label: 'Open evidence', format: 'text' },
      { key: 'nextAction', label: 'Next action', format: 'text' },
    ],
    rows: input.profiles.map((profile) => ({
      vendor: profile.vendorName,
      readiness: profile.readyForEvaluation,
      unsupportedClaims: profile.unsupportedClaims.length,
      responseCompleteness: profile.responseCompleteness.percent / 100,
      openEvidence:
        profile.unsupportedClaims[0] ?? firstMissingOrPartial(profile),
      nextAction:
        profile.clarificationQuestions[0] ??
        'Proceed with human score lock.',
    })),
    note: headline,
    citationIds: citations.map((c) => c.id),
  };

  return composeAvaAnswer({
    surface: 'source',
    mode: 'SOURCE',
    tenantKey: input.governedClientKey,
    question: input.question,
    intent: 'vendor_response_coverage',
    status: 'answered',
    tenantFencePassed: true,
    directAnswer: headline,
    artifacts: [{ ...table, artifact: 'table' as const }],
    citations,
    caveats: [
      {
        id: 'vendor-profile-grounding',
        label: 'Grounded to visible response profiles',
        detail:
          'This answer uses the same Vendor A/B/C proposal-profile substrate rendered on the Responses stage; lower-level ambient vendor rows are not mixed into this view.',
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

/**
 * Build the governed vendor-coverage answer, or `null` when there's nothing
 * honest to say: no response signal yet, no archetype, or the archetype has no
 * vendor rows. `null` means the caller falls through to the existing prose-only
 * chat behavior — never a fabricated placeholder table.
 */
export async function buildVendorCoverageGovernedAnswer(
  input: BuildVendorCoverageGovernedAnswerInput,
): Promise<AvaAnswerPacket | null> {
  const trace = (step: string, detail: Record<string, unknown>) => {
    console.error(
      '[source.vendor-coverage-governed-answer.trace]',
      JSON.stringify({
        step,
        eventId: input.eventId,
        clientKey: input.clientKey,
        governedClientKey:
          detail.governedClientKey ??
          governedClientKeyForSourceClientKey(input.clientKey),
        eventType: input.eventType,
        ...detail,
      }),
    );
  };

  const governedClientKey = governedClientKeyForSourceClientKey(input.clientKey);
  if (!governedClientKey) {
    trace('not_governable_client_key', {});
    return null;
  }

  const profileSet = input.event
    ? buildVendorResponseMveProfiles({
        id: input.event.id,
        code: input.event.code,
        name: input.event.name,
        accountName: input.event.accountName,
      })
    : null;
  if (profileSet?.profiles.length) {
    trace('using_response_profile_grounding', {
      profileCount: profileSet.profiles.length,
      profileVendors: profileSet.profiles.map((profile) => profile.vendorName),
    });
    return buildProfileGroundedVendorCoverageAnswer({
      ...input,
      governedClientKey,
      profiles: profileSet.profiles,
    });
  }

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

  if (!vendorResponses.signalPresent) {
    trace('no_vendor_response_signal', {
      vendorLeverFactsCount: vendorLeverFacts.length,
    });
    return null;
  }

  const archetype = resolveValueArchetype(input.eventType);
  if (!archetype) {
    trace('no_archetype_resolved', {});
    return null;
  }

  const insight = buildResponseCoverageInsight(
    archetype,
    factsRead.inputs,
    vendorResponses,
  );
  if (insight.isModel || !insight.vendors || insight.vendors.length === 0) {
    trace('insight_not_live_or_no_vendors', {
      archetypeId: archetype.id,
      archetypeEventType: archetype.eventType,
      isModel: insight.isModel,
      vendorsCount: insight.vendors?.length ?? 0,
      signalVendors: vendorResponses.vendors,
    });
    return null;
  }
  trace('insight_live_with_vendors', {
    archetypeId: archetype.id,
    vendorsCount: insight.vendors.length,
  });

  const candidates = vendorLeverFacts.map((fact) =>
    governedCandidateFromVendorLeverFact(fact, {
      clientKey: governedClientKey,
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
      tenantKey: governedClientKey,
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
    tenantKey: governedClientKey,
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
