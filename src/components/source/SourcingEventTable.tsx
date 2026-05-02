import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceRigorLevel, SourcingEventSummary } from '@/lib/source/types';
import {
  formatSourceFinancialValue,
  redactSourceFinancialText,
} from '@/lib/source/financial-display';
import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';
import { EventLifecycleStatusBadge } from './EventLifecycleStatusBadge';
import { InstanceHealthBadge } from '@/components/_shared/InstanceHealthBadge';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { InstanceHealth } from '@/lib/reasoning/instance-health';

// ─── Reasoning helpers ────────────────────────────────────────────────────────

interface EventReasoningData {
  health: InstanceHealth;
  contradictionCount: number;
}

/**
 * Compute instance health and contradiction count for a sourcing event row by
 * matching the event ID against SOURCE_EVENT_INSTANCES. Returns null when no
 * typed instance exists for that event (e.g. events not yet bound to a pattern).
 */
function computeEventReasoningData(eventId: string): EventReasoningData | null {
  const instance = SOURCE_EVENT_INSTANCES.find((i) => i.id === eventId);
  if (!instance) return null;
  const pattern = findLifecyclePattern(instance.patternId);
  if (!pattern) return null;
  const ctx = buildSourceSynthesisContext(instance, pattern);
  return {
    health: computeInstanceHealth(ctx),
    contradictionCount: ctx.activeContradictions.length,
  };
}

// ─── Contradiction count chip ──────────────────────────────────────────────────

function ContradictionChip({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span
        data-testid="contradiction-chip-zero"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 7px',
          borderRadius: 999,
          border: `1px solid ${SHELL.MINT_LINE}`,
          background: SHELL.MINT_BG,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          color: SHELL.MINT_TEXT,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        ✓ no contradictions
      </span>
    );
  }
  return (
    <span
      data-testid="contradiction-chip-nonzero"
      title={`${count} active contradiction${count === 1 ? '' : 's'} detected`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 999,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        background: SHELL.PEACH_BG,
        fontFamily: SHELL.MONO,
        fontSize: 9,
        fontWeight: 700,
        color: SHELL.PEACH_TEXT,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {count} contradiction{count === 1 ? '' : 's'}
    </span>
  );
}

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

const SOURCE_METRIC_DETAIL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
};

const SOURCE_TABLE_HEADER_CELL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  padding: '0 14px 10px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
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

const RISK_PILL_HIGH: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  padding: '3px 8px',
  borderRadius: 20,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  background: SHELL.RUST_BG,
  color: SHELL.RUST_TEXT,
  border: '1px solid ' + SHELL.PEACH_LINE,
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
};

const RISK_PILL_MEDIUM: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  padding: '3px 8px',
  borderRadius: 20,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  background: SHELL.PEACH_BG,
  color: SHELL.PEACH_TEXT,
  border: '1px solid ' + SHELL.PEACH_LINE,
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
};

const TABLE_CELL: CSSProperties = {
  padding: '14px 11px',
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  verticalAlign: 'top',
  overflowWrap: 'anywhere',
};

const STATUS_META: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  color: SHELL.INK_MUTED,
};

const EVENT_NAME: CSSProperties = {
  fontSize: '17px',
  fontWeight: 800,
  color: SHELL.INK,
  lineHeight: 1.25,
};

const LIGHT = {
  card: SHELL.CARD_WHITE,
  ink: SHELL.INK,
  muted: SHELL.INK_MUTED,
  border: SHELL.CARD_LINE,
  row: SHELL.PAPER_SOFT,
  teal: '#0F766E',
  red: SHELL.RUST_TEXT,
  green: SHELL.MINT_TEXT,
} as const;

type SourcingEventTableVariant = 'dark' | 'light';

const LIGHT_ACTION_LINK: CSSProperties = {
  ...SOURCE_ACTION_LINK_PRIMARY,
  color: LIGHT.ink,
  background: 'rgba(15,118,110,0.10)',
  border: '1px solid rgba(15,118,110,0.24)',
};

function formatRigorLabel(rigor: SourceRigorLevel): string {
  if (rigor === 'enhanced') return 'Enhanced';
  if (rigor === 'strategic') return 'Strategic';
  return 'Standard';
}

