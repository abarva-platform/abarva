import {
  APEX_RETAIL_AI_MATURITY,
  APEX_RETAIL_VOLUMETRICS,
  ENTERPRISE_DATA_ROOM_CONTRACT_VERSION,
  buildApexEnterpriseDataRoom,
  getEnterpriseDataRoom,
  listEnterpriseDataRooms,
  summarizeEnterpriseDataRoomPortfolio,
  validateEnterpriseDataRoom,
} from '@/lib/knowledge/enterprise-data-room';

describe('enterprise data room seed', () => {
  it('has a stable contract version marker', () => {
    expect(ENTERPRISE_DATA_ROOM_CONTRACT_VERSION).toBe('enterprise-data-room-v1');
  });

  it('returns deterministic Apex data-room output', () => {
    const first = JSON.stringify(buildApexEnterpriseDataRoom());
    const second = JSON.stringify(buildApexEnterpriseDataRoom());
    expect(first).toBe(second);
  });

  it('lists Apex as the first integrated enterprise data room', () => {
    const rooms = listEnterpriseDataRooms();
    expect(rooms).toHaveLength(1);
    expect(rooms[0].tenantKey).toBe('apex-retail');
    expect(rooms[0].generatedFrom).toBe('deterministic_enterprise_data_room_seed');
  });

  it('resolves Apex by tenant key and returns null for unknown tenants', () => {
    expect(getEnterpriseDataRoom('apex-retail')).not.toBeNull();
    expect(getEnterpriseDataRoom('unknown')).toBeNull();
  });

  it('integrates the Apex enterprise profile', () => {
    const room = buildApexEnterpriseDataRoom();
    expect(room.profile.legalName).toBe('Apex Retail Group');
    expect(room.profile.industry).toBe('Retail');
    expect(room.profile.residencyMode).toBe('abarva_hosted_synthetic');
    expect(room.profile.dataClassification).toBe('synthetic');
    expect(room.profile.strategicPriorities.length).toBeGreaterThanOrEqual(6);
  });

  it('integrates people, systems, vendors, financials, programs, artifacts, evidence, and sourcing events', () => {
    const room = buildApexEnterpriseDataRoom();
    expect(room.people.length).toBeGreaterThanOrEqual(6);
    expect(room.systems.length).toBeGreaterThanOrEqual(10);
    expect(room.vendorContracts.length).toBeGreaterThanOrEqual(10);
    expect(room.financials.length).toBeGreaterThanOrEqual(12);
    expect(room.programs.length).toBeGreaterThanOrEqual(10);
    expect(room.artifacts.length).toBeGreaterThanOrEqual(18);
    expect(room.evidence.length).toBeGreaterThanOrEqual(20);
    expect(room.sourcingEvents).toHaveLength(1);
  });

  it('keeps every vector readiness index tenant scoped and safe for private data posture', () => {
    const room = buildApexEnterpriseDataRoom();
    expect(room.vectorReadiness.length).toBeGreaterThanOrEqual(3);
    for (const index of room.vectorReadiness) {
      expect(index.tenantKeyRequired).toBe(true);
      expect(index.rawPrivateTextAllowedInSharedMetadata).toBe(false);
      expect(index.candidateChunkCount).toBeGreaterThan(0);
    }
  });

  it('builds graph nodes and edges from the data-room records', () => {
    const room = buildApexEnterpriseDataRoom();
    const nodeIds = new Set(room.graph.nodes.map((node) => node.id));
    expect(room.graph.nodes.length).toBeGreaterThanOrEqual(50);
    expect(room.graph.edges.length).toBeGreaterThanOrEqual(25);
    expect(nodeIds.has('tenant:apex-retail')).toBe(true);
    expect(nodeIds.has('program:apex:morrison-owned-brand-margin-recovery')).toBe(true);
    expect(room.graph.edges.some((edge) => edge.edgeType === 'PROGRAM_HAS_DELIVERABLE')).toBe(true);
    expect(room.graph.edges.some((edge) => edge.edgeType === 'SOURCING_EVENT_FOR_PROGRAM')).toBe(true);
    expect(room.graph.edges.some((edge) => edge.edgeType === 'ARTIFACT_CITES_EVIDENCE')).toBe(true);
  });

  it('validates Apex as rich-tenant-ready for this first integration slice', () => {
    const validation = validateEnterpriseDataRoom(buildApexEnterpriseDataRoom());
    expect(validation.isRichTenantReady).toBe(true);
    expect(validation.missingRequiredFields).toHaveLength(0);
    expect(validation.summary.completenessGaps).toBe(0);
    for (const requirement of validation.requirements) {
      expect(requirement.status).toBe('met');
      expect(requirement.actualCount).toBeGreaterThanOrEqual(requirement.minimumCount);
    }
  });

  it('summarizes the portfolio deterministically', () => {
    const summary = summarizeEnterpriseDataRoomPortfolio();
    expect(summary).toHaveLength(1);
    expect(summary[0].tenantKey).toBe('apex-retail');
    expect(summary[0].richness).toBe('rich');
    expect(JSON.stringify(summary)).toBe(JSON.stringify(summarizeEnterpriseDataRoomPortfolio()));
  });

  it('surfaces imported Apex AI maturity and retail volumetrics for future graph/vector slices', () => {
    expect(APEX_RETAIL_AI_MATURITY.pattern).toBe('PILOT_PURGATORY');
    expect(APEX_RETAIL_VOLUMETRICS.activeModels).toBeGreaterThan(0);
    expect(APEX_RETAIL_VOLUMETRICS.dataPipelines).toBeGreaterThan(0);
  });
});
