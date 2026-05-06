import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SOURCE_GOLDEN_EVENT_IDS, SOURCE_STAGE_LABELS, buildSourceBafoNegotiationPlan, getSourcingEvent } from '@/lib/source';
import { SentinelEngagementCanvas } from '@/components/source/SentinelEngagementCanvas';
import { SourceBafoNegotiationPanel } from '@/components/source/SourceBafoNegotiationPanel';
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

describe('Source BAFO negotiation panel', () => {
  it('renders deterministic plan details for seeded vendors', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const plan = buildSourceBafoNegotiationPlan({ event: event! });

    const html = renderToStaticMarkup(createElement(SourceBafoNegotiationPanel, { plan }));

    expect(html).toContain('BAFO negotiation');
    expect(html).toContain('Event negotiation readiness');
    expect(html).toContain('Vendor BAFO questions');
    expect(html).toContain('Top BAFO priorities');
    expect(html).toContain('Commercial traps');
    expect(html).toContain('Vertex CloudOps');
    expect(html).toContain('Nova Partner Group');
    expect(html).toContain('Aegis Digital');
  });

  it('renders BAFO panel in the event canvas for orals/BAFO stage', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const event = buildOralsBafoEvent(sourceEvent!);

    const html = renderToStaticMarkup(createElement(SentinelEngagementCanvas, { event }));

    expect(html).toContain('BAFO negotiation');
    expect(html).toContain('Event negotiation readiness');
    expect(html).toContain('Overall negotiation readiness');
    expect(html).toContain('Vertex CloudOps');
    expect(html).toContain('Overall negotiation readiness');
  });

  it('keeps BAFO implementation files dependency-free', async () => {
    const sourceEvent = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const plan = buildSourceBafoNegotiationPlan({ event: sourceEvent! });
    renderToStaticMarkup(createElement(SourceBafoNegotiationPanel, { plan }));

    const sources = [
      'src/components/source/SourceBafoNegotiationPanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/lib/source/bafo-negotiation.ts',
      'src/lib/source/bafo-negotiation-types.ts',
      'src/lib/source/vendor-response-completeness.ts',
      'src/lib/source/pricing-normalization.ts',
      'src/lib/source/mock-seed.ts',
    ].map((path) => readFileSync(join(process.cwd(), path), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|scorecard-ui)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
    expect(sources).not.toMatch(/app\/api/);
  });
});
