import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SourceEventDetailPage from '@/app/(maestro)/source/events/[eventId]/page';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  getSourcingEvent,
  buildSourceRfpReadiness,
  buildSourceExecutiveDecisionSummary,
  buildSourceVendorSelectionReadiness,
  SOURCE_STAGE_LABELS,
} from '@/lib/source';
import type { SourceStageStatus, StageGateStatus, WorkflowStage } from '@/lib/source/types';

type SourcingEvent = NonNullable<Awaited<ReturnType<typeof getSourcingEvent>>>;

function buildOralsBafoEvent(event: SourcingEvent) {
  const oralsBafoStage: WorkflowStage = {
    key: 'orals_bafo',
    label: SOURCE_STAGE_LABELS.orals_bafo,
    status: 'active',
    summary: 'Procurement is ready to run BAFO and close commercial conditions.',
    gate: {
      id: 'gate-source-bafo',
      label: 'BAFO package complete',
      status: 'in_review' as StageGateStatus,
      ownerRole: 'Procurement Lead',
      requiredArtifacts: ['Decision memo', 'Commercial exception log'],
      blocker: null,
    },
  };

  return {
    ...event,
    stages: [...event.stages.map((stage) => ({ ...stage, status: 'complete' as SourceStageStatus })), oralsBafoStage],
    currentStageKey: 'orals_bafo' as const,
    currentStageLabel: SOURCE_STAGE_LABELS.orals_bafo,
  };
}

function buildSelectionEvent(event: SourcingEvent) {
  const selectionStage: WorkflowStage = {
    key: 'selection',
    label: SOURCE_STAGE_LABELS.selection,
    status: 'active',
    summary: 'Steering committee is reviewing tradeoffs before final selection recommendation.',
    gate: {
      id: 'gate-source-selection-review',
      label: 'Selection review package complete',
      status: 'in_review' as StageGateStatus,
      ownerRole: 'Steering Committee',
      requiredArtifacts: ['Executive decision brief', 'Commercial risk log'],
      blocker: null,
    },
  };

  return {
    ...event,
    stages: [...event.stages.map((stage) => ({ ...stage, status: 'complete' as SourceStageStatus })), selectionStage],
    currentStageKey: 'selection' as const,
    currentStageLabel: SOURCE_STAGE_LABELS.selection,
  };
}

