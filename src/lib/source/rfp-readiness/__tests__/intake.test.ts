// PR-3/4/5 proof: every missing input has a concrete completion path; Nexus produces
// targeted prioritized questions; capture becomes governed (user_attested) context and
// never auto-agent_ready; recompute reflects captured client decisions.
import { SOURCE_INTAKE_TEMPLATES, getIntakeTemplate } from '../intake-template-registry';
import { buildNexusIntakeQueue } from '../nexus-intake-queue';
import { buildGovernedIntakeRecord, buildUploadManifestEntry, applyCaptureToContext } from '../intake-capture';
import { AMS_RFP_SECTIONS, buildAmsRfpReadiness } from '../ams-section-map';
import type { SectionResolutionContext } from '../types';

const defs = Object.fromEntries(AMS_RFP_SECTIONS.map((d) => [d.id, d]));
const sky: SectionResolutionContext = {
  agentReadyFamilies: new Set(['application_inventory', 'run_cost_baseline', 'sla_baseline', 'contract_baseline', 'staffing_baseline', 'service_tower_scope', 'incident_problem_change']),
  capturedInputs: new Set(), reviewsSignedOff: new Set(),
};

describe('PR-3 intake template registry', () => {
  it('maps key AMS families to governed-loader dimensions + record types + affected sections', () => {
    const t = getIntakeTemplate('ticket_volumes')!;
    expect(t.targetContextDimension).toBe('incidents_ops_telemetry');
    expect(t.affectedRfpSections).toContain('current_state');
    expect(getIntakeTemplate('sla_baseline')!.targetContextDimension).toBe('service_levels');
    expect(getIntakeTemplate('application_inventory')!.targetRecordType).toBe('cmdb_application');
    for (const t2 of SOURCE_INTAKE_TEMPLATES) {
      expect(t2.acceptedFileTypes.length).toBeGreaterThan(0);
      expect(t2.requiredColumns.length).toBeGreaterThan(0);
    }
  });
});

describe('PR-4 Nexus intake queue', () => {
  const { sections } = buildAmsRfpReadiness(sky);
  const queue = buildNexusIntakeQueue({ readiness: sections, definitions: defs });
  it('produces targeted, specific questions for the SkyHarbor gaps', () => {
    expect(queue.length).toBeGreaterThan(0);
    const tv = queue.find((q) => q.evidenceFamily === 'ticket_volumes');
    expect(tv).toBeTruthy();
    expect(tv!.questionText).toMatch(/defensible|provide|export/i);
    expect(tv!.questionText).not.toMatch(/please provide more information/i);
    expect(tv!.whyItMatters).toBeTruthy();
    expect(tv!.canUploadFile).toBe(true);
    expect(tv!.downloadableTemplate).toBe('ams_itsm_volume_template');
    expect(tv!.acceptedUploadTypes).toContain('csv');
  });
  it('every item offers completion options + owner + impact', () => {
    for (const q of queue) {
      expect(q.questionText.length).toBeGreaterThan(20);
      expect(q.ownerRoleSuggestion).toBeTruthy();
      expect(q.impactIfMissing).toBeTruthy();
      expect(typeof q.canMarkClientComplete).toBe('boolean');
    }
  });
  it('is prioritized (ascending priority)', () => {
    const p = queue.map((q) => q.priority);
    expect(p).toEqual([...p].sort((a, b) => a - b));
  });
});

describe('PR-5 intake capture → governed context', () => {
  const base = { tenantId: 't', clientKey: 'skyharbor-air', sourceEventId: 'evt', intakeBatchId: 'b1' };
  it('chat answer becomes user_attested governed context, NOT agent_ready', () => {
    const rec = buildGovernedIntakeRecord({ ...base, rfpSectionId: 'procurement_instructions', inputKey: 'procurement_timeline', method: 'chat_answer', value: 'due 2026-09-15' });
    expect(rec.source_basis).toBe('user_attested');
    expect(rec.promotion_status).toBe('captured'); // never agent_ready (type-enforced)
    expect(rec.lifecycle_state).toBe('active');
  });
  it('upload is promotion_candidate (never agent_ready) and yields a loader manifest entry', () => {
    const req = { ...base, rfpSectionId: 'current_state', evidenceFamily: 'ticket_volumes', inputKey: 'ticket_volumes', method: 'file_upload' as const, fileName: 'sn_export.csv' };
    const rec = buildGovernedIntakeRecord(req);
    expect(rec.promotion_status).toBe('promotion_candidate');
    const man = buildUploadManifestEntry(req)!;
    expect(man.templateId).toBe('ams_itsm_volume_template');
    expect(man.targetContextDimension).toBe('incidents_ops_telemetry');
  });
  it('applying capture lifts client-decision inputs but uploads stay pending promotion (not agent_ready)', () => {
    const chat = buildGovernedIntakeRecord({ ...base, rfpSectionId: 'procurement_instructions', inputKey: 'procurement_timeline', method: 'chat_answer', value: 'x' });
    const upload = buildGovernedIntakeRecord({ ...base, rfpSectionId: 'current_state', evidenceFamily: 'ticket_volumes', inputKey: 'ticket_volumes', method: 'file_upload', fileName: 'f.csv' });
    const { ctx, pendingPromotion } = applyCaptureToContext(sky, [chat, upload]);
    expect(ctx.capturedInputs.has('procurement_timeline')).toBe(true);
    expect(ctx.agentReadyFamilies.has('ticket_volumes')).toBe(false); // NOT agent_ready from upload
    expect(pendingPromotion).toContain('ticket_volumes');
  });
  it('client-complete decisions needing authorization stay uncaptured until authorized', () => {
    const weights = buildGovernedIntakeRecord({ ...base, rfpSectionId: 'evaluation_criteria', inputKey: 'evaluation_weights', method: 'chat_answer', value: '30/30/...' });
    const { ctx } = applyCaptureToContext(sky, [weights], { clientCompleteKeysNeedingAuth: new Set(['evaluation_weights']) });
    expect(ctx.capturedInputs.has('evaluation_weights')).toBe(false);
  });
});
