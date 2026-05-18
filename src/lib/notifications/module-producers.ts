import type { SegmentTrustAssessment } from '@/lib/context-trust/freshness-model';
import type { SentinelGroundingGap, SentinelGroundingSummary } from '@/lib/sentinel/types';
import type { ExecutiveAction } from '@/lib/tower/action-queue/executive-action-queue';
import type { ClassifiedRiskLine } from '@/lib/tower/regulatory-risk/types';
import { dedupeNotifications } from './policy';
import type {
  NotificationAudience,
  NotificationEvent,
  NotificationSeverity,
} from './types';

export interface NotificationProducerContext {
  tenantKey: string;
  producedAt: string;
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function role(ref: string, label: string): NotificationAudience {
  return { kind: 'role', ref, label };
}

function ownerAudience(ownerRef: string | null | undefined, fallback: NotificationAudience): NotificationAudience {
  if (!ownerRef) return fallback;
  if (ownerRef.includes('@')) {
    return { kind: 'user', ref: ownerRef.toLowerCase(), label: ownerRef };
  }
  return { kind: 'owner_ref', ref: ownerRef, label: ownerRef };
}

function movesHref(programId: string): string {
  return `/strategic-moves/${encodeURIComponent(programId)}`;
}

function towerHref(portfolioRef: string, entryId?: string): string {
  const suffix = entryId ? `?action=${encodeURIComponent(entryId)}` : '';
  return `/tower${suffix}#${encodeURIComponent(portfolioRef)}`;
}

function intelligenceHref(answerId: string): string {
  return `/intelligence?answer=${encodeURIComponent(answerId)}`;
}

function contextHref(segment: string): string {
  return `/home?setup=${encodeURIComponent(segment)}#context`;
}

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------

export type MovesSignalKind =
  | 'gate_blocked'
  | 'mobilization_blocked'
  | 'sourcing_required'
  | 'control_gap'
  | 'architecture_gap';

export interface MovesDecisionSignal {
  programId: string;
  programLabel: string;
  kind: MovesSignalKind;
  title: string;
  detail: string;
  ownerRef?: string | null;
  dueAt?: string | null;
  evidenceRefs: readonly string[];
  critical?: boolean;
}

const MOVES_KIND_LABEL: Record<MovesSignalKind, string> = {
  gate_blocked: 'Gate blocked',
  mobilization_blocked: 'Mobilization blocked',
  sourcing_required: 'Sourcing needed',
  control_gap: 'Control gap',
  architecture_gap: 'Architecture gap',
};

function movesSeverity(signal: MovesDecisionSignal): NotificationSeverity {
  if (signal.critical) return 'critical';
  if (signal.kind === 'gate_blocked' || signal.kind === 'mobilization_blocked') return 'urgent';
  if (signal.kind === 'sourcing_required' || signal.kind === 'control_gap') return 'attention';
  return 'info';
}

export function buildMovesDecisionNotifications(
  context: NotificationProducerContext,
  signals: readonly MovesDecisionSignal[],
): NotificationEvent[] {
  return dedupeNotifications(
    signals
      .filter((signal) => signal.evidenceRefs.length > 0)
      .map((signal) => {
        const kindLabel = MOVES_KIND_LABEL[signal.kind];
        return {
          id: `moves:${signal.programId}:${slug(signal.kind)}:${slug(signal.title)}`,
          tenantKey: context.tenantKey,
          module: 'moves',
          severity: movesSeverity(signal),
          title: `${kindLabel}: ${signal.title}`,
          body: signal.detail,
          href: movesHref(signal.programId),
          subject: {
            type: 'program',
            id: signal.programId,
            label: signal.programLabel,
          },
          audience: [
            ownerAudience(signal.ownerRef, role('program_owner', 'Program owner')),
            role('executive_sponsor', 'Executive sponsor'),
          ],
          producedAt: context.producedAt,
          dueAt: signal.dueAt ?? null,
          dedupeKey: `moves:${context.tenantKey}:${signal.programId}:${signal.kind}`,
          sourceEventType: `moves.${signal.kind}`,
          evidenceRefs: signal.evidenceRefs,
          metadata: {
            kind: signal.kind,
            evidenceCount: signal.evidenceRefs.length,
          },
        } satisfies NotificationEvent;
      }),
  ).slice(0, 12);
}

// ---------------------------------------------------------------------------
// Tower
// ---------------------------------------------------------------------------

function towerActionSeverity(severity: ExecutiveAction['severity']): NotificationSeverity {
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'urgent';
  if (severity === 'elevated') return 'attention';
  return 'info';
}

export function buildTowerExecutiveActionNotifications(
  context: NotificationProducerContext,
  actions: readonly ExecutiveAction[],
): NotificationEvent[] {
  return dedupeNotifications(
    actions
      .filter((action) => action.severity !== 'watch')
      .map((action) => ({
        id: `tower:${action.entryId}:${slug(action.trigger)}`,
        tenantKey: context.tenantKey,
        module: 'tower',
        severity: towerActionSeverity(action.severity),
        title: `${action.triggerLabel}: ${action.initiative}`,
        body: `${action.condition} ${action.impliedAction}`,
        href: towerHref('portfolio', action.entryId),
        subject: {
          type: 'tower_move',
          id: action.programKey ?? action.entryId,
          label: action.initiative,
        },
        audience: [role('portfolio_owner', 'Portfolio owner'), role('executive_sponsor', 'Executive sponsor')],
        producedAt: context.producedAt,
        dueAt: null,
        dedupeKey: `tower:${context.tenantKey}:${action.entryId}:${action.trigger}`,
        sourceEventType: 'tower.executive_action',
        evidenceRefs: [action.entryId],
        metadata: {
          trigger: action.trigger,
          severityRank: action.severityRank,
        },
      })),
  ).slice(0, 12);
}

function riskSeverity(severity: ClassifiedRiskLine['severity']): NotificationSeverity {
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'urgent';
  if (severity === 'moderate') return 'attention';
  return 'info';
}

export function buildTowerRegulatoryRiskNotifications(
  context: NotificationProducerContext,
  portfolioRef: string,
  lines: readonly ClassifiedRiskLine[],
): NotificationEvent[] {
  return dedupeNotifications(
    lines
      .filter((line) => line.isRegulatory && line.severity !== 'low')
      .map((line) => ({
        id: `tower:${line.subjectRef}:regulatory:${line.id}`,
        tenantKey: context.tenantKey,
        module: 'tower',
        severity: riskSeverity(line.severity),
        title: `Regulatory risk: ${line.title}`,
        body: line.executiveReadout,
        href: towerHref(portfolioRef, line.id),
        subject: {
          type: 'tower_move',
          id: line.subjectRef,
          label: line.title,
        },
        audience: [role('risk_owner', 'Risk owner'), role('executive_sponsor', 'Executive sponsor')],
        producedAt: context.producedAt,
        dueAt: null,
        dedupeKey: `tower:${context.tenantKey}:${line.subjectRef}:regulatory:${line.id}`,
        sourceEventType: 'tower.regulatory_risk',
        evidenceRefs: [line.id, line.subjectRef],
        metadata: {
          regime: line.regime,
          severity: line.severity,
          privileged: line.privileged,
        },
      })),
  ).slice(0, 12);
}

// ---------------------------------------------------------------------------
// Intelligence / Sentinel
// ---------------------------------------------------------------------------

function groundingSeverity(gap: SentinelGroundingGap): NotificationSeverity {
  if (gap.severity === 'critical') return 'urgent';
  if (gap.severity === 'warning') return 'attention';
  return 'info';
}

export function buildSentinelGroundingNotifications(
  context: NotificationProducerContext,
  args: {
    answerId: string;
    question: string;
    summary: SentinelGroundingSummary;
  },
): NotificationEvent[] {
  return dedupeNotifications(
    args.summary.gaps
      .filter((gap) => gap.severity !== 'info')
      .map((gap) => ({
        id: `intelligence:${args.answerId}:grounding:${slug(gap.type)}`,
        tenantKey: context.tenantKey,
        module: 'intelligence',
        severity: groundingSeverity(gap),
        title: `Sentinel grounding gap: ${gap.type.replace(/_/g, ' ')}`,
        body: gap.detail,
        href: intelligenceHref(args.answerId),
        subject: {
          type: 'agent_answer',
          id: args.answerId,
          label: args.question,
        },
        audience: [role('intelligence_owner', 'Intelligence owner')],
        producedAt: context.producedAt,
        dueAt: null,
        dedupeKey: `intelligence:${context.tenantKey}:${args.answerId}:grounding:${gap.type}`,
        sourceEventType: 'intelligence.sentinel.grounding_gap',
        evidenceRefs: gap.missing.length > 0 ? gap.missing : ['sentinel_grounding_summary'],
        metadata: {
          gapType: gap.type,
          gapSeverity: gap.severity,
          missingCount: gap.missing.length,
        },
      })),
  ).slice(0, 8);
}

export interface SentinelConsistencySignal {
  answerId: string;
  question: string;
  guardId: string;
  guardLabel: string;
  detail: string;
  severity: 'warning' | 'critical';
  evidenceRefs: readonly string[];
}

export function buildSentinelConsistencyNotifications(
  context: NotificationProducerContext,
  signals: readonly SentinelConsistencySignal[],
): NotificationEvent[] {
  return dedupeNotifications(
    signals
      .filter((signal) => signal.evidenceRefs.length > 0)
      .map((signal) => ({
        id: `intelligence:${signal.answerId}:guard:${slug(signal.guardId)}`,
        tenantKey: context.tenantKey,
        module: 'intelligence',
        severity: signal.severity === 'critical' ? 'urgent' : 'attention',
        title: `Sentinel check caught: ${signal.guardLabel}`,
        body: signal.detail,
        href: intelligenceHref(signal.answerId),
        subject: {
          type: 'agent_answer',
          id: signal.answerId,
          label: signal.question,
        },
        audience: [role('intelligence_owner', 'Intelligence owner')],
        producedAt: context.producedAt,
        dueAt: null,
        dedupeKey: `intelligence:${context.tenantKey}:${signal.answerId}:guard:${signal.guardId}`,
        sourceEventType: 'intelligence.sentinel.consistency_guard',
        evidenceRefs: signal.evidenceRefs,
        metadata: {
          guardId: signal.guardId,
          guardSeverity: signal.severity,
        },
      })),
  ).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Context freshness
// ---------------------------------------------------------------------------

function contextSeverity(assessment: SegmentTrustAssessment): NotificationSeverity {
  if (assessment.trustRung === 'missing') return 'urgent';
  if (assessment.trustRung === 'stale') return 'attention';
  return 'info';
}

export function buildContextTrustNotifications(
  context: NotificationProducerContext,
  assessments: readonly SegmentTrustAssessment[],
): NotificationEvent[] {
  return dedupeNotifications(
    assessments
      .filter((assessment) => assessment.trustRung === 'missing' || assessment.trustRung === 'stale')
      .map((assessment) => ({
        id: `context:${assessment.segment}:${assessment.trustRung}`,
        tenantKey: context.tenantKey,
        module: 'context',
        severity: contextSeverity(assessment),
        title:
          assessment.trustRung === 'missing'
            ? `Context missing: ${assessment.segment}`
            : `Context stale: ${assessment.segment}`,
        body: assessment.rationale,
        href: contextHref(assessment.segment),
        subject: {
          type: 'context_segment',
          id: assessment.segment,
          label: assessment.segment,
        },
        audience: [role('context_owner', 'Context owner'), role('tenant_admin', 'Tenant admin')],
        producedAt: context.producedAt,
        dueAt: null,
        dedupeKey: `context:${context.tenantKey}:${assessment.segment}:${assessment.trustRung}`,
        sourceEventType: `context.trust.${assessment.trustRung}`,
        evidenceRefs:
          assessment.trustRung === 'missing'
            ? ['missing_context_segment']
            : [assessment.segment],
        metadata: {
          segment: assessment.segment,
          trustRung: assessment.trustRung,
          freshness: assessment.freshness,
          ageDays: assessment.ageDays,
        },
      })),
  ).slice(0, 14);
}