export function SourcingEventTable({
  events,
  variant = 'dark',
  canViewFinancialValues = true,
}: {
  events: SourcingEventSummary[];
  variant?: SourcingEventTableVariant;
  canViewFinancialValues?: boolean;
}) {
  const lightMode = variant === 'light';
  const textPrimary = lightMode ? LIGHT.ink : SHELL.INK;
  const textSecondary = lightMode ? '#384152' : SHELL.INK_SOFT;
  const textMuted = lightMode ? LIGHT.muted : SHELL.INK_MUTED;
  const tableCell: CSSProperties = {
    ...TABLE_CELL,
    borderBottom: `1px solid ${lightMode ? LIGHT.border : SHELL.CARD_LINE}`,
    padding: lightMode ? '12px 11px' : TABLE_CELL.padding,
  };
  const headerCell: CSSProperties = {
    ...SOURCE_TABLE_HEADER_CELL,
    color: lightMode ? LIGHT.muted : SOURCE_TABLE_HEADER_CELL.color,
    borderBottom: `1px solid ${lightMode ? LIGHT.border : SHELL.CARD_LINE}`,
  };

  return (
    <section
      style={{
        ...SOURCE_CARD,
        background: lightMode ? LIGHT.card : SOURCE_CARD.background,
        border: `1px solid ${lightMode ? LIGHT.border : SHELL.CARD_LINE}`,
        gap: lightMode ? 10 : SOURCE_CARD.gap,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: lightMode ? 6 : 10,
          alignItems: 'end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'grid', gap: 5 }}>
          <div style={{ ...SOURCE_SECTION_LABEL, color: lightMode ? LIGHT.teal : SHELL.MINT_TEXT }}>Live Sourcing Events</div>
          <div style={{ fontSize: lightMode ? '22px' : '24px', fontWeight: 800, color: textPrimary }}>
            Event operating queue
          </div>
        </div>
        <p style={{ ...SOURCE_MUTED, margin: 0, maxWidth: 640, color: textMuted }}>
          Compare each IT sourcing event by stage, lifecycle, owner, linked program, evidence posture, value,
          blocker, aging, and next operating move.
        </p>
      </div>

      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: lightMode ? 1080 : 1160 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={headerCell}>Event / Tenant</th>
              <th style={headerCell}>Archetype / Rigor</th>
              <th style={headerCell}>Workflow</th>
              <th style={headerCell}>Owner / Pressure</th>
              <th style={headerCell}>Program / Evidence</th>
              <th style={headerCell}>Value At Stake</th>
              <th style={headerCell}>Next Action</th>
              <th style={{ ...headerCell, textAlign: 'right' }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const reasoningData = computeEventReasoningData(event.id);
              const linkedProgram = buildLinkedProgramBadgeView(event.id);
              const approvalQueueEvent = event.status === 'waiting_on_client'
                && event.blocker?.toLowerCase().includes('tenant admin approval');
              const openHref = approvalQueueEvent ? '/source/events' : `/source/events/${event.id}`;
              const openLabel = approvalQueueEvent ? 'Review approval' : 'Open event';
              return (
              <tr key={event.id} style={{ background: lightMode ? LIGHT.row : 'transparent' }}>
                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {/* Event name + health badge in a flex row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ ...EVENT_NAME, color: textPrimary }}>{event.name}</span>
                      {reasoningData && <InstanceHealthBadge health={reasoningData.health} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ ...STATUS_META, color: textMuted }}>{event.code} - {event.accountName}</span>
                      {reasoningData && <ContradictionChip count={reasoningData.contradictionCount} />}
                    </div>
                    {event.blocker ? (
                      <div
                        style={{
                          fontFamily: SHELL.SANS,
                          fontSize: 13,
                          color: event.isAtRisk ? (lightMode ? LIGHT.red : SHELL.RUST_TEXT) : textSecondary,
                          lineHeight: 1.5,
                          maxWidth: 280,
                        }}
                      >
                        Blocker - {event.blocker}
                      </div>
                    ) : (
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.5, color: lightMode ? LIGHT.green : SHELL.MINT_TEXT }}>No active blocker</div>
                    )}
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>{event.archetype}</div>
                    <div style={{ ...STATUS_META, color: textMuted }}>Rigor - {formatRigorLabel(event.rigor)}</div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>{event.currentStageLabel}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <EventLifecycleStatusBadge status={event.status} label={event.statusLabel} variant={variant} />
                      {event.isAtRisk ? <span style={RISK_PILL_HIGH}>At Risk</span> : null}
                      {event.openAlerts > 0 ? (
                        <span style={event.isAtRisk ? RISK_PILL_HIGH : RISK_PILL_MEDIUM}>
                          {event.openAlerts} alert{event.openAlerts === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>{event.owner}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ ...STATUS_META, color: textMuted }}>{event.agingDays}d aging</span>
                      <span style={{ ...STATUS_META, color: textMuted }}>{event.statusLabel}</span>
                    </div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 7, minWidth: 170 }}>
                    <div style={{ color: textPrimary, fontWeight: 700 }}>
                      {linkedProgram ? linkedProgram.programCode : 'Standalone'}
                    </div>
                    <div style={{ ...STATUS_META, color: textMuted }}>
                      {linkedProgram ? linkedProgram.programName : 'No linked program in seeded summary'}
                    </div>
                    <div style={{ ...STATUS_META, color: textMuted }}>
                      Evidence posture: seeded summary; open event for readiness rows.
                    </div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div
                    style={{
                      display: 'grid',
                      gap: 6,
                      borderLeft: `2px solid ${event.isAtRisk ? (lightMode ? LIGHT.red : SHELL.RUST_TEXT) : (lightMode ? LIGHT.teal : SHELL.MINT_TEXT)}`,
                      paddingLeft: 10,
                    }}
                  >
                    <div style={{ fontFamily: SHELL.SERIF, fontSize: lightMode ? '24px' : '25px', color: textPrimary }}>
                      {formatSourceFinancialValue(event.valueAtStakeUsd, canViewFinancialValues)}
                    </div>
                    <div style={{ ...SOURCE_METRIC_DETAIL, color: textMuted }}>
                      {event.isAtRisk ? 'Exposed projected value' : 'Projected sourcing value'}
                    </div>
                  </div>
                </td>

                <td style={tableCell}>
                  <div style={{ display: 'grid', gap: 7, minWidth: 190 }}>
                    <div style={{ ...SOURCE_METRIC_DETAIL, color: textMuted }}>Recommended next move</div>
                    <div style={{ color: textPrimary, fontWeight: 600 }}>
                      {redactSourceFinancialText(event.nextAction, canViewFinancialValues)}
                    </div>
                    <div style={{ ...SOURCE_MUTED, maxWidth: 260, color: textMuted }}>
                      {redactSourceFinancialText(event.nextDecision, canViewFinancialValues)}
                    </div>
                  </div>
                </td>

                <td style={{ ...tableCell, textAlign: 'right' }}>
                  <Link href={openHref} style={lightMode ? LIGHT_ACTION_LINK : SOURCE_ACTION_LINK_PRIMARY}>
                    {openLabel}
                  </Link>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
