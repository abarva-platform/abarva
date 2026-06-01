// Wave 3 A1 - per-Move audit pack model.
//
// The audit pack is a deterministic, evidence-forward bundle over the existing
// Moves expert kernel. It does not create a new decision engine. It takes the
// same real Move input used by the board-grade artifacts, runs
// `buildMoveBusinessCase`, and projects the result into the ten audit sections
// called for by the Wave 3 brief.
//
// Honesty contract:
// - every section is present;
// - missing substrate is rendered as an explicit gap, never silently omitted;
// - an unbound Move returns an honest unbound pack, never a fabricated one;
// - raw route identifiers are not shown in customer-facing section text.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
  type MoveBusinessCaseResult,
} from '../../../move-business-case';
import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import { resolveMoveFunctionIdentity } from '../../../function-identity';
import { resolveFunctionPack } from '../../domain/function-pack-registry';
import { resolveBoardGradeTenantLabel } from '../board-grade/tenant-label-resolver';

export type AuditPackSectionStatus = 'supported' | 'gap' | 'blocked';

export interface AuditPackEvidence {
  readonly source: string;
  readonly detail: string;
  readonly asOf: string;
}

export interface AuditPackItem {
  readonly label: string;
  readonly value: string;
}

export interface AuditPackSection {
  readonly id: string;
  readonly ordinal: string;
  readonly title: string;
  readonly status: AuditPackSectionStatus;
  readonly summary: string;
  readonly items: readonly AuditPackItem[];
  readonly evidence: readonly AuditPackEvidence[];
  readonly gaps: readonly string[];
}

export interface MoveAuditPack {
  readonly bound: true;
  readonly tenantLabel: string;
  readonly tenantKey: string;
  readonly moveLabel: string;
  readonly artifactLabel: 'Per-Move Audit Pack';
  readonly generatedOn: string;
  readonly verdict: BusinessCaseSkeleton['recommendation'];
  readonly sections: readonly AuditPackSection[];
  readonly evidenceCount: number;
  readonly gapCount: number;
  readonly disclaimer: string;
}

export interface MoveAuditPackUnbound {
  readonly bound: false;
  readonly tenantLabel: string;
  readonly tenantKey: string;
  readonly moveLabel: string;
  readonly artifactLabel: 'Per-Move Audit Pack';
  readonly generatedOn: string;
  readonly unboundReason: string;
  readonly sections: readonly AuditPackSection[];
  readonly evidenceCount: number;
  readonly gapCount: number;
  readonly disclaimer: string;
}

export type MoveAuditPackResult = MoveAuditPack | MoveAuditPackUnbound;

const AUDIT_PACK_DISCLAIMER =
  'Deterministic composition. This audit pack is assembled from the Move charter, expert-kernel business case, Function Pack binding, baseline metrics, critic findings, and Tower measurement handoff. It introduces no new figures.';

const NO_SOURCE = 'No tenant evidence bound yet.';
const NOT_ON_FILE = 'Not on file in the current Move substrate.';

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

function fmtRange(range: { low: number; point: number; high: number }): string {
  return `${fmtUsd(range.low)} / ${fmtUsd(range.point)} / ${fmtUsd(range.high)}`;
}

function asOf(date: string | undefined | null): string {
  return date && date.trim() ? date : 'as-recorded';
}

function readMoveLabel(move: MoveBusinessCaseInput): string {
  return typeof move.name === 'string' && move.name.trim()
    ? move.name.trim()
    : 'Move';
}

function readTenantKey(move: MoveBusinessCaseInput): string {
  return (
    move.tenant_key ||
    move.tenantKey ||
    move.industry_code ||
    move.industryCode ||
    'unknown-client'
  );
}

function section(
  ordinal: string,
  title: string,
  args: Omit<AuditPackSection, 'id' | 'ordinal' | 'title'>,
): AuditPackSection {
  return {
    id: title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    ordinal,
    title,
    ...args,
  };
}

