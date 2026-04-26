import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceExecutiveDecisionSummary,
  formatSourceExecutiveDecisionSummaryAsMarkdown,
  getSourceEventSeed,
  getSourceExecutiveDecisionBlockers,
  getSourceExecutiveDecisionOptions,
} from '@/lib/source';

describe('Source executive decision summary model', () => {
  function getSeededEvent() {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeTruthy();
    return event as NonNullable<typeof event>;
  }

  it('builds deterministic executive decision summary for seeded event', () => {
    const event = getSeededEvent();
    const summary = buildSourceExecutiveDecisionSummary({ event });

    expect(summary.eventId).toBe(event.id);
    expect(summary.decisionNeeded.length).toBeGreaterThan(0);
    expect(summary.recommendedDecisionPosture).toMatch(
      /ready_for_selection_review|proceed_to_bafo|defer_pending_clarifications|blocked_missing_pricing|blocked_low_evidence|waiver_required/,
    );
    expect(summary.recommendedDecisionPosture).not.toBe('ready_for_selection_review');
    expect(summary.vendorTradeoffs.length).toBe(3);
    expect(summary.viableVendors.length).toBeGreaterThan(0);
    expect(summary.atlasExecutiveBrief.length).toBeGreaterThan(0);
  });

  it('includes vendor tradeoffs and known seeded blockers', () => {
    const event = getSeededEvent();
    const summary = buildSourceExecutiveDecisionSummary({ event });
    const vendorB = summary.vendorTradeoffs.find((vendor) => vendor.vendorId === 'vendor-b');
    const vendorC = summary.vendorTradeoffs.find((vendor) => vendor.vendorId === 'vendor-c');

    expect(vendorB).toBeTruthy();
    expect(vendorB?.blockers.join(' ').toLowerCase()).toMatch(/pricing template/);
    expect(summary.blockers.join(' ').toLowerCase()).toMatch(/pricing template/);

    expect(vendorC).toBeTruthy();
    expect(vendorC?.evidenceConfidence).toBe('low');
    expect(summary.sentinelCautions.join(' ').toLowerCase()).toMatch(/aegis digital|evidence/);
  });

  it('returns deterministic decision options and blocker helpers', () => {
    const event = getSeededEvent();
    const summary = buildSourceExecutiveDecisionSummary({ event });

    expect(getSourceExecutiveDecisionOptions(summary).length).toBeGreaterThan(0);
    expect(getSourceExecutiveDecisionBlockers(summary)).toEqual(summary.blockers);
  });

  it('keeps deterministic posture gated while seeded blockers remain', () => {
    const event = getSeededEvent();
    const summary = buildSourceExecutiveDecisionSummary({ event });
    const blockers = getSourceExecutiveDecisionBlockers(summary);

    expect(blockers.length).toBeGreaterThan(0);
    expect(summary.recommendedDecisionPosture).toMatch(
      /proceed_to_bafo|defer_pending_clarifications|blocked_missing_pricing|blocked_low_evidence|waiver_required/,
    );
  });

  it('formats markdown output for executive decision summary', () => {
    const event = getSeededEvent();
    const summary = buildSourceExecutiveDecisionSummary({ event });
    const markdown = formatSourceExecutiveDecisionSummaryAsMarkdown(summary);

    expect(markdown).toContain('# Source Executive Decision Summary');
    expect(markdown).toContain('Decision posture:');
    expect(markdown).toContain('Vendor tradeoffs');
    expect(markdown).toContain('Atlas executive brief');
  });

  it('keeps executive summary model dependency-free', () => {
    const sources = [
      'src/lib/source/executive-decision-summary.ts',
      'src/lib/source/executive-decision-types.ts',
      'src/lib/source/bafo-negotiation.ts',
      'src/lib/source/pricing-normalization.ts',
      'src/lib/source/vendor-response-completeness.ts',
      'src/lib/source/mock-seed.ts',
      'src/lib/source/index.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|scorecard-ui)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
  });
});
