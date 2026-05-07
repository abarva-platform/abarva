/**
 * StewardOrientation · Overview Block 1.2 (Setup Redesign Package PR A).
 *
 * 3-sentence Steward narrative + 2 CTAs. Deterministic copy
 * generation per `DATA_BINDING_CATALOG.md` §1 Block 1.2 +
 * Setup canon refit.
 */

import Link from 'next/link';
import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';

export interface StewardOrientationProps {
  tenantName: string;
  industryPhrase: string | null;
  loadedSummary: string;
  missingSummary: string;
  nextLoadName: string | null;
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
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SETUP.mono,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: SETUP.navy,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          aria-hidden="true"
          style={{ width: 8, height: 8, borderRadius: '50%', background: SETUP.mint }}
        />
        Steward · Setup orientation
      </p>
      <p style={{ ...SETUP_TYPE.bodySerif, margin: 0 }}>
        {sentence1} {sentence2} {sentence3}
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
        <Link
          href="/admin/data-trust"
          data-testid="overview-cta-data-trust"
          style={{
            fontFamily: SETUP.sans,
            fontSize: 11,
            fontWeight: 600,
            color: SETUP.ink,
            background: SETUP.cardWhite,
            textDecoration: 'none',
            border: `1px solid ${SETUP.ink}`,
            borderRadius: SETUP_RADIUS.pill,
            padding: '4px 12px',
          }}
        >
          Go to Data Trust →
        </Link>
        <Link
          href="/admin/agent-readiness"
          data-testid="overview-cta-agent-readiness"
          style={{
            fontFamily: SETUP.sans,
            fontSize: 11,
            fontWeight: 600,
            color: SETUP.inkSoft,
            background: 'transparent',
            textDecoration: 'none',
            border: `1px solid ${SETUP.cardLineStrong}`,
            borderRadius: SETUP_RADIUS.pill,
            padding: '4px 12px',
          }}
        >
          Go to Agent Readiness →
        </Link>
      </div>
    </section>
  );
}
