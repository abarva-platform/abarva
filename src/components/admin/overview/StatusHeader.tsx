/**
 * StatusHeader · Overview Block 1.1 (Setup Redesign Package PR A).
 *
 * Single-line status: tenant · readiness % · agent level · N of 6 capability tracks blocked.
 * Per `DATA_BINDING_CATALOG.md` §1 Block 1.1.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface StatusHeaderProps {
  tenantName: string;
  /** 0-100; null when no segments loaded. */
  readinessPercent: number | null;
  /** decision-grade / partial / thin / blank */
  agentLevel: 'decision-grade' | 'partial' | 'thin' | 'blank';
  /** 0-6. */
  blockedCapabilityTracks: number;
}

const LEVEL_LABEL: Record<StatusHeaderProps['agentLevel'], string> = {
  'decision-grade': 'decision-grade',
  partial: 'partial',
  thin: 'thin',
  blank: 'not yet active',
};

export function StatusHeader({
  tenantName,
  readinessPercent,
  agentLevel,
  blockedCapabilityTracks,
}: StatusHeaderProps) {
  const readinessLabel =
    readinessPercent === null
      ? 'starting'
      : `${readinessPercent}%`;
  return (
    <section
      data-overview-block="status-header"
      data-testid="overview-status-header"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'baseline',
        gap: SPACING.sm,
        flexWrap: 'wrap',
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <span style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 18, color: COLORS.ink, fontWeight: 600 }}>
        {tenantName}
      </span>
      <Sep />
      <Pair label="Setup readiness" value={readinessLabel} />
      <Sep />
      <Pair label="Agents at" value={LEVEL_LABEL[agentLevel]} />
      <Sep />
      <Pair
        label=""
        value={`${blockedCapabilityTracks} of 6 capability tracks blocked`}
        emphasis={blockedCapabilityTracks >= 4 ? 'attention' : 'normal'}
      />
    </section>
  );
}

function Sep() {
  return (
    <span aria-hidden="true" style={{ color: `${COLORS.ink}55`, fontSize: 13 }}>
      ·
    </span>
  );
}

function Pair({
  label,
  value,
  emphasis = 'normal',
}: {
  label: string;
  value: string;
  emphasis?: 'normal' | 'attention';
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
      {label ? (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}80`,
            fontWeight: 600,
          }}
        >
          {label}:
        </span>
      ) : null}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: emphasis === 'attention' ? COLORS.coralInk : COLORS.ink,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </span>
  );
}
