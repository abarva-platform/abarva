// PR-2 proof: the AMS RFP section map resolves correctly against SkyHarbor's real
// coverage — issue-ready where evidence is agent_ready, ELICIT where it's missing,
// CLIENT-COMPLETE / review-required where it's judgment/policy. No silent weak sections.
import { AMS_RFP_SECTIONS, buildAmsRfpReadiness, getAmsSection } from '../ams-section-map';
import type { SectionResolutionContext } from '../types';

// SkyHarbor v2 promoted families (from the live data plane): apps, run-cost, sla,
// contract, staffing, tower-scope, incidents — NOT ticket_volumes / transition / retained-org / tooling.
const skyharbor: SectionResolutionContext = {
  agentReadyFamilies: new Set([
    'application_inventory', 'run_cost_baseline', 'sla_baseline', 'contract_baseline',
    'staffing_baseline', 'service_tower_scope', 'incident_problem_change',
  ]),
  capturedInputs: new Set(),
  reviewsSignedOff: new Set(),
  citationsByFamily: { sla_baseline: ['ev:sla#1'], application_inventory: ['ev:app#1'] },
};

describe('AMS RFP section map', () => {
  it('defines the full 16-section AMS package with unique ordered numbers', () => {
    expect(AMS_RFP_SECTIONS).toHaveLength(16);
    const nums = AMS_RFP_SECTIONS.map((s) => s.sectionNumber);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(AMS_RFP_SECTIONS.map((s) => s.id)).size).toBe(16);
  });

  it('every section declares mode, disclosure tier, and output artifacts', () => {
    for (const s of AMS_RFP_SECTIONS) {
      expect(['auto_governed', 'auto_template', 'elicit', 'client_complete']).toContain(s.defaultMode);
      expect(['vendor_facing', 'internal_only', 'aggregate_only']).toContain(s.disclosureTier);
      expect(s.outputArtifactTypes.length).toBeGreaterThan(0);
    }
  });

  it('source register is internal_only (never vendor-facing)', () => {
    expect(getAmsSection('source_register')!.disclosureTier).toBe('internal_only');
  });
});

describe('buildAmsRfpReadiness — SkyHarbor real coverage', () => {
  const { sections, scorecard } = buildAmsRfpReadiness(skyharbor);
  const byId = Object.fromEntries(sections.map((s) => [s.sectionId, s]));

  it('resolves all 16 sections with explicit labels (no silent weak sections)', () => {
    expect(sections).toHaveLength(16);
    for (const s of sections) expect(s.readinessStatus).toBeTruthy();
  });

  it('issue-ready where evidence is agent_ready (towers, SLA, service requirements)', () => {
    expect(byId.service_towers.mode).toBe('auto_governed');
    expect(byId.service_towers.readinessStatus).toBe('issue_ready');
    expect(byId.sla_kpi.readinessStatus).toBe('issue_ready');
    expect(byId.sla_kpi.citedSources).toContain('ev:sla#1');
    expect(byId.service_requirements.readinessStatus).toBe('issue_ready');
  });

  it('ELICIT where required evidence is missing (current-state needs ticket volumes; transition; retained-org)', () => {
    expect(byId.current_state.mode).toBe('elicit'); // ticket_volumes missing
    expect(byId.current_state.missingInputs).toContain('ticket_volumes');
    expect(byId.transition.mode).toBe('elicit');
    expect(byId.governance_retained_org.mode).toBe('elicit');
  });

  it('CLIENT-COMPLETE / review for judgment & legal sections', () => {
    expect(byId.security_compliance.readinessStatus).toBe('client_to_complete');
    expect(byId.contracting_terms.readinessStatus).toBe('legal_review_required');
    expect(byId.procurement_instructions.readinessStatus).toBe('procurement_review_required');
    expect(byId.pricing_commercial.readinessStatus).toBe('pricing_review_required');
  });

  it('NO section with missing required evidence is AUTO-GOVERNED (hard rule across the pack)', () => {
    for (const s of sections) {
      if (s.mode === 'auto_governed') expect(s.missingInputs).toHaveLength(0);
    }
  });

  it('scorecard reflects a partial, honest readiness posture', () => {
    expect(scorecard.total).toBe(16);
    expect(scorecard.issue_ready).toBeGreaterThanOrEqual(3);
    expect(scorecard.evidence_missing + scorecard.client_to_complete + scorecard.legal_review_required + scorecard.procurement_review_required + scorecard.pricing_review_required).toBeGreaterThan(0);
    expect(scorecard.overallReadinessPct).toBeGreaterThan(0);
    expect(scorecard.overallReadinessPct).toBeLessThan(100);
  });
});
