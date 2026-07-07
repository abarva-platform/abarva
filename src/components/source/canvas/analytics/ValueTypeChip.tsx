'use client';

import type { CSSProperties } from 'react';
import { ANALYTICS, valueTypeMeta } from './analytics-tokens';
import type { ValueType } from './view-model';

interface ValueTypeChipProps {
  valueType: ValueType;
  /** 'short' renders the lowercase spine label (concession · incremental …). */
  variant?: 'short' | 'full';
}

/**
 * A single value-type chip from the canonical classification spine —
 * `expected concession · incremental · solution · protected · risk-adjusted`.
 * Color-coded per type; never a background wash on the whole row, just the chip.
 */
export function ValueTypeChip({ valueType, variant = 'short' }: ValueTypeChipProps) {
  const meta = valueTypeMeta(valueType);
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: ANALYTICS.SANS,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: variant === 'short' ? 0.2 : 0,
    padding: '3px 9px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    background: meta.bg,
    color: meta.fg,
  };
  return (
    <span style={style} data-value-type={valueType}>
      {variant === 'short' ? meta.short : meta.label}
    </span>
  );
}

/**
 * The full legend of the five value types — the classification spine, shown as a
 * row of chips. Used above the waterfall so the reader learns the vocabulary.
 */
export function ValueTypeLegend() {
  const order: ValueType[] = [
    'expected_concession',
    'incremental_negotiated',
    'solution_tightening',
    'protected',
    'risk_adjusted',
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
      }}
    >
      {order.map((vt, i) => (
        <span key={vt} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ValueTypeChip valueType={vt} />
          {i < order.length - 1 ? (
            <span style={{ color: ANALYTICS.FAINT, fontSize: 12 }}>·</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
