'use client';

// TOWER · T-4 — Metric provenance icon + popover.
//
// Per the AI Initiatives Substrate Package v1.1.0 Wireframe Addendum
// (locked 2026-05-07): every number on Tower CFO View gets a small `ⓘ` icon
// trailing the value. Click opens a floating panel showing the load path
// (calculation · day-1 · day-N · source-allows · last refreshed).
//
// This component is shared between Tower CFO View and (future) Tower CIO View.
// It expects the metric key + the rendered children. The popover content is
// resolved from the deterministic provenance view-model.

import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  getTowerMetricProvenance,
  complexityLabel,
  sourceAllowsLabel,
  type MetricProvenanceKey,
} from '@/lib/tower/metric-provenance';

const C = {
  ink: '#0A0C12',
  inkMuted: '#525866',
  inkSoft: '#6b7280',
  cream: '#F8F7F4',
  card: '#FFFFFF',
  border: '#E8E6E1',
  borderStrong: '#d3cdbf',
  navy: '#1B2B5C',
} as const;

interface MetricProvenanceProps {
  /** Stable key used to resolve panel content from the view-model. */
  metricKey: MetricProvenanceKey;
  /** The rendered metric value (e.g. `<span>2.8×</span>`). */
  children: ReactNode;
}

export function MetricProvenance({ metricKey, children }: MetricProvenanceProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const panel = getTowerMetricProvenance(metricKey);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      data-testid={`metric-provenance-${metricKey}`}
      style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, position: 'relative' }}
    >
      {children}
      <button
        type="button"
        aria-label={panel ? `Provenance for ${panel.metricLabel}` : 'Metric provenance'}
        aria-expanded={open}
        data-testid={`metric-provenance-trigger-${metricKey}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          padding: 0,
          marginLeft: 2,
          border: `1px solid ${C.border}`,
          borderRadius: '50%',
          background: 'transparent',
          color: C.inkSoft,
          fontSize: 9,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontWeight: 700,
          lineHeight: 1,
          cursor: 'pointer',
          transition: 'background 120ms ease, color 120ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.cream;
          e.currentTarget.style.color = C.ink;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = C.inkSoft;
        }}
      >
        ⓘ
      </button>
      {open && panel && (
        <div
          role="dialog"
          aria-label={`${panel.metricLabel} provenance`}
          data-testid={`metric-provenance-panel-${metricKey}`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 50,
            width: 320,
            background: C.card,
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(10,12,18,0.12), 0 2px 6px rgba(10,12,18,0.06)',
            padding: 14,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: 12,
            lineHeight: 1.5,
            color: C.ink,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: C.navy,
              marginBottom: 8,
            }}
          >
            {panel.metricLabel} · provenance
          </div>

          <Section label="How calculated">{panel.calculation}</Section>

          <Section label="Day-1 load path">
            <div>
              Template field:{' '}
              <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: C.navy }}>
                {panel.day1.templateField}
              </code>
            </div>
            <div style={{ color: C.inkMuted }}>Source: {panel.day1.sourceTemplate}</div>
          </Section>

          <Section label="Day-N integration target">
            <div>{panel.dayN.target}</div>
            <div style={{ color: C.inkMuted }}>
              Complexity: {complexityLabel(panel.dayN.complexity)}
              {panel.dayN.notes ? ` · ${panel.dayN.notes}` : ''}
            </div>
          </Section>

          <Section label="Source allows">
            <div>{sourceAllowsLabel(panel.sourceAllows.verdict)}</div>
            <div style={{ color: C.inkMuted }}>{panel.sourceAllows.explanation}</div>
          </Section>

          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px dashed ${C.border}`,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 10,
              color: C.inkSoft,
            }}
          >
            Last refreshed: {panel.lastRefreshed}
          </div>
        </div>
      )}
    </span>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 9.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#525866',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ color: '#0A0C12', fontSize: 12, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}
