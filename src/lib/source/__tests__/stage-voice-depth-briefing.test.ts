/**
 * stage-voice-depth-briefing.test.ts
 *
 * Verifies that F-M4-103 is addressed: briefings built with stageKey='bafo'
 * must produce meaningfully different primaryFinding text than briefings
 * built with stageKey='strategy'. Tests cover Sentinel, Nexus, and Atlas.
 *
 * The Apex event seed is used because it contains the widest stage coverage
 * including 'intake' (→ strategy), 'orals_bafo' (→ bafo), 'evaluation', and
 * 'value_realization' (→ value). Legacy stage keys are normalized to canonical
 * stage keys inside the briefing builders via normalizeSourceStageKey.
 */
import {
  SOURCE_GOLDEN_EVENT_IDS,
} from '@/lib/source/constants';
import {
  buildSourceContextFromSeed,
} from '@/lib/source/context-builder';
import {
  buildSentinelBriefing,
  buildNexusBriefing,
  buildAtlasBriefing,
} from '../multi-agent-briefing';
import type { SourceAgentBriefingInput } from '../multi-agent-types';

const tenant = { tenantId: 'tenant-test', tenantName: 'Test Tenant' };
const user = { id: 'user-test', email: 'test@example.com' };
const generatedAt = '2026-05-06T00:00:00.000Z';

/**
 * Builds a complete SourceAgentBriefingInput using the Apex event with a
 * specific legacy stage key. The context builder accepts legacy stage keys
 * and normalizeSourceStageKey in the briefing functions handles the lookup.
 */
function buildInputForStage(
  legacyStageKey: 'intake' | 'orals_bafo' | 'evaluation' | 'value_realization',
): SourceAgentBriefingInput {
  const contextBundle = buildSourceContextFromSeed({
    tenant,
    user,
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: '/test',
    surface: 'nexusPanel',
    userPrompt: 'Test',
    eventId: SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
    stageKey: legacyStageKey,
    selectedAttachmentIds: [],
  });

  return { contextBundle, generatedAt };
}

// ── Sentinel primaryFinding differentiation ───────────────────────────────────

describe('buildSentinelBriefing — per-stage voice depth', () => {
  it('produces different primaryFinding for strategy vs bafo', () => {
    const strategyInput = buildInputForStage('intake');
    const bafoInput = buildInputForStage('orals_bafo');

    const strategyFinding = buildSentinelBriefing(strategyInput).primaryFinding;
    const bafoFinding = buildSentinelBriefing(bafoInput).primaryFinding;

    expect(strategyFinding).not.toBe(bafoFinding);
  });

  it('strategy sentinel finding references supplier landscape or make-vs-buy framing', () => {
    const input = buildInputForStage('intake');
    const finding = buildSentinelBriefing(input).primaryFinding;

    // sentinelFocus for 'strategy' (intake → strategy) mentions supplier landscape
    expect(finding.toLowerCase()).toMatch(/supplier landscape|make-vs-buy/);
  });

  it('bafo sentinel finding references concession or commercial differentiation', () => {
    const input = buildInputForStage('orals_bafo');
    const finding = buildSentinelBriefing(input).primaryFinding;

    // sentinelFocus for 'bafo' (orals_bafo → bafo) mentions concession / commercial
    expect(finding.toLowerCase()).toMatch(/concession|commercial/);
  });
});

// ── Nexus primaryFinding differentiation ─────────────────────────────────────

describe('buildNexusBriefing — per-stage voice depth', () => {
  it('produces different primaryFinding for strategy vs bafo', () => {
    const strategyInput = buildInputForStage('intake');
    const bafoInput = buildInputForStage('orals_bafo');

    const strategyFinding = buildNexusBriefing(strategyInput).primaryFinding;
    const bafoFinding = buildNexusBriefing(bafoInput).primaryFinding;

    expect(strategyFinding).toBeTruthy();
    expect(bafoFinding).toBeTruthy();
    expect(strategyFinding).not.toBe(bafoFinding);
  });

  it('evaluation nexus finding references scoring or comparative language', () => {
    const input = buildInputForStage('evaluation');
    const finding = buildNexusBriefing(input).primaryFinding;

    // nexusFocus for 'evaluation' mentions scoring / shortlist / evaluation
    expect(finding.toLowerCase()).toMatch(/scor|shortlist|evaluat/);
  });
});

// ── Atlas primaryFinding differentiation ─────────────────────────────────────

describe('buildAtlasBriefing — per-stage voice depth', () => {
  it('produces different primaryFinding for strategy vs value_realization', () => {
    const strategyInput = buildInputForStage('intake');
    const valueInput = buildInputForStage('value_realization');

    const strategyFinding = buildAtlasBriefing(strategyInput).primaryFinding;
    const valueFinding = buildAtlasBriefing(valueInput).primaryFinding;

    expect(strategyFinding).not.toBe(valueFinding);
  });

  it('value_realization atlas finding references roi measurement or benefit realization language', () => {
    const input = buildInputForStage('value_realization');
    const finding = buildAtlasBriefing(input).primaryFinding;

    // atlasFocus for 'value' (value_realization → value) mentions realized vs projected value
    expect(finding.toLowerCase()).toMatch(/roi|realized|benefit realization|value tracking/);
  });
});
