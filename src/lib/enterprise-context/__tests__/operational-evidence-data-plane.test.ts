import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  buildOperationalEvidenceDataPlanePlan,
  getOperationalEvidenceTableTargets,
  summarizeOperationalDataPlanePlan,
} from '../operational-evidence-data-plane';
import { generateSyntheticOperationalEvidencePack } from '../operational-evidence-template-library';

const migrationSql = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260624120000_operational_evidence_data_plane.sql'),
  'utf8',
);

describe('operational evidence Azure data plane', () => {
  it('adds typed operational tables, indexes, and RLS policies in the migration', () => {
    for (const table of Object.values(getOperationalEvidenceTableTargets()).filter((table) => table !== 'enterprise_context_chunks')) {
      expect(migrationSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      expect(migrationSql).toContain(table);
    }

    expect(migrationSql).toContain('operational_work_items');
    expect(migrationSql).toContain('operational_events');
    expect(migrationSql).toContain('operational_automation_opportunities');
    expect(migrationSql).toContain('operational_value_estimates');
    expect(migrationSql).toContain('move_evidence_slot_coverage');
    expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_operational_work_items_app');
    expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_operational_work_items_evidence_refs');
    expect(migrationSql).toContain('ALTER TABLE %I ENABLE ROW LEVEL SECURITY');
    expect(migrationSql).toContain('can_read_tenant_by_key(tenant_key)');
    expect(migrationSql).toContain('can_write_tenant_by_key(tenant_key)');
  });

  it('builds a full staged-to-retrievable plan from the 8 minimum evidence templates', () => {
    const pack = generateSyntheticOperationalEvidencePack({
      tenantId: 'morganstreet',
      useCaseName: 'Advisor Operations AI Opportunity Discovery',
      generatedAt: '2026-06-24T12:00:00.000Z',
    });

    const plan = buildOperationalEvidenceDataPlanePlan({ pack, moveId: '00000000-0000-4000-8000-000000000001' });

    expect(plan.loadRun.statesCompleted).toEqual([
      'registered',
      'uploaded',
      'staged',
      'parsed',
      'reviewed',
      'committed',
      'indexed',
      'retrieval_proven',
    ]);
    expect(plan.proof).toEqual({
      sourceRegistered: true,
      filesStagedWithHashes: true,
      templatesValidated: true,
      sensitivityReviewed: true,
      normalizedTypedRows: true,
      relationshipsCreated: true,
      movesProjectionCreated: true,
      sanitizedSearchChunksCreated: true,
      retrievalReady: true,
    });
    expect(plan.fileManifests).toHaveLength(8);
    expect(plan.fileManifests.every((file) => file.blobUri.includes('private.blob.local'))).toBe(true);
    expect(plan.fileManifests.every((file) => file.fileHash.length === 64)).toBe(true);
  });

  it('normalizes evidence into typed entities instead of generic JSON only', () => {
    const plan = buildOperationalEvidenceDataPlanePlan({
      pack: generateSyntheticOperationalEvidencePack({ tenantId: 'morganstreet' }),
    });

    expect(plan.normalized.workItems.length).toBeGreaterThan(0);
    expect(plan.normalized.events.length).toBeGreaterThan(0);
    expect(plan.normalized.processObservations.length).toBeGreaterThan(0);
    expect(plan.normalized.systemServiceMaps.length).toBeGreaterThan(0);
    expect(plan.normalized.automationOpportunities.length).toBeGreaterThan(0);
    expect(plan.normalized.humanAgentResponsibilities.length).toBe(plan.normalized.automationOpportunities.length);
    expect(plan.normalized.valueEstimates.length).toBeGreaterThan(0);

    expect(plan.normalized.workItems[0]).toMatchObject({
      tenantId: 'morganstreet',
      sourceId: 'src-morganstreet-operational-evidence',
      sourceRef: expect.objectContaining({
        rawPayloadStored: false,
        redactionApplied: true,
      }),
    });
  });

  it('creates traceability from source evidence to opportunities, values, Moves slots, and search chunks', () => {
    const plan = buildOperationalEvidenceDataPlanePlan({
      pack: generateSyntheticOperationalEvidencePack({ tenantId: 'morganstreet' }),
    });

    expect(plan.relationships.map((relationship) => relationship.relationshipType)).toEqual(
      expect.arrayContaining(['affects', 'corroborates', 'supported_by', 'estimates_value_for']),
    );
    expect(plan.moveEvidenceSlotCoverage.map((slot) => slot.slotId)).toEqual(
      expect.arrayContaining([
        'p2_operational_current_state',
        'p3_operational_automation_opportunities',
        'p4_operational_value_estimate',
      ]),
    );
    expect(plan.moveEvidenceItems.map((item) => item.slotIds).flat()).toEqual(
      expect.arrayContaining(['p3_operational_automation_opportunities']),
    );
    expect(plan.searchChunks.length).toBeGreaterThan(0);
    expect(plan.searchChunks.every((chunk) => chunk.indexName === 'enterprise-context-azure-search')).toBe(true);
  });

  it('labels synthetic evidence and requires finance validation for benchmark rate estimates', () => {
    const plan = buildOperationalEvidenceDataPlanePlan({
      pack: generateSyntheticOperationalEvidencePack({ tenantId: 'morganstreet' }),
    });

    expect(plan.syntheticLabel).toContain('Synthetic demo evidence');
    expect(plan.reviewItems.map((item) => item.reason)).toEqual(
      expect.arrayContaining(['synthetic_demo_label', 'finance_validation']),
    );
    expect(plan.moveEvidenceSlotCoverage.find((slot) => slot.slotId === 'p4_operational_value_estimate')?.caveats.join(' ')).toContain(
      'Finance/client rate validation required',
    );
    expect(plan.searchChunks.map((chunk) => chunk.sanitizedSummary).join(' ')).not.toMatch(/password|token|secret/i);
  });

  it('summarizes proof without collapsing file, DB, projection, and retrieval states', () => {
    const plan = buildOperationalEvidenceDataPlanePlan({
      pack: generateSyntheticOperationalEvidencePack({ tenantId: 'morganstreet' }),
    });
    const summary = summarizeOperationalDataPlanePlan(plan);

    expect(summary).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Source registered'),
        expect.stringContaining('Files staged'),
        expect.stringContaining('Typed rows'),
        expect.stringContaining('Relationships'),
        expect.stringContaining('Moves slots'),
        expect.stringContaining('Search chunks'),
      ]),
    );
  });
});
