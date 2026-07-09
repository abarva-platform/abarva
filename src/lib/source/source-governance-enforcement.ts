import {
  criterionById,
  requiredEvidenceForStage,
  specByCode,
} from './canonical-specs';
import { SOURCE_STAGE_ORDER } from './constants';
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from './canvas-substrate';
import type { SourceStageKey } from './types';

export const SOURCE_APPROVAL_REASON_MIN_LENGTH = 12;
export const SOURCE_HUMAN_EDIT_METADATA_KEYS = [
  'humanEditedAt',
  'humanReviewedAt',
] as const;

export interface SourceGovernanceBlocker {
  code: string;
  detail: string;
}

export interface SourceGovernanceVerdict {
  ok: boolean;
  blockers: SourceGovernanceBlocker[];
}

export type SourceArtifactEvidenceState =
  | 'evidenced'
  | 'partial_evidence'
  | 'assumption'
  | 'missing_evidence'
  | 'archetype_recommendation'
  | 'human_override';

export type SourceArtifactReadiness =
  | 'not_generated'
  | 'ready'
  | 'needs_review'
  | 'blocked';

export interface SourceArtifactReadinessVerdict {
  artifactCode: string;
  artifactLabel: string;
  status: SourceEventArtifactState['status'] | 'client_final';
  readiness: SourceArtifactReadiness;
  vendorFacingSafe: boolean;
  humanReviewed: boolean;
  blockers: SourceGovernanceBlocker[];
  warnings: SourceGovernanceBlocker[];
  generatedAt: string | null;
  evidenceState: SourceArtifactEvidenceState;
}

export interface SourceArtifactSetReadinessVerdict {
  artifacts: SourceArtifactReadinessVerdict[];
  crossArtifactBlockers: SourceGovernanceBlocker[];
}

const PASSING_ARTIFACT_STATUSES = new Set(['approved', 'locked']);
const SOURCE_VENDOR_FACING_ARTIFACT_CODES = new Set([
  'd01_strategy_memo',
  'd05_scope_memo',
  'd09_rfp_pack',
  'd11_response_checklist',
  'd16_scorecard',
  'd22_bafo_question_pack',
  'd24_decision_brief',
]);

const CROSS_ARTIFACT_MONEY_CODES = new Set([
  'd01_strategy_memo',
  'd05_scope_memo',
  'd09_rfp_pack',
  'd11_response_checklist',
  'd16_scorecard',
  'd22_bafo_question_pack',
  'd24_decision_brief',
]);

const EVIDENCE_RANK: Record<SourceEventEvidence['currentState'], number> = {
  'Not Requested': 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  'Usable Evidence': 4,
  Stale: -1,
  'Low Confidence': -1,
};

export function normalizeApprovalReason(reason: unknown): string {
  return typeof reason === 'string' ? reason.trim() : '';
}

export function validateApprovalReason(reason: unknown): SourceGovernanceVerdict {
  const normalized = normalizeApprovalReason(reason);
  if (normalized.length >= SOURCE_APPROVAL_REASON_MIN_LENGTH) {
    return pass();
  }

  return fail({
    code: 'approval_reason_required',
    detail: `A human approval reason of at least ${SOURCE_APPROVAL_REASON_MIN_LENGTH} characters is required.`,
  });
}

export function isArtifactHumanReviewed(artifact: SourceEventArtifactState | undefined): boolean {
  if (!artifact) return false;
  if (artifact.linkedArtifactId) return true;
  if (!artifact.body?.trim()) return false;
  const metadata = artifact.bodyGenerationMetadata;
  if (!metadata) return true;
  return SOURCE_HUMAN_EDIT_METADATA_KEYS.some((key) => typeof metadata[key] === 'string');
}

export function isArtifactGateReady(artifact: SourceEventArtifactState | undefined): boolean {
  if (!artifact) return false;
  if (!PASSING_ARTIFACT_STATUSES.has(artifact.status)) return false;
  return isArtifactHumanReviewed(artifact);
}

