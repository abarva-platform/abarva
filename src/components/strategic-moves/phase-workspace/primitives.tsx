// Moves phase workspace — shared presentational primitives.
// Pure, no state, no handlers — safe as server components and in static render.

import * as React from 'react';
import type { AssessmentStatus } from '../../../lib/programs/phase-templates/fixtures/lakeshore-legal';
import type { ConfidenceLevel } from '../../../lib/programs/phase-templates/types';

export type ChipTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue';

export function Chip({ tone = 'neutral', children }: { tone?: ChipTone; children: React.ReactNode }): React.ReactElement {
  const cls = tone === 'neutral' ? 'pw-chip' : `pw-chip ${tone}`;
  return <span className={cls}>{children}</span>;
}

export function Lane({ children }: { children: React.ReactNode }): React.ReactElement {
  return <span className="pw-lane">{children}</span>;
}

/** Assessment status → tone + client-friendly label. */
const STATUS_META: Record<AssessmentStatus, { tone: ChipTone; label: string }> = {
  evidence_backed: { tone: 'green', label: 'Evidence-backed' },
  accepted: { tone: 'green', label: 'Accepted' },
  partial: { tone: 'amber', label: 'Partial' },
  needs_confirmation: { tone: 'amber', label: 'Needs confirmation' },
  missing: { tone: 'red', label: 'Gap' },
};

export function statusMeta(s: AssessmentStatus): { tone: ChipTone; label: string } {
  return STATUS_META[s];
}

const CONF_TONE: Record<ConfidenceLevel, ChipTone> = { high: 'green', medium: 'amber', low: 'red' };
export function confidenceTone(c: ConfidenceLevel): ChipTone {
  return CONF_TONE[c];
}

export function Card({
  kicker,
  title,
  note,
  children,
}: {
  kicker?: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="pw-card">
      <div className="pw-card-head">
        {kicker ? <span className="pw-kicker">{kicker}</span> : null}
        <h3 className="pw-title serif">{title}</h3>
        {note ? <span className="pw-note">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function KeyValue({ k, children }: { k: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="pw-kv">
      <span className="pw-kv-k">{k}</span>
      <span className="pw-kv-v">{children}</span>
    </div>
  );
}
