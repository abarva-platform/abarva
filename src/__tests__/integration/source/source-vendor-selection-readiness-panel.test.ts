import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import { SourceVendorSelectionReadinessPanel } from '@/components/source/SourceVendorSelectionReadinessPanel';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  SOURCE_STAGE_LABELS,
  buildSourceVendorSelectionReadiness,
  getSourcingEvent,
} from '@/lib/source';
import type { SourceStageKey, SourceStageStatus, StageGateStatus, WorkflowStage } from '@/lib/source/types';

type SourcingEvent = NonNullable<Awaited<ReturnType<typeof getSourcingEvent>>>;

function buildSelectionEvent(event: SourcingEvent) {
  const selectionStage: WorkflowStage = {
    key: 'selection',
    label: SOURCE_STAGE_LABELS.selection,
    status: 'active' as SourceStageStatus,
    summary: 'Steering committee is reviewing tradeoffs before selection review.',
    gate: {
      id: 'gate-source-selection-readiness',
      label: 'Selection review readiness package',
      status: 'in_review' as StageGateStatus,
      ownerRole: 'Steering Committee',
      requiredArtifacts: ['Executive decision brief', 'Commercial exception log'],
      blocker: 'Pricing template gaps for one vendor remain open.',
    },
  };

  return {
    ...event,
    stages: [...event.stages.map((stage) => ({ ...stage, status: 'complete' as SourceStageStatus })), selectionStage],
    currentStageKey: 'selection' as SourceStageKey,
    currentStageLabel: SOURCE_STAGE_LABELS.selection,
  };
}

describe('Source vendor selection readiness panel', () => {
  it('renders vendor selection readiness panels with blocked posture and blockers visible', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeDefined();

    const readiness = buildSourceVendorSelectionReadiness({ event: event! });
    const html = renderToStaticMarkup(createElement(SourceVendorSelectionReadinessPanel, { readiness }));

    expect(html).toContain('Vendor selection readiness');
    expect(html).toContain('Selection-readiness readiness signal');
    expect(html).toContain('Selection posture');
    expect(html).toContain('Selection ready');
    expect(html).toContain('Viable vendors');
    expect(html).toContain('Blocked vendors');
    expect(html).toContain('Unresolved commercial issues');
    expect(html).toContain('Unresolved evidence issues');
    expect(html).toContain('Atlas executive implication');
    expect(html).toContain('Steward gate notes');
    expect(html).toContain(readiness.nexusRecommendation);
  });

  it('surfaces selection readiness in event canvas when selection is active', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const event = buildSelectionEvent(sourceEvent!);
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event }));

    expect(html).toContain('Vendor selection readiness');
    expect(html).toContain('Selection-readiness readiness signal');
    expect(html).toContain('Selection posture');
    expect(html).toContain('Required artifacts');
    expect(html).toContain('Selection ready');
    expect(html).toContain('Blocked vendors');
  });

  it('keeps selection readiness files free from model/upload/workflow imports', () => {
    const sources = [
      'src/components/source/SourceVendorSelectionReadinessPanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/lib/source/vendor-selection-readiness.ts',
      'src/lib/source/vendor-selection-readiness-types.ts',
      'src/__tests__/integration/source/source-vendor-selection-readiness-panel.test.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|workflow-engine|approval-engine)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
  });
});