export function evaluateSourceArtifactReadiness(input: {
  artifact: SourceEventArtifactState | undefined;
  crossArtifactBlockers?: SourceGovernanceBlocker[];
}): SourceArtifactReadinessVerdict {
  const artifactCode = input.artifact?.artifactCode ?? 'unknown';
  const artifactLabel = specByCode(artifactCode)?.name ?? artifactCode;
  const blockers: SourceGovernanceBlocker[] = [
    ...(input.crossArtifactBlockers ?? []),
  ];
  const warnings: SourceGovernanceBlocker[] = [];
  const metadata = input.artifact?.bodyGenerationMetadata ?? null;
  const body = input.artifact?.body?.trim() ?? '';
  const status = input.artifact?.status ?? 'not_started';

  if (!input.artifact || status === 'not_started' || !body) {
    return {
      artifactCode,
      artifactLabel,
      status,
      readiness: 'not_generated',
      vendorFacingSafe: false,
      humanReviewed: false,
      blockers: [
        ...blockers,
        {
          code: 'artifact_not_generated',
          detail: `${artifactLabel} has no generated or authored body yet.`,
        },
      ],
      warnings,
      generatedAt: readString(metadata?.generatedAt),
      evidenceState: 'missing_evidence',
    };
  }

  if (status === 'needs_review') {
    blockers.push({
      code: 'artifact_needs_review',
      detail: `${artifactLabel} is marked needs review and cannot be issued as ready.`,
    });
  }

  const qualityGate = readRecord(metadata?.qualityGate);
  if (qualityGate && qualityGate.passed !== true) {
    blockers.push({
      code: 'quality_gate_failed',
      detail: `${artifactLabel} did not pass its quality gate.`,
    });
  }
  if (artifactCode === 'd09_rfp_pack' && !qualityGate) {
    blockers.push({
      code: 'quality_gate_missing',
      detail: 'RFP Package requires a recorded quality gate before vendor issuance.',
    });
  }

  const sectionVerification = readRecord(metadata?.sectionVerification);
  if (sectionVerification?.status === 'incomplete') {
    const missing = Array.isArray(sectionVerification.missingSections)
      ? sectionVerification.missingSections.map(String).join(', ')
      : 'required sections';
    blockers.push({
      code: 'required_sections_missing',
      detail: `${artifactLabel} is missing ${missing}.`,
    });
  }

  blockers.push(...lintSourceArtifactBody(artifactCode, body));
  warnings.push(...warnSourceArtifactBody(artifactCode, body));

  const humanReviewed = isArtifactHumanReviewed(input.artifact);
  const vendorFacingArtifact = SOURCE_VENDOR_FACING_ARTIFACT_CODES.has(artifactCode);
  const readiness =
    blockers.length > 0
      ? status === 'needs_review' || qualityGate?.passed === false
        ? 'needs_review'
        : 'blocked'
      : 'ready';

  return {
    artifactCode,
    artifactLabel,
    status,
    readiness,
    vendorFacingSafe: readiness === 'ready' && (!vendorFacingArtifact || humanReviewed),
    humanReviewed,
    blockers,
    warnings,
    generatedAt: readString(metadata?.generatedAt),
    evidenceState: inferArtifactEvidenceState({
      metadata,
      readiness,
      humanReviewed,
      body,
    }),
  };
}

export function evaluateSourceArtifactSetReadiness(
  artifacts: readonly SourceEventArtifactState[],
): SourceArtifactSetReadinessVerdict {
  const crossArtifactBlockers = evaluateCrossArtifactMoneyConsistency(artifacts);
  return {
    crossArtifactBlockers,
    artifacts: artifacts.map((artifact) =>
      evaluateSourceArtifactReadiness({
        artifact,
        crossArtifactBlockers: crossArtifactBlockers.filter((blocker) =>
          blocker.code.includes(artifact.artifactCode),
        ),
      }),
    ),
  };
}

