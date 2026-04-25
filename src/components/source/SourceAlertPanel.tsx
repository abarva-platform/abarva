import Link from 'next/link';
import { COLORS, FONTS, TEXT } from '@/lib/design-system';
import type { SourceAlertSeverity, SourceAlertStatus } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import { sourceActionLink, sourceAttentionItem, sourceCard, sourceMuted, sourceSectionLabel } from './foundationStyles';

export type SourceAlertEventContext = {
  name: string;
  valueAtStakeUsd: number;
  agingDays: number;
  statusLabel: string;
  blocker: string | null;
};

type SourceAlertPanelItem = {
  id: string;
  title: string;
  detail: string;
  severity: SourceAlertSeverity;
  status?: SourceAlertStatus;
  eventId?: string;
  owner?: string;
  actionLabel?: string;
};

function severityLabel(severity: SourceAlertSeverity): string {
  if (severity === 'critical') return 'Critical';
  if (severity === 'warning') return 'Watch';
  return 'Attention';
}

function severityColor(severity: SourceAlertSeverity): string {
  if (severity === 'critical') return COLORS.red;
  if (severity === 'warning') return COLORS.amber;
  return COLORS.teal;
}

export function SourceAlertPanel({
  alerts,
  title = 'Nexus alerts / decisions needed',
  emptyLabel = 'No open Source alerts. Nexus will surface aging, missing inputs, and decision risks here.',
  framed = true,
  eventContextById,
}: {
  alerts: SourceAlertPanelItem[];
  title?: string;
  emptyLabel?: string;
  framed?: boolean;
  eventContextById?: Record<string, SourceAlertEventContext>;
}) {
  return (
    <section style={framed ? sourceCard : { display: 'grid', gap: 10 }}>
      <div style={sourceSectionLabel}>{title}</div>
      {alerts.length === 0 ? (
        <div style={sourceAttentionItem('info')}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary }}>Clear for now</div>
          <div style={sourceMuted}>{emptyLabel}</div>
        </div>
      ) : (
        alerts.map((alert) => {
          const eventContext = alert.eventId ? eventContextById?.[alert.eventId] : undefined;

          return (
            <div key={alert.id} style={sourceAttentionItem(alert.severity)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: severityColor(alert.severity),
                  }}
                >
                  {severityLabel(alert.severity)}
                </div>
                {eventContext ? (
                  <div style={{ ...TEXT.small, color: COLORS.textMuted }}>{eventContext.statusLabel}</div>
                ) : alert.status ? (
                  <div style={{ ...TEXT.small, color: COLORS.textMuted }}>Status - {alert.status}</div>
                ) : null}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary }}>{alert.title}</div>
              {eventContext ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ ...TEXT.small, color: COLORS.textSecondary }}>{eventContext.name}</span>
                  {alert.owner ? (
                    <span style={{ ...TEXT.small, color: COLORS.textMuted }}>Owner - {alert.owner}</span>
                  ) : null}
                  <span style={{ ...TEXT.small, color: COLORS.textMuted }}>{eventContext.agingDays}d aging</span>
                  <span style={{ ...TEXT.small, color: COLORS.textMuted }}>
                    {formatUsd(eventContext.valueAtStakeUsd)} exposed
                  </span>
                </div>
              ) : alert.owner ? (
                <div style={{ ...TEXT.small, color: COLORS.textMuted }}>Owner - {alert.owner}</div>
              ) : null}
              <div style={sourceMuted}>{alert.detail}</div>
              {eventContext?.blocker ? (
                <div style={{ ...TEXT.small, color: COLORS.textSecondary }}>Blocker - {eventContext.blocker}</div>
              ) : null}
              {alert.eventId ? (
                <div>
                  <Link href={`/source/events/${alert.eventId}`} style={sourceActionLink('primary')}>
                    {alert.actionLabel ?? 'Open event'}
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </section>
  );
}
