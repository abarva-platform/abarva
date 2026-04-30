/**
 * SetupSentinelOpener · SETUP-1.2
 *
 * The page-opening narrative shown above the three Acts. Rendered
 * by the /admin landing as the first thing the tenant admin reads.
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.1: the opener is Sentinel's
 * librarian voice — concrete, specific, no marketing language. It
 * states what the platform sees today and the live counts cited
 * (records, segments) inline.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface SetupSentinelOpenerProps {
  tenantDisplayName: string;
  /** Sentinel-voice opener prose. */
  opener: string;
  /** Total tenant records loaded. */
  totalRecords: number | null;
  /** Number of segment families tracked. */
  segmentsTracked: number | null;
  /** Capabilities currently grounded (Act 2 grounded count). */
  capabilitiesGrounded: number;
  /** "Last refreshed" relative phrase, e.g. "5m ago". */
  lastIngestedRelative?: string;
}

export function SetupSentinelOpener({
  tenantDisplayName,
  opener,
  totalRecords,
  segmentsTracked,
  capabilitiesGrounded,
  lastIngestedRelative,
}: SetupSentinelOpenerProps) {
  return (
    <section
      data-testid="admin-setup-sentinel-opener"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Sentinel · librarian read of {tenantDisplayName}
        </p>
        {lastIngestedRelative ? (
          <p
            style={{
              margin: 0,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}99`,
            }}
            data-testid="admin-setup-last-refreshed"
          >
            Last refreshed {lastIngestedRelative}
          </p>
        ) : null}
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          lineHeight: 1.45,
          color: COLORS.ink,
        }}
        data-testid="admin-setup-opener-prose"
      >
        {opener}
      </p>

      <div
        style={{
          display: 'flex',
          gap: SPACING.lg,
          flexWrap: 'wrap',
          marginTop: SPACING.sm,
          paddingTop: SPACING.md,
          borderTop: `1px solid ${COLORS.ink}11`,
        }}
        role="list"
        aria-label="Setup summary metrics"
      >
        <SummaryCount
          label="Records loaded"
          value={totalRecords === null ? '—' : totalRecords.toLocaleString()}
          testid="admin-setup-summary-records"
        />
        <SummaryCount
          label="Segments tracked"
          value={segmentsTracked === null ? '—' : `${segmentsTracked} of 14`}
          testid="admin-setup-summary-segments"
        />
        <SummaryCount
          label="Capabilities grounded"
          value={`${capabilitiesGrounded} of 4`}
          testid="admin-setup-summary-capabilities"
        />
      </div>
    </section>
  );
}

function SummaryCount({
  label,
  value,
  testid,
}: {
  label: string;
  value: string;
  testid: string;
}) {
  return (
    <div
      role="listitem"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}
      data-testid={testid}
    >
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          lineHeight: 1,
          color: COLORS.ink,
          fontWeight: 600,
        }}
      >
        {value}
      </p>
    </div>
  );
}
