// DES2 · PatternCard.
//
// Sentinel pattern surfacing on Intelligence. One card per I1
// detection. Imports restricted to next/link and the AbarVa theme.

import Link from 'next/link';
import {
  COLORS,
  FONT,
  RADIUS,
  TYPE,
  statusAccent,
} from '@/lib/design/abarva-theme';

export type PatternSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PatternConfidence = 'low' | 'medium' | 'high';

export interface PatternCardAffectedProgram {
  programCode: string;
  programName: string;
  routeHref: string;
}

export interface PatternCardHandoff {
  target: string;
}

export interface PatternCardProps {
  patternKey: string;
  patternName: string;
  severity: PatternSeverity;
  confidence: PatternConfidence;
  title: string;
  summary: string;
  whyItMatters: string;
  programsCount: number;
  sourceSignalsCount: number;
  affectedPrograms: ReadonlyArray<PatternCardAffectedProgram>;
  missingInputs?: ReadonlyArray<string>;
  recommendedAction: string;
  handoffs?: ReadonlyArray<PatternCardHandoff>;
  detailHref: string;
}

export function PatternCard({
  patternKey,
  patternName,
  severity,
  confidence,
  title,
  summary,
  whyItMatters,
  programsCount,
  sourceSignalsCount,
  affectedPrograms,
  missingInputs,
  recommendedAction,
  handoffs,
  detailHref,
}: PatternCardProps) {
  const sevAccent = statusAccent(severity);
  const confAccent = statusAccent(confidence);
  const programsHead = affectedPrograms.slice(0, 4);
  const programsOverflow = Math.max(0, affectedPrograms.length - 4);
  const inputs = missingInputs ?? [];
  return (
    <article
      data-abarva-pattern-key={patternKey}
      aria-label={`Pattern · ${patternName}`}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${sevAccent.ring}`,
        borderRadius: RADIUS.card,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: FONT.body,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ ...TYPE.eyebrow, color: sevAccent.fg }}>
          {patternName}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <MiniChip
            label={severity}
            fg={sevAccent.fg}
            bg={sevAccent.bg}
          />
          <MiniChip
            label={`conf · ${confidence}`}
            fg={confAccent.fg}
            bg={confAccent.bg}
          />
        </div>
      </header>
      <h3 style={{ ...TYPE.h3, margin: 0 }}>{title}</h3>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: COLORS.muted,
          lineHeight: 1.55,
        }}
      >
        {summary}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: COLORS.mutedSoft,
          lineHeight: 1.55,
          fontStyle: 'italic',
        }}
      >
        {whyItMatters}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 6,
          fontFamily: FONT.mono,
          fontSize: 11,
          color: COLORS.muted,
        }}
      >
        <Stat label="Programs" value={String(programsCount)} />
        <Stat label="Source signals" value={String(sourceSignalsCount)} />
      </div>
      {affectedPrograms.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ ...TYPE.eyebrow, color: COLORS.mutedSoft }}>
            Affected programs
          </span>
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {programsHead.map((p) => (
              <li key={p.programCode} style={{ fontSize: 12, color: COLORS.muted }}>
                <Link
                  href={p.routeHref}
                  style={{ color: COLORS.ink, textDecoration: 'none' }}
                >
                  <span style={{ color: COLORS.navy, fontWeight: 600 }}>
                    {p.programCode}
                  </span>{' '}
                  · {p.programName}
                </Link>
              </li>
            ))}
            {programsOverflow > 0 ? (
              <li style={{ fontSize: 11, color: COLORS.mutedSoft }}>
                + {programsOverflow} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
      {inputs.length > 0 ? (
        <details>
          <summary
            style={{
              ...TYPE.eyebrow,
              color: COLORS.mutedSoft,
              cursor: 'pointer',
            }}
          >
            Missing inputs · {inputs.length}
          </summary>
          <ul
            style={{
              margin: '6px 0 0 16px',
              padding: 0,
              fontSize: 12,
              color: COLORS.muted,
              lineHeight: 1.55,
            }}
          >
            {inputs.slice(0, 5).map((it) => (
              <li key={it}>{it}</li>
            ))}
            {inputs.length > 5 ? (
              <li style={{ color: COLORS.mutedSoft }}>
                + {inputs.length - 5} more
              </li>
            ) : null}
          </ul>
        </details>
      ) : null}
      <div
        style={{
          paddingTop: 6,
          borderTop: `1px dashed ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span style={{ ...TYPE.eyebrow, color: COLORS.mutedSoft }}>
          Recommended action
        </span>
        <span style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.55 }}>
          {recommendedAction}
        </span>
      </div>
      {handoffs && handoffs.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {handoffs.map((h) => (
            <MiniChip
              key={h.target}
              label={`handoff · ${h.target}`}
              fg={COLORS.muted}
              bg={COLORS.surface2}
            />
          ))}
        </div>
      ) : null}
      <Link
        href={detailHref}
        data-abarva-pattern-route={patternKey}
        style={{
          fontSize: 12,
          fontFamily: FONT.mono,
          color: COLORS.navy,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open pattern detail →
      </Link>
    </article>
  );
}

function MiniChip({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span
      style={{
        ...TYPE.eyebrow,
        fontSize: 9,
        background: bg,
        color: fg,
        padding: '2px 6px',
        borderRadius: RADIUS.pill,
      }}
    >
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ ...TYPE.eyebrow, fontSize: 9 }}>{label}</span>
      <span style={{ color: COLORS.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
