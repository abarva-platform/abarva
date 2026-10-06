import { sanitizeRestrictedFinancialText } from '@/lib/agent/restricted-output-policy';
import type {
  SourcingEventDetail,
  SourcingEventSummary,
  SourceValueLedgerSnapshot,
} from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';

export const RESTRICTED_SOURCE_FINANCIAL_LABEL = 'Restricted';
export const RESTRICTED_SOURCE_FINANCIAL_DETAIL =
  'Exact financial values are restricted for this user.';

const RESTRICTED_POLICY = { outputPolicy: { exactFinancialValues: false } };

export function formatSourceFinancialValue(value: number, canViewFinancialValues: boolean): string {
  return canViewFinancialValues ? formatUsd(value) : RESTRICTED_SOURCE_FINANCIAL_LABEL;
}

export function redactSourceFinancialText(
  value: string | null | undefined,
  canViewFinancialValues: boolean,
): string {
  if (!value) return '';
  if (canViewFinancialValues) return value;
  return sanitizeRestrictedFinancialText(value, RESTRICTED_POLICY);
}

/**
 * Keys whose values are addresses, not prose, and must survive redaction.
 *
 * `redactSourceFinancialText` would only alter one of these if it contained a
 * money token, which is unlikely — but a silently rewritten `href` is a broken
 * link rather than a withheld figure, and that is not a trade this gate should
 * ever make.
 */
const NON_PROSE_KEYS = new Set(['href', 'url', 'contractId', 'clientKey', 'actionId', 'milestoneId', 'targetId']);

/**
 * U-520 — redact every exact magnitude out of a view model's PROSE, in one pass
 * at the boundary where it reaches the component.
 *
 * Why a deep walk rather than a named-field list. `SourceExecutionRoomPage`
 * renders builder-authored sentences from five nested shapes — critical-path
 * milestones, action rows and their linked drafts, the negotiation brief, the
 * vendor email draft, rebid readiness — through five sub-components that do not
 * take the entitlement flag. Measured on the restricted render before this
 * change: 13 magnitude occurrences over 3 distinct values, none of them through
 * a formatter. A named-field list is the wrong instrument for that, because the
 * failure mode is a field nobody listed, and the next sentence the builder adds
 * is by definition not on the list.
 *
 * The walk is a no-op for a granted reader — asserted, not assumed, by a case
 * that compares the granted render against the untouched room.
 */
export function redactFinancialProseDeep<T>(value: T, canViewFinancialValues: boolean): T {
  if (canViewFinancialValues) return value;
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (typeof value === 'string') return redactSourceFinancialText(value, false);
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = NON_PROSE_KEYS.has(key) ? child : walk(child);
    }
    return out;
  }
  return value;
}

function redactLedgerSnapshot(
  snapshot: SourceValueLedgerSnapshot,
  canViewFinancialValues: boolean,
): SourceValueLedgerSnapshot {
  if (canViewFinancialValues) return snapshot;
  const redactEntries = (entries: SourceValueLedgerSnapshot['projected']) =>
    entries.map((entry) => ({
      ...entry,
      amountUsd: 0,
      note: redactSourceFinancialText(entry.note, false),
    }));

  return {
    ...snapshot,
    projected: redactEntries(snapshot.projected),
    realized: redactEntries(snapshot.realized),
  };
}

export function redactSourcingEventSummaryForDisplay<T extends SourcingEventSummary>(
  event: T,
  canViewFinancialValues: boolean,
): T {
  if (canViewFinancialValues) return event;
  return {
    ...event,
    blocker: event.blocker ? redactSourceFinancialText(event.blocker, false) : null,
    nextAction: redactSourceFinancialText(event.nextAction, false),
    nextDecision: redactSourceFinancialText(event.nextDecision, false),
    valueAtStakeUsd: 0,
    projectedValueUsd: 0,
    realizedValueUsd: 0,
  };
}

export function redactSourcingEventDetailForDisplay(
  event: SourcingEventDetail,
  canViewFinancialValues: boolean,
): SourcingEventDetail {
  if (canViewFinancialValues) return event;
  return {
    ...redactSourcingEventSummaryForDisplay(event, false),
    synopsis: redactSourceFinancialText(event.synopsis, false),
    problemStatement: redactSourceFinancialText(event.problemStatement, false),
    stages: event.stages.map((stage) => ({
      ...stage,
      summary: redactSourceFinancialText(stage.summary, false),
      gate: {
        ...stage.gate,
        blocker: stage.gate.blocker ? redactSourceFinancialText(stage.gate.blocker, false) : null,
      },
    })),
    alerts: event.alerts.map((alert) => ({
      ...alert,
      title: redactSourceFinancialText(alert.title, false),
      detail: redactSourceFinancialText(alert.detail, false),
    })),
    artifacts: event.artifacts.map((artifact) => ({
      ...artifact,
      title: redactSourceFinancialText(artifact.title, false),
      summary: redactSourceFinancialText(artifact.summary, false),
    })),
    scorecard: {
      ...event.scorecard,
      criteria: event.scorecard.criteria.map((criterion) => ({
        ...criterion,
        note: redactSourceFinancialText(criterion.note, false),
      })),
    },
    valueLedger: redactLedgerSnapshot(event.valueLedger, false),
    dataReadiness: event.dataReadiness.map((item) => ({
      ...item,
      workflowImpact: redactSourceFinancialText(item.workflowImpact, false),
      agentRecommendation: redactSourceFinancialText(item.agentRecommendation, false),
    })),
  };
}
