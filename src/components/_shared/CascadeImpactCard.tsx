/**
 * CascadeImpactCard — REASON-31
 *
 * Surfaces the *details* of each `CascadeImpact` produced by the
 * `cross-instance-reasoner`. Until now only a count appeared in the
 * provenance ribbon — this card lists each downstream impact (or upstream
 * dependency, when used in reverse mode) so the user can see the full
 * cross-instance graph from a single detail page.
 *
 * Server-friendly presentation (no React hooks). Pure props in / JSX out.
 *
 * Empty list renders the supplied `emptyState`, defaulting to a neutral
 * "no downstream impacts" line so callers can drop the card in without
 * having to gate on `impacts.length > 0` themselves.
 */

import type { CascadeImpact, LinkedInstance, LinkType } from '@/lib/reasoning/types';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  formatCascadeRow,
  severityAriaLabel,
  LINK_TYPE_LABEL,
  SEVERITY_DIR_LABEL,
} from '@/lib/reasoning/cascade-formatters';

export interface CascadeImpactCardProps {
  /** Downstream cascade impacts to render. */
  impacts: CascadeImpact[];
  /** Section title — defaults to "Downstream impacts". */
  title?: string;
  /** Override the default empty-state copy. */
  emptyState?: React.ReactNode;
}

const DEFAULT_TITLE = 'Downstream impacts';
const DEFAULT_EMPTY =
  'No downstream impacts · this instance has no linked instances pending';

export function CascadeImpactCard({
  impacts,
  title = DEFAULT_TITLE,
  emptyState,
}: CascadeImpactCardProps) {
  if (impacts.length === 0) {
    return (
      <section
        data-testid="cascade-impact-card-empty"
        style={sectionStyle}
      >
        <SectionHeader label={title} count={0} />
        <div style={emptyStyle}>{emptyState ?? DEFAULT_EMPTY}</div>
      </section>
    );
  }

  return (
    <section data-testid="cascade-impact-card" style={sectionStyle}>
      <SectionHeader label={title} count={impacts.length} />
      {impacts.map((impact, idx) => (
        <CascadeRow
          key={`${impact.sourceInstanceId}::${impact.targetInstanceId}::${impact.linkType}::${idx}`}
          impact={impact}
        />
      ))}
    </section>
  );
}

// ─── Reverse cascade card ────────────────────────────────────────────────────

export interface ReverseCascadeCardProps {
  /** Upstream linked instances this instance is waiting on. */
  upstream: LinkedInstance[];
  /** Section title — defaults to "Upstream dependencies". */
  title?: string;
  /** Stable identifier for the instance owning these upstream deps (the "to" side of the arrow). */
  thisInstanceId: string;
  /** Override the default empty-state copy. */
  emptyState?: React.ReactNode;
}

const DEFAULT_REVERSE_TITLE = 'Upstream dependencies';
const DEFAULT_REVERSE_EMPTY =
  'No upstream dependencies · this instance is not waiting on any linked instance';

export function ReverseCascadeCard({
  upstream,
  thisInstanceId,
  title = DEFAULT_REVERSE_TITLE,
  emptyState,
}: ReverseCascadeCardProps) {
  if (upstream.length === 0) {
    return (
      <section
        data-testid="reverse-cascade-card-empty"
        style={sectionStyle}
      >
        <SectionHeader label={title} count={0} />
        <div style={emptyStyle}>{emptyState ?? DEFAULT_REVERSE_EMPTY}</div>
      </section>
    );
  }

  return (
    <section data-testid="reverse-cascade-card" style={sectionStyle}>
      <SectionHeader label={title} count={upstream.length} />
      {upstream.map((link, idx) => (
        <ReverseRow
          key={`${link.instanceId}::${link.linkType}::${idx}`}
          link={link}
          thisInstanceId={thisInstanceId}
        />
      ))}
    </section>
  );
}

// ─── Internals ───────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  marginTop: 16,
  marginBottom: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const emptyStyle: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
  background: SHELL.CARD_WHITE,
  border: `1px dashed ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 8,
  padding: '12px 14px',
  lineHeight: 1.5,
};

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: SHELL.INK_MUTED,
      }}
    >
      {label} · {count}
    </div>
  );
}

const ARROW = '→';
const REVERSE_ARROW = '←';

function CascadeRow({ impact }: { impact: CascadeImpact }) {
  const row = formatCascadeRow(impact);
  const dotColor = SHELL[row.severityDotToken];

  return (
    <article
      data-testid={`cascade-impact-row-${impact.targetInstanceId}-${impact.linkType}`}
      style={cardStyle}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          aria-label={severityAriaLabel(impact.impactSeverity)}
          title={severityAriaLabel(impact.impactSeverity)}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginTop: 6,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK,
              lineHeight: 1.4,
            }}
          >
            <span>{row.source}</span>
            <span
              aria-hidden
              style={{
                color: SHELL.INK_MUTED,
                fontFamily: SHELL.MONO,
              }}
            >
              {ARROW}
            </span>
            <span>{row.target}</span>
            <LinkTypeChip linkType={impact.linkType} />
            <SeverityChip kind={impact.severity} />
          </div>
          {row.description && (
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_SOFT,
                margin: '6px 0 0 0',
                lineHeight: 1.5,
              }}
            >
              {row.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function ReverseRow({
  link,
  thisInstanceId,
}: {
  link: LinkedInstance;
  thisInstanceId: string;
}) {
  return (
    <article
      data-testid={`reverse-cascade-row-${link.instanceId}-${link.linkType}`}
      style={cardStyle}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          aria-label="Waiting on this instance"
          title="Waiting on this instance"
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: SHELL.AMBER_DOT,
            flexShrink: 0,
            marginTop: 6,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK,
              lineHeight: 1.4,
            }}
          >
            <span>{thisInstanceId}</span>
            <span
              aria-hidden
              style={{ color: SHELL.INK_MUTED, fontFamily: SHELL.MONO }}
            >
              {REVERSE_ARROW}
            </span>
            <span>{link.instanceId}</span>
            <LinkTypeChip linkType={link.linkType} />
            <span style={waitingChipStyle}>waiting on this</span>
          </div>
          {link.description && (
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_SOFT,
                margin: '6px 0 0 0',
                lineHeight: 1.5,
              }}
            >
              {link.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

const cardStyle: React.CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const chipBaseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
  background: SHELL.GRAY_BG,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  padding: '2px 8px',
  lineHeight: 1.4,
};

const waitingChipStyle: React.CSSProperties = {
  ...chipBaseStyle,
  color: SHELL.PEACH_TEXT,
  background: SHELL.PAPER_SOFT,
};

function LinkTypeChip({ linkType }: { linkType: LinkType }) {
  return <span style={chipBaseStyle}>{LINK_TYPE_LABEL[linkType]}</span>;
}

function SeverityChip({ kind }: { kind: CascadeImpact['severity'] }) {
  const accent =
    kind === 'blocking'
      ? SHELL.RUST_TEXT
      : kind === 'accelerating'
        ? SHELL.MINT_TEXT
        : SHELL.INK_MUTED;
  return (
    <span
      style={{
        ...chipBaseStyle,
        color: accent,
      }}
    >
      {SEVERITY_DIR_LABEL[kind]}
    </span>
  );
}
