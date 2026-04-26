import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  SOURCE_STAGE_LABELS,
  buildSourceExecutiveDecisionSummary,
  getSourcingEvent,
} from '@/lib/source';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import { SourceExecutiveDecisionSummaryPanel } from '@/components/source/SourceExecutiveDecisionSummaryPanel';
import type { SourceStageStatus, StageGateStatus, WorkflowStage } from '@/lib/source/types';

type SourcingEvent = NonNullable<Awaited<ReturnType<typeof getSourcingEvent>>>;

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

describe('Source executive decision summary panel', () => {
  it('renders deterministic executive posture and vendor tradeoff output', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const summary = buildSourceExecutiveDecisionSummary({ event: sourceEvent! });
    const html = renderToStaticMarkup(createElement(SourceExecutiveDecisionSummaryPanel, { summary }));

    expect(html).toContain('Executive decision summary');
    expect(html).toContain('Selection-readiness decision brief');
    expect(html).toContain('Decision posture');
    expect(html).toContain('Vendor tradeoffs');
    expect(html).toContain('Blockers');
    expect(html).toContain('Atlas executive brief');
    expect(html).toContain('Nexus recommended next action');
    expect(html).toContain('Source modules used');
    expect(html).toContain('Vertex CloudOps');
    expect(html).toContain('Nova Partner Group');
    expect(html).toContain('Aegis Digital');
  });

  it('renders executive decision panel in event canvas when selection stage is active', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const event = buildSelectionEvent(sourceEvent!);
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event }));

    expect(html).toContain('Executive decision summary');
    expect(html).toContain('Selection-readiness decision brief');
    expect(html).toContain('Decision options');
    expect(html).toContain('Atlas executive brief');
    expect(html).toContain('Nexus recommended next action');
  });

  it('renders deterministic non-final decision posture with visible blockers for seeded data', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const summary = buildSourceExecutiveDecisionSummary({ event: sourceEvent! });
    const html = renderToStaticMarkup(createElement(SourceExecutiveDecisionSummaryPanel, { summary }));

    expect(summary.recommendedDecisionPosture).not.toBe('ready_for_selection_review');
    expect(summary.blockers.length).toBeGreaterThan(0);
    expect(html).toContain(summary.recommendedDecisionPosture);
    expect(html).toContain('Blockers');
    expect(html).not.toContain('Finalize vendor selection');
  });

  it('keeps executive decision panel files free of model/upload/workflow imports', () => {
    const sources = [
      'src/components/source/SourceExecutiveDecisionSummaryPanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/lib/source/executive-decision-summary.ts',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|scorecard-ui)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(approval|workflow-engine|workflow runtime|workflowRuntime)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
  });
});
