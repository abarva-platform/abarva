// RFP-canon proof: archetypes produce STRUCTURALLY different RFPs, and missing
// evidence flags sections as blocked rather than fabricating them.

import { AMS_MANAGED_SERVICES, ERP_SI_IMPLEMENTATION } from '../registry';
import { buildSourceEvidenceReadiness } from '../evidence-readiness';
import { buildArchetypeRfp, renderRfpMarkdown } from '../rfp-canon';
import { evaluateDeliverableQuality, getDeliverableSpec, gateDeliverables } from '../deliverable-canon';

describe('RFP canon — structurally different by event type', () => {
  it('AMS and ERP RFPs have different required sections', () => {
    const ams = buildArchetypeRfp(AMS_MANAGED_SERVICES).sections.map((s) => s.key);
    const erp = buildArchetypeRfp(ERP_SI_IMPLEMENTATION).sections.map((s) => s.key);
    expect(ams).toContain('service_towers');
    expect(ams).toContain('resource_units');
    expect(erp).toContain('data_migration');
    expect(erp).toContain('rollout_waves');
    expect(erp).not.toContain('resource_units');
    expect(ams).not.toContain('data_migration');
  });
});

describe('RFP canon — never fabricate missing evidence', () => {
  it('flags the resource-unit pricing section as evidence_blocked when ticket volumes are not agent_ready', () => {
    const readiness = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {
      service_tower_scope: 'agent_ready',
      application_inventory: 'agent_ready',
      ticket_volumes: 'committed', // present but not promoted
      staffing_baseline: 'committed',
    });
    const rfp = buildArchetypeRfp(AMS_MANAGED_SERVICES, readiness);
    const resourceUnits = rfp.sections.find((s) => s.key === 'resource_units');
    expect(resourceUnits?.status).toBe('evidence_blocked');
    expect(resourceUnits?.blockingEvidence).toContain('ticket_volumes');
    expect(resourceUnits?.note).toMatch(/do NOT fabricate/i);
    expect(rfp.complete).toBe(false);
    expect(rfp.blockedSections).toContain('resource_units');
  });

  it('marks a section ready when its evidence dependencies are agent_ready', () => {
    const readiness = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {
      service_tower_scope: 'agent_ready',
      application_inventory: 'agent_ready',
    });
    const rfp = buildArchetypeRfp(AMS_MANAGED_SERVICES, readiness);
    const towers = rfp.sections.find((s) => s.key === 'service_towers');
    expect(towers?.status).toBe('ready');
    expect(towers?.blockingEvidence).toEqual([]);
  });

  it('renders blocked sections honestly in markdown', () => {
    const readiness = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {});
    const md = renderRfpMarkdown(buildArchetypeRfp(AMS_MANAGED_SERVICES, readiness));
    expect(md).toMatch(/EVIDENCE BLOCKED/);
    expect(md).toMatch(/required section\(s\) blocked/);
  });
});

describe('Deliverable canon — quality bar enforcement', () => {
  it('fails a thin draft and one without required citations', () => {
    const spec = getDeliverableSpec(AMS_MANAGED_SERVICES, 'ams_strategy_memo')!;
    const result = evaluateDeliverableQuality(spec, {
      sections: { Objective: 'x' }, // far below minSections
      citations: [],
    });
    expect(result.pass).toBe(false);
    expect(result.failures.join(' ')).toMatch(/sections/);
    expect(result.failures.join(' ')).toMatch(/citations/);
  });

  it('fails a draft that carries unsupported claims', () => {
    const spec = getDeliverableSpec(AMS_MANAGED_SERVICES, 'ams_strategy_memo')!;
    const result = evaluateDeliverableQuality(spec, {
      sections: { a: 'x', b: 'x', c: 'x', d: 'x', e: 'x' },
      citations: ['ev:run_cost#1'],
      unsupportedClaims: ['40% savings'],
    });
    expect(result.pass).toBe(false);
    expect(result.failures.join(' ')).toMatch(/unsupported claim/i);
  });

  it('passes a complete, cited, grounded draft and returns the rubric to review', () => {
    const spec = getDeliverableSpec(AMS_MANAGED_SERVICES, 'ams_strategy_memo')!;
    const result = evaluateDeliverableQuality(spec, {
      sections: { a: 'x', b: 'x', c: 'x', d: 'x', e: 'x' },
      citations: ['ev:run_cost#1', 'ev:tower_scope#2'],
      unsupportedClaims: [],
    });
    expect(result.pass).toBe(true);
    expect(result.rubricToReview.length).toBeGreaterThan(0);
  });

  it('exposes the gate-artifact deliverables for an archetype', () => {
    const gates = gateDeliverables(AMS_MANAGED_SERVICES).map((d) => d.key);
    expect(gates).toContain('ams_strategy_memo');
    expect(gates).toContain('ams_rfp');
  });
});
