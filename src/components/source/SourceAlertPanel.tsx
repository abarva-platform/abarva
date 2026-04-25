import Link from 'next/link';
import type { CSSProperties } from 'react';
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

type SourceAlertPanelVariant = 'dark' | 'light';

const LIGHT = {
  card: '#FFFFFF',
  ink: '#101827',
  muted: '#5F6673',
  border: 'rgba(20, 32, 48, 0.12)',
  teal: '#0F766E',
  amber: '#B45309',
  red: '#B91C1C',
} as const;

const LIGHT_ACTION_LINK: CSSProperties = {
  ...sourceActionLink('primary'),
  color: LIGHT.ink,
  background: 'rgba(15,118,110,0.10)',
  border: '1px solid rgba(15,118,110,0.24)',
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
  variant = 'dark',
}: {
  alerts: SourceAlertPanelItem[];
  title?: string;
  emptyLabel?: string;
  framed?: boolean;
  eventContextById?: Record<string, SourceAlertEventContext>;
  variant?: SourceAlertPanelVariant;
}) {
  const lightMode = variant === 'light';
  const panelStyle: CSSProperties = lightMode
    ? {
        display: 'grid',
        alignContent: 'start',
        gap: 9,
        border: `1px solid ${LIGHT.border}`,
        background: 'rgba(255,255,255,0.86)',
        borderRadius: 14,
        padding: 14,
      }
    : sourceCard;
  const textPrimary = lightMode ? LIGHT.ink : COLORS.textPrimary;
  const textSecondary = lightMode ? '#384152' : COLORS.textSecondary;
  const textMuted = lightMode ? LIGHT.muted : COLORS.textMuted;

  return (
    <section style={framed ? panelStyle : { display: 'grid', gap: 10 }}>
      <div style={{ ...sourceSectionLabel, color: lightMode ? LIGHT.teal : COLORS.teal }}>{title}</div>
      {alerts.length === 0 ? (
        <div style={sourceAttentionItem('info')}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Clear for now</div>
          <div style={{ ...sourceMuted, color: textMuted }}>{emptyLabel}</div>
        </div>
      ) : (
        alerts.map((alert) => {
          const eventContext = alert.eventId ? eventContextById?.[alert.eventId] : undefined;
          const severityAccent =
            alert.severity === 'critical'
              ? LIGHT.red
              : alert.severity === 'warning'
                ? LIGHT.amber
                : LIGHT.teal;
          const itemStyle: CSSProperties = lightMode
            ? {
                display: 'grid',
                gap: 6,
                border: `1px solid ${LIGHT.border}`,
                borderLeft: `3px solid ${severityAccent}`,
                borderRadius: 10,
                background: LIGHT.card,
                padding: '10px 12px',
              }
            : sourceAttentionItem(alert.severity);

          return (
            <div key={alert.id} style={itemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: lightMode ? severityAccent : severityColor(alert.severity),
                  }}
                >
                  {severityLabel(alert.severity)}
                </div>
                {eventContext ? (
                  <div style={{ ...TEXT.small, color: textMuted }}>{eventContext.statusLabel}</div>
                ) : alert.status ? (
                  <div style={{ ...TEXT.small, color: textMuted }}>Status - {alert.status}</div>
                ) : null}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: textPrimary }}>{alert.title}</div>
              {eventContext ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ ...TEXT.small, color: textSecondary, fontWeight: 700 }}>{eventContext.name}</span>
                  {alert.owner ? (
                    <span style={{ ...TEXT.small, color: textMuted }}>Owner - {alert.owner}</span>
                  ) : null}
                  <span style={{ ...TEXT.small, color: textMuted }}>{eventContext.agingDays}d aging</span>
                  <span style={{ ...TEXT.small, color: textMuted }}>
                    {formatUsd(eventContext.valueAtStakeUsd)} exposed
                  </span>
                </div>
              ) : alert.owner ? (
                <div style={{ ...TEXT.small, color: textMuted }}>Owner - {alert.owner}</div>
              ) : null}
              <div style={{ ...sourceMuted, color: textMuted, fontSize: '12px' }}>{alert.detail}</div>
              {eventContext?.blocker ? (
                <div style={{ ...TEXT.small, color: textSecondary }}>Blocker - {eventContext.blocker}</div>
              ) : null}
              {alert.eventId ? (
                <div>
                  <Link href={`/source/events/${alert.eventId}`} style={lightMode ? LIGHT_ACTION_LINK : sourceActionLink('primary')}>
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
