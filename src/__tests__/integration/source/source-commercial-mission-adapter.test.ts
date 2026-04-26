import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  adaptCommercialMissionsToSourceAgentMissions,
  buildCommercialMissionQueue,
  buildSourceCommercialSignals,
  buildSourceCommercialAgentMissions,
  buildSourceExecutiveDecisionSummary,
  formatSourceCommercialAgentMissionsAsMarkdown,
  summarizeSourceCommercialAgentMissions,
} from '@/lib/source';

describe('Source commercial mission adapter', () => {
  function buildSeededResult() {
    return buildSourceCommercialAgentMissions({
      queueInput: {
        eventId: 'event-commercial-adapter',
        eventName: 'Commercial Adapter Validation Event',
        stage: 'selection',
        vendorIds: ['vendor-a', 'vendor-b', 'vendor-c'],
        needsPriceBenchmark: true,
        needsScopeClarification: true,
        needsEvidenceCollection: true,
        needsGovernanceReview: true,
        isBafoPhase: true,
      },
    });
  }

  it('adapts commercial missions into canonical Source agent missions deterministically', () => {
    const first = buildSeededResult();
    const second = buildSeededResult();

    expect(first).toEqual(second);
    expect(first.sourceQueueCount).toBeGreaterThan(0);
    expect(first.adaptedMissions.length).toBeGreaterThan(0);
    expect(first.adaptedMissions.every((mission) => mission.missionId.startsWith('commercial-'))).toBe(true);
    expect(first.adaptedMissions.every((mission) => mission.sourceEventId === 'event-commercial-adapter')).toBe(true);
  });

  it('preserves canonical mission fields and owner mappings', () => {
    const result = buildSeededResult();
    const allowedAgents = new Set(['nexus', 'sentinel', 'atlas', 'steward']);
    const allowedPriorities = new Set(['critical', 'high', 'medium', 'low']);
    const allowedStates = new Set(['proposed', 'active', 'waiting', 'blocked', 'completed', 'dismissed', 'escalated', 'deferred']);

    for (const mission of result.adaptedMissions) {
      expect(allowedAgents.has(mission.agentName)).toBe(true);
      expect(allowedPriorities.has(mission.priority)).toBe(true);
      expect(allowedStates.has(mission.state)).toBe(true);
      expect(typeof mission.trigger).toBe('string');
      expect(mission.contextUsed.length).toBeGreaterThan(0);
      expect(mission.suggestedActions.length).toBeGreaterThan(0);
    }
  });

  it('suppresses duplicates when canonical missions already cover the same issue', () => {
    const queue = buildCommercialMissionQueue({
      eventId: 'event-commercial-adapter',
      eventName: 'Commercial Adapter Validation Event',
      stage: 'selection',
      vendorIds: ['vendor-a'],
      needsPriceBenchmark: true,
      needsScopeClarification: false,
      needsEvidenceCollection: false,
      needsGovernanceReview: false,
      isBafoPhase: false,
    });

    const duplicated = adaptCommercialMissionsToSourceAgentMissions({
      commercialQueue: queue,
      existingMissions: [{
        missionId: 'existing-price-benchmark',
        agentName: 'atlas',
        missionType: 'value_risk',
        title: 'Run pricing benchmark analysis',
        summary: 'Benchmark all vendor quotes against market median and peer data.',
        priority: 'high',
        state: 'active',
        trigger: 'value_at_stake_detected',
        sourceEventId: 'event-commercial-adapter',
        stageId: 'selection',
        relatedArtifactId: undefined,
        evidenceStatus: 'lowConfidence',
        blockerReason: undefined,
        recommendedAction: 'Use benchmark data to close commercial assumptions.',
        suggestedActions: [],
        handoffTarget: undefined,
        contextUsed: [{
          eventStateUsed: true,
          patternPackUsed: undefined,
          patternSectionsUsed: [],
          artifactsUsed: [],
          uploadedFilesUsed: [],
          scorecardUsed: false,
          valueLedgerUsed: false,
          citationsUsed: [],
          deterministicFieldsUsed: ['commercialMission:price_benchmark'],
          modelAssistedFieldsUsed: [],
          evidenceGatedFieldsUsed: [],
          missingContext: [],
        }],
        createdAt: '2026-04-26T00:00:00.000Z',
      }],
    });

    expect(duplicated.sourceQueueCount).toBe(1);
    expect(duplicated.duplicateSuppressedCount).toBe(1);
    expect(duplicated.adaptedMissions).toHaveLength(0);
  });

  it('summarizes and formats adapter output as markdown', () => {
    const result = buildSeededResult();
    const summary = summarizeSourceCommercialAgentMissions(result);
    const markdown = formatSourceCommercialAgentMissionsAsMarkdown({ result });

    expect(summary.summary).toContain('Commercial mission adapter');
    expect(markdown).toContain('# Source Commercial Mission Adapter');
    expect(markdown).toContain('## By agent');
    expect(markdown).toContain('## By priority');
    expect(markdown).toContain('## Missions');
  });

  it('feeds adapted missions into executive decision summary without bypassing canonical contracts', () => {
    const result = buildSeededResult();
    const signals = buildSourceCommercialSignals({
      event: {
        id: 'event-commercial-adapter',
        name: 'Commercial Adapter Validation Event',
        currentStageKey: 'selection',
      },
    });
    const summary = buildSourceExecutiveDecisionSummary({
      event: {
        id: 'event-commercial-adapter',
        name: 'Commercial Adapter Validation Event',
        currentStageKey: 'selection',
      },
      commercialSignals: signals,
      unifiedMissions: result.adaptedMissions,
    });

    expect(summary.sourceModulesUsed).toEqual(['commercial-signals', 'commercial-mission-adapter']);
    expect(summary.missionSummary.total).toBeGreaterThan(0);
    expect(summary.recommendedDecisionPosture).not.toBe('ready_for_selection_review');
  });

  it('keeps adapter implementation free of model calls, UI imports, and persistence wiring', () => {
    const sources = [
      'src/lib/source/commercial-mission-adapter.ts',
      'src/lib/source/commercial-mission-adapter-types.ts',
      'src/lib/source/commercial-mission-queue.ts',
      'src/lib/source/agent-missions.ts',
      'src/lib/source/index.ts',
      'src/__tests__/integration/source/source-commercial-mission-adapter.test.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(\/components\/|react|next\/)/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|workflow-engine|scheduler|database|supabase)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
  });
});
