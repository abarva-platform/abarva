// DES2 · AgentBriefPanel.
//
// Shared brief-shell used by Atlas, Sentinel, Nexus, and Steward
// surfaces. Renders an eyebrow, title, top chips row, brief lines, an
// optional recommended-action callout, three disabled "Ask <agent>"
// follow-up chips with sub-label "deferred · live <agent> runtime",
// and an optional footer caption.
//
// Variant `dark` uses the navyDark surface — reserved for high-impact
// briefs only (Atlas hero). Default variant is light.

import {
  AGENT_ACCENT,
  COLORS,
  FONT,
  BORDER,
  RADIUS,
  SPACING,
  type AbarvaAgent,
} from '@/lib/design/abarva-theme';
import { AgentBadge } from '@/components/abarva/AgentBadge';

export type AgentBriefVariant = 'light' | 'dark';

export interface AgentBriefPanelProps {
  agent: AbarvaAgent;
  /** Eyebrow text — short, mono uppercase. */
  eyebrow: string;
  /** Title — sentence-case, calm. */
  title: string;
  /** Top chips row above brief lines (e.g. status, scope chips). */
  chips?: ReadonlyArray<{ key: string; label: string }>;
  /** Brief lines (1–4 short sentences). */
  briefLines: ReadonlyArray<string>;
  /** Optional recommended-action callout text. */
  recommendedAction?: string;
  /** Three follow-up chip labels (Ask <agent> deferred). */
  followUps?: ReadonlyArray<string>;
  /** Footer caption (provenance / source label). */
  footerCaption?: string;
  variant?: AgentBriefVariant;
}

export function AgentBriefPanel({
  agent,
  eyebrow,
  title,
  chips,
  briefLines,
  recommendedAction,
  followUps,
  footerCaption,
  variant = 'light',
}: AgentBriefPanelProps) {
  const isDark = variant === 'dark';
  const accent = AGENT_ACCENT[agent];

  const surfaceBg = isDark ? COLORS.navyDark : COLORS.card;
  const surfaceBorder = isDark
    ? '1px solid rgba(255,255,255,0.08)'
    : BORDER.hairline;
  const inkColor = isDark ? '#F7F8FA' : COLORS.ink;
  const bodyColor = isDark ? 'rgba(247,248,250,0.78)' : COLORS.body;
  const mutedColor = isDark ? 'rgba(247,248,250,0.55)' : COLORS.muted;
  const calloutBg = isDark
    ? 'rgba(255,255,255,0.06)'
    : COLORS.surface2;

  return (
    <section
      data-variant={variant}
      data-agent={agent}
      aria-label={`${agent} brief`}
      style={{
        background: surfaceBg,
        border: surfaceBorder,
        borderTop: `3px solid ${accent.ring}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xxl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
        fontFamily: FONT.body,
        color: inkColor,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: mutedColor,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
            color: inkColor,
          }}
        >
          {title}
        </h2>
        {chips && chips.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: SPACING.sm,
              marginTop: SPACING.xs,
            }}
          >
            {chips.map((c) => (
              <span
                key={c.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: isDark ? 'rgba(247,248,250,0.85)' : COLORS.muted,
                  background: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : COLORS.surface2,
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.10)'
                    : BORDER.hairlineSoft,
                  borderRadius: RADIUS.pill,
                  padding: '3px 9px',
                  lineHeight: 1.4,
                }}
              >
                {c.label}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
          fontSize: 14,
          lineHeight: 1.55,
          color: bodyColor,
        }}
      >
        {briefLines.map((line, i) => (
          <p key={i} style={{ margin: 0 }}>
            {line}
          </p>
        ))}
      </div>

      {recommendedAction ? (
        <div
          style={{
            background: calloutBg,
            border: isDark
              ? '1px solid rgba(255,255,255,0.10)'
              : BORDER.hairlineSoft,
            borderLeft: `3px solid ${accent.ring}`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.md}px ${SPACING.lg}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: accent.fg,
            }}
          >
            recommended action
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: inkColor,
              lineHeight: 1.5,
            }}
          >
            {recommendedAction}
          </div>
        </div>
      ) : null}

      {followUps && followUps.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: mutedColor,
            }}
          >
            ask {agent}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: SPACING.sm,
            }}
          >
            {followUps.slice(0, 3).map((label, i) => (
              <span
                key={i}
                aria-disabled="true"
                data-deferred="true"
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  background: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : COLORS.surface,
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.10)'
                    : BORDER.hairlineSoft,
                  borderRadius: RADIUS.md,
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  cursor: 'not-allowed',
                  opacity: 0.85,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: inkColor,
                    lineHeight: 1.3,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 9,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: mutedColor,
                  }}
                >
                  deferred · live {agent} runtime
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
          marginTop: SPACING.xs,
        }}
      >
        <AgentBadge agent={agent} status="brief" />
        {footerCaption ? (
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: mutedColor,
            }}
          >
            {footerCaption}
          </span>
        ) : null}
      </footer>
    </section>
  );
}
