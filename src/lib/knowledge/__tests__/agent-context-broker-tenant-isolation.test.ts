import { buildEnterpriseAgentContextBundle } from '@/lib/knowledge/agent-context-broker';
import { listEnterpriseDataRooms } from '@/lib/knowledge/enterprise-data-room';
import { mapEnterpriseDataRoomToPersistenceRows } from '@/lib/knowledge/enterprise-data-room-persistence';

const TENANT_A = 'apex-retail';
const OTHER_TENANT_RE = /meridian|first-capital/i;

function allDryRunChunkRows() {
  return listEnterpriseDataRooms().flatMap((room) =>
    mapEnterpriseDataRoomToPersistenceRows(room).rowGroups.chunks,
  );
}

describe('AgentContextBroker tenant isolation', () => {
  it('returns only the requested tenant in broker items and graph metadata', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: TENANT_A,
      agentName: 'Sentinel',
      surface: 'intelligence',
      includeGraphNeighborhood: true,
      allowL4RawContext: true,
    });

    expect(bundle.tenantKey).toBe(TENANT_A);
    expect(bundle.graphNeighborhood.tenantKey).toBe(TENANT_A);
    expect(bundle.items.length).toBeGreaterThan(0);
    expect(bundle.items.every((item) => item.tenantKey === TENANT_A)).toBe(true);
    expect(bundle.blockedItems.every((item) => item.tenantKey === TENANT_A)).toBe(true);
    expect(bundle.items.map((item) => item.id).join('\n')).not.toMatch(OTHER_TENANT_RE);
    expect(bundle.items.flatMap((item) => item.provenanceIds).join('\n')).not.toMatch(OTHER_TENANT_RE);
    expect(bundle.citations.map((citation) => citation.evidenceId).join('\n')).not.toMatch(OTHER_TENANT_RE);
  });

  it('proves dry-run vector chunks need tenant_key filtering before live retrieval', () => {
    const allChunks = allDryRunChunkRows();
    const scopedChunks = allChunks.filter((row) => row.tenantKey === TENANT_A);
    const unsafeUnfilteredOtherTenantChunks = allChunks.filter((row) => row.tenantKey !== TENANT_A);

    expect(scopedChunks.length).toBeGreaterThan(0);
    expect(scopedChunks.every((row) => row.tenantKey === TENANT_A)).toBe(true);
    expect(scopedChunks.map((row) => row.id).join('\n')).not.toMatch(OTHER_TENANT_RE);

    // This is the deliberate negative-control half of the smoke test:
    // if a future vector query omits tenant_key, other-tenant rows are available.
    expect(unsafeUnfilteredOtherTenantChunks.length).toBeGreaterThan(0);
    expect(unsafeUnfilteredOtherTenantChunks.map((row) => row.tenantKey)).toEqual(
      expect.arrayContaining(['meridian', 'first-capital']),
    );
  });

  it('returns an explicit blocked bundle instead of falling back to another tenant', () => {
    const bundle = buildEnterpriseAgentContextBundle({
      tenantKey: 'missing-tenant',
      agentName: 'Sentinel',
      surface: 'intelligence',
      includeGraphNeighborhood: true,
    });

    expect(bundle.tenantKey).toBe('missing-tenant');
    expect(bundle.items).toHaveLength(0);
    expect(bundle.citations).toHaveLength(0);
    expect(bundle.graphNeighborhood.tenantKey).toBe('missing-tenant');
    expect(bundle.blockedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenantKey: 'missing-tenant',
          reason: 'unknown_tenant',
        }),
      ]),
    );
  });
});
