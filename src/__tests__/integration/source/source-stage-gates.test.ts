import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSourceStageGateReadiness, formatSourceStageGateReadinessAsMarkdown, getSourceEventSeed, SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source';

describe('Source stage gate readiness model', () => {
  it('builds deterministic stage gate readiness for seeded source event', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(event).toBeTruthy();

    const first = buildSourceStageGateReadiness({ event: event! });
    const second = buildSourceStageGateReadiness({ event: event! });

    expect(first.eventId).toBe(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(first.generatedAt).toBe('2026-04-26T00:00:00.000Z');
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('covers all required source gate transitions with valid states', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const readiness = buildSourceStageGateReadiness({ event: event! });
    const validStates = ['ready', 'blocked', 'waiting', 'needs_approval', 'waiver_required', 'deferred'];

    expect(readiness.gates.map((gate) => gate.transitionLabel)).toEqual([
      'Strategy -> Scope',
      'Scope -> RFP',
      'RFP -> Responses',
      'Responses -> Evaluation',
      'Evaluation -> Pricing',
      'Pricing -> BAFO',
      'BAFO -> Executive Decision',
      'Executive Decision -> Selection',
      'Selection -> Transition',
      'Transition -> Value',
      'Value -> Closed',
    ]);

    for (const gate of readiness.gates) {
      expect(validStates).toContain(gate.state);
      expect(gate.requiredArtifacts.length).toBeGreaterThan(0);
      expect(gate.requiredApprovals.length).toBeGreaterThan(0);
    }
  });

  it('surfaces blockers and conservative next action when blocked transitions exist', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const readiness = buildSourceStageGateReadiness({ event: event! });

    expect(readiness.overallState).toBe('blocked');
    expect(readiness.blockers.length).toBeGreaterThan(0);
    expect(readiness.recommendedNextAction).toContain('Application inventory');
  });

  it('formats markdown summary with transition details', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.amsConsolidation);
    const readiness = buildSourceStageGateReadiness({ event: event! });
    const markdown = formatSourceStageGateReadinessAsMarkdown(readiness);

    expect(markdown).toContain('# Source Stage Gate Readiness');
    expect(markdown).toContain('## Gate transitions');
    expect(markdown).toContain('Strategy -> Scope');
    expect(markdown).toContain('Value -> Closed');
  });

  it('keeps stage-gate model files free from model/upload/parsing imports', () => {
    const sources = [
      'src/lib/source/source-stage-gates.ts',
      'src/lib/source/source-stage-gate-types.ts',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|ai\/react|@anthropic-ai\/sdk)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|artifact-drawer|workflow-engine|approval-engine)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(database|supabase|migrations)['"]/i);
  });
});
