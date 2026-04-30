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
import { SPACING } from '@/lib/design/design-tokens';
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
