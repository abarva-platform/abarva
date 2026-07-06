// Differentiation proof: the SAME Source spine serves materially different event
// types, each requiring DIFFERENT evidence, RFP structure, pricing, evaluation,
// and negotiation levers — with ZERO Source core code change. Adding an
// archetype is a registry edit, not an engine edit. This is the framework's
// reason to exist.

import {
  AI_DATA_PLATFORM,
  AMS_MANAGED_SERVICES,
  CONTRACT_RENEWAL,
  ERP_SI_IMPLEMENTATION,
  archetypeForEventType,
  getSourceArchetype,
  listSourceArchetypes,
} from '../registry';
import {
  evidenceReadiness,
  requiredEvidenceFamilies,
  resolveSourceStageRequirements,
} from '../resolver';
import { SOURCING_METHODS } from '../method-library';

const ALL = listSourceArchetypes();

describe('Source Event Archetype Framework — registry integrity', () => {
  it('registers the shipped archetypes', () => {
    expect(ALL.map((a) => a.id).sort()).toEqual(
      ['AI_DATA_PLATFORM', 'AMS_MANAGED_SERVICES', 'CLOUD_FINOPS', 'CONTRACT_RENEWAL', 'ERP_SI_IMPLEMENTATION'],
    );
  });

  it('resolves an archetype by id and by event type without core branching', () => {
    expect(getSourceArchetype('AMS_MANAGED_SERVICES')).toBe(AMS_MANAGED_SERVICES);
    expect(archetypeForEventType('data_platform')).toBe(AI_DATA_PLATFORM);
    expect(getSourceArchetype('nope')).toBeUndefined();
  });

  it('every required evidence family declares why it is needed and an accepted format', () => {
    for (const a of ALL) {
      for (const fam of a.requiredEvidenceFamilies) {
        expect(fam.whyNeeded.length).toBeGreaterThan(10);
        expect(fam.acceptedFormats.length).toBeGreaterThan(0);
      }
    }
  });

  it('every analysis method referenced by a stage exists in the method library', () => {
    for (const a of ALL) {
      for (const stage of a.stageModel) {
        for (const m of stage.analysisMethods) {
          expect(SOURCING_METHODS[m]).toBeDefined();
        }
      }
    }
  });

  it('every evaluation model has criteria weights that sum to ~1', () => {
    for (const a of ALL) {
      const sum = a.evaluationModel.criteria.reduce((s, c) => s + c.weight, 0);
      expect(sum).toBeGreaterThan(0.98);
      expect(sum).toBeLessThan(1.02);
    }
  });

  it('every agent guidance demands a grounded answer', () => {
    for (const a of ALL) {
      expect(a.agentGuidance.requiresGroundedAnswer).toBe(true);
      expect(a.agentGuidance.systemFraming).toMatch(/missing evidence/i);
    }
  });
});

describe('Source Event Archetype Framework — DIFFERENT DNA per event type', () => {
  it('AMS and ERP require materially different evidence', () => {
    const ams = new Set(requiredEvidenceFamilies(AMS_MANAGED_SERVICES));
    const erp = new Set(requiredEvidenceFamilies(ERP_SI_IMPLEMENTATION));
    // AMS-only families
    expect(ams.has('ticket_volumes')).toBe(true);
    expect(erp.has('ticket_volumes')).toBe(false);
    // ERP-only families
    expect(erp.has('data_migration_scope')).toBe(true);
    expect(ams.has('data_migration_scope')).toBe(false);
  });

  it('AI platform and renewal require materially different evidence', () => {
    const ai = new Set(requiredEvidenceFamilies(AI_DATA_PLATFORM));
    const renew = new Set(requiredEvidenceFamilies(CONTRACT_RENEWAL));
    expect(ai.has('governance_maturity')).toBe(true);
    expect(renew.has('governance_maturity')).toBe(false);
    expect(renew.has('switching_cost')).toBe(true);
    expect(ai.has('switching_cost')).toBe(false);
  });

  it('each archetype has a distinct pricing model', () => {
    const models = ALL.map((a) => a.pricingModel.model);
    expect(new Set(models).size).toBe(models.length);
    // AMS expects a bottom-up should-cost; ERP/SI does not.
    expect(AMS_MANAGED_SERVICES.pricingModel.shouldCost).toBe(true);
    expect(ERP_SI_IMPLEMENTATION.pricingModel.shouldCost).toBe(false);
  });

  it('each archetype has a distinct RFP structure (not one generic flow)', () => {
    const amsSections = AMS_MANAGED_SERVICES.rfpDocumentStructure.map((s) => s.key);
    const erpSections = ERP_SI_IMPLEMENTATION.rfpDocumentStructure.map((s) => s.key);
    expect(amsSections).toContain('service_towers');
    expect(amsSections).toContain('resource_units');
    expect(erpSections).toContain('data_migration');
    expect(erpSections).not.toContain('resource_units');
    // renewal is an internal negotiation pack, not a vendor RFP
    expect(CONTRACT_RENEWAL.rfpDocumentStructure.map((s) => s.key)).toContain('walk_away');
  });

  it('each archetype has distinct negotiation levers', () => {
    const amsLevers = AMS_MANAGED_SERVICES.negotiationLevers.map((l) => l.key);
    const renewLevers = CONTRACT_RENEWAL.negotiationLevers.map((l) => l.key);
    expect(amsLevers).toContain('productivity_glidepath');
    expect(renewLevers).toContain('renewal_timing');
    expect(renewLevers).not.toContain('productivity_glidepath');
  });
});

describe('Source Event Archetype Framework — resolver: evidence + estate axis', () => {
  it('surfaces missing hard evidence explicitly (never silent)', () => {
    const res = resolveSourceStageRequirements(AMS_MANAGED_SERVICES, 'scope', {
      committedFamilies: ['application_inventory'],
    });
    // application_inventory committed; the other hard families remain missing
    expect(res.missingEvidence).toContain('ticket_volumes');
    expect(res.missingEvidence).toContain('sla_baseline');
    expect(res.missingEvidence).not.toContain('application_inventory');
  });

  it('prunes heavy soft requirements for small deals but keeps hard ones', () => {
    const enterprise = resolveSourceStageRequirements(AMS_MANAGED_SERVICES, 'rfp', { spendBand: 'enterprise' });
    const small = resolveSourceStageRequirements(AMS_MANAGED_SERVICES, 'rfp', { spendBand: 'small' });
    const eFams = enterprise.requiredEvidence.map((r) => r.family);
    const sFams = small.requiredEvidence.map((r) => r.family);
    expect(eFams).toContain('transition_constraints'); // soft + heavy
    expect(sFams).not.toContain('transition_constraints');
    expect(sFams).toContain('service_tower_scope'); // hard stays
  });

  it('reports readiness as a required/committed/missing diff', () => {
    const r = evidenceReadiness(CONTRACT_RENEWAL, ['current_contract', 'spend_baseline']);
    expect(r.ready).toBe(false);
    expect(r.committed).toEqual(expect.arrayContaining(['current_contract', 'spend_baseline']));
    expect(r.missing).toContain('switching_cost');
  });

  it('resolves stage analysis methods from the archetype, not hardcoded', () => {
    const ams = resolveSourceStageRequirements(AMS_MANAGED_SERVICES, 'strategy');
    const erp = resolveSourceStageRequirements(ERP_SI_IMPLEMENTATION, 'strategy');
    expect(ams.analysisMethods).toContain('should_cost');
    expect(erp.analysisMethods).toContain('data_migration_complexity');
    expect(erp.analysisMethods).not.toContain('should_cost');
  });
});
