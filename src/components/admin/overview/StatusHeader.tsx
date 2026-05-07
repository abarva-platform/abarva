/**
 * StatusHeader · Overview Block 1.1 (Setup Redesign Package PR A).
 *
 * Single-line status: tenant · readiness % · agent level · N of 6 capability tracks blocked.
 * Per `DATA_BINDING_CATALOG.md` §1 Block 1.1 + Setup canon refit.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';

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
  const readinessLabel = readinessPercent === null ? 'starting' : `${readinessPercent}%`;
  return (
    <section
      data-overview-block="status-header"
      data-testid="overview-status-header"
      style={{
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        flexWrap: 'wrap',
        fontFamily: SETUP.sans,
      }}
    >
      <span
        style={{
          fontFamily: SETUP.serif,
          fontSize: 19,
          fontWeight: 500,
          letterSpacing: '-0.012em',
          color: SETUP.ink,
        }}
      >
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
    <span aria-hidden="true" style={{ color: SETUP.inkFaint, fontSize: 13 }}>
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
        <span style={{ ...SETUP_TYPE.tileLabel, color: SETUP.inkMuted }}>{label}:</span>
      ) : null}
      <span
        style={{
          fontFamily: SETUP.sans,
          fontSize: 13,
          color: emphasis === 'attention' ? SETUP.coral : SETUP.ink,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </span>
  );
}
