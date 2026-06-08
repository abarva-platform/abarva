'use client';

// DiscoveryCapturePanel · S6 (UI)
//
// Right-pane capture view for the discovery intake — renders a DiscoveryShape
// with per-field provenance (chat / upload / context) and review state, the
// extracted data landscape, and the known / open-unknowns split. Mirrors the
// wireframe (docs/build/moves-design/wireframes/originate-charter-intake.html)
// in the repo's brand-token idiom. Pure presentational component (props in,
// JSX out) — the page wires the shape from the persisted charter, gated by
// `discovery_intake_v2`.

import type { CSSProperties } from 'react';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import {
  shapeCompleteness,
  type DiscoveryShape,
  type CapturedField,
  type IntakeSource,
} from '@/lib/programs/discovery/discovery-intake';

const RULE = '#E3DFD5';

const SOURCE_BADGE: Record<IntakeSource, { label: string; bg: string; fg: string }> = {
  chat: { label: 'CHAT', bg: '#f0efeb', fg: BrandColors.slate },
  upload: { label: 'UPLOAD', bg: '#e6f1fb', fg: BrandColors.signalBlue },
  context: { label: 'CONTEXT', bg: '#eaf3de', fg: '#27500a' },
};

function badge(bg: string, fg: string): CSSProperties {
  return {
    fontSize: 9,
    fontWeight: 700,
    color: fg,
    background: bg,
    borderRadius: 4,
    padding: '1px 6px',
    letterSpacing: '0.02em',
  };
}

const LABEL: CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: BrandColors.stone,
  marginBottom: 2,
};

function Provenance({ field }: { field: CapturedField<unknown> }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
      {field.sources.map((s) => (
        <span key={s} style={badge(SOURCE_BADGE[s].bg, SOURCE_BADGE[s].fg)}>
          {SOURCE_BADGE[s].label}
        </span>
      ))}
      {field.review === 'review_pending' && <span style={badge('#f7eccc', '#8a6d00')}>⚑ review</span>}
      {field.review === 'confirmed' && field.value != null && (
        <span style={{ fontSize: 10, color: '#2f7a3f', fontWeight: 700 }}>✓</span>
      )}
    </span>
  );
}

function fmt(field: CapturedField<unknown>): string {
  const v = field.value;
  if (v == null) return '—';
  return typeof v === 'string' ? v : String(v);
}

const FOUNDATION_LABEL: Record<string, string> = {
  first_of_kind: 'First-of-kind — builds the foundation',
  rides_existing: 'Rides an existing foundation',
};
const MODE_LABEL: Record<string, string> = {
  full_strategy: 'Full data & AI strategy',
  point_use_case: 'Point use case',
};

function Row({
  label,
  field,
  display,
}: {
  label: string;
  field: CapturedField<unknown>;
  display?: string;
}) {
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${RULE}` }}>
      <div style={LABEL}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: BrandColors.inkBlack }}>{display ?? fmt(field)}</div>
        <Provenance field={field} />
      </div>
    </div>
  );
}

export function DiscoveryCapturePanel({ shape }: { shape: DiscoveryShape }) {
  const c = shapeCompleteness(shape);
  const landscape = shape.landscape.value ?? [];
  const foundation = shape.foundationIntent.value;
  const mode = shape.engagementMode.value;

  return (
    <div
      data-testid="discovery-capture-panel"
      style={{ fontFamily: BrandTypography.sans, color: BrandColors.inkBlack }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontFamily: BrandTypography.serif, fontSize: 16 }}>Discovery shape</div>
        <div style={{ fontSize: 10, color: BrandColors.slate }}>
          {c.captured} of {c.total} captured
          {c.pendingReview > 0 ? ` · ${c.pendingReview} review-pending` : ''}
        </div>
      </div>

      <Row label="Problem / use case" field={shape.problem} />
      <Row
        label="Foundation intent"
        field={shape.foundationIntent}
        display={foundation ? FOUNDATION_LABEL[foundation] : '—'}
      />
      <Row label="Archetype" field={shape.archetype} />
      <Row label="Engagement mode" field={shape.engagementMode} display={mode ? MODE_LABEL[mode] : '—'} />
      <Row label="Sponsor" field={shape.sponsor} />
      <Row label="Value hypothesis" field={shape.valueHypothesis} />

      <div style={{ marginTop: 14 }}>
        <div style={LABEL}>Data landscape ({landscape.length})</div>
        {landscape.length === 0 ? (
          <div style={{ fontSize: 11, color: BrandColors.slate, fontStyle: 'italic' }}>
            No landscape captured yet.
          </div>
        ) : (
          landscape.map((f, i) => (
            <div
              key={`${f.system}-${i}`}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' }}
            >
              <span>
                <strong>{f.system}</strong>{' '}
                <span style={{ color: BrandColors.stone }}>· {f.domain}</span>
              </span>
              <span
                style={badge(
                  f.source === 'upload' ? '#e6f1fb' : '#eaf3de',
                  f.source === 'upload' ? BrandColors.signalBlue : '#27500a',
                )}
              >
                {f.source}
                {f.review === 'review_pending' ? ' ⚑' : ''}
              </span>
            </div>
          ))
        )}
      </div>

      {(shape.known.length > 0 || shape.openUnknowns.length > 0) && (
        <div style={{ marginTop: 14 }}>
          {shape.known.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={LABEL}>Known (context layer)</div>
              <div style={{ fontSize: 11, color: BrandColors.slate }}>{shape.known.join(' · ')}</div>
            </div>
          )}
          {shape.openUnknowns.length > 0 && (
            <div>
              <div style={LABEL}>Open unknowns → seed Diagnose</div>
              <div style={{ fontSize: 11, color: BrandColors.slate }}>
                {shape.openUnknowns.join(' · ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
