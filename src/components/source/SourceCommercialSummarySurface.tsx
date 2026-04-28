'use client';

import React from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SourceCommercialSummaryPanel } from './SourceCommercialSummaryPanel';
import { buildCommercialSummaryProps } from '../../lib/source/source-commercial-summary';

// Design tokens — AbarVa canon
const BG = SHELL.PAPER;
const DARK = SHELL.INK;
const TEXT = SHELL.INK_SOFT;
const MUTED = SHELL.INK_MUTED;
const BORDER = SHELL.CARD_LINE;
const ACCENT = SHELL.INK_MID; // dark navy/blue — NOT teal

export interface SourceCommercialSummarySurfaceProps {
  eventId: string;
  eventName: string;
  stage: string;
  vendorCount?: number;
  className?: string;
}

export function SourceCommercialSummarySurface({
  eventId,
  eventName,
  stage,
  vendorCount = 2,
  className = '',
}: SourceCommercialSummarySurfaceProps): React.ReactElement {
  const panelProps = buildCommercialSummaryProps({ eventId, eventName, stage, vendorCount });

  return (
    <div
      data-testid={`commercial-summary-surface-${eventId}`}
      style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: '20px 24px' }}
      className={className}
    >
      {/* Status strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: ACCENT,
        }}>
          Commercial Intelligence
        </span>
        <span style={{ fontSize: 10, color: MUTED }}>·</span>
        <span style={{ fontSize: 10, color: MUTED }}>Deterministic seeded data · No live model calls</span>
      </div>

      <SourceCommercialSummaryPanel {...panelProps} />

      {/* Caveat footer */}
      <p style={{ fontSize: 11, color: MUTED, marginTop: 12, lineHeight: 1.5 }}>
        Commercial intelligence is generated from deterministic seeded data.
        No live market benchmarks, no live vendor data, no AI-generated savings claims.
        For internal review only.
      </p>
    </div>
  );
}

export default SourceCommercialSummarySurface;