function gapEvidence(asOfDate: string): AuditPackEvidence[] {
  return [{ source: NO_SOURCE, detail: 'Explicit audit gap.', asOf: asOfDate }];
}

function sectionStatus(gaps: readonly string[]): AuditPackSectionStatus {
  return gaps.length > 0 ? 'gap' : 'supported';
}

function buildBoundSections(
  result: MoveBusinessCaseResult & { bound: true; skeleton: BusinessCaseSkeleton },
  move: MoveBusinessCaseInput,
  generatedOn: string,
): readonly AuditPackSection[] {
  const skeleton = result.skeleton;
  const identity = resolveMoveFunctionIdentity({
    industryCode: move.industry_code ?? move.industryCode,
    functionPackKey: move.function_pack_key ?? move.functionPackKey,
    charter: move.charter,
  });
  const pack =
    identity && resolveFunctionPack(identity.industryKey, identity.functionKey);

  const baselineEvidence = skeleton.baseline.metrics.map((metric) => ({
    source: metric.recorded ? metric.source : NO_SOURCE,
    detail: metric.recorded
      ? `${metric.label}: ${metric.value} ${metric.unit}`
      : metric.seedGapReason || 'Baseline metric is missing.',
    asOf: asOf(metric.asOf),
  }));
  const seedGapStatements = skeleton.baseline.seedGaps.map(
    (metric) => `${metric.label}: ${metric.seedGapReason}`,
  );
  const criticGaps = [
    ...skeleton.critic.blockers.map((b) => `${b.code}: ${b.message}`),
    ...skeleton.critic.concerns.map((c) => `${c.code}: ${c.message}`),
  ];

  const vendorGaps = [
    'Vendor SOW terms are not bound to this Move substrate yet.',
    'BAA or data-processing chain is not bound to this Move substrate yet.',
  ];
  const governanceGaps = [
    'AI Governance Council attestation is not bound to this Move substrate yet.',
  ];
  const realizedGaps = [
    'Realized value ledger is not bound to this Move audit pack yet.',
  ];

  return [
    section('01', 'Move charter', {
      status: 'supported',
      summary:
        `Audit scope for ${readMoveLabel(move)}. The Move is bound to the ` +
        `${result.binding.functionLabel || 'curated'} Function Pack.`,
      items: [
        { label: 'Move', value: readMoveLabel(move) },
        { label: 'Function', value: result.binding.functionLabel || 'Bound function' },
        { label: 'Verdict', value: skeleton.recommendation.toUpperCase() },
        { label: 'Generated', value: generatedOn },
      ],
      evidence: [
        {
          source: 'Move charter and Function Pack binding',
          detail: 'Charter identity, function binding, and kernel verdict.',
          asOf: generatedOn,
        },
      ],
      gaps: result.derivationNotes,
    }),
    section('02', 'Business case', {
      status: sectionStatus(seedGapStatements),
      summary:
        `Investment and value are rendered as ranges. Recommendation: ` +
        `${skeleton.recommendation.toUpperCase()} because ${skeleton.recommendationRationale}`,
      items: [
        { label: 'Investment low / base / high', value: fmtRange(skeleton.economics.investment) },
        { label: 'Net return low / base / high', value: fmtRange(skeleton.economics.netReturn) },
        {
          label: 'Payback',
          value:
            skeleton.economics.paybackMonths === null
              ? 'Not claimable until monetization gaps close'
              : `${skeleton.economics.paybackMonths} months`,
        },
      ],
      evidence: [
        {
          source: 'Moves expert kernel',
          detail: 'Business-case compiler output.',
          asOf: generatedOn,
        },
      ],
      gaps: seedGapStatements,
    }),
    section('03', 'Diagnose evidence', {
      status: sectionStatus(seedGapStatements),
      summary:
        `${skeleton.baseline.recordedMetrics.length} recorded baseline metrics; ` +
        `${skeleton.baseline.seedGaps.length} explicit seed gaps.`,
      items: skeleton.baseline.metrics.map((metric) => ({
        label: metric.label,
        value: metric.recorded
          ? `${metric.value} ${metric.unit}`
          : 'Gap - not recorded',
      })),
      evidence: baselineEvidence.length > 0 ? baselineEvidence : gapEvidence(generatedOn),
      gaps: seedGapStatements,
    }),
    section('04', 'Design decisions and dissent log', {
      status: sectionStatus(criticGaps),
      summary:
        skeleton.critic.hasBlocker
          ? 'The critic raised blockers; the pack treats them as dissent to resolve before the next gate.'
          : 'No blocker-level dissent is present in the kernel critic output.',
      items: [
        ...skeleton.assumptions.topMovers.map((a) => ({
          label: a.key,
          value: a.statement,
        })),
        ...skeleton.critic.blockers.map((b) => ({
          label: b.code,
          value: b.message,
        })),
      ],
      evidence: [
        {
          source: 'Assumption ledger and critic report',
          detail: 'Top sensitivity movers, blockers, and concerns.',
          asOf: generatedOn,
        },
      ],
      gaps: criticGaps,
    }),
    section('05', 'Gate evidence per phase', {
      status: sectionStatus(skeleton.killCriteria.map((k) => k.condition)),
      summary:
        'Gate evidence is derived from the recommendation, kill criteria, and Tower measurement handoff.',
      items: [
        ...skeleton.killCriteria.map((k) => ({
          label: k.code,
          value: k.condition,
        })),
        ...skeleton.towerHandoff.map((m) => ({
          label: m.metricLabel,
          value: m.readinessNote,
        })),
      ],
      evidence: [
        {
          source: 'Business-case compiler',
          detail: 'Recommendation, kill criteria, and measurement handoff.',
          asOf: generatedOn,
        },
      ],
      gaps: skeleton.killCriteria.map((k) => k.condition),
    }),
    section('06', 'Vendor SOW and BAA chain', {
      status: 'gap',
      summary:
        'Vendor contract, statement-of-work, BAA, and data-processing chain are audit gaps until contract artifacts are bound.',
      items: [
        { label: 'Vendor SOW', value: NOT_ON_FILE },
        { label: 'BAA or data-processing chain', value: NOT_ON_FILE },
      ],
      evidence: gapEvidence(generatedOn),
      gaps: vendorGaps,
    }),
    section('07', 'AI Governance attestation', {
      status: 'gap',
      summary:
        'AI governance status is visible as a required attestation, but the signed council record is not bound yet.',
      items: [
        { label: 'Kernel recommendation', value: skeleton.recommendation.toUpperCase() },
        { label: 'Critic blockers', value: String(skeleton.critic.blockers.length) },
      ],
      evidence: [
        {
          source: 'Kernel critic report',
          detail: 'Risk blockers and concerns used as pre-attestation evidence.',
          asOf: generatedOn,
        },
      ],
      gaps: governanceGaps,
    }),
    section('08', 'Realized vs projected', {
      status: 'gap',
      summary:
        'Projected value is available from the kernel; realized value is a Tower ledger follow-through item.',
      items: [
        { label: 'Projected value low / base / high', value: fmtRange(skeleton.valueRange) },
        { label: 'Realized value', value: NOT_ON_FILE },
      ],
      evidence: [
        {
          source: 'Moves expert kernel',
          detail: 'Projected value range.',
          asOf: generatedOn,
        },
      ],
      gaps: realizedGaps,
    }),
    section('09', 'Pattern matches with corpus citations', {
      status: sectionStatus(pack ? [] : ['No resolved Function Pack for pattern evidence.']),
      summary:
        pack
          ? `${pack.referenceSolutionPatterns.length} solution patterns and ${pack.evidenceAnchors.length} evidence anchors are available from the bound Function Pack.`
          : 'Pattern evidence is unavailable because the Function Pack could not be resolved.',
      items: [
        ...(pack?.referenceSolutionPatterns.slice(0, 5).map((p) => ({
          label: p.name,
          value: p.description,
        })) ?? []),
        ...(pack?.evidenceAnchors.slice(0, 5).map((a) => ({
          label: a.claim,
          value: a.authoritativeSource,
        })) ?? []),
      ],
      evidence:
        pack?.evidenceAnchors.slice(0, 5).map((a) => ({
          source: a.authoritativeSource,
          detail: `${a.claim}: ${a.whatGoodEvidenceLooksLike}`,
          asOf: generatedOn,
        })) ?? gapEvidence(generatedOn),
      gaps: pack ? [] : ['No resolved Function Pack for pattern evidence.'],
    }),
    section('10', 'Peer-source citations', {
      status: sectionStatus(pack && pack.evidenceAnchors.length > 0 ? [] : ['No peer-source citations are bound yet.']),
      summary:
        pack && pack.evidenceAnchors.length > 0
          ? 'Peer and corpus citations are carried from the bound Function Pack.'
          : 'No peer-source citations are bound to this Move yet.',
      items:
        pack?.evidenceAnchors.slice(0, 8).map((a) => ({
          label: a.claim,
          value: a.authoritativeSource,
        })) ?? [],
      evidence:
        pack?.evidenceAnchors.slice(0, 8).map((a) => ({
          source: a.authoritativeSource,
          detail: `${a.claim}: ${a.whatGoodEvidenceLooksLike}`,
          asOf: generatedOn,
        })) ?? gapEvidence(generatedOn),
      gaps: pack && pack.evidenceAnchors.length > 0 ? [] : ['No peer-source citations are bound yet.'],
    }),
  ];
}

