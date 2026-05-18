import type { ExecutionAction, ExecutionApproval, ExecutionRoom } from '@/lib/source/execution-room/types';
import type { SourceDecisionBundle } from '@/lib/source/decision-queue/types';
import { NOT_RECORDED } from '@/lib/source/execution-room/execution-room';
import type {
  NotificationAudience,
  NotificationEvent,
  NotificationSeverity,
} from './types';
import { dedupeNotifications } from './policy';

function sourceHref(contractId: string): string {
  return `/source/renewal/${encodeURIComponent(contractId)}/execution`;
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function daysPhrase(days: number | null): string {
  if (days === null) return 'date not recorded';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'due today';
  return `due in ${days}d`;
}

function severityForDays(days: number | null): NotificationSeverity {
  if (days === null) return 'attention';
  if (days < 0) return 'critical';
  if (days <= 3) return 'critical';
  if (days <= 14) return 'urgent';
  if (days <= 45) return 'attention';
  return 'info';
}

function ownerAudience(owner: string): NotificationAudience {
  if (owner === NOT_RECORDED) {
    return { kind: 'role', ref: 'source_owner', label: 'Source owner' };
  }
  if (owner.includes('@')) {
    return { kind: 'user', ref: owner.toLowerCase(), label: owner };
  }
  return { kind: 'owner_ref', ref: owner, label: owner };
}

function baseEvent(args: {
  room: ExecutionRoom;
  idPart: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  dueAt: string | null;
  sourceEventType: string;
  evidenceRefs: readonly string[];
  audience: readonly NotificationAudience[];
  metadata?: Record<string, string | number | boolean | null>;
}): NotificationEvent {
  const idPart = slug(args.idPart);
  return {
    id: `source:${args.room.contractId}:${idPart}`,
    tenantKey: args.room.clientKey,
    module: 'source',
    severity: args.severity,
    title: args.title,
    body: args.body,
    href: sourceHref(args.room.contractId),
    subject: {
      type: 'contract',
      id: args.room.contractId,
      label: `${args.room.vendorName} - ${args.room.product}`,
    },
    audience: args.audience,
    producedAt: args.room.generatedAt,
    dueAt: args.dueAt,
    dedupeKey: `source:${args.room.clientKey}:${args.room.contractId}:${idPart}`,
    sourceEventType: args.sourceEventType,
    evidenceRefs: args.evidenceRefs,
    metadata: args.metadata,
  };
}

function noticeEvent(room: ExecutionRoom, action: ExecutionAction): NotificationEvent {
  const severity = severityForDays(action.daysUntilDue);
  return baseEvent({
    room,
    idPart: 'notice-window',
    severity,
    title: `${room.vendorName} notice window ${daysPhrase(action.daysUntilDue)}`,
    body:
      action.daysUntilDue !== null && action.daysUntilDue <= 14
        ? 'Protect optionality now: serve notice or explicitly waive the right before the renewal locks.'
        : 'Notice timing should stay visible in the Source decision inbox until the renewal path is recorded.',
    dueAt: action.dueDate,
    sourceEventType: 'source.renewal.notice_window',
    evidenceRefs: action.evidenceRefs,
    audience: [ownerAudience(action.owner), { kind: 'role', ref: 'legal', label: 'Legal' }],
    metadata: {
      actionId: action.actionId,
      daysUntilDue: action.daysUntilDue,
      posture: room.recommendedPosture,
    },
  });
}

function ownerGapEvent(room: ExecutionRoom, action: ExecutionAction): NotificationEvent {
  return baseEvent({
    room,
    idPart: 'owner-gap',
    severity: 'urgent',
    title: `${room.vendorName} renewal has no accountable owner`,
    body:
      'Assign a named sourcing owner before the notice, negotiation, approval and final-decision path can be trusted.',
    dueAt: action.dueDate,
    sourceEventType: 'source.renewal.owner_missing',
    evidenceRefs: action.evidenceRefs,
    audience: [{ kind: 'role', ref: 'source_vp', label: 'VP Sourcing' }],
    metadata: { actionId: action.actionId },
  });
}

function approvalEvent(room: ExecutionRoom, approval: ExecutionApproval): NotificationEvent {
  return baseEvent({
    room,
    idPart: `approval-${approval.role}`,
    severity: severityForDays(
      approval.dueDate
        ? Math.floor((Date.parse(`${approval.dueDate}T00:00:00Z`) - Date.parse(room.generatedAt)) / 86_400_000)
        : null,
    ),
    title: `${approval.label} approval needed for ${room.vendorName}`,
    body: approval.decisionNeeded,
    dueAt: approval.dueDate,
    sourceEventType: 'source.renewal.approval_needed',
    evidenceRefs: [room.contractId, 'vendor_contracts'],
    audience: [{ kind: 'role', ref: approval.role, label: approval.label }],
    metadata: { approvalRole: approval.role },
  });
}

function finalDecisionEvent(room: ExecutionRoom, action: ExecutionAction): NotificationEvent {
  return baseEvent({
    room,
    idPart: 'final-decision',
    severity: severityForDays(action.daysUntilDue),
    title: `${room.vendorName} final sourcing decision is pending`,
    body:
      'Record the renewal, rebid, exit or concession decision before the commercial posture decays into a default renewal.',
    dueAt: action.dueDate,
    sourceEventType: 'source.renewal.final_decision_due',
    evidenceRefs: action.evidenceRefs,
    audience: [ownerAudience(action.owner), { kind: 'role', ref: 'source_vp', label: 'VP Sourcing' }],
    metadata: { actionId: action.actionId },
  });
}

export function buildSourceExecutionRoomNotifications(
  room: ExecutionRoom,
): NotificationEvent[] {
  const events: NotificationEvent[] = [];

  const serveNotice = room.actions.find((a) => a.kind === 'serve_notice');
  if (serveNotice && serveNotice.status !== 'complete') {
    events.push(noticeEvent(room, serveNotice));
  }

  const assignOwner = room.actions.find((a) => a.kind === 'assign_owner');
  if (assignOwner && room.accountableOwner === NOT_RECORDED) {
    events.push(ownerGapEvent(room, assignOwner));
  }

  for (const approval of room.approvals) {
    if (approval.status !== 'complete') {
      events.push(approvalEvent(room, approval));
    }
  }

  const finalDecision = room.actions.find((a) => a.kind === 'final_decision');
  if (finalDecision && finalDecision.status !== 'complete') {
    events.push(finalDecisionEvent(room, finalDecision));
  }

  return dedupeNotifications(events).slice(0, 8);
}

export function buildSourceDecisionQueueNotifications(
  bundles: readonly SourceDecisionBundle[],
): NotificationEvent[] {
  function titleForBundle(bundle: SourceDecisionBundle): string {
    const notice = bundle.subIssues.find((issue) => issue.kind === 'notice_window');
    if (notice) return `${bundle.vendorName} notice window needs action`;
    return bundle.headline;
  }

  return dedupeNotifications(
    bundles
      .filter((bundle) => bundle.urgency !== 'next_90_days' && bundle.urgency !== 'watch')
      .slice(0, 12)
      .map((bundle) => ({
        id: `source:${bundle.bundleId}:decision`,
        tenantKey: bundle.clientKey,
        module: 'source',
        severity:
          bundle.urgency === 'due_now'
            ? 'critical'
            : bundle.urgency === 'next_14_days'
              ? 'urgent'
              : 'attention',
        title: titleForBundle(bundle),
        body: `${bundle.recommendedAction} ${bundle.summary}`,
        href: bundle.deepLink,
        subject: {
          type: bundle.contractId ? 'contract' : 'source_event',
          id: bundle.contractId ?? bundle.bundleId,
          label: bundle.vendorName,
        },
        audience: [{ kind: 'role', ref: 'source_owner', label: 'Source owner' }],
        producedAt: bundle.surfacedAt,
        dueAt: null,
        dedupeKey: `source:${bundle.clientKey}:${bundle.bundleId}:decision`,
        sourceEventType: 'source.decision_queue.bundle',
        evidenceRefs: bundle.evidenceRefs,
        metadata: {
          urgency: bundle.urgency,
          posture: bundle.posture,
          valueAtStakeUsd: bundle.valueAtStakeUsd,
        },
      })),
  );
}
