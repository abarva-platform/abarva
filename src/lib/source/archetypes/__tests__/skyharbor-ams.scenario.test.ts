// Phase 7 — end-to-end proof: the whole Source spine composes into one honest,
// grounded, event-specific sourcing decision for a SkyHarbor AMS event.

import { runSkyHarborAmsScenario, SKYHARBOR_TENANT } from '../scenarios/skyharbor-ams';

describe('SkyHarbor AMS — end-to-end scenario proof', () => {
  const r = runSkyHarborAmsScenario();

  it('classifies the event to the AMS archetype (no hardcoded branching)', () => {
    expect(r.archetypeId).toBe('AMS_MANAGED_SERVICES');
  });

  it('is event-specific and tenant-resolved, with derived (not hardcoded) confidence', () => {
    expect(r.envelope.tenantResolved).toBe(SKYHARBOR_TENANT);
    expect(r.envelope.archetypeResolved).toBe('AMS_MANAGED_SERVICES');
    expect(r.envelope.specific).toBe(true);
    // partial evidence → not 'high', not 'insufficient'
    expect(['medium', 'low']).toContain(r.envelope.confidence);
  });

  it('shows missing evidence honestly (never silent)', () => {
    expect(r.missingRequired).toEqual(
      expect.arrayContaining(['transition_constraints', 'retained_org_model']),
    );
    expect(r.envelope.missingEvidence.length).toBeGreaterThan(0);
  });

  it('blocks RFP sections whose evidence is not agent-ready, not fabricates them', () => {
    // contract_baseline is only 'retrievable' (not promoted) → commercial_terms blocked
    expect(r.rfpBlockedSections).toContain('commercial_terms');
    expect(r.rfpBlockedSections).toContain('transition');
  });

  it('produces cited should-cost and a normalized TCO winner', () => {
    expect(r.shouldCostTotal).toBe(8_200_000);
    // NorthOps headline is higher but it included transition; SkyManage excluded it
    // → after add-back NorthOps is the true low bidder
    expect(r.tcoBestVendor).toBe('NorthOps');
  });

  it('sequences the negotiation plan starting pre-RFP', () => {
    expect(r.negotiationFirstMove).toBeTruthy();
  });

  it('fences cross-tenant evidence and carries zero unsupported claims', () => {
    expect(r.envelope.citations.every((c) => !c.includes('apex'))).toBe(true);
    expect(r.envelope.evidenceUsed).toContain('run_cost_baseline');
    expect(r.envelope.unsupportedClaims).toEqual([]);
    expect(r.mayAnswer).toBe(true);
  });

  it('renders a complete decision narrative', () => {
    expect(r.narrativeMarkdown).toMatch(/AMS Sourcing Event/);
    expect(r.narrativeMarkdown).toMatch(/Grounded executive recommendation/);
    expect(r.narrativeMarkdown).toMatch(/EVIDENCE BLOCKED/);
  });
});
