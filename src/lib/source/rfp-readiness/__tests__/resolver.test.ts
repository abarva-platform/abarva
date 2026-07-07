// PR-1 proof: the 4-mode resolver enforces the hard rules.
import { resolveSectionReadiness, buildReadinessScorecard } from '../resolver';
import type { RfpSectionDefinition, SectionResolutionContext } from '../types';

function def(over: Partial<RfpSectionDefinition> = {}): RfpSectionDefinition {
  return {
    id: 's', sectionNumber: 1, title: 'Section', description: '', archetype: 'AMS_MANAGED_SERVICES',
    defaultMode: 'auto_governed', disclosureTier: 'vendor_facing',
    requiredInputs: [], optionalInputs: [], evidenceFamilies: [],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: false,
    outputArtifactTypes: ['docx'], ...over,
  };
}
function ctx(over: Partial<SectionResolutionContext> = {}): SectionResolutionContext {
  return { agentReadyFamilies: new Set(), capturedInputs: new Set(), reviewsSignedOff: new Set(), ...over };
}

describe('resolveSectionReadiness — AUTO-GOVERNED gating (hard rule)', () => {
  it('resolves AUTO-GOVERNED + issue_ready only when all required evidence is agent_ready', () => {
    const d = def({ defaultMode: 'auto_governed', evidenceFamilies: ['sla_baseline'],
      requiredInputs: [{ key: 'sla_baseline', label: 'SLA baseline', evidenceFamily: 'sla_baseline' }],
      citationRequired: true });
    const r = resolveSectionReadiness(d, ctx({ agentReadyFamilies: new Set(['sla_baseline']), citationsByFamily: { sla_baseline: ['ev:sla#1'] } }));
    expect(r.mode).toBe('auto_governed');
    expect(r.readinessStatus).toBe('issue_ready');
    expect(r.completenessScore).toBe(1);
    expect(r.citedSources).toContain('ev:sla#1');
    expect(r.issueReady).toBe(true);
  });

  it('NEVER stays AUTO-GOVERNED when required evidence is missing — drops to ELICIT/evidence_missing', () => {
    const d = def({ defaultMode: 'auto_governed', evidenceFamilies: ['ticket_volumes'],
      requiredInputs: [{ key: 'ticket_volumes', label: 'Ticket volumes', evidenceFamily: 'ticket_volumes' }] });
    const r = resolveSectionReadiness(d, ctx()); // nothing agent_ready
    expect(r.mode).not.toBe('auto_governed');
    expect(r.mode).toBe('elicit');
    expect(['evidence_missing', 'blocked']).toContain(r.readinessStatus);
    expect(r.issueReady).toBe(false);
    expect(r.missingInputs).toContain('ticket_volumes');
  });

  it('drops to CLIENT-COMPLETE when the missing input is client judgment and client-complete is allowed', () => {
    const d = def({ defaultMode: 'auto_governed', clientCompleteAllowed: true,
      requiredInputs: [{ key: 'evaluation_weights', label: 'Evaluation weights', clientDecision: true }] });
    const r = resolveSectionReadiness(d, ctx());
    expect(r.mode).toBe('client_complete');
    expect(r.readinessStatus).toBe('client_to_complete');
    expect(r.clientToCompleteItems).toContain('Evaluation weights');
  });

  it('a pending required review overrides issue_ready', () => {
    const d = def({ defaultMode: 'auto_governed', legalReviewRequired: true });
    const r = resolveSectionReadiness(d, ctx());
    expect(r.readinessStatus).toBe('legal_review_required');
    expect(r.reviewsRequired).toContain('legal');
    expect(r.issueReady).toBe(false);
  });
});

describe('resolveSectionReadiness — other modes', () => {
  it('AUTO-TEMPLATE resolves to preliminary boilerplate (no client facts)', () => {
    const r = resolveSectionReadiness(def({ defaultMode: 'auto_template' }), ctx());
    expect(r.mode).toBe('auto_template');
    expect(r.readinessStatus).toBe('preliminary');
  });

  it('AUTO-TEMPLATE with legal review required surfaces legal_review_required', () => {
    const r = resolveSectionReadiness(def({ defaultMode: 'auto_template', legalReviewRequired: true }), ctx());
    expect(r.readinessStatus).toBe('legal_review_required');
  });

  it('ELICIT default with missing evidence is evidence_missing; with preliminary opt-in becomes a labelled draft', () => {
    const d = def({ defaultMode: 'elicit', evidenceFamilies: ['transition_constraints'], preliminaryDraftAllowed: true,
      requiredInputs: [{ key: 'transition_constraints', label: 'Transition constraints', evidenceFamily: 'transition_constraints' }] });
    expect(resolveSectionReadiness(d, ctx()).readinessStatus).toBe('evidence_missing');
    const prelim = resolveSectionReadiness(d, ctx({ allowPreliminary: true }));
    expect(prelim.readinessStatus).toBe('preliminary');
    expect(prelim.preliminaryOnly).toBe(true);
    expect(prelim.assumptions.join(' ')).toMatch(/transition_constraints/);
  });

  it('ELICIT section whose evidence has since arrived becomes AUTO-GOVERNED', () => {
    const d = def({ defaultMode: 'elicit', evidenceFamilies: ['staffing_baseline'],
      requiredInputs: [{ key: 'staffing_baseline', label: 'Staffing baseline', evidenceFamily: 'staffing_baseline' }] });
    const r = resolveSectionReadiness(d, ctx({ agentReadyFamilies: new Set(['staffing_baseline']) }));
    expect(r.mode).toBe('auto_governed');
    expect(r.readinessStatus).toBe('issue_ready');
  });

  it('CLIENT-COMPLETE with legal review surfaces legal_review_required', () => {
    const d = def({ defaultMode: 'client_complete', legalReviewRequired: true, clientCompleteAllowed: true,
      requiredInputs: [{ key: 'liability_cap', label: 'Liability cap', clientDecision: true }] });
    expect(resolveSectionReadiness(d, ctx()).readinessStatus).toBe('legal_review_required');
  });

  it('captured client answers satisfy inputs and lift readiness', () => {
    const d = def({ defaultMode: 'elicit',
      requiredInputs: [{ key: 'procurement_timeline', label: 'Timeline', clientDecision: true }],
      evidenceFamilies: [] });
    const r = resolveSectionReadiness(d, ctx({ capturedInputs: new Set(['procurement_timeline']) }));
    expect(r.presentInputs).toContain('procurement_timeline');
    expect(r.completenessScore).toBe(1);
  });
});

describe('readiness scorecard', () => {
  it('rolls section readinesses into a package scorecard', () => {
    const ready = resolveSectionReadiness(def({ id: 'a', defaultMode: 'auto_template' }), ctx());
    const missing = resolveSectionReadiness(def({ id: 'b', defaultMode: 'auto_governed', evidenceFamilies: ['x'],
      requiredInputs: [{ key: 'x', label: 'X', evidenceFamily: 'x' }] }), ctx());
    const sc = buildReadinessScorecard([ready, missing]);
    expect(sc.total).toBe(2);
    expect(sc.preliminary).toBe(1);
    expect(sc.evidence_missing + sc.blocked).toBe(1);
    expect(sc.overallReadinessPct).toBeGreaterThanOrEqual(0);
  });
});
