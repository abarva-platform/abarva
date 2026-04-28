import { notFound } from 'next/navigation';
import { ScorecardGovernancePanel, SourceCanonShell } from '@/components/source';
import { getSourcingEvent } from '@/lib/source/queries';
import { buildSourceStageGateReadiness } from '@/lib/source/source-stage-gates';

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
  const evaluationToBafoGate = stageReadiness.gates.find((gate) => gate.transitionId === 'gate-evaluation-bafo')
    ?? stageReadiness.gates[0];

  return (
    <SourceCanonShell
      activeRoute="events"
      title={`${event.name} · scorecard governance`}
      summary={`Steward-led governance workspace for ${event.currentStageLabel}. This route makes scorecard posture, evidence confidence, gate impact, and missing rationale explicit without executing approval automation.`}
    >
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
    </SourceCanonShell>
  );
}
