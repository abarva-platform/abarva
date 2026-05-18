// Source Execution Room.
//
// The cockpit tells a sourcing VP what the posture should be. This page tells
// them how to run the renewal to outcome: protect optionality, align
// stakeholders, negotiate, decide rebid/renewal, and measure the result.

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  ExecutionAction,
  ExecutionActionStatus,
  ExecutionApproval,
  ExecutionEvidenceRef,
  ExecutionMilestone,
  ExecutionRoom,
  ExecutionStatus,
} from '@/lib/source/execution-room/types';
import {
  resolveEvidenceTraces,
  type EvidenceResolutionContext,
} from '@/lib/source/evidence-trace/evidence-trace';
import {
  buildSourceExecutionRoomNotifications,
  routeNotification,
  type NotificationEvent,
} from '@/lib/notifications';
import { EvidenceTraceTrigger } from './EvidenceTraceDrawer';

const PAGE: CSSProperties = {
  maxWidth: 1180,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const BAND: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '18px 20px',
};

const PANEL: CSSProperties = {
  ...BAND,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  color: SHELL.INK_MUTED,
};

const BODY: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_SOFT,
  margin: 0,
  lineHeight: 1.55,
};

const STATUS_META: Record<ExecutionStatus, { bg: string; line: string; text: string }> = {
  on_track: { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  at_risk: { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  blocked: { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
};

const ACTION_STATUS_LABEL: Record<ExecutionActionStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  complete: 'Complete',
  pending_external: 'Pending external',
};

function formatUsd(value: number | null): string {
  if (value === null) return 'not priced';
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function SectionTitle({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={LABEL}>{label}</span>
      <h2
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: 'normal',
          fontSize: 20,
          color: SHELL.INK,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'rust' | 'blue';
}) {
  const meta =
    tone === 'green'
      ? { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT }
      : tone === 'amber'
        ? { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT }
        : tone === 'rust'
          ? { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT }
          : tone === 'blue'
            ? { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID }
            : { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT };
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        background: meta.bg,
        border: '1px solid ' + meta.line,
        color: meta.text,
        borderRadius: 5,
        padding: '3px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 132 }}>
      <span style={LABEL}>{label}</span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 18,
          color: SHELL.INK,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
      {detail ? <span style={{ ...BODY, fontSize: 12 }}>{detail}</span> : null}
    </div>
  );
}

function statusTone(status: ExecutionActionStatus): 'neutral' | 'green' | 'amber' | 'rust' {
  if (status === 'complete') return 'green';
  if (status === 'blocked') return 'rust';
  if (status === 'in_progress' || status === 'pending_external') return 'amber';
  return 'neutral';
}

function severityTone(severity: NotificationEvent['severity']): 'neutral' | 'green' | 'amber' | 'rust' | 'blue' {
  if (severity === 'critical') return 'rust';
  if (severity === 'urgent') return 'amber';
  if (severity === 'attention') return 'blue';
  return 'neutral';
}

function CriticalPath({ milestones }: { milestones: ExecutionMilestone[] }) {
  return (
    <section style={PANEL}>
      <SectionTitle
        label="Critical path"
        title="What must happen before this renewal locks"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 10,
        }}
      >
        {milestones.map((m, index) => (
          <article
            key={m.milestoneId}
            style={{
              border: '1px solid ' + SHELL.CARD_LINE_SOFT,
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              minHeight: 150,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={LABEL}>Step {index + 1}</span>
              <Pill tone={statusTone(m.status)}>{ACTION_STATUS_LABEL[m.status]}</Pill>
            </div>
            <h3 style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK, margin: 0 }}>
              {m.title}
            </h3>
            <p style={BODY}>{m.whyItMatters}</p>
            <span style={{ ...BODY, fontWeight: 700, color: SHELL.INK }}>
              {m.daysUntilDue === null
                ? 'Due date not recorded'
                : m.daysUntilDue < 0
                  ? `${Math.abs(m.daysUntilDue)}d overdue`
                  : `Due in ${m.daysUntilDue}d`}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionWorkplan({ actions }: { actions: ExecutionAction[] }) {
  return (
    <section style={PANEL}>
      <SectionTitle
        label="Action workplan"
        title="The sourcing operating plan"
      >
        <p style={BODY}>
          Ordered by urgency and sourcing control. Pending actions are clearly
          labelled when persistence or external workflow is not yet wired.
        </p>
      </SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 860,
          }}
        >
          <thead>
            <tr>
              {['Action', 'Owner', 'Due', 'Status', 'Evidence / link'].map((h) => (
                <th
                  key={h}
                  style={{
                    ...LABEL,
                    textAlign: 'left',
                    borderBottom: '1px solid ' + SHELL.CARD_LINE,
                    padding: '0 10px 8px 0',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr key={action.actionId}>
                <td style={{ padding: '12px 10px 12px 0', borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT }}>
                  <strong style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK }}>
                    {action.title}
                  </strong>
                </td>
                <td style={{ padding: '12px 10px 12px 0', borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT, ...BODY }}>
                  {action.owner}
                </td>
                <td style={{ padding: '12px 10px 12px 0', borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT, ...BODY }}>
                  {action.daysUntilDue === null ? 'not recorded' : `${action.daysUntilDue}d`}
                </td>
                <td style={{ padding: '12px 10px 12px 0', borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT }}>
                  <Pill tone={statusTone(action.status)}>{ACTION_STATUS_LABEL[action.status]}</Pill>
                </td>
                <td style={{ padding: '12px 0', borderBottom: '1px solid ' + SHELL.CARD_LINE_SOFT }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ ...BODY, color: SHELL.INK_MID }}>{action.evidenceBasis}</span>
                    {action.linkedAction.type === 'route' ? (
                      <a href={action.linkedAction.href} style={{ ...BODY, color: SHELL.INK, fontWeight: 700 }}>
                        {action.linkedAction.label}
                      </a>
                    ) : action.linkedAction.type === 'draft' ? (
                      <details>
                        <summary style={{ ...BODY, color: SHELL.INK, fontWeight: 700, cursor: 'pointer' }}>
                          {action.linkedAction.label}
                        </summary>
                        <pre
                          style={{
                            margin: '8px 0 0',
                            whiteSpace: 'pre-wrap',
                            fontFamily: SHELL.SANS,
                            fontSize: 12,
                            lineHeight: 1.5,
                            color: SHELL.INK_SOFT,
                          }}
                        >
                          {action.linkedAction.body}
                        </pre>
                      </details>
                    ) : (
                      <span style={{ ...BODY, color: SHELL.INK_MUTED }}>
                        {action.linkedAction.label}: {action.linkedAction.reason}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SignalRoutingPanel({ room }: { room: ExecutionRoom }) {
  const notifications = buildSourceExecutionRoomNotifications(room);
  return (
    <section style={PANEL}>
      <SectionTitle
        label="Signal routing"
        title="Alerts this room will raise"
      >
        <p style={BODY}>
          These are platform notification events, not cosmetic badges. Urgent
          and critical signals can route to in-app plus email; lower-priority
          signals stay in the digest to avoid alert fatigue.
        </p>
      </SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
        {notifications.map((event) => {
          const policy = routeNotification(event);
          return (
            <article
              key={event.id}
              style={{
                border: '1px solid ' + SHELL.CARD_LINE_SOFT,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <Pill tone={severityTone(event.severity)}>{event.severity}</Pill>
                <span style={{ ...BODY, fontSize: 12 }}>
                  {event.dueAt ? `Due ${event.dueAt}` : 'Due date not recorded'}
                </span>
              </div>
              <h3 style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK, margin: 0 }}>
                {event.title}
              </h3>
              <p style={BODY}>{event.body}</p>
              <span style={{ ...LABEL, color: SHELL.INK_MID }}>
                Channels · {policy.channels.join(' + ')}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function NegotiationPanel({ room }: { room: ExecutionRoom }) {
  const brief = room.negotiationBrief;
  return (
    <section id="negotiation-room" style={PANEL}>
      <SectionTitle
        label="Negotiation room"
        title={brief.headline}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        <BriefColumn title="Walk-away" body={`${brief.walkAway.title}. ${brief.walkAway.rationale}`} />
        <BriefColumn title="BATNA" body={`${brief.batna.title}. ${brief.batna.rationale}`} />
        <BriefColumn
          title="Concession strategy"
          body={brief.concessions.map((c) => `${c.title}: ${c.rationale}`).join(' ')}
        />
      </div>
      <div style={{ borderTop: '1px solid ' + SHELL.CARD_LINE_SOFT, paddingTop: 12 }}>
        <span style={LABEL}>Levers worth pulling</span>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {brief.levers.map((lever) => (
            <li key={lever.title} style={{ ...BODY, color: SHELL.INK_MID, marginBottom: 6 }}>
              <strong>{lever.title}.</strong> {lever.rationale}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BriefColumn({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        border: '1px solid ' + SHELL.CARD_LINE_SOFT,
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={LABEL}>{title}</span>
      <p style={{ ...BODY, color: SHELL.INK_MID }}>{body}</p>
    </div>
  );
}

function RebidPanel({ room }: { room: ExecutionRoom }) {
  const read = room.rebidReadiness;
  return (
    <section id="rebid-market-test" style={PANEL}>
      <SectionTitle
        label="Rebid / market test"
        title={
          read.verdict === 'start_rebid'
            ? 'Start a competitive rebid'
            : read.verdict === 'market_test_first'
              ? 'Market-test before threatening a rebid'
              : 'Do not rebid yet'
        }
      >
        <p style={BODY}>{read.rationale}</p>
      </SectionTitle>
      {read.blockers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={LABEL}>Blockers</span>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {read.blockers.map((b) => (
              <li key={b} style={{ ...BODY, color: SHELL.INK_MID }}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p style={{ ...BODY, color: SHELL.INK }}>
        <strong>Next action:</strong> {read.nextAction}
      </p>
    </section>
  );
}

function ApprovalPanel({ approvals }: { approvals: ExecutionApproval[] }) {
  return (
    <section style={PANEL}>
      <SectionTitle label="Stakeholder approvals" title="Who must say yes" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {approvals.map((approval) => (
          <article
            key={approval.role}
            style={{
              border: '1px solid ' + SHELL.CARD_LINE_SOFT,
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK, fontWeight: 700 }}>
                {approval.label}
              </span>
              <Pill tone={statusTone(approval.status)}>{ACTION_STATUS_LABEL[approval.status]}</Pill>
            </div>
            <p style={BODY}>{approval.decisionNeeded}</p>
            <span style={{ ...BODY, fontSize: 12 }}>Owner: {approval.owner}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidencePack({
  evidence,
  evidenceContext,
}: {
  evidence: ExecutionEvidenceRef[];
  evidenceContext?: EvidenceResolutionContext;
}) {
  return (
    <section style={PANEL}>
      <SectionTitle
        label="Evidence pack"
        title="Every number and clause must defend itself"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {evidence.map((item) => {
          const traces = evidenceContext
            ? resolveEvidenceTraces(item.evidenceRefs, evidenceContext)
            : [];
          return (
            <article
              key={item.label}
              style={{
                border: '1px solid ' + SHELL.CARD_LINE_SOFT,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <span style={LABEL}>{item.label}</span>
                {evidenceContext ? (
                  <EvidenceTraceTrigger
                    variant="chip"
                    claimLabel={item.label}
                    traces={traces}
                  />
                ) : null}
              </div>
              <p style={{ ...BODY, color: SHELL.INK_MID }}>{item.claim}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function SourceExecutionRoomPage({
  room,
  evidenceContext,
}: {
  room: ExecutionRoom;
  evidenceContext?: EvidenceResolutionContext;
}) {
  const status = STATUS_META[room.status];
  return (
    <div style={PAGE}>
      <header
        style={{
          ...BAND,
          background: status.bg,
          borderColor: status.line,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <Link
          href={`/source/renewal/${encodeURIComponent(room.contractId)}`}
          style={{ ...BODY, textDecoration: 'none', color: SHELL.INK_MID, fontWeight: 700 }}
        >
          Back to Renewal Cockpit
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 260, flex: '1 1 360px' }}>
            <span style={LABEL}>Source Execution Room</span>
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontWeight: 'normal',
                fontSize: 34,
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {room.vendorName} - {room.product}
            </h1>
            <p style={{ ...BODY, color: SHELL.INK_MID, fontSize: 14 }}>
              {room.statusRationale}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Pill tone={room.status === 'blocked' ? 'rust' : room.status === 'at_risk' ? 'amber' : 'green'}>
              {room.statusLabel}
            </Pill>
            <Pill tone="blue">Posture: {room.postureLabel}</Pill>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 14,
            borderTop: '1px solid ' + status.line,
            paddingTop: 14,
          }}
        >
          <Metric
            label="Notice deadline"
            value={room.daysToNoticeDeadline === null ? 'not recorded' : `${room.daysToNoticeDeadline}d`}
            detail={room.noticeDeadlineDate ?? undefined}
          />
          <Metric label="Annual spend" value={formatUsd(room.currentAnnualSpendUsd)} />
          <Metric label="Term end" value={room.termEndDate ?? 'not recorded'} />
          <Metric label="Owner" value={room.accountableOwner} />
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.62)',
            border: '1px solid ' + status.line,
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={LABEL}>Next best action</span>
          <p style={{ ...BODY, color: SHELL.INK, fontSize: 15, fontWeight: 700 }}>
            {room.nextBestAction}
          </p>
        </div>
      </header>

      <CriticalPath milestones={room.criticalPath} />
      <SignalRoutingPanel room={room} />
      <ActionWorkplan actions={room.actions} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        <NegotiationPanel room={room} />
        <RebidPanel room={room} />
      </div>

      <ApprovalPanel approvals={room.approvals} />
      <EvidencePack evidence={room.evidencePack} evidenceContext={evidenceContext} />

      <section style={PANEL}>
        <SectionTitle label="Outcome target" title="What success must prove" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
          {room.outcomeTargets.map((target) => (
            <article
              key={target.targetId}
              style={{
                border: '1px solid ' + SHELL.CARD_LINE_SOFT,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span style={LABEL}>{target.title}</span>
              <p style={{ ...BODY, color: SHELL.INK_MID }}>{target.targetValue}</p>
              <span style={{ ...BODY, fontSize: 12 }}>
                Measurement: {target.measurementDate ?? 'not recorded'}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
