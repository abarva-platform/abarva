// I4 · Sentinel authored pattern content.
//
// Pure deterministic authored content for the five canonical I1
// pattern keys. Renders alongside the I3 pattern detail surface to
// give the operator authored definition, failure modes, interventions,
// required evidence, related patterns, and handoff guidance.
//
// No live Sentinel runtime, no Claude / OpenAI / Pinecone invocation,
// no Date.now() reads. Same patternKey → identical content.
//
// This module does NOT import:
//   - src/lib/sentinel/**
//   - src/lib/atlas/**
//   - src/lib/nexus/**
//   - src/lib/agent/**
//   - src/components/agent/**
//   - src/lib/source/**
//   - src/app/programs/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import {
  SENTINEL_PATTERN_KEYS_IN_RANK_ORDER,
  type SentinelPatternHandoffTarget,
  type SentinelPatternKey,
} from '@/lib/intelligence/sentinel-pattern-detections';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type SentinelPatternContentCompleteness = 'partial' | 'authored';

export interface SentinelPatternFailureMode {
  id: string;
  title: string;
  description: string;
}

export interface SentinelPatternIntervention {
  id: string;
  title: string;
  description: string;
}

export interface SentinelPatternRelatedPattern {
  patternKey: SentinelPatternKey;
  reason: string;
}

export interface SentinelPatternHandoffGuidance {
  target: SentinelPatternHandoffTarget;
  guidance: string;
}

export interface SentinelPatternAuthoredContent {
  patternKey: SentinelPatternKey;
  patternName: string;
  definition: string;
  howSentinelDetected: ReadonlyArray<string>;
  whyItMatters: string;
  failureModes: ReadonlyArray<SentinelPatternFailureMode>;
  interventions: ReadonlyArray<SentinelPatternIntervention>;
  requiredEvidence: ReadonlyArray<string>;
  relatedPatterns: ReadonlyArray<SentinelPatternRelatedPattern>;
  handoffGuidance: ReadonlyArray<SentinelPatternHandoffGuidance>;
  contentCompleteness: SentinelPatternContentCompleteness;
  /** Marker: this is hand-authored deterministic seed content. */
  authoredAt: 'deterministic_seed';
}

// ---------------------------------------------------------------------
// Authored content (one entry per canonical pattern key)
// ---------------------------------------------------------------------

