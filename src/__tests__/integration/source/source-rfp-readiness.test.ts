import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceRfpReadiness,
  buildSourceRfpSectionReadiness,
  formatSourceRfpReadinessAsMarkdown,
  getSourceRfpReadinessBlockers,
  getSourceRfpReadinessNextActions,
} from '@/lib/source';
import type { SourceEvidenceUsability } from '@/lib/source/types';
import { getSourceEventSeed } from '@/lib/source/mock-seed';

describe('Source RFP readiness read model', () => {
  const baseEvent = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) as NonNullable<
    ReturnType<typeof getSourceEventSeed>
  >;
  const amsEvent = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.amsConsolidation) as NonNullable<
    ReturnType<typeof getSourceEventSeed>
  >;

  function cloneEventWithCategory(
    event: NonNullable<ReturnType<typeof getSourceEventSeed>>,
    updates: Record<string, {
      evidenceUsability: SourceEvidenceUsability;
      confidence?: 'high' | 'medium' | 'low';
      readinessState?: string;
      workflowImpact?: string;
    }>,
  ) {
    return {
      ...event,
      artifacts: event.artifacts.map((artifact) => ({ ...artifact })),
      stages: event.stages.map((stage) => ({ ...stage, gate: { ...stage.gate } })),
      dataReadiness: event.dataReadiness.map((row) => {
        const patch = updates[row.category];
        if (!patch) return { ...row };
        return {
          ...row,
          evidenceUsability: patch.evidenceUsability,
          confidence: patch.confidence ?? row.confidence,
          readinessState: patch.readinessState ?? row.readinessState,
          workflowImpact: patch.workflowImpact ?? row.workflowImpact,
        };
      }) as typeof event.dataReadiness,
    };
  }

  it('is not Rich when recommended inputs are missing', () => {
    const event = cloneEventWithCategory(baseEvent, {
      'Application Inventory': { evidenceUsability: 'usable', readinessState: 'Usable Evidence', confidence: 'high' },
      'Workload Baseline': { evidenceUsability: 'usable', readinessState: 'Usable Evidence', confidence: 'high' },
      'Vendor Spend': { evidenceUsability: 'usable', readinessState: 'Usable Evidence', confidence: 'high' },
      'Security / Compliance Requirements': { evidenceUsability: 'usable', readinessState: 'Usable Evidence', confidence: 'high' },
      'Retained Roles': { evidenceUsability: 'usable', readinessState: 'Usable Evidence', confidence: 'high' },
      'Ticket History': { evidenceUsability: 'not_available', readinessState: 'Missing', confidence: 'low' },
      'SLA Baseline': { evidenceUsability: 'not_available', readinessState: 'Missing', confidence: 'low' },
    });
    event.stages = event.stages.map((stage) => (
      stage.key === 'scope'
        ? { ...stage, status: 'active', gate: { ...stage.gate, status: 'approved', blocker: null } }
        : stage
    ));

    const readiness = buildSourceRfpReadiness({ event });
    expect(readiness.overallTier).toBe('Outline');
    expect(readiness.overallTier).not.toBe('Rich');
    expect(readiness.requiredInputsComplete).toBe(true);
    expect(readiness.readinessScore).toBeLessThan(100);
    expect(readiness.recommendedNextAction).toMatch(/Produce|Collect/);
  });

  it('flags seeded required missing inputs and blockers', () => {
    expect(baseEvent).toBeTruthy();
    const readiness = buildSourceRfpReadiness({ event: baseEvent });

    const requiredMissing = readiness.missingInputs.filter((item) => item.severity === 'required');
    expect(requiredMissing.length).toBeGreaterThan(0);
    expect(requiredMissing.map((item) => item.category)).toEqual(expect.arrayContaining([
      'Workload Baseline',
      'Retained Roles',
    ]));
    expect(readiness.blockers).toEqual(expect.arrayContaining([
      expect.stringContaining('Required: Workload Baseline'),
      expect.stringContaining('Artifact pending'),
    ]));
    expect(readiness.overallTier).not.toBe('Rich');
    expect(readiness.requiredArtifacts[0]?.name).toBe('Scope Document');
    expect(readiness.blockers.length).toBeGreaterThanOrEqual(1);
  });

  it('maps loaded/usable signal into pricing readiness and action readiness', () => {
    const event = cloneEventWithCategory(baseEvent, {
      'Ticket History': { evidenceUsability: 'loaded_not_usable', readinessState: 'Loaded', confidence: 'medium' },
      'SLA Baseline': { evidenceUsability: 'available_not_validated', readinessState: 'Available', confidence: 'medium' },
      'Workload Baseline': { evidenceUsability: 'usable', readinessState: 'Usable Evidence', confidence: 'high' },
      'Vendor Spend': { evidenceUsability: 'not_available', readinessState: 'Missing', confidence: 'low' },
    });
    const sections = buildSourceRfpSectionReadiness(event);
    const pricingSection = sections.find((section) => section.id === 'pricing-instructions');
    expect(pricingSection).toBeDefined();
    expect(pricingSection?.status).toBe('partial');
    expect(pricingSection?.requiredInputsMissing).toContain('Vendor Spend');
    expect(pricingSection?.readyForSection).toBe(false);
    expect(pricingSection?.notes.length).toBeGreaterThan(0);
  });

  it('returns a valid markdown snapshot', () => {
    const readiness = buildSourceRfpReadiness({ event: amsEvent });
    const markdown = formatSourceRfpReadinessAsMarkdown(readiness);

    expect(markdown).toContain('# Source RFP Readiness');
    expect(markdown).toContain(readiness.eventId);
    expect(markdown).toContain(readiness.overallTier);
    expect(markdown).toContain('Required artifacts');
    expect(markdown).toContain('Top blockers');
  });

  it('returns top blockers and next actions from readiness projection', () => {
    const readiness = buildSourceRfpReadiness({ event: baseEvent });
    const blockers = getSourceRfpReadinessBlockers(readiness);
    const nextActions = getSourceRfpReadinessNextActions(readiness);

    expect(blockers).toEqual(expect.arrayContaining([
      expect.stringContaining('Workload Baseline'),
    ]));
    expect(nextActions).toEqual(expect.arrayContaining([
      expect.any(String),
    ]));
    expect(nextActions).toHaveLength(3);
  });

  it('keeps the read model deterministic and dependency-free', () => {
    const sources = [
      'src/lib/source/rfp-readiness.ts',
      'src/lib/source/rfp-readiness-types.ts',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');
    const lines = sources.split('\n');
    const bannedImportTokens = [
      'openai',
      'anthropic',
      'api/v1',
      'app/api',
      'artifact-drawer',
      'scorecard-ui',
      'parser',
      'upload',
    ];

    for (const line of lines) {
      if (!line.startsWith('import ')) continue;
      for (const token of bannedImportTokens) {
        expect(line).not.toContain(token);
      }
    }

    expect(sources).not.toMatch(/fetch\(/i);
    expect(sources).not.toMatch(/createConnector|createDataset|uploadFile/i);
  });
});
