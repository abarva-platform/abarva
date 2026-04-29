import { buildApexEnterpriseDataRoom } from '@/lib/knowledge/enterprise-data-room';
import {
  ENTERPRISE_DATA_ROOM_PERSISTENCE_MAPPER_VERSION,
  buildEnterpriseDataRoomPlaceholderClientId,
  mapEnterpriseDataRoomToPersistenceRows,
} from '@/lib/knowledge/enterprise-data-room-persistence';

describe('enterprise data room persistence mapper', () => {
  it('lowers the Apex data room into deterministic persistence row groups without DB writes', () => {
    const room = buildApexEnterpriseDataRoom();
    const first = mapEnterpriseDataRoomToPersistenceRows(room, {
      clientId: 'client-apex-retail',
      generatedAt: '2026-04-29T00:00:00.000Z',
    });
    const second = mapEnterpriseDataRoomToPersistenceRows(room, {
      clientId: 'client-apex-retail',
      generatedAt: '2026-04-29T00:00:00.000Z',
    });

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.context).toMatchObject({
      tenantKey: 'apex-retail',
      clientId: 'client-apex-retail',
      clientIdResolved: true,
      placeholderClientId: false,
      rowStatus: 'ready',
      blockedReason: null,
      mapperVersion: ENTERPRISE_DATA_ROOM_PERSISTENCE_MAPPER_VERSION,
    });
    expect(first.rowGroups.enterprise_data_rooms).toHaveLength(1);
    expect(first.rowGroups.enterprise_data_rooms[0]).toMatchObject({
      tenantKey: 'apex-retail',
      clientId: 'client-apex-retail',
      rowStatus: 'ready',
      legalName: 'Apex Retail Group',
      generatedFrom: 'deterministic_enterprise_data_room_seed',
    });
    expect(first.rowGroups.entities.length).toBe(
      1
      + room.people.length
      + room.systems.length
      + room.vendorContracts.length
      + room.financials.length
      + room.programs.length
      + room.sourcingEvents.length,
    );
    expect(first.rowGroups.artifacts).toHaveLength(room.artifacts.length);
    expect(first.rowGroups.evidence).toHaveLength(room.evidence.length);
    expect(first.rowGroups.graph_nodes).toHaveLength(room.graph.nodes.length);
    expect(first.rowGroups.graph_edges).toHaveLength(room.graph.edges.length);
    expect(first.blockedRows).toHaveLength(0);
    expect(first.summary.readyRows).toBe(first.summary.totalRows);
  });

  it('marks every row blocked with a deterministic placeholder clientId when clientId is unresolved', () => {
    const room = buildApexEnterpriseDataRoom();
    const plan = mapEnterpriseDataRoomToPersistenceRows(room);
    const allRows = Object.values(plan.rowGroups).flat();

    expect(plan.context.clientId).toBe(buildEnterpriseDataRoomPlaceholderClientId('apex-retail'));
    expect(plan.context.placeholderClientId).toBe(true);
    expect(plan.context.blockedReason).toBe('client_id_unresolved');
    expect(allRows.length).toBeGreaterThan(0);
    expect(allRows.every((row) => row.clientId === 'unresolved-client:apex-retail')).toBe(true);
    expect(allRows.every((row) => row.tenantKey === 'apex-retail')).toBe(true);
    expect(allRows.every((row) => row.rowStatus === 'blocked')).toBe(true);
    expect(allRows.every((row) => row.blockedReason === 'client_id_unresolved')).toBe(true);
    expect(plan.blockedRows).toHaveLength(allRows.length);
    expect(plan.summary.readyRows).toBe(0);
    expect(plan.summary.blockedRows).toBe(allRows.length);
  });

  it('emits vector chunk readiness rows with no private text or embeddings', () => {
    const room = buildApexEnterpriseDataRoom();
    const plan = mapEnterpriseDataRoomToPersistenceRows(room, { clientId: 'client-apex-retail' });
    const expectedChunkCount = room.vectorReadiness.reduce((total, index) => total + index.candidateChunkCount, 0);

    expect(plan.rowGroups.chunks).toHaveLength(expectedChunkCount);
    expect(plan.summary.chunkReadinessRows).toBe(expectedChunkCount);
    expect(plan.rowGroups.chunks.every((chunk) => chunk.embeddingStatus === 'not_embedded')).toBe(true);
    expect(plan.rowGroups.chunks.every((chunk) => chunk.embeddingModel === null)).toBe(true);
    expect(plan.rowGroups.chunks.every((chunk) => chunk.embeddingVector === null)).toBe(true);
    expect(plan.rowGroups.chunks.every((chunk) => chunk.chunkText === null)).toBe(true);
    expect(plan.rowGroups.chunks.every((chunk) => chunk.rawPrivateTextAllowedInSharedMetadata === false)).toBe(true);
    expect(plan.rowGroups.chunks.every((chunk) => chunk.tenantKeyRequired === true)).toBe(true);
  });

  it('preserves graph and evidence linkage identifiers for later persistence stages', () => {
    const plan = mapEnterpriseDataRoomToPersistenceRows(buildApexEnterpriseDataRoom(), { clientId: 'client-apex-retail' });

    expect(plan.rowGroups.graph_nodes.some((node) => node.sourceRecordId === 'tenant:apex-retail')).toBe(true);
    expect(plan.rowGroups.graph_edges.some((edge) => edge.edgeType === 'PROGRAM_HAS_DELIVERABLE')).toBe(true);
    expect(plan.rowGroups.graph_edges.some((edge) => edge.evidenceIds.length > 0)).toBe(true);
    expect(plan.rowGroups.evidence.some((evidence) => evidence.linkedArtifactIds.length > 0)).toBe(true);
    expect(plan.rowGroups.artifacts.some((artifact) => artifact.linkedProgramIds.includes('program:apex:morrison-owned-brand-margin-recovery'))).toBe(true);
  });
});
