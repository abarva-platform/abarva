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
  InventorySegmentRollup,
} from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';

import { SetupActOne } from './SetupActOne';
import { SetupActThree } from './SetupActThree';
import { SetupActTwo } from './SetupActTwo';
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
}

function OrientationBanner({ tenantDisplayName }: { tenantDisplayName: string }) {
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
        Getting started · {tenantDisplayName}
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
        The corpus is empty — Sentinel has nothing to reason about yet.
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
        Three moves that unlock the most reasoning power fastest:
      </p>
      <ol
        style={{
          margin: 0,
          padding: '0 0 0 20px',
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          lineHeight: 1.8,
        }}
      >
        <li>
          <strong>Upload to segment 9 — Evidence &amp; Citations.</strong>{' '}
          Sentinel uses this to ground every answer with source documents.
        </li>
        <li>
          <strong>Upload to segment 1 — Program Inventory.</strong>{' '}
          This tells Nexus which AI programs are live, planned, or stalled.
        </li>
        <li>
          <strong>Upload to segment 14 — Cross-program signals.</strong>{' '}
          Atlas uses this to detect contradictions across the portfolio.
        </li>
      </ol>
      <p
        style={{
          margin: `${SPACING.xs} 0 0`,
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
        }}
      >
        Ask Steward in the right panel for guidance on any segment.
      </p>
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
}: SetupAdminLandingProps) {
  const isFirstTime =
    totalRecords === null || totalRecords === 0 || content.tenantDataRichness === 'sparse';

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
        {isFirstTime && (
          <OrientationBanner tenantDisplayName={content.tenantDisplayName} />
        )}
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
        <SetupActTwo capabilities={content.actTwoCapabilityNodes} />
        <SetupActThree gains={content.actThreeGainEntries} />
        <SetupRecentActivity events={content.recentActivity} />
      </div>
    </EditorialCanvas>
  );
}