export function buildArtifactReadinessMetadata(
  verdict: SourceArtifactReadinessVerdict,
): Record<string, unknown> {
  return {
    status: verdict.readiness,
    vendorFacingSafe: verdict.vendorFacingSafe,
    humanReviewed: verdict.humanReviewed,
    evidenceState: verdict.evidenceState,
    blockerCount: verdict.blockers.length,
    warningCount: verdict.warnings.length,
    blockers: verdict.blockers,
    warnings: verdict.warnings,
  };
}

export function evaluateCriterionMetReadiness(input: {
  criterion: SourceEventGateCriterion;
  artifacts: SourceEventArtifactState[];
  evidence: SourceEventEvidence[];
  reason: unknown;
}): SourceGovernanceVerdict {
  const blockers: SourceGovernanceBlocker[] = [
    ...validateApprovalReason(input.reason).blockers,
  ];
  const definition = criterionById(input.criterion.criterionId);

  if (!definition) {
    blockers.push({
      code: 'criterion_definition_missing',
      detail: `No canonical definition exists for ${input.criterion.criterionId}.`,
    });
  }

  for (const artifactCode of definition?.linkedArtifactCodes ?? []) {
    const artifact = input.artifacts.find((row) => row.artifactCode === artifactCode);
    if (!isArtifactGateReady(artifact)) {
      blockers.push({
        code: 'linked_artifact_not_committed',
        detail: `${artifactCode} must be authored and approved or locked before this gate can be marked met.`,
      });
    }
  }

  const requiredEvidence = requiredEvidenceForStage(input.criterion.fromStage);
  for (const requirement of requiredEvidence) {
    const state = input.evidence.find((row) => row.requirementId === requirement.requirementId);
    if (!state || EVIDENCE_RANK[state.currentState] < EVIDENCE_RANK[requirement.minimumState]) {
      blockers.push({
        code: 'required_evidence_not_ready',
        detail: `${requirement.label} must be at least ${requirement.minimumState}; current state is ${state?.currentState ?? 'missing'}.`,
      });
    }
  }

  return { ok: blockers.length === 0, blockers };
}

export function evaluateStagePromotionReadiness(input: {
  currentStage: SourceStageKey;
  targetStage: SourceStageKey;
  criteria: SourceEventGateCriterion[];
  artifacts?: SourceEventArtifactState[];
  evidence?: SourceEventEvidence[];
  reason: unknown;
}): SourceGovernanceVerdict {
  const blockers: SourceGovernanceBlocker[] = [
    ...validateApprovalReason(input.reason).blockers,
  ];
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(input.currentStage);
  const targetIndex = SOURCE_STAGE_ORDER.indexOf(input.targetStage);

  if (currentIndex < 0 || targetIndex < 0) {
    blockers.push({
      code: 'invalid_stage',
      detail: 'Current and target stages must both be canonical Source stages.',
    });
  } else if (targetIndex !== currentIndex + 1) {
    blockers.push({
      code: 'non_adjacent_stage_promotion',
      detail: `Stage promotion must move exactly one step from ${input.currentStage}; requested ${input.targetStage}.`,
    });
  }

  const stageCriteria = input.criteria.filter((row) => row.fromStage === input.currentStage);
  for (const criterion of stageCriteria) {
    const definition = criterionById(criterion.criterionId);
    const blocksPromotion =
      definition?.required !== false &&
      (definition?.severity === 'hard' || definition?.severity === 'soft');
    if (blocksPromotion && criterion.state !== 'met' && criterion.state !== 'waived') {
      blockers.push({
        code: 'gate_criterion_open',
        detail: `${definition?.title ?? criterion.criterionId} is ${criterion.state}.`,
      });
      continue;
    }
    if (
      blocksPromotion &&
      criterion.state === 'met' &&
      input.artifacts &&
      input.evidence
    ) {
      const criterionReadiness = evaluateCriterionMetReadiness({
        criterion,
        artifacts: input.artifacts,
        evidence: input.evidence,
        reason: criterion.notes,
      });
      if (!criterionReadiness.ok) {
        blockers.push({
          code: 'gate_criterion_unverified',
          detail: `${definition?.title ?? criterion.criterionId} was previously marked met, but no longer satisfies artifact, evidence, and reason controls.`,
        });
        blockers.push(...criterionReadiness.blockers);
      }
    }
  }

  if (stageCriteria.length === 0 && input.targetStage !== 'strategy') {
    blockers.push({
      code: 'stage_gate_not_scaffolded',
      detail: `No gate criteria are scaffolded for ${input.currentStage}.`,
    });
  }

  return { ok: blockers.length === 0, blockers };
}

