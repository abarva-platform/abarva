'use client';

// DiscoveryReceiptCard · S7 (agent response rendering)
//
// Renders an ExtractionReceipt (from S3's planDiscoveryExtraction) as a card in
// the agent chat — the name-every-stage strip (staged → parsed → extracted →
// routed → review) plus what was routed vs kept as evidence-only. The honesty
// contract made visible: "extracted" never means "uploaded"; nothing faked into
// a field. Presentational (props in, JSX out); StewardChat mounts it.

import type { CSSProperties } from 'react';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import type {
  ExtractionReceipt,
  ExtractionStage,
} from '@/lib/programs/discovery/extraction-planner';

const RULE = '#E3DFD5';

const STAGE_COLOR: Record<ExtractionStage['status'], string> = {
  done: '#2f7a3f',
  partial: '#8a6d00',
  skipped: BrandColors.stone,
  failed: '#a11d1d',
};

function stageMark(status: ExtractionStage['status']): string {
  switch (status) {
    case 'done':
      return '✓';
    case 'failed':
      return '✕';
    case 'skipped':
      return '–';
    default:
      return '~';
  }
}

const LABEL: CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: BrandColors.stone,
};

export function DiscoveryReceiptCard({ receipt }: { receipt: ExtractionReceipt }) {
  return (
    <div
      data-testid="discovery-receipt-card"
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 8,
        background: '#fff',
        overflow: 'hidden',
        fontFamily: BrandTypography.sans,
        marginTop: 8,
      }}
    >
      <div
        style={{
          background: '#f0efeb',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        <span style={{ color: BrandColors.signalBlue }}>{receipt.sourceFile}</span>
        <span style={{ color: BrandColors.slate }}>{receipt.evidenceType}</span>
      </div>

      <div style={{ display: 'flex', padding: '8px 10px', borderBottom: `1px solid ${RULE}` }}>
        {receipt.stages.map((s, i) => (
          <div key={s.stage} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            <div style={LABEL}>{s.stage}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: STAGE_COLOR[s.status], marginTop: 2 }}>
              {stageMark(s.status)}
            </div>
            {i < receipt.stages.length - 1 && (
              <span style={{ position: 'absolute', right: -3, top: 8, color: '#cfcabb' }}>›</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '7px 10px', fontSize: 10, color: BrandColors.slate, lineHeight: 1.4 }}>
        {receipt.summary}
      </div>

      {receipt.unmapped.length > 0 && (
        <div style={{ padding: '0 10px 8px', fontSize: 9, color: BrandColors.stone }}>
          {receipt.unmapped.length} kept as evidence only (not routed to a field)
        </div>
      )}
    </div>
  );
}