function buildUnboundSections(
  reason: string,
  generatedOn: string,
): readonly AuditPackSection[] {
  const titles = [
    'Move charter',
    'Business case',
    'Diagnose evidence',
    'Design decisions and dissent log',
    'Gate evidence per phase',
    'Vendor SOW and BAA chain',
    'AI Governance attestation',
    'Realized vs projected',
    'Pattern matches with corpus citations',
    'Peer-source citations',
  ];
  return titles.map((title, index) =>
    section(String(index + 1).padStart(2, '0'), title, {
      status: index === 0 ? 'supported' : 'blocked',
      summary:
        index === 0
          ? 'The Move exists, but the audit pack cannot run with curated depth until the function is classified.'
          : 'Blocked because the Move is not bound to a curated Function Pack.',
      items: [{ label: 'Blocked reason', value: reason }],
      evidence: gapEvidence(generatedOn),
      gaps: [reason],
    }),
  );
}

export function buildMoveAuditPack(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): MoveAuditPackResult {
  const result = buildMoveBusinessCase(move);
  const skeletonTenantKey = readTenantKey(move);
  const { tenantKey, tenantLabel } = resolveBoardGradeTenantLabel(
    move,
    skeletonTenantKey,
  );
  const moveLabel = readMoveLabel(move);

  if (!result.bound || !result.skeleton) {
    const sections = buildUnboundSections(result.unboundReason, generatedOn);
    return {
      bound: false,
      tenantLabel,
      tenantKey,
      moveLabel,
      artifactLabel: 'Per-Move Audit Pack',
      generatedOn,
      unboundReason: result.unboundReason,
      sections,
      evidenceCount: sections.reduce((sum, s) => sum + s.evidence.length, 0),
      gapCount: sections.reduce((sum, s) => sum + s.gaps.length, 0),
      disclaimer: AUDIT_PACK_DISCLAIMER,
    };
  }

  const sections = buildBoundSections(
    result as MoveBusinessCaseResult & { bound: true; skeleton: BusinessCaseSkeleton },
    move,
    generatedOn,
  );
  return {
    bound: true,
    tenantLabel,
    tenantKey,
    moveLabel,
    artifactLabel: 'Per-Move Audit Pack',
    generatedOn,
    verdict: result.skeleton.recommendation,
    sections,
    evidenceCount: sections.reduce((sum, s) => sum + s.evidence.length, 0),
    gapCount: sections.reduce((sum, s) => sum + s.gaps.length, 0),
    disclaimer: AUDIT_PACK_DISCLAIMER,
  };
}
