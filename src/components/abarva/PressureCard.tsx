// DES2 · PressureCard.
//
// Tower / Programs pressure surfacing. One card per top-N pressure
// signal. Imports restricted to next/link and the AbarVa theme.

import Link from 'next/link';
import {
  COLORS,
  FONT,
  RADIUS,
  TYPE,
  statusAccent,
} from '@/lib/design/abarva-theme';

export type PressureSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PressureCardProps {
  programCode: string;
  programName: string;
  severity: PressureSeverity;
  title: string;
  summary: string;
  missingInputs?: ReadonlyArray<string>;
  recommendedAction: string;
  routeHref: string;
  /** 1 / 2 / 3 — Tower limits to top three. */
  position?: 1 | 2 | 3;
}

export function PressureCard({
  programCode,
  programName,
  severity,
  title,
  summary,
  missingInputs,
  recommendedAction,
  routeHref,
  position,
}: PressureCardProps) {
  const accent = statusAccent(severity);
  const inputs = missingInputs ?? [];
  const inputsHead = inputs.slice(0, 3);
  const overflow = inputs.length > 3 ? inputs.length - 3 : 0;
  return (
    <article
      data-abarva-pressure-program={programCode}
      data-abarva-pressure-position={position ?? ''}
      aria-label={`Pressure card · ${programCode}`}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${accent.ring}`,
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
        <span style={{ ...TYPE.eyebrow, color: accent.fg }}>
          {severity} pressure · {programCode}
        </span>
        <span style={{ ...TYPE.eyebrow, color: COLORS.mutedSoft }}>
          {programName}
        </span>
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
      {inputs.length > 0 ? (
        <ul
          style={{
            margin: '0 0 0 18px',
            padding: 0,
            fontSize: 12,
            color: COLORS.muted,
            lineHeight: 1.55,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {inputsHead.map((it) => (
            <li key={it}>{it}</li>
          ))}
          {overflow > 0 ? (
            <li style={{ color: COLORS.mutedSoft, listStyle: 'none' }}>
              + {overflow} more
            </li>
          ) : null}
        </ul>
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
      <Link
        href={routeHref}
        data-abarva-pressure-route={programCode}
        style={{
          fontSize: 12,
          fontFamily: FONT.mono,
          color: COLORS.navy,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open program →
      </Link>
    </article>
  );
}
