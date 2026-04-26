import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceBafoNegotiationPlan,
  formatSourceBafoNegotiationAsMarkdown,
  getSourceNegotiationBlockers,
  getSourceBafoPriorities,
  getSourceEventSeed,
} from '@/lib/source';

describe('Source BAFO negotiation model', () => {
  function getSeededEvent() {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeTruthy();
    return event as NonNullable<typeof event>;
  }

  it('builds seeded negotiation plans for all vendors', () => {
    const event = getSeededEvent();
    const plan = buildSourceBafoNegotiationPlan({ event });

    expect(plan.vendorNegotiationPlans.length).toBe(3);
    expect(plan.vendorNegotiationPlans.map((vendor) => vendor.vendorName)).toEqual(
      expect.arrayContaining([
        'Vertex CloudOps',
        'Nova Partner Group',
        'Aegis Digital',
      ]),
    );
    expect(plan.overallNegotiationReadiness).toMatch(/ready|partially_ready|not_ready|blocked/);
    expect(plan.blockers.length).toBeGreaterThan(0);
    expect(getSourceNegotiationBlockers(plan).length).toBe(plan.blockers.length);
  });

  it('marks vendor with missing pricing template as not comparable and adds BAFO blockers', () => {
    const event = getSeededEvent();
    const plan = buildSourceBafoNegotiationPlan({ event });
    const vendorB = plan.vendorNegotiationPlans.find((vendor) => vendor.vendorId === 'vendor-b');

    expect(vendorB).toBeTruthy();
    expect(vendorB?.readiness).toBe('not_comparable');
    expect(vendorB?.negotiationQuestions.some((question) => (
      question.question.toLowerCase().includes('pricing template')
    ))).toBe(true);
    expect(vendorB?.recommendedAsks.some((ask) => (
      ask.toLowerCase().includes('pricing template')
    ))).toBe(true);
    expect(vendorB?.blockers.join(' ')).toMatch(/pricing template/i);
  });

  it('adds Vendor A exclusion lock clarifications and Vendor C automation evidence follow-up', () => {
    const event = getSeededEvent();
    const plan = buildSourceBafoNegotiationPlan({ event });
    const vendorA = plan.vendorNegotiationPlans.find((vendor) => vendor.vendorId === 'vendor-a');
    const vendorC = plan.vendorNegotiationPlans.find((vendor) => vendor.vendorId === 'vendor-c');

    expect(vendorA).toBeTruthy();
    expect(vendorA?.negotiationQuestions.some((question) => (
      question.question.toLowerCase().includes('exclusion')
      && question.question.toLowerCase().includes('release')
    ))).toBe(true);
    expect(vendorA?.requiredClarifications.length).toBeGreaterThan(0);

    expect(vendorC).toBeTruthy();
    expect(vendorC?.negotiationQuestions.some((question) => (
      question.question.toLowerCase().includes('automation')
      || question.question.toLowerCase().includes('evidence')
    ))).toBe(true);
  });

  it('returns non-empty executive tradeoff and top action priorities', () => {
    const event = getSeededEvent();
    const plan = buildSourceBafoNegotiationPlan({ event });

    expect(plan.executiveTradeoffSummary.length).toBeGreaterThan(0);
    expect(plan.recommendedBafoPriorities.length).toBeGreaterThan(0);
    expect(getSourceBafoPriorities(plan)).toEqual(expect.arrayContaining([expect.any(String)]));
  });

  it('renders markdown output with vendor-level negotiation rows', () => {
    const event = getSeededEvent();
    const plan = buildSourceBafoNegotiationPlan({ event });
    const markdown = formatSourceBafoNegotiationAsMarkdown(plan);

    expect(markdown).toContain('# Source BAFO Negotiation');
    expect(markdown).toContain('Vendor Negotiation Plans');
    expect(markdown).toContain('Vertex CloudOps');
    expect(markdown).toContain('Nova Partner Group');
    expect(markdown).toContain('Aegis Digital');
    expect(markdown).toContain('Top blockers');
  });

  it('returns deterministic blockers and dependency-free read-model behavior', () => {
    const sources = [
      'src/lib/source/bafo-negotiation.ts',
      'src/lib/source/bafo-negotiation-types.ts',
      'src/lib/source/index.ts',
      'src/lib/source/vendor-response-completeness.ts',
      'src/lib/source/pricing-normalization.ts',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    const lines = sources.split('\n');
    const bannedImportTokens = [
      'openai',
      'anthropic',
      'api/v1',
      'artifact-drawer',
      'scorecard-ui',
      'parser',
      'upload',
      'createConnector',
      'createDataset',
      'fetch(',
      'fetch (' ,
    ];

    for (const line of lines) {
      if (!line.startsWith('import ')) continue;
      for (const token of bannedImportTokens) {
        expect(line).not.toContain(token);
      }
    }

    expect(sources).not.toMatch(/fetch\(/i);
    expect(sources).not.toMatch(/createDataset|uploadFile|from 'openai'|from "openai"|from 'anthropic'|from "anthropic"/i);
  });
});
