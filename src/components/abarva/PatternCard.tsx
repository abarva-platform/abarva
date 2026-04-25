// DES2 · PatternCard.
//
// Sentinel pattern primitive. Severity + confidence MiniChips, title,
// summary, why-it-matters italic, 2-cell stat grid, affected programs
// (top 4 + overflow), collapsible missing-inputs <details>, recommended
// action, handoff chips, and a plain "Open pattern detail →" link.

import Link from 'next/link';
import {
  COLORS,
  FONT,
  BORDER,
  RADIUS,
  SPACING,
  statusAccent,
  type AbarvaStatus,
} from '@/lib/design/abarva-theme';

export interface PatternCardProgramRef {
  code: string;
  href: string;
}

export interface PatternCardProps {
  patternId: string;
  title: string;
  severity: Extract<AbarvaStatus, 'low' | 'medium' | 'high' | 'critical'>;
  /** 0–100. */
  confidence: number;
  summary: string;
  whyItMatters: string;
  /** Two stat cells (label + value). */
  stats: ReadonlyArray<{ label: string; value: string | number }>;
  affectedPrograms: ReadonlyArray<PatternCardProgramRef>;
  missingInputs?: ReadonlyArray<string>;
  recommendedAction?: string;
  /** Handoff chips (downstream agents who can act on this). */
  handoffs?: ReadonlyArray<string>;
  patternHref: string;
}

const PROGRAMS_PREVIEW = 4;

function MiniChip({
  label,
  fg,
  bg,
}: {
  label: string;
  fg: string;
  bg: string;
}) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: fg,
        background: bg,
        border: `1px solid ${fg}33`,
        borderRadius: 999,
        padding: '2px 8px',
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

export function PatternCard({
  patternId,
  title,
  severity,
  confidence,
  summary,
  whyItMatters,
  stats,
  affectedPrograms,
  missingInputs,
  recommendedAction,
  handoffs,
  patternHref,
}: PatternCardProps) {
  const sev = statusAccent(severity);
  const visiblePrograms = affectedPrograms.slice(0, PROGRAMS_PREVIEW);
  const programOverflow = affectedPrograms.length - visiblePrograms.length;
  const twoStats = stats.slice(0, 2);

  return (
    <article
      data-pattern={patternId}
      data-severity={severity}
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderTop: `3px solid ${sev.ring}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        fontFamily: FONT.body,
        color: COLORS.ink,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.xs,
          alignItems: 'center',
        }}
      >
        <MiniChip label={`${severity}`} fg={sev.fg} bg={sev.bg} />
        <MiniChip
          label={`conf ${confidence}%`}
          fg={COLORS.navy}
          bg={COLORS.navySoft}
        />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            color: COLORS.mutedSoft,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginLeft: SPACING.xs,
          }}
        >
          {patternId}
        </span>
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '-0.005em',
          lineHeight: 1.3,
          color: COLORS.ink,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: COLORS.body,
        }}
      >
        {summary}
      </p>
      <p
        style={{
          margin: 0,
          fontStyle: 'italic',
          fontSize: 13,
          lineHeight: 1.5,
          color: COLORS.muted,
        }}
      >
        {whyItMatters}
      </p>

      {twoStats.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING.sm,
            background: COLORS.surface,
            border: BORDER.hairlineSoft,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
          }}
        >
          {twoStats.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLORS.muted,
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: COLORS.ink,
                  lineHeight: 1.2,
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {visiblePrograms.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            affected programs
          </span>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {visiblePrograms.map((p) => (
              <Link
                key={p.code}
                href={p.href}
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 500,
                  color: COLORS.navy,
                  background: COLORS.navySoft,
                  border: `1px solid ${COLORS.navy}33`,
                  borderRadius: 999,
                  padding: '2px 8px',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                }}
              >
                {p.code}
              </Link>
            ))}
            {programOverflow > 0 ? (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  color: COLORS.mutedSoft,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  alignSelf: 'center',
                }}
              >
                +{programOverflow} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {missingInputs && missingInputs.length > 0 ? (
        <details
          style={{
            background: COLORS.surface,
            border: BORDER.hairlineSoft,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm}px ${SPACING.md}px`,
          }}
        >
          <summary
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              cursor: 'pointer',
            }}
          >
            missing inputs · {missingInputs.length}
          </summary>
          <ul
            style={{
              margin: '6px 0 0',
              paddingLeft: 14,
              fontSize: 12,
              color: COLORS.body,
              lineHeight: 1.4,
            }}
          >
            {missingInputs.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {recommendedAction ? (
        <div
          style={{
            fontSize: 13,
            color: COLORS.body,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.amber,
              marginRight: 6,
            }}
          >
            next
          </span>
          {recommendedAction}
        </div>
      ) : null}

      {handoffs && handoffs.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {handoffs.map((h, i) => (
            <span
              key={i}
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: COLORS.muted,
                background: COLORS.surface2,
                border: BORDER.hairlineSoft,
                borderRadius: 999,
                padding: '2px 8px',
              }}
            >
              handoff · {h}
            </span>
          ))}
        </div>
      ) : null}

      <Link
        href={patternHref}
        style={{
          marginTop: SPACING.xs,
          fontSize: 12,
          fontWeight: 500,
          color: COLORS.navy,
          textDecoration: 'none',
        }}
      >
        Open pattern detail →
      </Link>
    </article>
  );
}
