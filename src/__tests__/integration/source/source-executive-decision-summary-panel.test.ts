import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  SOURCE_STAGE_LABELS,
  getSourcingEvent,
} from '@/lib/source';
import { SentinelEngagementCanvas } from '@/components/source/SentinelEngagementCanvas';
import {
  SourceExecutiveDecisionSummaryPanel,
  buildAmsDecisionSummaryProps,
} from '@/components/source/SourceExecutiveDecisionSummaryPanel';
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
  it('renders T06 Atlas brief card with posture grid and KV table', () => {
    const props = buildAmsDecisionSummaryProps();
    const html = renderToStaticMarkup(createElement(SourceExecutiveDecisionSummaryPanel, props));

    // Atlas brief section
    expect(html).toContain('Atlas');
    expect(html).toContain('Executive brief');
    expect(html).toContain(props.atlasHeadline);

    // Posture cards
    expect(html).toContain('Value posture');
    expect(html).toContain('Risk posture');
    expect(html).toContain('Transition posture');

    // KV table
    expect(html).toContain('Atlas recommendation');
    expect(html).toContain('Steward sign-off');
    expect(html).toContain('Sentinel attestation');
    expect(html).toContain('Decision deadline');
    expect(html).toContain('Decision posture');

    // CTA row
    expect(html).toContain('Approve');
    expect(html).toContain('Send back');

    // Drawer triggers
    expect(html).toContain('Data readiness');
    expect(html).toContain('Evidence trail');
    expect(html).toContain('Gate criteria');
  });

  it('renders executive decision panel in event canvas when selection stage is active', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const event = buildSelectionEvent(sourceEvent!);
    const html = renderToStaticMarkup(createElement(SentinelEngagementCanvas, { event }));

    expect(html).toContain('Vendor selection readiness');
    expect(html).toContain('Selection posture');
    expect(html).toContain('Selection-readiness readiness signal');
    expect(html).toContain('Lead sourcing agent');
  });

  it('seeded AMS decision props reflect conditional posture and P0 open state', () => {
    const props = buildAmsDecisionSummaryProps();

    // Headline references conditional recommendation
    expect(props.atlasHeadline).toMatch(/northstar/i);
    expect(props.atlasHeadline).toMatch(/condition/i);

    // Risk / transition posture are amber or red
    expect(['amber', 'red']).toContain(props.postureCards[1].tone);
    expect(['amber', 'red']).toContain(props.postureCards[2].tone);

    // KV reflects pending steward sign-off
    expect(props.kv.stewardSignOff).toMatch(/pending/i);
    expect(props.kv.stewardSignOffTone).toBe('amber');
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
