'use client';

/**
 * EvidenceTraceDrawer
 *
 * The "where did this number come from?" drawer (VP usability fix). Opened
 * from any number / claim in the Source Decision Queue bundles and the
 * Renewal Cockpit. For each cited evidence reference it shows the six fields
 * the design-partner VP asked for:
 *
 *   - Source record   — which table / segment / module the number came from
 *   - Last refreshed   — recency, from the context freshness/trust model
 *   - Confidence       — the freshness model's trust rung
 *   - Owner            — who owns the data, where known
 *   - Linked segment   — the 14-segment context source
 *   - Why usable       — a plain-language one-liner
 *
 * Honesty rule: a field the substrate does not carry shows `not recorded` —
 * the view-model never invents an owner or a refresh date, and this component
 * renders that placeholder verbatim.
 *
 * Pure presentation: the traces are resolved server-side by the
 * `evidence-trace` view-model and passed in. Locked design system.
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  NOT_RECORDED,
  type EvidenceTrace,
} from '@/lib/source/evidence-trace/evidence-trace';
import type { TrustRung } from '@/lib/context-trust/freshness-model';
import { SourceDrawerShell } from './SourceDrawerShell';

// ---------------------------------------------------------------------------
// Trust-rung colour map — locked palette.
// ---------------------------------------------------------------------------

const RUNG_META: Record<TrustRung, { bg: string; line: string; text: string; dot: string }> = {
  verified: { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT, dot: '#1d9e75' },
  sourced: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID, dot: '#3a6ea0' },
  inferred: { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT, dot: '#ba7517' },
  stale: { bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT, dot: '#a32d2d' },
  missing: { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT, dot: '#8b8779' },
};

const RUNG_LABEL: Record<TrustRung, string> = {
  verified: 'Verified',
  sourced: 'Sourced',
  inferred: 'Inferred',
  stale: 'Stale',
  missing: 'Missing',
};

// ---------------------------------------------------------------------------
// Field row — label · value, with the "not recorded" honesty styling.
// ---------------------------------------------------------------------------

const FIELD_ROW: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const FIELD_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
};

function FieldRow({ label, value }: { label: string; value: string }) {
  const isUnknown = value === NOT_RECORDED;
  return (
    <div style={FIELD_ROW}>
      <span style={FIELD_LABEL}>{label}</span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          lineHeight: 1.5,
          fontWeight: isUnknown ? 'normal' : 600,
          fontStyle: isUnknown ? 'italic' : 'normal',
          color: isUnknown ? SHELL.INK_MUTED : SHELL.INK,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One trace card inside the drawer.
// ---------------------------------------------------------------------------

function TraceCard({ trace }: { trace: EvidenceTrace }) {
  const rung = RUNG_META[trace.trustRung];
  return (
    <article
      style={{
        background: SHELL.PAPER_SOFT,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 10,
        padding: '13px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13.5,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1.35,
          }}
        >
          {trace.title}
        </span>
        <span
          style={{
            flexShrink: 0,
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            background: rung.bg,
            border: '1px solid ' + rung.line,
            color: rung.text,
            borderRadius: 5,
            padding: '3px 7px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: rung.dot,
              display: 'inline-block',
            }}
          />
          {RUNG_LABEL[trace.trustRung]}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <FieldRow label="Source record" value={trace.sourceRecord} />
        <FieldRow
          label="Last refreshed"
          value={
            trace.lastRefreshed === NOT_RECORDED
              ? NOT_RECORDED
              : trace.ageDays === null
                ? trace.lastRefreshed
                : `${trace.lastRefreshed} · ${trace.ageDays}d ago`
          }
        />
        <FieldRow label="Confidence" value={trace.confidenceLabel} />
        <FieldRow label="Owner" value={trace.owner} />
        <FieldRow label="Linked segment" value={trace.linkedSegment} />
      </div>

      <div
        style={{
          borderTop: '1px solid ' + SHELL.CARD_LINE_SOFT,
          paddingTop: 9,
        }}
      >
        <span style={FIELD_LABEL}>Why this number is usable</span>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: SHELL.INK_MID,
            margin: '3px 0 0',
          }}
        >
          {trace.whyUsable}
        </p>
      </div>

      <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED }}>
        ref: {trace.evidenceRef}
      </span>
    </article>
  );
}

// ---------------------------------------------------------------------------
// The drawer.
// ---------------------------------------------------------------------------

export interface EvidenceTraceDrawerProps {
  open: boolean;
  onClose: () => void;
  /** What the VP clicked — "$980K should-cost benchmark", a spend figure, … */
  claimLabel: string;
  /** The resolved traces backing the claim — resolved server-side. */
  traces: EvidenceTrace[];
}

export function EvidenceTraceDrawer({
  open,
  onClose,
  claimLabel,
  traces,
}: EvidenceTraceDrawerProps) {
  return (
    <SourceDrawerShell
      open={open}
      onClose={onClose}
      eyebrow="Evidence trace"
      title={claimLabel}
    >
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12.5,
          lineHeight: 1.55,
          color: SHELL.INK_SOFT,
          margin: 0,
        }}
      >
        Where this figure comes from — the source record, when it was last
        refreshed, its confidence, owner, and linked context segment. A field
        AbarVa does not hold reads <em>not recorded</em>; it is never invented.
      </p>
      {traces.length === 0 ? (
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_MUTED,
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          No evidence references are attached to this figure.
        </p>
      ) : (
        traces.map((trace) => <TraceCard key={trace.evidenceRef} trace={trace} />)
      )}
    </SourceDrawerShell>
  );
}

/**
 * EvidenceTraceTrigger
 *
 * A small inline button that opens an `EvidenceTraceDrawer` for one claim.
 * Drop it next to any number / claim in the queue bundle cards or the Renewal
 * Cockpit. Self-contained — it owns its own open/close state.
 */
export function EvidenceTraceTrigger({
  claimLabel,
  traces,
  variant = 'link',
}: {
  claimLabel: string;
  traces: EvidenceTrace[];
  /** `link` — inline text affordance; `chip` — a bordered pill. */
  variant?: 'link' | 'chip';
}) {
  const [open, setOpen] = useState(false);
  const chip = variant === 'chip';
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Trace the evidence behind: ${claimLabel}`}
        style={
          chip
            ? {
                fontFamily: SHELL.MONO,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                background: SHELL.PAPER,
                border: '1px solid ' + SHELL.CARD_LINE,
                color: SHELL.INK_SOFT,
                borderRadius: 5,
                padding: '3px 8px',
                cursor: 'pointer',
              }
            : {
                fontFamily: SHELL.SANS,
                fontSize: 11.5,
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px dashed ' + SHELL.INK_MUTED,
                color: SHELL.INK_MID,
                padding: '0 0 1px',
                cursor: 'pointer',
              }
        }
      >
        {chip ? 'Trace evidence' : 'Where did this come from?'}
      </button>
      <EvidenceTraceDrawer
        open={open}
        onClose={() => setOpen(false)}
        claimLabel={claimLabel}
        traces={traces}
      />
    </>
  );
}