export function verifiedGateCriterionForDisplay(input: {
  criterion: SourceEventGateCriterion;
  artifacts: SourceEventArtifactState[];
  evidence: SourceEventEvidence[];
}): SourceEventGateCriterion {
  if (input.criterion.state !== 'met') return input.criterion;
  const readiness = evaluateCriterionMetReadiness({
    criterion: input.criterion,
    artifacts: input.artifacts,
    evidence: input.evidence,
    reason: input.criterion.notes,
  });
  if (readiness.ok) return input.criterion;
  return {
    ...input.criterion,
    state: 'pending',
    reviewedAt: null,
    reviewerUserId: null,
    notes: `Previously marked met, but blocked by current governance controls: ${readiness.blockers
      .map((blocker) => blocker.detail)
      .join(' ')}`,
  };
}

export function firstGovernanceBlocker(verdict: SourceGovernanceVerdict): SourceGovernanceBlocker {
  return verdict.blockers[0] ?? {
    code: 'governance_blocked',
    detail: 'Source governance prerequisites are not satisfied.',
  };
}

function lintSourceArtifactBody(
  artifactCode: string,
  body: string,
): SourceGovernanceBlocker[] {
  const blockers: SourceGovernanceBlocker[] = [];
  if (/\([^)]+\.(csv|xlsx?|xlsm)\b[^)]*\)/i.test(body)) {
    blockers.push({
      code: 'raw_file_citation',
      detail:
        'Client-facing citations must render as Exhibit N labels, not raw spreadsheet filename fragments.',
    });
  }
  if (/\b(?:row\s*:|sha-[a-f0-9]{6,}|datasets\/|enterprise-reads\.json)\b/i.test(body)) {
    blockers.push({
      code: 'raw_internal_marker',
      detail: 'Client-facing text contains raw row/hash/dataset markers.',
    });
  }
  if (/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(body)) {
    blockers.push({
      code: 'internal_uuid_visible',
      detail: 'Client-facing text contains an internal UUID.',
    });
  }
  if (/\bgap\s*[—-]\s*tbd\b/i.test(body)) {
    blockers.push({
      code: 'vendor_facing_tbd_gap',
      detail: 'Vendor-facing tables cannot carry unresolved “Gap — TBD” cells.',
    });
  }
  if (
    /24\s*[x×]\s*7[^.\n]{0,80}\b(?:p1|p2|p1\/p2)\b/i.test(body) &&
    !/(recommend|proposed|require|vendor must|ask vendors?|archetype|target state)/i.test(
      body,
    )
  ) {
    blockers.push({
      code: 'unsupported_sla_coverage_fact',
      detail:
        '24x7 P1/P2 coverage is stated as fact without being labeled as a recommendation, requirement, or target-state ask.',
    });
  }
  if (artifactCode === 'd09_rfp_pack' && !/\brisk register\b/i.test(body)) {
    blockers.push({
      code: 'risk_register_missing',
      detail: 'RFP Package must include a risk register section before issuance.',
    });
  }
  if (artifactCode === 'd16_scorecard') {
    const weights = extractScorecardWeights(body);
    if (weights.length > 0) {
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(total - 100) > 0.5) {
        blockers.push({
          code: 'scorecard_weights_not_100',
          detail: `Scorecard weights sum to ${total}%, not 100%.`,
        });
      }
    }
  }
  return blockers;
}

