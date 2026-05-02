import { notFound } from 'next/navigation';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import type { StageStatus } from '@/components/shell/StageTrackerStrip';
import { SentinelSynthesisQuote } from '@/components/source/SentinelSynthesisQuote';
import { SourceProvenanceRibbon } from '@/components/source/SourceProvenanceRibbon';
import { DownloadContextButton } from '@/components/reasoning/DownloadContextButton';
import { SourceEventAgentCanvas } from '@/components/source/SourceEventAgentCanvas';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import { SourceCommercialEventSection } from '@/components/source/SourceCommercialEventSection';
import { GateCriteriaPanel } from '@/components/source/GateCriteriaPanel';
import { FailureModeWarningChip } from '@/components/_shared/FailureModeWarningChip';
import { EvidenceQualityChip } from '@/components/_shared/EvidenceQualityChip';
import { CompareWithDropdown } from '@/components/_shared/CompareWithDropdown';
import { MissionListInteractive } from '@/components/_shared/MissionListInteractive';
import { RecentMissionStates } from '@/components/_shared/RecentMissionStates';
import { InstanceEventTimeline } from '@/components/_shared/InstanceEventTimeline';
import { InstanceEventTimelineFilterBar } from '@/components/_shared/InstanceEventTimelineFilterBar';
import { buildInstanceEventTimeline } from '@/lib/reasoning/instance-event-timeline';
import { parseTimelineFiltersFromSearchParams } from '@/lib/reasoning/instance-event-timeline-filters';
import { deriveMissionsFromInstance } from '@/lib/reasoning/mission-derivation';
import { getSourcingEvent } from '@/lib/source/queries';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMapWithIngestions } from '@/lib/source/source-event-instance';
import { AddEvidenceForm } from '@/components/source/AddEvidenceForm';
import { BulkEvidenceImportButton } from '@/components/source/BulkEvidenceImportButton';
import { CascadeImpactSection } from '@/components/_shared/CascadeImpactSection';
import { ReasoningErrorBoundary } from '@/components/reasoning/ReasoningErrorBoundary';
import { PatternRecommendationChips } from '@/components/source/PatternRecommendationChips';
import { StageAdvanceButton } from '@/components/source/StageAdvanceButton';
import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { getAllInstanceIds } from '@/lib/reasoning/instance-resolver';
import { summarizeFailureModes } from '@/lib/reasoning/provenance-ribbon-helpers';
import { summarizeEvidenceQuality, summaryGrade } from '@/lib/reasoning/evidence-quality';
import type { GateEvaluation } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export default async function SourceEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = (await (searchParams ?? Promise.resolve({}))) ?? {};
  const event = await getSourcingEvent(eventId);
  if (!event) notFound();

  // Decode URL-driven timeline filters (`?tlKind=…&tlSince=…&tlSearch=…`).
  const timelineFilters = parseTimelineFiltersFromSearchParams(sp);

  // Resolve typed instance for live synthesis. Fallback to AMS instance when
  // other events don't have a typed SourceEventInstance yet.
  const matchedInstance = SOURCE_EVENT_INSTANCES.find(i => i.id === eventId)
    ?? (event.name.toLowerCase().includes('ams')
      ? SOURCE_EVENT_INSTANCES.find((instance) => instance.id.toLowerCase().includes('ams'))
      : undefined)
    ?? SOURCE_EVENT_INSTANCES[0];

  // Build gate-driven stage states when a typed instance is available.
  let stageStates: Record<string, StageStatus> | undefined;
  // REASON-23 — also surface criteria-level gate detail. The next-stage gate
  // criteria are the most actionable; we additionally include all upcoming
  // stage criteria so the panel reads like a forward-looking ribbon.
  let nextGateEvaluations: GateEvaluation[] = [];
  let nextGateTargetStageId: string | undefined;
  if (matchedInstance) {
    const evidenceMap = buildEvidenceMapWithIngestions(matchedInstance);
    const evaluator = createGateEvaluator(PAT_SRC_AMS_001);
    const allStageEvals = evaluator.evaluateAllStages(matchedInstance.currentStage, evidenceMap);
    const raw: Record<string, StageStatus> = {};
    for (const stageEval of allStageEvals) {
      raw[stageEval.stageLabel] = stageEval.status;
      // Also key by hyphenated form to match AMS_SOURCE_EVENT.stages ('Initial-Bid' vs 'Initial Bid')
      raw[stageEval.stageLabel.replace(/ /g, '-')] = stageEval.status;
    }
    stageStates = raw;

    // The criteria that gate the CURRENT → NEXT advance. evaluateStage returns
    // criteria whose stageId names the destination stage, so the criterion
    // stageId tells us the gate target.
    nextGateEvaluations = evaluator.evaluateStage(matchedInstance.currentStage, evidenceMap);
    nextGateTargetStageId = nextGateEvaluations[0]?.stageId;
  }

  // REASON-27 — Build the SynthesisContext server-side so the provenance
  // ribbon can surface what grounded the streamed Sentinel synthesis quote.
  const synthesisContext = matchedInstance
    ? buildSourceSynthesisContext(matchedInstance, PAT_SRC_AMS_001)
    : null;

  // Mission queue · derived from the same (instance, pattern) pair as the
  // gate evaluator. This is the TASK-oriented view of pending criteria —
  // verb-first, sorted high → medium → low — that complements the
  // STATUS-oriented `GateCriteriaPanel` below.
  const derivedMissions = matchedInstance
    ? deriveMissionsFromInstance(matchedInstance, PAT_SRC_AMS_001)
    : [];
  const blockingGateEvaluations = nextGateEvaluations.filter(
    (evaluation) =>
      evaluation.gateType === 'hard' &&
      evaluation.status !== 'met' &&
      evaluation.status !== 'waived',
  );

  // REASON-29 — Header-level failure-mode warning chip. Pulls the same
  // SynthesisContext used by the provenance ribbon so high-confidence
  // anti-pattern matches are visible without scrolling the agent column.
  const failureModeSummary = synthesisContext
    ? summarizeFailureModes(synthesisContext)
    : null;
  // Evidence-quality aggregate for the typed instance. Source-side
  // `EvidenceItem` uses `{ value, source, recordedAt }` rather than the
  // generic shape, so we adapt the fields onto the scorer's expected
  // properties before summarizing.
  const evidenceQualitySummary = matchedInstance
    ? summarizeEvidenceQuality(
        matchedInstance.evidence.map((ev) => ({
          text: ev.value,
          citation: ev.source,
          uploadedAt: ev.recordedAt,
          uploadedBy: ev.source,
        })),
      )
    : null;
  const evidenceQualityGrade = evidenceQualitySummary
    ? summaryGrade(evidenceQualitySummary)
    : undefined;
  const failureModeTopMitigations = (() => {
    if (!synthesisContext || !failureModeSummary || failureModeSummary.topLabel === null) {
      return undefined;
    }
    const top = synthesisContext.failureModes.find(
      (d) => d.label === failureModeSummary.topLabel,
    );
    return top?.mitigations;
  })();

  const sentinelQuote = `${event.name} at ${event.currentStageLabel}.${event.blocker ? ` Blocker: ${event.blocker}.` : ''}`;
  const eventStageLabels = event.stages.map((stage) => stage.label);
  const journeyStages = eventStageLabels.includes(event.currentStageLabel)
    ? eventStageLabels
    : AMS_SOURCE_EVENT.stages;
  const activeJourneyStage =
    event.currentStageLabel === 'Orals/BAFO' && journeyStages.includes('BAFO')
      ? 'BAFO'
      : event.currentStageLabel;

  return (
    <SourceEventAgentCanvas
      event={event}
      quote={sentinelQuote}
      middleStrip={
        <StageTrackerStrip
          stages={journeyStages}
          activeStage={activeJourneyStage}
          stageStates={stageStates}
          variant="journey"
          personaLabel="Sourcing lead"
        />
      }
    >
      <NexusEngagementCanvas event={event} />
      <section
        aria-label="Sentinel event synthesis"
        style={{
          border: '1px solid rgba(12,26,58,0.12)',
          borderRadius: 14,
          background: '#FFFFFF',
          padding: '14px 16px',
          display: 'grid',
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(12,26,58,0.52)',
            fontWeight: 700,
          }}
        >
          Sentinel synthesis
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 18,
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: 'rgba(12,26,58,0.92)',
          }}
        >
          <SentinelSynthesisQuote
            instanceId={matchedInstance?.id ?? 'ams-vendor-consolidation-2026'}
            fallback={sentinelQuote}
          />
        </p>
        {synthesisContext ? (
          <div>
            <SourceProvenanceRibbon context={synthesisContext} />
            <div style={{ marginTop: 6 }}>
              <DownloadContextButton instanceId={matchedInstance.id} surface="source" />
            </div>
          </div>
        ) : null}
      </section>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {failureModeSummary && (
          <FailureModeWarningChip
            topLabel={failureModeSummary.topLabel}
            topConfidence={failureModeSummary.topConfidence}
            highCount={failureModeSummary.highConfidence}
            mitigations={failureModeTopMitigations}
          />
        )}
        {evidenceQualitySummary && evidenceQualitySummary.total > 0 && (
          <EvidenceQualityChip
            summary={evidenceQualitySummary}
            grade={evidenceQualityGrade}
          />
        )}
        {matchedInstance && (
          <CompareWithDropdown
            currentInstanceId={matchedInstance.id}
            allOtherIds={getAllInstanceIds()}
          />
        )}
        <a
          href={`/source/events/${eventId}/report`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 10,
            color: 'rgba(0,0,0,0.5)',
            textDecoration: 'none',
            borderBottom: '1px dashed rgba(0,0,0,0.35)',
            paddingBottom: 1,
            marginLeft: 4,
          }}
        >
          Full report →
        </a>
        <StageAdvanceButton
          eventId={event.id}
          currentStageKey={event.currentStageKey}
          blockingGateCount={blockingGateEvaluations.length}
          blockingGateLabel={nextGateTargetStageId}
        />
      </div>
      <PatternRecommendationChips
        eventName={event.name}
        eventType={event.archetype}
      />
      {matchedInstance && nextGateEvaluations.length > 0 && (
        <GateCriteriaPanel
          evaluations={nextGateEvaluations}
          pattern={PAT_SRC_AMS_001}
          currentStageId={nextGateTargetStageId}
          title={`Gate criteria — ${nextGateTargetStageId ?? 'next stage'}`}
        />
      )}
      {matchedInstance && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <BulkEvidenceImportButton instanceId={matchedInstance.id} />
          </div>
          <AddEvidenceForm
            instanceId={matchedInstance.id}
            currentStage={matchedInstance.currentStage}
          />
        </div>
      )}
      {matchedInstance && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <MissionListInteractive
            missions={derivedMissions}
            title="Pending gates · this event"
            maxRows={6}
          />
          <RecentMissionStates instanceId={matchedInstance.id} limit={3} />
        </div>
      )}
      {matchedInstance && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InstanceEventTimelineFilterBar filters={timelineFilters} />
          <InstanceEventTimeline
            entries={buildInstanceEventTimeline(matchedInstance.id)}
            filters={timelineFilters}
          />
        </div>
      )}
      {/* REASON-34 — Cascade impact graph for this source-event instance */}
      {matchedInstance && (
        <ReasoningErrorBoundary section="Cascade Impact">
          <CascadeImpactSection instanceId={matchedInstance.id} />
        </ReasoningErrorBoundary>
      )}
      <SourceCommercialEventSection
        eventId={event.id}
        eventName={event.name}
        accountName={event.accountName}
      />
    </SourceEventAgentCanvas>
  );
}
