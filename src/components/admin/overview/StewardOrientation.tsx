/**
 * StewardOrientation · Overview Block 1.2 (Setup Redesign Package PR A).
 *
 * 3-sentence Steward narrative + 2 CTAs. Deterministic copy
 * generation per `DATA_BINDING_CATALOG.md` §1 Block 1.2.
 */

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface StewardOrientationProps {
  tenantName: string;
  /** Plain-language industry phrase, e.g. "a regulated financial-services bank". Null if unknown. */
  industryPhrase: string | null;
  /** Plain-language summary of loaded categories, e.g. "Who you are and What rules apply are partially loaded". */
  loadedSummary: string;
  /** Plain-language summary of missing categories, e.g. "How you measure performance and What you have in flight are empty". */
  missingSummary: string;
  /** Highest-impact next load, e.g. "Compliance posture". */
  nextLoadName: string | null;
  /** Consequence copy for the next load, e.g. "Steward can gate AI / sourcing / programs against control requirements". */
  nextLoadConsequence: string | null;
}

export function StewardOrientation({
  tenantName,
  industryPhrase,
  loadedSummary,
  missingSummary,
  nextLoadName,
  nextLoadConsequence,
}: StewardOrientationProps) {
  const sentence1 = industryPhrase
    ? `${tenantName} is ${industryPhrase}.`
    : `${tenantName} is your AbarVa tenant.`;
  const sentence2 = `${loadedSummary}; ${missingSummary}.`;
  const sentence3 = nextLoadName
    ? `The next move is to load ${nextLoadName} — ${nextLoadConsequence ?? 'this would deepen agent capability'}.`
    : `Setup is complete enough that no single load is the obvious next move; review the action queue if any items are pending.`;

  return (
    <section
      data-overview-block="steward-orientation"
      data-testid="overview-steward-orientation"
      style={{
        background: COLORS.skyPale,
        borderLeft: `4px solid ${COLORS.navy}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        Steward · Setup orientation
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 17,
          color: SHELL.INK,
          lineHeight: 1.45,
          fontWeight: 400,
        }}
      >
        {sentence1} {sentence2} {sentence3}
      </p>
      <div style={{ display: 'flex', gap: SPACING.sm, marginTop: SPACING.xs, flexWrap: 'wrap' }}>
        <Link
          href="/admin/data-trust"
          data-testid="overview-cta-data-trust"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.navy,
            textDecoration: 'none',
            border: `1px solid ${COLORS.navy}`,
            borderRadius: RADIUS.pill,
            padding: `4px ${SPACING.md}`,
            background: SHELL.CARD_WHITE,
          }}
        >
          Go to Data Trust →
        </Link>
        <Link
          href="/admin/agent-readiness"
          data-testid="overview-cta-agent-readiness"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.navy,
            textDecoration: 'none',
            border: `1px solid ${COLORS.navy}55`,
            borderRadius: RADIUS.pill,
            padding: `4px ${SPACING.md}`,
          }}
        >
          Go to Agent Readiness →
        </Link>
      </div>
    </section>
  );
}
