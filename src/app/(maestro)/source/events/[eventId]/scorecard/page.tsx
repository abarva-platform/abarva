import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { ScorecardGovernancePanel } from '@/components/source/ScorecardGovernancePanel';
import { getSourcingEvent } from '@/lib/source/queries';
import { buildSourceStageGateReadiness } from '@/lib/source/source-stage-gates';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';

export const dynamic = 'force-dynamic';

export default async function SourceEventScorecardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getSourcingEvent(eventId);
  if (!event) notFound();
  const stageReadiness = buildSourceStageGateReadiness({ event });
  const evaluationToBafoGate =
    stageReadiness.gates.find((gate) => gate.transitionId === 'gate-evaluation-bafo') ??
    stageReadiness.gates[0];
  const approvedCriteriaCount =
    event.scorecard?.criteria?.filter((c) => c.status === 'approved' || c.status === 'ready').length ?? 0;
  const pendingCriteriaCount = Math.max((event.scorecard?.criteria?.length ?? 0) - approvedCriteriaCount, 0);

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: event.accountName,
        showLocked: true,
        context: `Source · ${event.name} · Scorecard governance`,
      }}
      middleStrip={
        <StageTrackerStrip
          stages={AMS_SOURCE_EVENT.stages}
          activeStage={event.currentStageLabel === 'Orals/BAFO' ? 'BAFO' : event.currentStageLabel}
          variant="journey"
          personaLabel="Sourcing lead"
        />
      }
    >
      <SentinelAgentColumn
        quote={`Scorecard at ${event.scorecard?.approvalState ?? 'default_generated'}. ${approvedCriteriaCount} criteria approved · ${pendingCriteriaCount} pending review. Locks when all criteria reach 'approved'.`}
        agentContext={`Sentinel · ${event.name} · Scorecard`}
        actions={[
          { letter: 'A', text: 'Review approval blockers', detail: 'Criteria pending approval or still carrying blocked status' },
          { letter: 'B', text: 'Inspect rationale gaps', detail: 'Criteria where deterministic rationale is still incomplete' },
          { letter: 'C', text: 'Explain BAFO gate impact', detail: `How scorecard state affects ${evaluationToBafoGate.transitionLabel}` },
        ]}
      />
      <SourceWorkingPane>
        <ScorecardGovernancePanel
          scorecard={event.scorecard}
          eventName={event.name}
          currentStageLabel={event.currentStageLabel}
          currentBlocker={event.blocker}
          gateImpact={{
            label: evaluationToBafoGate.transitionLabel,
            state: evaluationToBafoGate.state,
            blocker: evaluationToBafoGate.blocker,
            requiredArtifacts: evaluationToBafoGate.requiredArtifacts,
            requiredApprovals: evaluationToBafoGate.requiredApprovals,
          }}
        />
      </SourceWorkingPane>
    </AppShell>
  );
}
