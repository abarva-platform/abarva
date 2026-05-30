/**
 * StewardOrientationBlock · extracted from `HomeOverviewV2` so the
 * Steward orientation zone can be rendered from an async server
 * component slot in Wave 3 PR-7. Pure presenter — receives the
 * `orientation` slice of `OverviewBlocks` and renders the editorial
 * voice block exactly as it lived inline in HomeOverviewV2.
 *
 * Locked palette + fonts mirror HomeOverviewV2; if those tokens move,
 * this component should move with them.
 */

import type { OverviewBlocks } from '@/lib/admin/overview-composer';

const F_DISPLAY = 'var(--font-fraunces), Georgia, serif';
const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.06)',
  teal: '#0E8A65',
  amber: '#92400E',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
} as const;

interface Props {
  orientation: OverviewBlocks['orientation'];
}

export function StewardOrientationBlock({ orientation }: Props) {
  return (
    <div
      style={{
        border: `1px solid ${C.borderLight}`,
        background: C.surface,
        borderRadius: 10,
        padding: '28px 28px 22px',
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.navy,
          marginBottom: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 9 }}>◆</span>
        Steward · Tenant orientation
      </div>
      <p
        style={{
          fontFamily: F_DISPLAY,
          fontSize: 22,
          fontWeight: 400,
          color: C.ink,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          marginBottom: 18,
          maxWidth: '60ch',
          margin: '0 0 18px 0',
        }}
      >
        {orientation.industryPhrase ? `${orientation.industryPhrase}. ` : ''}
        {orientation.loadedSummary.charAt(0).toUpperCase() + orientation.loadedSummary.slice(1)}
        {'. '}
        {orientation.missingSummary &&
          `${orientation.missingSummary.charAt(0).toUpperCase() + orientation.missingSummary.slice(1)}.`}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          paddingTop: 18,
          borderTop: `1px dashed ${C.borderLight}`,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.teal,
              marginBottom: 10,
            }}
          >
            Loaded · grounded
          </div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}>
            {orientation.loadedSummary}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.amber,
              marginBottom: 10,
            }}
          >
            Missing · authored only
          </div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}>
            {orientation.missingSummary}
          </div>
        </div>
      </div>

      {orientation.nextLoadName && (
        <div
          style={{
            marginTop: 18,
            padding: '14px 16px',
            background: C.navySoft,
            borderLeft: `3px solid ${C.navy}`,
            borderRadius: '0 6px 6px 0',
          }}
        >
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: C.navy,
              marginBottom: 4,
            }}
          >
            Next load · highest leverage
          </div>
          <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55 }}>
            <strong style={{ fontWeight: 600 }}>
              Strengthen &ldquo;{orientation.nextLoadName}&rdquo;.
            </strong>{' '}
            {orientation.nextLoadConsequence}
          </div>
        </div>
      )}
    </div>
  );
}
