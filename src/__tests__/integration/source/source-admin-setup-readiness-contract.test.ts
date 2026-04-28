import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceDataReadinessProjectionFromAdminSetup,
  getSeededAdminSetupReadinessRecordsForSourceEvent,
  getSourceEventDataRequirements,
  mapAdminSetupReadinessToSourceItem,
  summarizeSourceDataReadinessProgress,
  type SourceAdminSetupReadinessRecord,
} from '@/lib/source';

describe('Admin/Setup to Source readiness contract', () => {
  const eventId = SOURCE_GOLDEN_EVENT_IDS.dataAiModernization;

  it('projects seeded Admin/Setup readiness into Source event readiness rows', () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId });

    expect(projection.eventId).toBe(eventId);
    expect(projection.generatedFrom).toBe('admin_setup_contract_seed');
    expect(projection.items).toHaveLength(8);
    expect(projection.items.map((item) => item.category)).toEqual([
      'Application Inventory',
      'Workload Baseline',
      'Ticket History',
      'Vendor Spend',
      'SLA Baseline',
      'Vendor Contracts',
      'Security / Compliance Requirements',
      'Retained Roles',
    ]);
  });

  it('surfaces missing required categories and Admin/Setup handoffs', () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId });
    const missingRequired = projection.items.filter((item) => (
      item.requirementLevel === 'required' && item.evidenceUsability === 'not_available'
    ));

    expect(missingRequired.map((item) => item.category)).toEqual([
      'Workload Baseline',
      'Retained Roles',
    ]);
    expect(projection.summary.missingRequiredItems).toBe(2);
    expect(projection.summary.blockers).toEqual(expect.arrayContaining([
      expect.stringContaining('Workload Baseline'),
      expect.stringContaining('Retained Roles'),
    ]));
    expect(missingRequired[0]?.stewardAdminHandoffLabel).toBe('Steward to data owner');
  });

  it('keeps loaded, available, and usable evidence distinct', () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId });
    const byCategory = new Map(projection.items.map((item) => [item.category, item]));

    expect(byCategory.get('Application Inventory')).toMatchObject({
      readinessState: 'Usable Evidence',
      evidenceUsability: 'usable',
      confidence: 'high',
    });
    expect(byCategory.get('Vendor Contracts')).toMatchObject({
      readinessState: 'Loaded',
      evidenceUsability: 'loaded_not_usable',
      confidence: 'medium',
    });
    expect(byCategory.get('Vendor Spend')).toMatchObject({
      readinessState: 'Available',
      evidenceUsability: 'available_not_validated',
      confidence: 'medium',
    });
  });

  it('calculates deterministic progress against 100 percent without claiming production readiness', () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId });

    expect(projection.summary.readinessPercent).toBe(34);
    expect(projection.summary.usableEvidencePercent).toBe(13);
    expect(projection.summary.progressLabel).toBe('34% toward event data readiness');
    expect(projection.summary.progressBasis).toContain('Seeded contract only');
    expect(projection.summary.progressBasis).toContain('not live monitoring');
  });

  it('preserves access-restricted and waived records instead of converting them to usable evidence', () => {
    const requirement = getSourceEventDataRequirements(eventId).find((item) => (
      item.categoryKey === 'vendor_contracts'
    ));
    expect(requirement).toBeDefined();

    const restrictedRecord: SourceAdminSetupReadinessRecord = {
      recordId: 'admin-source-readiness-vendor-contracts-restricted',
      tenantId: 'tenant-source-seed',
      datasetId: 'dataset-vendor-contracts',
      datasetDomain: 'contract_repository',
      categoryKey: 'vendor_contracts',
      categoryLabel: 'Vendor Contracts',
      readinessState: 'Access Restricted',
      evidenceUsability: 'restricted',
      ownerName: 'Legal / Procurement',
      ownerRole: 'Contract owner',
      sourceSystem: 'Contract repository',
      sourceType: 'repository',
      lastUpdated: '2026-04-25',
      confidence: 'low',
      accessState: 'restricted',
      freshnessStatus: 'current',
      provenance: 'Synthetic restricted record for contract test.',
    };
    const waivedRecord: SourceAdminSetupReadinessRecord = {
      ...restrictedRecord,
      recordId: 'admin-source-readiness-vendor-contracts-waived',
      readinessState: 'Waived',
      evidenceUsability: 'waived',
      accessState: 'allowed',
      waiver: {
        owner: 'CIO Office',
        reason: 'Known contract inventory gap accepted for outline-tier strategy only.',
        approvedAt: '2026-04-25',
        downstreamImpact: 'RFP commercial assumptions must remain caveated.',
      },
    };

    const restrictedItem = mapAdminSetupReadinessToSourceItem({
      requirement: requirement!,
      record: restrictedRecord,
    });
    const waivedItem = mapAdminSetupReadinessToSourceItem({
      requirement: requirement!,
      record: waivedRecord,
    });

    expect(restrictedItem).toMatchObject({
      readinessState: 'Access Restricted',
      evidenceUsability: 'restricted',
      stewardAdminHandoffLabel: 'Steward to access owner',
    });
    expect(restrictedItem.workflowImpact).toContain('access restrictions');
    expect(waivedItem).toMatchObject({
      readinessState: 'Waived',
      evidenceUsability: 'waived',
      stewardAdminHandoffLabel: 'Waived by CIO Office',
    });
    expect(waivedItem.workflowImpact).toContain('waiver owner');
  });

  it('returns empty deterministic projections for unknown events', () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId: 'missing-event' });

    expect(getSourceEventDataRequirements('missing-event')).toEqual([]);
    expect(getSeededAdminSetupReadinessRecordsForSourceEvent('missing-event')).toEqual([]);
    expect(projection.items).toEqual([]);
    expect(projection.summary.readinessPercent).toBe(0);
  });

  it('summarizes custom Source readiness items deterministically', () => {
    const projection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId });
    const summary = summarizeSourceDataReadinessProgress(eventId, projection.items.slice(0, 2));

    expect(summary.totalItems).toBe(2);
    expect(summary.requiredItems).toBe(2);
    expect(summary.readinessPercent).toBe(50);
  });

  it('keeps the contract in deterministic read-model boundaries', () => {
    const sources = [
      'src/lib/source/admin-setup-readiness-contract.ts',
      'src/lib/source/index.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(api\/v1|app\/api)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|artifact-drawer|scorecard-ui)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(admin\/setup|platform\/admin|connectors|migrations)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createConnector|createDataset)\b/);
  });
});
