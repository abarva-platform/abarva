/**
 * TowerPortfolioSummaryStrip — server-rendered portfolio summary
 *
 * Renders an `<InstanceSummaryTile />` for every known instance (programs +
 * source events) side-by-side as compact tiles. Useful for at-a-glance
 * triage from the Control Tower index.
 *
 * AbarVa palette only via SHELL tokens. Pure server component; relies on
 * the tile to do all reasoning-context resolution.
 */

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getAllInstanceIds } from '@/lib/reasoning/instance-resolver';
import { InstanceSummaryTile } from '@/components/_shared/InstanceSummaryTile';

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginBottom: 24,
  paddingBottom: 20,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
};

const HEADER_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 600,
};

const HEADER_HINT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_SOFT,
};

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 10,
};

export function TowerPortfolioSummaryStrip() {
  const ids = getAllInstanceIds();
  const allIds = [...ids.programs, ...ids.sourceEvents];

  if (allIds.length === 0) return null;

  return (
    <section
      data-testid="tower-portfolio-summary-strip"
      aria-label="Portfolio instance summary"
      style={SECTION}
    >
      <div style={HEADER}>
        <span style={HEADER_LABEL}>Portfolio summary</span>
        <span style={HEADER_HINT}>{allIds.length} instances</span>
      </div>
      <div style={GRID}>
        {allIds.map((id) => (
          <InstanceSummaryTile key={id} instanceId={id} size="compact" />
        ))}
      </div>
    </section>
  );
}

export default TowerPortfolioSummaryStrip;