const CONTENT: Record<SentinelPatternKey, SentinelPatternAuthoredContent> = {
  value_ledger_incompleteness: {
    patternKey: 'value_ledger_incompleteness',
    patternName: 'Value ledger incompleteness',
    definition:
      'A class of patterns in which programs claim or imply business value without a captured baseline KPI, target, or realized-value entry. The dollar story is not defensible at canonical G3 (Design + Value) or G4 (CXO Verification) without a value ledger.',
    howSentinelDetected: ['value_not_ready'],
    whyItMatters:
      'Without a complete value ledger, dollar claims cannot be defended at canonical G3 / G4 and steering committees cannot prioritize portfolio investment. Atlas refuses to issue dollar claims; Nexus refuses substantive value answers; Steward must surface the gap before phase advancement.',
    failureModes: [
      {
        id: 'fm-no-baseline',
        title: 'No captured baseline KPI',
        description:
          'A program claims value uplift without a captured baseline; any "before" reference is anecdotal.',
      },
      {
        id: 'fm-no-target',
        title: 'No captured target',
        description:
          'A program has a baseline but no committed target; the value claim has no upper bound.',
      },
      {
        id: 'fm-no-realized-entry',
        title: 'No realized-value entry',
        description:
          'A program claims realized value without a tied measurement; the claim cannot survive G4 review.',
      },
    ],
    interventions: [
      {
        id: 'iv-attach-baseline',
        title: 'Attach baseline + target before G3',
        description:
          'Before promoting a Design + Value gate, capture the baseline KPI, target, and confidence band on the program record.',
      },
      {
        id: 'iv-realized-postmortem',
        title: 'Capture realized value at G4',
        description:
          'At verification, attach the realized-value entry with the measurement source and confidence band.',
      },
    ],
    requiredEvidence: [
      'Baseline KPI snapshot (with timestamp + measurement source)',
      'Committed target with confidence band',
      'Realized-value entry tied to the same measurement source',
      'CXO sign-off on the value chain',
    ],
    relatedPatterns: [
      {
        patternKey: 'evidence_chain_gap',
        reason:
          'Value claims always require a per-deliverable evidence chain; the two patterns often co-occur.',
      },
      {
        patternKey: 'gate_governance_gap',
        reason:
          'Without a value ledger, G3 / G4 gates cannot pass — the governance gap surfaces alongside.',
      },
      {
        patternKey: 'ai_governance_operating_model_gap',
        reason:
          'When value-ledger incompleteness spans multiple programs, the operating model itself is the issue.',
      },
    ],
    handoffGuidance: [
      {
        target: 'atlas',
        guidance:
          'Atlas can compose the executive editorial naming the value-ledger gap with confidence medium. It refuses to defend a dollar claim until the baseline + target + realized entry exist.',
      },
      {
        target: 'steward',
        guidance:
          'Steward must block phase advancement at G3 until the value ledger is complete; Steward should also surface the value gap in the next steering touchpoint.',
      },
    ],
    contentCompleteness: 'authored',
    authoredAt: 'deterministic_seed',
  },
  evidence_chain_gap: {
    patternKey: 'evidence_chain_gap',
    patternName: 'Evidence chain gap',
    definition:
      'A class of patterns in which deliverable conclusions cannot be traced back to interview or telemetry sources via E-id citations. Findings cannot survive CXO review without a complete evidence chain.',
    howSentinelDetected: ['evidence_not_ready'],
    whyItMatters:
      'Without a complete evidence chain, deliverable conclusions cannot be traced to interview or telemetry sources and findings cannot survive CXO review. Nexus drops to pattern-only retrieval; Atlas refuses citation; Steward must clear the gap before evidence-dependent gates promote.',
    failureModes: [
      {
        id: 'fm-stub-deliverable',
        title: 'Required deliverable still at Stub tier',
        description:
          'A required deliverable has not been promoted to Outline or Rich; the evidence chain has nothing to cite.',
      },
      {
        id: 'fm-missing-eid',
        title: 'No E-id attached to deliverable',
        description:
          'A deliverable exists but no evidence registry id (E-###) has been attached; conclusions cannot be traced.',
      },
      {
        id: 'fm-orphan-citation',
        title: 'Orphan citation',
        description:
          'An E-id is referenced but the underlying source artifact is missing or stale; the chain is broken.',
      },
    ],
    interventions: [
      {
        id: 'iv-promote-stub',
        title: 'Promote required-but-stub deliverables to Outline',
        description:
          'Move every required deliverable from Stub to at least Outline tier before claiming gate readiness.',
      },
      {
        id: 'iv-attach-eid',
        title: 'Attach E-id citations per deliverable',
        description:
          'For every deliverable that depends on interview or telemetry source, attach the E-id citation.',
      },
      {
        id: 'iv-validate-chain',
        title: 'Validate the citation chain end-to-end',
        description:
          'Confirm every E-id resolves to a parsed and indexed source artifact before evidence-dependent gates.',
      },
    ],
    requiredEvidence: [
      'Per-deliverable E-id citations with source artifact references',
      'Source artifact registry entries (interview transcript, telemetry export, document)',
      'CXO interview capture (when required by the program phase)',
      'Quality-checked status on every cited deliverable',
    ],
    relatedPatterns: [
      {
        patternKey: 'value_ledger_incompleteness',
        reason:
          'Evidence and value patterns co-occur; G3 requires both an evidence chain and a value ledger.',
      },
      {
        patternKey: 'program_context_sparsity',
        reason:
          'Thin Context Bundle and missing E-id citations both leave Nexus refusing substantive answers.',
      },
    ],
    handoffGuidance: [
      {
        target: 'steward',
        guidance:
          'Steward should walk the deliverable list, promote Stub tier, and attach E-ids before clearing evidence-dependent gates.',
      },
      {
        target: 'nexus',
        guidance:
          'Nexus should drop to pattern-only retrieval until the evidence chain is wired; do not let Nexus assert a citation it cannot defend.',
      },
    ],
    contentCompleteness: 'authored',
    authoredAt: 'deterministic_seed',
  },
  gate_governance_gap: {
    patternKey: 'gate_governance_gap',
    patternName: 'Gate governance gap',
    definition:
      'A class of patterns in which canonical hard gates are missing required inputs OR an executive decision is overdue. Phase advancement cannot be justified from seed alone; the cycle stalls or proceeds on undocumented authority.',
    howSentinelDetected: ['gate_missing_inputs', 'executive_decision_needed'],
    whyItMatters:
      'Phase advancement cannot be justified when canonical hard gates are missing inputs or when an executive decision is overdue; the cycle stalls or proceeds on undocumented authority. Steward refuses to advance the phase; Atlas surfaces the gap in editorial; Sentinel detects the recurrence.',
    failureModes: [
      {
        id: 'fm-charter-unsigned',
        title: 'G1 charter not signed',
        description:
          'A program in Diagnose claims to have entered without a signed charter; the executive mandate is implicit.',
      },
      {
        id: 'fm-cxo-interview-missing',
        title: 'G2 CXO interview missing before findings',
        description:
          'Findings are being authored without the canonical CXO interview that anchors them.',
      },
      {
        id: 'fm-design-value-incomplete',
        title: 'G3 design + value gate inputs incomplete',
        description:
          'A program claims design completeness without a captured projected value with confidence band.',
      },
      {
        id: 'fm-cxo-verification-missing',
        title: 'G4 CXO verification missing realized outcomes',
        description:
          'A program claims completion without CXO verification that realized outcomes match the value ledger.',
      },
      {
        id: 'fm-decision-overdue',
        title: 'Executive decision overdue',
        description:
          'Steward has flagged a blocking item that only an executive can clear, and the steering touchpoint has passed.',
      },
    ],
    interventions: [
      {
        id: 'iv-resolve-gate-input',
        title: 'Resolve the missing hard-gate input',
        description:
          'Capture the named input (charter signature, CXO interview note, projected value, CXO verification) before phase advancement.',
      },
      {
        id: 'iv-surface-decision',
        title: 'Surface the pending executive decision',
        description:
          'Place the decision on the next steering touchpoint agenda and assign the named decision-maker.',
      },
      {
        id: 'iv-document-authority',
        title: 'Document the override authority',
        description:
          'If a phase must advance without a hard-gate input, document the explicit override authority and the deferred remediation plan.',
      },
    ],
    requiredEvidence: [
      'Signed charter for G1',
      'CXO interview note for G2',
      'Projected value + confidence band + design sign-off for G3',
      'CXO verification of realized outcomes for G4',
      'Steering-touchpoint agenda with the pending decision named',
    ],
    relatedPatterns: [
      {
        patternKey: 'value_ledger_incompleteness',
        reason:
          'G3 requires a captured value ledger; the two patterns gate each other.',
      },
      {
        patternKey: 'evidence_chain_gap',
        reason:
          'Most gates require an evidence chain; the patterns often co-occur on the same program.',
      },
      {
        patternKey: 'ai_governance_operating_model_gap',
        reason:
          'Recurrent gate-governance gaps across programs surface the operating-model pattern.',
      },
    ],
    handoffGuidance: [
      {
        target: 'atlas',
        guidance:
          'Atlas can name the canonical gate that is missing inputs and the recommended next step; it should refuse to defend a phase advancement claim.',
      },
      {
        target: 'steward',
        guidance:
          'Steward must place blocking items on the next steering touchpoint and refuse to advance the phase until the named input is captured.',
      },
    ],
    contentCompleteness: 'authored',
    authoredAt: 'deterministic_seed',
  },
  program_context_sparsity: {
    patternKey: 'program_context_sparsity',
    patternName: 'Program context sparsity',
    definition:
      'A class of patterns in which the Context Bundle is in pattern_only / insufficient / blocked state OR required deliverables remain at Stub tier. Downstream agents must refuse substantive answers; Nexus cannot reach usable_with_gaps.',
    howSentinelDetected: ['context_insufficient', 'deliverable_coverage_gap'],
    whyItMatters:
      'When the Context Bundle is thin or required deliverables remain at Stub tier, downstream agents must refuse substantive answers and Nexus cannot reach a usable_with_gaps state. The user experience degrades; the program looks abandoned without honest sourcing.',
    failureModes: [
      {
        id: 'fm-pattern-only',
        title: 'Bundle in pattern_only state',
        description:
          'The Context Bundle exposes pattern context only; client-specific evidence is missing.',
      },
      {
        id: 'fm-bundle-insufficient',
        title: 'Bundle insufficient',
        description:
          'The Context Bundle is below the substantive-answer threshold; substantive answers are gated.',
      },
      {
        id: 'fm-stub-cluster',
        title: 'Stub-tier deliverable cluster',
        description:
          'Multiple required deliverables sit at Stub tier; the program does not yet have authored coverage.',
      },
    ],
    interventions: [
      {
        id: 'iv-seed-population',
        title: 'Land the seed-population slice',
        description:
          'Populate evidence references and value-ledger entries so the Context Bundle can lift to usable_with_gaps.',
      },
      {
        id: 'iv-promote-deliverables',
        title: 'Promote required-but-stub deliverables',
        description:
          'Move required deliverables to at least Outline tier before relying on the program for executive decisions.',
      },
    ],
    requiredEvidence: [
      'Context Bundle composition reaching usable_with_gaps or better',
      'Per-program evidence registry references',
      'Required deliverables at Outline tier or above',
    ],
    relatedPatterns: [
      {
        patternKey: 'evidence_chain_gap',
        reason:
          'Sparsity in deliverables and missing E-ids overlap; both block Nexus from substantive answers.',
      },
      {
        patternKey: 'ai_governance_operating_model_gap',
        reason:
          'Recurrent sparsity across programs surfaces the operating-model pattern.',
      },
    ],
    handoffGuidance: [
      {
        target: 'nexus',
        guidance:
          'Nexus should refuse substantive answers until the Context Bundle reaches usable_with_gaps; surface the gap honestly to the user instead of hallucinating.',
      },
      {
        target: 'sentinel',
        guidance:
          'Sentinel will track recurrence across steering touchpoints once persistence lands.',
      },
    ],
    contentCompleteness: 'authored',
    authoredAt: 'deterministic_seed',
  },
  ai_governance_operating_model_gap: {
    patternKey: 'ai_governance_operating_model_gap',
    patternName: 'AI governance operating model gap',
    definition:
      'A meta-pattern surfaced when at least two distinct programs share governance, gate, evidence, and value gaps. The issue is no longer per-program — the operating model itself is not yet fit to govern AI delivery at portfolio scale.',
    howSentinelDetected: [
      'value_not_ready',
      'evidence_not_ready',
      'gate_missing_inputs',
      'executive_decision_needed',
    ],
    whyItMatters:
      'When multiple programs share governance, gate, evidence, and value gaps, the issue is no longer per-program — the operating model itself is not yet fit to govern AI delivery at portfolio scale. Atlas can compose portfolio editorial; Steward must convene a governance review; Sentinel will track recurrence.',
    failureModes: [
      {
        id: 'fm-cross-program-recurrence',
        title: 'Cross-program recurrence',
        description:
          'The same governance / gate / evidence / value gap surfaces on multiple programs in the same steering cycle.',
      },
      {
        id: 'fm-no-portfolio-owner',
        title: 'No portfolio governance owner',
        description:
          'Programs share gaps but no named owner is accountable for the operating-model fix.',
      },
      {
        id: 'fm-orphan-decisions',
        title: 'Orphan decisions across programs',
        description:
          'Multiple programs are blocked on the same kind of executive decision that has not been routed to the right forum.',
      },
    ],
    interventions: [
      {
        id: 'iv-portfolio-review',
        title: 'Convene a portfolio governance review',
        description:
          'Stand up a portfolio-level review focused on the operating-model gap, not per-program triage.',
      },
      {
        id: 'iv-name-owner',
        title: 'Assign a portfolio governance owner',
        description:
          'Name the executive accountable for closing the operating-model gap and reporting at the next steering cycle.',
      },
      {
        id: 'iv-program-by-program',
        title: 'Steward clears program by program',
        description:
          'In parallel with the portfolio review, Steward should walk each affected program and resolve the per-program gap.',
      },
    ],
    requiredEvidence: [
      'Cross-program detection record (Sentinel I1 meta-pattern)',
      'Portfolio governance forum minutes',
      'Named portfolio owner with authority to close the gap',
      'Per-program remediation plan from Steward',
    ],
    relatedPatterns: [
      {
        patternKey: 'value_ledger_incompleteness',
        reason:
          'Recurrence of value-ledger incompleteness across programs is a strong indicator of the operating-model pattern.',
      },
      {
        patternKey: 'evidence_chain_gap',
        reason:
          'Recurrence of evidence-chain gaps signals the same operating-model issue.',
      },
      {
        patternKey: 'gate_governance_gap',
        reason:
          'Recurrence of gate-governance gaps is the most direct cross-program operating-model symptom.',
      },
      {
        patternKey: 'program_context_sparsity',
        reason:
          'Recurring context sparsity across programs implies the seed-population / capture pipeline is the underlying gap.',
      },
    ],
    handoffGuidance: [
      {
        target: 'atlas',
        guidance:
          'Atlas should compose a portfolio-level editorial naming the operating-model gap and the recommended forum + owner. Confidence cannot reach high until cross-steering recurrence is observed.',
      },
      {
        target: 'steward',
        guidance:
          'Steward should clear program by program in parallel with the portfolio review and surface a remediation plan.',
      },
      {
        target: 'sentinel',
        guidance:
          'Sentinel will track recurrence and surface a recurrence chip once persistence lands.',
      },
    ],
    contentCompleteness: 'authored',
    authoredAt: 'deterministic_seed',
  },
};

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build authored pattern content for a canonical Sentinel pattern
 * key. Returns null for unknown keys. Pure: same input → identical
 * output.
 */
export function buildSentinelPatternAuthoredContent(
  patternKey: string,
): SentinelPatternAuthoredContent | null {
  if (!isSentinelPatternKeyContent(patternKey)) return null;
  return CONTENT[patternKey];
}

/**
 * The canonical pattern key list this module authors content for.
 * Mirrors the I1 list so a regression in either contract is caught.
 */
export const SENTINEL_PATTERN_CONTENT_KEYS: ReadonlyArray<SentinelPatternKey> =
  SENTINEL_PATTERN_KEYS_IN_RANK_ORDER;

function isSentinelPatternKeyContent(value: string): value is SentinelPatternKey {
  return (SENTINEL_PATTERN_KEYS_IN_RANK_ORDER as ReadonlyArray<string>).includes(
    value,
  );
}
