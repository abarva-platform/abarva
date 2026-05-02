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