function warnSourceArtifactBody(
  artifactCode: string,
  body: string,
): SourceGovernanceBlocker[] {
  const warnings: SourceGovernanceBlocker[] = [];
  if (
    SOURCE_VENDOR_FACING_ARTIFACT_CODES.has(artifactCode) &&
    /\b(?:archetype|pattern)\b/i.test(body) &&
    !/\b(?:recommendation|recommended|pattern context|industry pattern)\b/i.test(body)
  ) {
    warnings.push({
      code: 'archetype_context_not_labeled',
      detail:
        'Archetype or pattern context should be labeled as recommendation/context, not implied tenant fact.',
    });
  }
  return warnings;
}

function evaluateCrossArtifactMoneyConsistency(
  artifacts: readonly SourceEventArtifactState[],
): SourceGovernanceBlocker[] {
  const amounts = artifacts
    .filter((artifact) => CROSS_ARTIFACT_MONEY_CODES.has(artifact.artifactCode))
    .map((artifact) => ({
      artifactCode: artifact.artifactCode,
      artifactLabel: specByCode(artifact.artifactCode)?.name ?? artifact.artifactCode,
      amount: extractLabeledDealAmount(artifact.body ?? ''),
    }))
    .filter(
      (row): row is { artifactCode: string; artifactLabel: string; amount: number } =>
        typeof row.amount === 'number',
    );
  if (amounts.length < 2) return [];

  const min = Math.min(...amounts.map((row) => row.amount));
  const max = Math.max(...amounts.map((row) => row.amount));
  if (max - min < 100_000) return [];

  return amounts.map((row) => ({
    code: `numeric_discrepancy_${row.artifactCode}`,
    detail: `${row.artifactLabel} cites ${formatUsd(row.amount)} for the event value while another artifact cites ${formatUsd(row.amount === min ? max : min)}.`,
  }));
}

function extractLabeledDealAmount(body: string): number | null {
  const patterns = [
    /\b(?:value at stake|estimated value|total value|target value|opportunity value|financial exposure|sourcing value)\b[^$\n]{0,100}\$([0-9][0-9,.]*)\s*([kmb])?/i,
    /\$([0-9][0-9,.]*)\s*([kmb])?[^.\n]{0,80}\b(?:value at stake|estimated value|total value|target value|opportunity value|financial exposure|sourcing value)\b/i,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) return parseMoney(match[1], match[2]);
  }
  return null;
}

function parseMoney(raw: string, suffix?: string): number {
  const base = Number(raw.replace(/,/g, ''));
  const normalizedSuffix = suffix?.toLowerCase();
  if (normalizedSuffix === 'b') return base * 1_000_000_000;
  if (normalizedSuffix === 'm') return base * 1_000_000;
  if (normalizedSuffix === 'k') return base * 1_000;
  return base;
}

function extractScorecardWeights(body: string): number[] {
  const rows = body
    .split(/\r?\n/)
    .filter((line) => /\bweight\b/i.test(line) || /\|/.test(line));
  const weights: number[] = [];
  for (const row of rows) {
    const match = row.match(/(?:^|\||\s)(\d{1,3}(?:\.\d+)?)\s*%/);
    if (match) weights.push(Number(match[1]));
  }
  return weights.length >= 2 ? weights : [];
}

function inferArtifactEvidenceState(input: {
  metadata: Record<string, unknown> | null;
  readiness: SourceArtifactReadiness;
  humanReviewed: boolean;
  body: string;
}): SourceArtifactEvidenceState {
  if (input.humanReviewed && input.readiness === 'ready') return 'human_override';
  const reasoningStatus = input.metadata?.reasoningStatus;
  if (reasoningStatus === 'refusal') return 'missing_evidence';
  if (/\b(?:assumption|assumed|subject to validation)\b/i.test(input.body)) {
    return 'assumption';
  }
  if (/\b(?:archetype|industry pattern|pattern context)\b/i.test(input.body)) {
    return 'archetype_recommendation';
  }
  if (input.readiness === 'ready') return 'evidenced';
  if (input.readiness === 'needs_review') return 'partial_evidence';
  return 'missing_evidence';
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value);
}

function pass(): SourceGovernanceVerdict {
  return { ok: true, blockers: [] };
}

function fail(blocker: SourceGovernanceBlocker): SourceGovernanceVerdict {
  return { ok: false, blockers: [blocker] };
}
