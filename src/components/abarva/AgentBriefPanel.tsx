// DES2 · AgentBriefPanel.
//
// Shared brief shell every canonical agent (Atlas / Sentinel /
// Steward / Nexus) uses. Light variant for default; dark variant
// for Atlas hero / storytelling moments only (canon §F).
//
// Imports restricted to next/link, the AbarVa theme module, and
// sibling primitives (AgentBadge).

import Link from 'next/link';
import {
  AGENT_ACCENT,
  COLORS,
  FONT,
  RADIUS,
  TYPE,
  type AbarvaAgent,
} from '@/lib/design/abarva-theme';
import { AgentBadge } from '@/components/abarva/AgentBadge';

export type AgentBriefVariant = 'light' | 'dark';

export interface AgentBriefChip {
  label: string;
  tone?: 'default' | 'navy' | 'amber' | 'red';
  tooltip?: string;
}

export interface AgentBriefLine {
  label: string;
  value: string;
}

export interface AgentBriefFollowUp {
  id: string;
  label: string;
  reason: string;
}

export interface AgentBriefRecommendation {
  label: string;
  reason: string;
  href: string;
}

export interface AgentBriefPanelProps {
  agent: AbarvaAgent;
  variant?: AgentBriefVariant;
  eyebrow: string;
  title: string;
  topChips?: ReadonlyArray<AgentBriefChip>;
  briefLines: ReadonlyArray<AgentBriefLine>;
  recommendedAction?: AgentBriefRecommendation;
  suggestedFollowUps: ReadonlyArray<AgentBriefFollowUp>;
  sourceLabel: string;
  interpretationBasis: string;
}

export function AgentBriefPanel({
  agent,
  variant = 'light',
  eyebrow,
  title,
  topChips,
  briefLines,
  recommendedAction,
  suggestedFollowUps,
  sourceLabel,
  interpretationBasis,
}: AgentBriefPanelProps) {
  const accent = AGENT_ACCENT[agent];
  const isDark = variant === 'dark';
  const surface = isDark ? COLORS.inkDark : COLORS.card;
  const titleColor = isDark ? COLORS.surface : COLORS.ink;
  const labelColor = isDark ? COLORS.mutedSoft : COLORS.mutedSoft;
  const valueColor = isDark ? COLORS.surface : COLORS.body;
  const captionColor = isDark ? COLORS.mutedSoft : COLORS.mutedSoft;

  return (
    <article
      aria-label={`${agent} brief`}
      data-abarva-brief-agent={agent}
      data-abarva-brief-variant={variant}
      style={{
        background: surface,
        border: isDark ? `1px solid ${COLORS.inkDark}` : `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${accent.ring}`,
        borderRadius: RADIUS.card,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: FONT.body,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              ...TYPE.eyebrow,
              color: accent.fg,
              marginBottom: 4,
            }}
          >
            {eyebrow}
          </div>
          <h2
            style={{
              ...TYPE.h3,
              color: titleColor,
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {topChips?.map((chip) => (
            <Chip key={chip.label} chip={chip} isDark={isDark} />
          ))}
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {briefLines.map((line) => (
          <BriefLine
            key={line.label}
            line={line}
            labelColor={labelColor}
            valueColor={valueColor}
          />
        ))}
      </div>

      {recommendedAction ? (
        <div
          style={{
            padding: '12px 14px',
            background: isDark ? COLORS.navyDark : COLORS.surface2,
            border: isDark ? `1px solid ${COLORS.navyDark}` : `1px dashed ${COLORS.border}`,
            borderRadius: RADIUS.cardSmall,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{ ...TYPE.eyebrow, color: labelColor }}>
            Recommended next action
          </span>
          <Link
            href={recommendedAction.href}
            data-abarva-brief-action
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: titleColor,
              textDecoration: 'none',
              lineHeight: 1.5,
            }}
          >
            {recommendedAction.label} →
          </Link>
          <span style={{ fontSize: 11, color: labelColor, lineHeight: 1.5 }}>
            {recommendedAction.reason}
          </span>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingTop: 8,
          borderTop: isDark
            ? `1px dashed ${COLORS.navyDark}`
            : `1px dashed ${COLORS.border}`,
        }}
      >
        <span style={{ ...TYPE.eyebrow, color: labelColor }}>
          Ask {agent} · suggested follow-ups · {suggestedFollowUps.length}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestedFollowUps.map((followUp) => (
            <FollowUpChip
              key={followUp.id}
              followUp={followUp}
              agent={agent}
              isDark={isDark}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          color: captionColor,
          fontStyle: 'italic',
          lineHeight: 1.55,
        }}
      >
        Source · {sourceLabel.replace(/_/g, ' ')}. {interpretationBasis}
      </div>
    </article>
  );
}

function Chip({ chip, isDark }: { chip: AgentBriefChip; isDark: boolean }) {
  const tone = chip.tone ?? 'default';
  const palette = (() => {
    switch (tone) {
      case 'navy':
        return { fg: COLORS.navy, bg: COLORS.navySoft };
      case 'amber':
        return { fg: COLORS.amber, bg: COLORS.amberSoft };
      case 'red':
        return { fg: COLORS.red, bg: COLORS.redSoft };
      default:
        return isDark
          ? { fg: COLORS.surface, bg: COLORS.navyDark }
          : { fg: COLORS.muted, bg: COLORS.surface2 };
    }
  })();
  return (
    <span
      title={chip.tooltip}
      style={{
        ...TYPE.eyebrow,
        background: palette.bg,
        color: palette.fg,
        padding: '2px 8px',
        borderRadius: RADIUS.pill,
      }}
    >
      {chip.label}
    </span>
  );
}

function BriefLine({
  line,
  labelColor,
  valueColor,
}: {
  line: AgentBriefLine;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 180px) 1fr',
        gap: 12,
        alignItems: 'baseline',
      }}
    >
      <span style={{ ...TYPE.eyebrow, color: labelColor }}>{line.label}</span>
      <span style={{ fontSize: 13, color: valueColor, lineHeight: 1.55 }}>
        {line.value}
      </span>
    </div>
  );
}

function FollowUpChip({
  followUp,
  agent,
  isDark,
}: {
  followUp: AgentBriefFollowUp;
  agent: AbarvaAgent;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      data-abarva-followup-id={followUp.id}
      title={`${followUp.reason} · live ${agent} runtime is deferred`}
      style={{
        padding: '8px 12px',
        background: isDark ? COLORS.navyDark : COLORS.surface,
        border: isDark
          ? `1px solid ${COLORS.navyDark}`
          : `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.cardSmall,
        color: isDark ? COLORS.surface : COLORS.muted,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'not-allowed',
        opacity: 0.85,
        fontFamily: 'inherit',
        textAlign: 'left',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 320,
      }}
    >
      <span style={{ color: isDark ? COLORS.surface : COLORS.ink }}>
        {followUp.label}
      </span>
      <span style={{ ...TYPE.eyebrow, color: COLORS.mutedSoft }}>
        deferred · live {agent} runtime
      </span>
    </button>
  );
}

// Augment the badge import for tree-shake friendliness in tests.
export { AgentBadge };
