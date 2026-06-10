// Evidence-readiness proof: the promotion-only ladder is enforced. Committed
// data is NOT agent-usable; only governed promotion to agent_ready unlocks an
// evidence family. Missing hard evidence blocks the stage gate explicitly.

import { AMS_MANAGED_SERVICES } from '../registry';
import {
  agentUsableFamilies,
  buildSourceEvidenceReadiness,
  stageGateClear,
} from '../evidence-readiness';

describe('Source evidence-readiness — promotion-only ladder', () => {
  it('treats committed/indexed/retrievable as NOT agent-usable', () => {
    const r = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {
      run_cost_baseline: 'committed',
      ticket_volumes: 'indexed',
      sla_baseline: 'retrievable',
      service_tower_scope: 'citation_ready',
    });
    // none of these reached agent_ready, so none are agent-usable
    expect(agentUsableFamilies(r)).toEqual([]);
    expect(r.agentReady).toEqual([]);
    // but they ARE recognized as committed-not-promoted (data exists)
    expect(r.committedNotPromoted).toEqual(
      expect.arrayContaining(['run_cost_baseline', 'ticket_volumes', 'sla_baseline', 'service_tower_scope']),
    );
    expect(r.overall).toBe('not_ready');
  });

  it('only governed promotion to agent_ready unlocks a family', () => {
    const r = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {
      run_cost_baseline: 'agent_ready',
      service_tower_scope: 'agent_ready',
    });
    expect(agentUsableFamilies(r)).toEqual(
      expect.arrayContaining(['run_cost_baseline', 'service_tower_scope']),
    );
    expect(r.overall).toBe('partial'); // some but not all required families ready
  });

  it('defaults unlisted families to missing and lists missing required', () => {
    const r = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {});
    expect(r.missingRequired).toContain('ticket_volumes');
    expect(r.missingRequired).toContain('run_cost_baseline');
    expect(r.families.find((f) => f.family === 'ticket_volumes')?.state).toBe('missing');
  });
});

describe('Source evidence-readiness — stage gates never silent', () => {
  it('blocks the AMS scope gate with explicit reasons when hard evidence is not agent_ready', () => {
    const r = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {
      application_inventory: 'agent_ready',
      ticket_volumes: 'committed', // committed but not promoted
      // sla_baseline + staffing_baseline missing
    });
    const gate = stageGateClear(r, 'scope');
    expect(gate.clear).toBe(false);
    const blockedFamilies = gate.blockers.map((b) => b.family);
    expect(blockedFamilies).toContain('ticket_volumes'); // committed != ready
    expect(blockedFamilies).toContain('sla_baseline'); // missing
    expect(blockedFamilies).not.toContain('application_inventory'); // agent_ready clears
    // each blocker carries a human reason
    const ticket = gate.blockers.find((b) => b.family === 'ticket_volumes');
    expect(ticket?.reason).toMatch(/not yet indexed|committed/i);
  });

  it('clears a stage gate only when ALL hard families are agent_ready', () => {
    const r = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, {
      application_inventory: 'agent_ready',
      ticket_volumes: 'agent_ready',
      sla_baseline: 'agent_ready',
      staffing_baseline: 'agent_ready',
    });
    const gate = stageGateClear(r, 'scope');
    expect(gate.clear).toBe(true);
    expect(gate.blockers).toEqual([]);
  });

  it('reports overall ready only when every required family is agent_ready', () => {
    const allReady: Record<string, 'agent_ready'> = {};
    for (const f of AMS_MANAGED_SERVICES.requiredEvidenceFamilies) allReady[f.key] = 'agent_ready';
    const r = buildSourceEvidenceReadiness(AMS_MANAGED_SERVICES, allReady);
    expect(r.overall).toBe('ready');
    expect(r.committedNotPromoted).toEqual([]);
  });
});
