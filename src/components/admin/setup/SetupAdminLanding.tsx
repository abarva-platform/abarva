/**
 * SetupAdminLanding · SETUP-1.2
 *
 * Composer for the redesigned /admin landing. Three Acts +
 * activity feed inside the standard EditorialCanvas. Receives
 * already-merged content from the page server component, so this
 * file is pure presentation.
 */

import type {
  SetupActsContent,
  CapabilityGainEntry,
  InventorySegmentRollup,
} from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import Link from 'next/link';

import { SetupActOne } from './SetupActOne';
import { SetupActThree } from './SetupActThree';
import { SetupCapabilityMatrix } from './SetupCapabilityMatrix';
import { SetupAgentStrip } from './SetupAgentStrip';
import { SetupRecentActivity } from './SetupRecentActivity';
import { SetupSentinelOpener } from './SetupSentinelOpener';

export interface SetupAdminLandingProps {
  content: SetupActsContent;
  segmentRollups: InventorySegmentRollup[];
  totalRecords: number | null;
  segmentsTracked: number | null;
  capabilitiesGrounded: number;
  lastIngestedRelative?: string;
  /** Atlas agent: cross-program signals count. */
  atlasSignalCount: number;
  /** Atlas agent: HIGH-severity signals open. */
  atlasHighSeverityCount: number;
  /** Nexus agent: active program count. */
  nexusProgramCount: number;
  /** Steward agent: compliance findings count. */
  stewardFindingCount: number;
  /** Tenant-admin queue: submitted program briefs waiting for approval. */
  programApprovalPendingCount?: number;
}

function topGainEntries(gains: CapabilityGainEntry[]): CapabilityGainEntry[] {
  return gains
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);
}

function OrientationBanner({
  content,
  totalRecords,
}: {
  content: SetupActsContent;
  totalRecords: number | null;
}) {
  const topGains = topGainEntries(content.actThreeGainEntries);
  const hasAnyRecords = typeof totalRecords === 'number' && totalRecords > 0;
  const headline = hasAnyRecords
    ? 'Your enterprise memory has started. The next records decide what the agents can safely say.'
    : 'Setup is where AbarVa learns your enterprise before any agent gives confident advice.';
  const subcopy = hasAnyRecords
    ? 'Each additional segment sharpens a different operating capability: citation discipline, decision rights, gate readiness, sourcing posture, or portfolio signals.'
    : 'Every upload has a concrete consequence. Enterprise profile gives context. Org structure gives decision rights. KPIs give measurement. Evidence gives citations. Programs and signals give Nexus and Atlas something real to govern.';

  return (
    <section
      data-testid="admin-setup-orientation-banner"
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
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
          fontFamily: SHELL.SANS,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        Enterprise memory · {content.tenantDisplayName}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 20,
          color: SHELL.INK,
          lineHeight: 1.3,
          fontWeight: 400,
        }}
      >
        {headline}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          lineHeight: 1.6,
        }}
      >
        {subcopy}
      </p>
      <ol
        data-testid="admin-setup-orientation-priorities"
        style={{
          margin: 0,
          padding: '0 0 0 20px',
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          lineHeight: 1.8,
        }}
      >
        {topGains.map((gain) => (
          <li key={gain.id}>
            <a
              href={`/admin/segments/${gain.targetSegmentId}`}
              style={{
                color: SHELL.INK,
                textDecorationColor: `${COLORS.navy}55`,
                textUnderlineOffset: 3,
              }}
            >
              <strong>
                Segment {Number(gain.targetSegmentId)} — {gain.targetSegmentName}.
              </strong>
            </a>{' '}
            {gain.capabilityGained}
          </li>
        ))}
      </ol>
      <p
        style={{
          margin: `${SPACING.xs} 0 0`,
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
        }}
      >
        Ask Steward in the right panel which segment should come next for this tenant.
      </p>
    </section>
  );
}

function ProgramApprovalQueueCallout({ pendingCount }: { pendingCount: number }) {
  const hasPending = pendingCount > 0;
  return (
    <section
      data-testid="program-approval-queue-callout"
      style={{
        background: hasPending ? SHELL.PAPER : COLORS.skyPale,
        borderLeft: `3px solid ${hasPending ? COLORS.coralInk : COLORS.navy}`,
        paddingLeft: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.md,
        paddingRight: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.lg,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: hasPending ? COLORS.coralInk : COLORS.navy,
            fontWeight: 800,
          }}
        >
          Nexus program approvals
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: SHELL.INK,
            lineHeight: 1.25,
          }}
        >
          {hasPending
            ? `${pendingCount} program brief${pendingCount === 1 ? '' : 's'} waiting for Setup approval.`
            : 'No program briefs are waiting for Setup approval.'}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            lineHeight: 1.5,
          }}
        >
          New programs should not appear as active work until this queue approves the seed and unlocks Phase 0.
        </p>
      </div>
      <Link
        href="/admin/programs/approvals"
        style={{
          flex: '0 0 auto',
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: SHELL.INK,
          textDecoration: 'none',
          border: `1px solid ${SHELL.INK}`,
          borderRadius: 999,
          padding: '8px 12px',
          background: SHELL.CARD_WHITE,
        }}
      >
        Review queue →
      </Link>
    </section>
  );
}

export function SetupAdminLanding({
  content,
  segmentRollups,
  totalRecords,
  segmentsTracked,
  capabilitiesGrounded,
  lastIngestedRelative,
  atlasSignalCount,
  atlasHighSeverityCount,
  nexusProgramCount,
  stewardFindingCount,
  programApprovalPendingCount = 0,
}: SetupAdminLandingProps) {
  const isFirstTime =
    totalRecords === null ||
    totalRecords === 0 ||
    content.tenantDataRichness === 'sparse' ||
    content.tenantDataRichness === 'partial';

  return (
    <EditorialCanvas
      eyebrow={`Setup · ${content.tenantDisplayName}`}
      title="Your enterprise, as the platform sees it."
      subtitle="A story-led setup landing. Three Acts: what we know about you today, what we can reason about because of that data, and what changes when you upload one more thing."
    >
      <div
        data-testid="admin-setup-landing"
        data-tenant-richness={content.tenantDataRichness}
        style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}
      >
        {isFirstTime && <OrientationBanner content={content} totalRecords={totalRecords} />}
        <ProgramApprovalQueueCallout pendingCount={programApprovalPendingCount} />
        <SetupAgentStrip
          tenantDisplayName={content.tenantDisplayName}
          tenantRecords={totalRecords}
          atlasSignalCount={atlasSignalCount}
          atlasHighSeverityCount={atlasHighSeverityCount}
          nexusProgramCount={nexusProgramCount}
          stewardFindingCount={stewardFindingCount}
          capabilitiesGrounded={capabilitiesGrounded}
        />
        <SetupSentinelOpener
          tenantDisplayName={content.tenantDisplayName}
          opener={content.sentinelOpener}
          totalRecords={totalRecords}
          segmentsTracked={segmentsTracked}
          capabilitiesGrounded={capabilitiesGrounded}
          lastIngestedRelative={lastIngestedRelative}
        />
        <SetupActOne facts={content.actOneFacts} segmentRollups={segmentRollups} />
        <SetupCapabilityMatrix
          matrix={content.capabilityMatrix}
          narrativeCards={content.capabilityNarrativeCards}
        />
        <SetupActThree gains={content.actThreeGainEntries} />
        <SetupRecentActivity events={content.recentActivity} />
      </div>
    </EditorialCanvas>
  );
}
