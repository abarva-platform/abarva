// PR-7/8 proof: generation honors readiness (only AUTO-GOVERNED asserts client facts),
// and every section generation emits a SourceRfpContextBundleTrace.
import { buildSectionGenerationDecision, buildSourceRfpSectionTrace, isCleanSectionTrace } from '../section-trace';
import { resolveSectionReadiness } from '../resolver';
import { getAmsSection } from '../ams-section-map';
import type { SectionResolutionContext } from '../types';

const ctxWith = (fams: string[], captured: string[] = []): SectionResolutionContext => ({
  agentReadyFamilies: new Set(fams), capturedInputs: new Set(captured), reviewsSignedOff: new Set(),
  citationsByFamily: { sla_baseline: ['ev:sla#1'], application_inventory: ['ev:app#1'], service_tower_scope: ['ev:tower#1'] },
});
const decide = (id: string, ctx: SectionResolutionContext) => {
  const def = getAmsSection(id)!; const r = resolveSectionReadiness(def, ctx);
  return { def, r, d: buildSectionGenerationDecision(def, r) };
};

describe('PR-7 generation decision honors readiness (hard rule)', () => {
  it('AUTO-GOVERNED → governed_facts, model allowed, only governed families', () => {
    const { d } = decide('service_towers', ctxWith(['service_tower_scope', 'application_inventory']));
    expect(d.modelCallKind).toBe('governed_facts');
    expect(d.modelCallAllowed).toBe(true);
    expect(d.allowedEvidenceFamilies).toEqual(expect.arrayContaining(['service_tower_scope', 'application_inventory']));
  });
  it('AUTO-TEMPLATE → boilerplate_only, no evidence families', () => {
    const { d } = decide('vendor_response_instructions', ctxWith([]));
    expect(d.modelCallKind).toBe('boilerplate_only');
    expect(d.allowedEvidenceFamilies).toEqual([]);
    expect(d.generationDirective).toMatch(/no client-specific facts/i);
  });
  it('ELICIT (no evidence, no preliminary) → model NOT allowed (intake only)', () => {
    const { d } = decide('transition', ctxWith([])); // transition_constraints missing
    expect(d.modelCallAllowed).toBe(false);
    expect(d.modelCallKind).toBe('none');
    expect(d.generationDirective).toMatch(/NEXUS INTAKE/);
  });
  it('ELICIT with preliminary opt-in → placeholder_only labelled draft', () => {
    const ctx = ctxWith([]); ctx.allowPreliminary = true;
    const { d } = decide('transition', ctx);
    expect(d.modelCallKind).toBe('placeholder_only');
    expect(d.generationDirective).toMatch(/PRELIMINARY/);
  });
  it('CLIENT-COMPLETE → placeholder_only, never invents policy', () => {
    const { d } = decide('security_compliance', ctxWith([]));
    expect(d.modelCallKind).toBe('placeholder_only');
    expect(d.generationDirective).toMatch(/CLIENT TO COMPLETE/);
  });
});

describe('PR-8 SourceRfpContextBundleTrace', () => {
  const mk = (id: string, ctx: SectionResolutionContext, extra = {}) => {
    const { def, r, d } = decide(id, ctx);
    return buildSourceRfpSectionTrace({ sourceEventId: 'evt', tenantId: 't', tenantKey: 'skyharbor-air', archetype: 'AMS_MANAGED_SERVICES', def, readiness: r, decision: d, ...extra });
  };
  it('emits a full trace with model_call gate + readiness mirror', () => {
    const t = mk('sla_kpi', ctxWith(['sla_baseline']));
    expect(t.trace_id).toBe('rfptr-evt-sla_kpi');
    expect(t.section_mode).toBe('auto_governed');
    expect(t.model_call_allowed).toBe(true);
    expect(t.citations_emitted).toContain('ev:sla#1');
    expect(t.tenant_leakage_status).toBe('clean');
  });
  it('flags unsupported claims on a governed section', () => {
    const t = mk('sla_kpi', ctxWith(['sla_baseline']), { draftClaims: [
      { text: 'Mainframe at 99.9%', citation: 'ev:sla#1' }, { text: 'We will save 30%' } ] });
    expect(t.claims_unsupported).toBe(1);
    expect(isCleanSectionTrace(t)).toBe(false);
  });
  it('detects cross-tenant leakage', () => {
    const t = mk('service_towers', ctxWith(['service_tower_scope', 'application_inventory']), { crossTenantHits: 1 });
    expect(t.tenant_leakage_status).toBe('leak_detected');
    expect(isCleanSectionTrace(t)).toBe(false);
  });
  it('a clean governed section with backed claims passes', () => {
    const t = mk('service_towers', ctxWith(['service_tower_scope', 'application_inventory']), { draftClaims: [{ text: '12 towers', citation: 'ev:tower#1' }] });
    expect(isCleanSectionTrace(t)).toBe(true);
  });
});
