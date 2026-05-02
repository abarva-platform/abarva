import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceCommercialDemoScenario,
  buildSourceStageGateReadiness,
  getSourceArtifactStatusStripSeed,
  getSourceEventSeed,
} from '@/lib/source';

describe('Source stage gate + artifact smoke coverage', () => {
  it('keeps stage-gate and artifact strip deterministic for seeded events', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const readiness = buildSourceStageGateReadiness({ event: event! });
    const artifactStrip = getSourceArtifactStatusStripSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);

    expect(readiness.generatedAt).toBe('2026-04-26T00:00:00.000Z');
    expect(artifactStrip.eventId).toBe(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(readiness.gates).toHaveLength(11);
    expect(artifactStrip.artifacts).toHaveLength(10);
  });

  it('renders stage gate and artifact sections together in event canvas shell', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Stage gate readiness');
    expect(html).toContain('Current gate signal');
    expect(html).toContain('Gate transition table');
    expect(html).toContain('Artifacts and deliverables');
    expect(html).toContain('Deterministic artifact status strip');
    expect(html).toContain('Value Ledger Assumptions');
  });

  it('keeps Apex commercial demo scenario enriched and deterministic', () => {
    const scenario = buildSourceCommercialDemoScenario();

    expect(scenario.scenarioId).toBe('apex-retail-ams-outsourcing-2026');
    expect(scenario.stageGates.length).toBeGreaterThanOrEqual(5);
    expect(scenario.artifactMetadata.length).toBe(10);
    expect(scenario.reviewApprovalStates.length).toBeGreaterThanOrEqual(3);
    expect(scenario.executiveDecisionPosture.posture).toBe('proceed_to_bafo');
  });

  it('keeps stage/artifact/demo files free from model/upload/parsing imports', () => {
    const sources = [
      'src/lib/source/source-stage-gates.ts',
      'src/components/source/SourceStageGatePanel.tsx',
      'src/components/source/SourceArtifactStatusStrip.tsx',
      'src/lib/source/source-commercial-demo-scenario.ts',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|workflow-engine|approval-engine)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(database|supabase|migrations)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
  });
});
