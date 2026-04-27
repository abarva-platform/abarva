import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { EvidenceStrengthPill, type EvidenceStrength } from './EvidenceStrengthPill';
import { BlockerPill } from './BlockerPill';

export interface StewardEditorialProps {
  title: string;
  body: string;
  contextUsed: ReadonlyArray<string>;
  evidenceStrength: EvidenceStrength;
  blocker?: string;
  primaryAction: { label: string; href: string };
}

export function StewardEditorial({
  title,
  body,
  contextUsed,
  evidenceStrength,
  blocker,
  primaryAction,
}: StewardEditorialProps) {
  return (
    <article
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
      data-steward-editorial="true"
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}cc`,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {body}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}80`,
          }}
        >
          Context used
        </span>
        {contextUsed.map((chip) => (
          <span
            key={chip}
            style={{
              padding: '4px 12px',
              borderRadius: RADIUS.pill,
              background: COLORS.skyPale,
              color: COLORS.navy,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
          marginTop: SPACING.sm,
        }}
      >
        <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
          <EvidenceStrengthPill strength={evidenceStrength} />
          {blocker ? <BlockerPill label={blocker} /> : null}
        </div>
        <a
          href={primaryAction.href}
          style={{
            display: 'inline-block',
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: COLORS.ink,
            color: COLORS.cream,
            borderRadius: RADIUS.md,
            fontFamily: TYPOGRAPHY.sans,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          {primaryAction.label}
        </a>
      </div>
    </article>
  );
}
