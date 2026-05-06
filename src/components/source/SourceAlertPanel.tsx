import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceAlertSeverity, SourceAlertStatus } from '@/lib/source/types';
import { formatSourceFinancialValue } from '@/lib/source/financial-display';

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

const SOURCE_CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const SOURCE_SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

const SOURCE_MUTED: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

const TEXT_SMALL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
};

const SOURCE_ATTENTION_INFO: CSSProperties = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const SOURCE_ATTENTION_WARNING: CSSProperties = {
  background: SHELL.PEACH_BG,
  border: '1px solid ' + SHELL.PEACH_LINE,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const SOURCE_ATTENTION_CRITICAL: CSSProperties = {
  background: SHELL.RUST_BG,
  border: '1px solid ' + SHELL.PEACH_LINE,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const SOURCE_ACTION_LINK_PRIMARY: CSSProperties = {
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '9px 12px',
  borderRadius: 999,
  border: '1px solid ' + SHELL.INK,
  background: SHELL.INK,
  color: SHELL.CARD_WHITE,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
};

const LIGHT = {
  card: SHELL.CARD_WHITE,
  ink: SHELL.INK,
  muted: SHELL.INK_MUTED,
  border: SHELL.CARD_LINE,
  teal: '#0F766E',
  amber: SHELL.PEACH_TEXT,
  red: SHELL.RUST_TEXT,
} as const;

const LIGHT_ACTION_LINK: CSSProperties = {
  ...SOURCE_ACTION_LINK_PRIMARY,
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
  if (severity === 'critical') return SHELL.RUST_TEXT;
  if (severity === 'warning') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function sourceAttentionItem(tone: 'info' | 'warning' | 'critical'): CSSProperties {
  if (tone === 'critical') return SOURCE_ATTENTION_CRITICAL;
  if (tone === 'warning') return SOURCE_ATTENTION_WARNING;
  return SOURCE_ATTENTION_INFO;
}

export function SourceAlertPanel({
  alerts,
  title = 'Sentinel alerts / decisions needed',
  emptyLabel = 'No open Source alerts. Sentinel will surface aging, missing inputs, and decision risks here.',
  framed = true,
  eventContextById,
  variant = 'dark',
  canViewFinancialValues = true,
}: {
  alerts: SourceAlertPanelItem[];
  title?: string;
  emptyLabel?: string;
  framed?: boolean;
  eventContextById?: Record<string, SourceAlertEventContext>;
  variant?: SourceAlertPanelVariant;
  canViewFinancialValues?: boolean;
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
        minWidth: 0,
        maxWidth: '100%',
      }
    : SOURCE_CARD;
  const textPrimary = lightMode ? LIGHT.ink : SHELL.INK;
  const textSecondary = lightMode ? '#384152' : SHELL.INK_SOFT;
  const textMuted = lightMode ? LIGHT.muted : SHELL.INK_MUTED;

  return (
    <section style={framed ? panelStyle : { display: 'grid', gap: 10 }}>
      <div style={{ ...SOURCE_SECTION_LABEL, color: lightMode ? LIGHT.teal : SHELL.MINT_TEXT }}>{title}</div>
      {alerts.length === 0 ? (
        <div style={sourceAttentionItem('info')}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Clear for now</div>
          <div style={{ ...SOURCE_MUTED, color: textMuted }}>{emptyLabel}</div>
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
                    fontFamily: SHELL.MONO,
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: lightMode ? severityAccent : severityColor(alert.severity),
                  }}
                >
                  {severityLabel(alert.severity)}
                </div>
                {eventContext ? (
                  <div style={{ ...TEXT_SMALL, color: textMuted }}>{eventContext.statusLabel}</div>
                ) : alert.status ? (
                  <div style={{ ...TEXT_SMALL, color: textMuted }}>Status - {alert.status}</div>
                ) : null}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: textPrimary, overflowWrap: 'anywhere' }}>
                {alert.title}
              </div>
              {eventContext ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ ...TEXT_SMALL, color: textSecondary, fontWeight: 700, minWidth: 0 }}>
                    {eventContext.name}
                  </span>
                  {alert.owner ? (
                    <span style={{ ...TEXT_SMALL, color: textMuted }}>Owner - {alert.owner}</span>
                  ) : null}
                  <span style={{ ...TEXT_SMALL, color: textMuted }}>{eventContext.agingDays}d aging</span>
                  <span style={{ ...TEXT_SMALL, color: textMuted }}>
                    {formatSourceFinancialValue(eventContext.valueAtStakeUsd, canViewFinancialValues)} exposed
                  </span>
                </div>
              ) : alert.owner ? (
                <div style={{ ...TEXT_SMALL, color: textMuted }}>Owner - {alert.owner}</div>
              ) : null}
              <div style={{ ...SOURCE_MUTED, color: textMuted, fontSize: '12px' }}>{alert.detail}</div>
              {eventContext?.blocker ? (
                <div style={{ ...TEXT_SMALL, color: textSecondary }}>Blocker - {eventContext.blocker}</div>
              ) : null}
              {alert.eventId ? (
                <div>
                  <Link href={`/source/events/${alert.eventId}`} style={lightMode ? LIGHT_ACTION_LINK : SOURCE_ACTION_LINK_PRIMARY}>
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
