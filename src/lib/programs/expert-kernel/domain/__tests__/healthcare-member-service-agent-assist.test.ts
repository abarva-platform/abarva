// Healthcare Function Pack — Member-service Agent Assist.
//
// This suite asserts the Meridian / healthcare contact-center specialization
// is a first-class pack: reachable through the registry, deep enough for the
// §6 bar, grounded in healthcare member-service vocabulary, and explicit that
// DORA / CI-CD / SDLC evidence is not part of its P2 strategy spine.

import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
} from '../function-pack-types';
import {
  checkFunctionPackDepth,
  resolveFunctionPack,
} from '../function-pack-registry';
import { memberServiceAgentAssistPack } from '../healthcare/member-service-agent-assist';

describe('memberServiceAgentAssistPack — §6 depth bar', () => {
  const pack = memberServiceAgentAssistPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack('healthcare-provider', 'member_service_agent_assist'),
    ).toBe(pack);
  });

  it('passes the machine-checkable depth bar with no shortfalls', () => {
    const result = checkFunctionPackDepth(pack);
    expect(result.shortfalls).toEqual([]);
    expect(result.passes).toBe(true);
  });

  it('meets every §6 minimum layer count', () => {
    expect(pack.operatingMetrics.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.operatingMetrics,
    );
    expect(pack.painThemes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.painThemes,
    );
    expect(pack.aiUseCaseArchetypes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.aiUseCaseArchetypes,
    );
    expect(pack.referenceSolutionPatterns.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.referenceSolutionPatterns,
    );
    expect(pack.evidenceAnchors.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.evidenceAnchors,
    );
  });

  it('carries an outline for each of the four Moves phase artifacts', () => {
    const artifacts = pack.deliverableOutlines.map((o) => o.artifact).sort();
    expect(artifacts).toEqual([...REQUIRED_DELIVERABLE_ARTIFACTS].sort());
  });

  it('specifies the expected member-service Agent Assist archetypes', () => {
    const keys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(keys).toContain('real_time_agent_copilot');
    expect(keys).toContain('intent_and_transfer_intelligence');
    expect(keys).toContain('claim_auth_status_assist');
    expect(keys).toContain('after_call_summary_automation');
    expect(keys).toContain('knowledge_governance_workbench');
    expect(keys).toContain('contact_driver_closed_loop');
  });

  it('every archetype moves only metrics the pack actually defines', () => {
    const metricKeys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.metricsMoved.length).toBeGreaterThan(0);
      for (const moved of archetype.metricsMoved) {
        expect(metricKeys.has(moved)).toBe(true);
      }
    }
  });

  it('uses healthcare member-service vocabulary and controls', () => {
    const vocabulary = [
      pack.summary,
      ...pack.vocabulary.systemsOfRecord.map((s) => `${s.name} ${s.role}`),
      ...pack.vocabulary.regulatoryFrames.map((r) => `${r.name} ${r.relevance}`),
      ...pack.vocabulary.canonicalTerms.map((t) => `${t.term} ${t.definition}`),
    ]
      .join(' ')
      .toLowerCase();

    expect(vocabulary).toContain('claims');
    expect(vocabulary).toContain('benefits');
    expect(vocabulary).toContain('eligibility');
    expect(vocabulary).toContain('prior');
    expect(vocabulary).toContain('phi');
    expect(vocabulary).toContain('hipaa');
  });

  it('does not make engineering delivery metrics part of the strategy spine', () => {
    const strategyText = [
      pack.summary,
      ...pack.operatingMetrics.map((m) => `${m.key} ${m.name} ${m.definition}`),
      ...pack.painThemes.map((p) => `${p.name} ${p.description}`),
      ...pack.evidenceAnchors.map(
        (e) => `${e.claim} ${e.authoritativeSource}`,
      ),
    ]
      .join(' ')
      .toLowerCase();

    expect(strategyText).not.toContain('dora');
    expect(strategyText).not.toContain('ci/cd');
    expect(strategyText).not.toContain('sdlc');
  });

  it('keeps every benchmark as a labelled planning range', () => {
    for (const metric of pack.operatingMetrics) {
      expect(metric.benchmarkRange.label).toBe('planning-range');
      expect(metric.benchmarkRange.basis.trim().length).toBeGreaterThan(0);
    }
    for (const factor of pack.valueModel.dominantHaircutFactors) {
      expect(factor.typicalHaircut.label).toBe('planning-range');
      expect(factor.typicalHaircut.basis.trim().length).toBeGreaterThan(0);
    }
    for (const benchmark of pack.valueModel.valueBenchmarks) {
      expect(benchmark.range.label).toBe('planning-range');
      expect(benchmark.range.basis.trim().length).toBeGreaterThan(0);
    }
  });
});
