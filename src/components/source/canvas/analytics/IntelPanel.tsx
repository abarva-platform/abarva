'use client';

import type { CSSProperties } from 'react';
import { ANALYTICS, intelToneStyle } from './analytics-tokens';
import type { SourceIntelViewModel } from './view-model';

interface IntelPanelProps {
  intel: SourceIntelViewModel;
}

/**
 * Beat 1 — "Intel we bring." The engine's read for this stage, rendered ON the
 * page (never buried only in the download): what it found, benchmarks, archetype
 * knowledge, and what a cold start would miss. Tagged, plain-English findings.
 */
export function IntelPanel({ intel }: IntelPanelProps) {
  const isSample = intel.provenance === 'sample';
  const panelStyle: CSSProperties = {
    border: `1px solid ${ANALYTICS.LINE}`,
    borderRadius: ANALYTICS.RADIUS_LG,
    background: ANALYTICS.INTEL_GRADIENT,
    boxShadow: ANALYTICS.SHADOW_SM,
    padding: '18px 20px',
  };

  return (
    <section style={panelStyle} data-testid="intel-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: ANALYTICS.TEAL_DEEP,
            color: ANALYTICS.TEAL_BRIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: ANALYTICS.SERIF,
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          a
        </span>
        <span
          style={{
            fontFamily: ANALYTICS.SERIF,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: ANALYTICS.INK,
          }}
        >
          What Source brings
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 999,
            background: isSample ? 'rgba(10,10,11,0.06)' : ANALYTICS.GREEN_TINT,
            color: isSample ? ANALYTICS.MUTED : ANALYTICS.GREEN_TEXT,
          }}
        >
          {isSample ? 'Sample' : 'Live'}
        </span>
      </div>

      <p
        style={{
          fontSize: 14,
          color: ANALYTICS.INK_2,
          lineHeight: 1.5,
          margin: '9px 0 15px',
        }}
      >
        {intel.lead}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {intel.points.map((point, i) => {
          const tone = intelToneStyle(point.tone);
          return (
            <div
              key={`${point.tag}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr',
                gap: 14,
                alignItems: 'start',
              }}
            >
              <span
                style={{
                  fontFamily: ANALYTICS.MONO,
                  fontSize: 9,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 5,
                  textAlign: 'center',
                  background: tone.bg,
                  color: tone.fg,
                  marginTop: 1,
                }}
              >
                {point.tag}
              </span>
              <span
                style={{
                  fontSize: 13.5,
                  color: point.tone === 'muted' ? ANALYTICS.MUTED : ANALYTICS.INK,
                  lineHeight: 1.5,
                }}
              >
                {point.text}
              </span>
            </div>
          );
        })}
      </div>

      {isSample ? (
        <div
          style={{
            display: 'flex',
            gap: 9,
            padding: '11px 14px',
            borderRadius: ANALYTICS.RADIUS,
            background: ANALYTICS.AMBER_TINT,
            fontSize: 12.5,
            color: ANALYTICS.INK_2,
            lineHeight: 1.5,
            marginTop: 15,
          }}
        >
          <span style={{ color: ANALYTICS.AMBER, fontWeight: 800, flexShrink: 0 }}>!</span>
          <div>
            <b style={{ color: ANALYTICS.AMBER_TEXT }}>Sample intelligence.</b> These
            findings are illustrative while the structured intake that feeds the live
            engine is being built. They are plausible and cited, but not tenant-real —
            not a live savings claim.
          </div>
        </div>
      ) : null}
    </section>
  );
}