describe('Source event canvas shell', () => {
  it('renders the seeded event canvas shell deterministically', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(event).toBeDefined();

    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Journey map');
    expect(html).toContain('Stage gate readiness');
    expect(html).toContain('Current gate signal');
    expect(html).toContain('Artifacts and deliverables');
    expect(html).toContain('Deterministic artifact status strip');
    expect(html).toContain('Scope stage workspace');
    expect(html).toContain('Data readiness');
    expect(html).toContain('Evidence posture for this stage');
    expect(html).toContain('34% toward event data readiness');
    expect(html).toContain('Admin/Setup readiness contract projection');
    expect(html).toContain('Source consumes Admin/Setup readiness');
    expect(html).toContain('Artifact placeholders');
    expect(html).toContain('Top mission signal');
    expect(html).toContain('Nexus guidance');
    expect(html).toContain('Event RFP readiness snapshot');
    expect(html).toContain('Overall tier');
  });

  it('keeps Scope visible as the current blocked stage with required baseline inputs', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const readiness = buildSourceRfpReadiness({ event: event! });
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Scope');
    expect(html).toContain('Blocked');
    expect(html).toContain('Application inventory');
    expect(html).toContain('Workload Baseline');
    expect(
      html.includes('Application inventory and analytics workload data block')
      || html.includes('Application inventory and analytics workload baseline still missing.'),
    ).toBe(true);
    expect(html).toContain('Workload Baseline');
    expect(html).toContain('Retained Roles');
    expect(html).toContain('Requested');
    expect(html).toContain('Blocks Rich-tier Scope and makes pricing normalization unsafe.');
    expect(html).toContain('Blocks clear scope split and transition responsibility language.');
    expect(readiness.overallTier).not.toBe('Rich');
    expect(html).toContain(readiness.overallTier);
  });

  it('renders deterministic Nexus and mission content without API calls', async () => {
    const page = await SourceEventDetailPage({
      params: Promise.resolve({ eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('Source event canvas led by Nexus across pricing, risk, BAFO, readiness, mission, and signal workflow steps.');
    expect(html).toContain('Lead sourcing agent');
    expect(html).toContain('Top mission');
    expect(html).toContain('Stage gate check required');
    expect(html).toContain('Deterministic guidance only');
  });

  it('surfaces BAFO negotiation panel signals in event canvas when orals/BAFO is active', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const event = buildOralsBafoEvent(sourceEvent!);
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event }));

    expect(html).toContain('BAFO negotiation');
    expect(html).toContain('Overall negotiation readiness');
    expect(html).toContain('Top BAFO priorities');
    expect(html).toContain('Vendor BAFO questions');
    expect(html).toContain('Vertex CloudOps');
  });

  it('surfaces executive decision summary signals while keeping final selection posture gated', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const event = buildSelectionEvent(sourceEvent!);
    const summary = buildSourceExecutiveDecisionSummary({ event });
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event }));
    const selectionReadiness = buildSourceVendorSelectionReadiness({ event });

    expect(html).toContain('Vendor selection readiness');
    expect(html).toContain(selectionReadiness.selectionPosture);
    expect(html).toContain('Viable vendors');
    expect(html).toContain('Blocked vendors');
    expect(summary.recommendedDecisionPosture).not.toBe('ready_for_selection_review');
    expect(summary.blockers.length).toBeGreaterThan(0);
    expect(html).not.toContain('Finalize vendor selection');
  });

  it('surfaces selection readiness blocked state in selection stage without selecting vendor', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const event = buildSelectionEvent(sourceEvent!);
    const readiness = buildSourceVendorSelectionReadiness({ event: event });

    expect(readiness.selectionReviewReady).toBe(false);
    expect(readiness.selectionPosture).not.toBe('ready_for_selection_review');

    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event }));

    expect(html).toContain('Vendor selection readiness');
    expect(html).toContain('Selection posture');
    expect(html).toContain(readiness.selectionPosture);
    expect(html).toContain('Selection ready: no');
    expect(readiness.blockedVendors.length).toBeGreaterThan(0);
    expect(html).toContain(readiness.blockedVendors[0]);
    expect(html).toContain('Selection-readiness readiness signal');
    expect(html).toContain(readiness.recommendedNextAction);
  });

  it('includes the deterministic data readiness panel with missing and usable evidence states', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Data readiness');
    expect(html).toContain('Workload Baseline');
    expect(html).toContain('Ticket History');
    expect(html).toContain('Requested');
    expect(html).toContain('Missing');
    expect(html).toContain('Application Inventory');
    expect(html).toContain('Usable Evidence');
    expect(html).toContain('usable evidence');
    expect(html).toContain('Vendor Contracts');
    expect(html).toContain('Loaded');
    expect(html).toContain('loaded, not usable');
    expect(html).toContain('Vendor Spend');
    expect(html).toContain('Available');
    expect(html).toContain('available, not validated');
    expect(html).toContain('Loaded and Available');
    expect(html).toContain('Steward to Admin/Setup intake');
  });

  it('renders contract-backed readiness even when event-local readiness rows are empty', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(event).toBeDefined();

    const eventWithoutLocalReadiness = {
      ...event!,
      dataReadiness: [],
    };
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: eventWithoutLocalReadiness }));

    expect(html).toContain('34% toward event data readiness');
    expect(html).toContain('Admin/Setup readiness contract projection');
    expect(html).toContain('Workload Baseline');
    expect(html).toContain('Retained Roles');
    expect(html).toContain('3/5 required present');
  });

  it('keeps the event canvas shell inside the approved Source boundary', () => {
    const sources = [
      'src/app/(maestro)/source/events/[eventId]/page.tsx',
      'src/components/source/NexusEngagementCanvas.tsx',
      'src/components/source/SourceJourneyTracker.tsx',
      'src/components/source/SourceStagePanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/components/source/SourceDataReadinessPanel.tsx',
      'src/components/source/PersistentNexusPanel.tsx',
      'src/lib/source/admin-setup-readiness-contract.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(api\/v1|app\/api)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|scorecard-ui|artifact-drawer)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(admin\/setup|platform\/admin|connectors|migrations)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createConnector|createDataset|createScorecardUi|openArtifactDrawer)\b/);
    expect(sources).not.toMatch(/from ['"][^'"]*(ProgramSurface|programs\/mock|preview|demo)[^'"]*['"]/i);
  });
});
