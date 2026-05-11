import path from 'node:path';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  parseMeridianEnterpriseContextDataset,
} from '../ingestion/meridian-loader';
import {
  buildEnterpriseContextChunksFromPlan,
  retrieveEnterpriseContextChunksFromRows,
} from '../chunking';

const root = path.join(process.cwd(), 'docs/enterprise-context/synthetic/meridian');

describe('enterprise context chunking', () => {
  const parsed = parseMeridianEnterpriseContextDataset(root);
  const plan = buildMeridianEnterpriseContextIngestionPlan(parsed);
  const chunks = buildEnterpriseContextChunksFromPlan(plan, root);

  it('creates one stable, citation-rich chunk for every canonical record', () => {
    expect(chunks).toHaveLength(plan.records.length);
    expect(new Set(chunks.map((chunk) => chunk.chunkId)).size).toBe(chunks.length);
    expect(chunks.every((chunk) => chunk.tenantKey === 'meridian')).toBe(true);
    expect(chunks.every((chunk) => chunk.embeddingStatus === 'pending')).toBe(true);
    expect(chunks.every((chunk) => chunk.chunkMetadata.vector_status === 'vector_pending')).toBe(true);

    const epicChunk = chunks.find((chunk) => chunk.sourceRecordId === 'CI-APP-EPIC-HYPERSPACE');
    expect(epicChunk?.chunkId).toBe('meridian:cmdb_applications_services:CI-APP-EPIC-HYPERSPACE:summary:v1');
    expect(epicChunk?.chunkText).toContain('Citation:');
    expect(epicChunk?.provenance.owner).toBeTruthy();
    expect(epicChunk?.provenance.confidence).toBeGreaterThan(0.7);
  });

  it('supports keyword retrieval with domain, freshness, and confidence filters', () => {
    const hits = retrieveEnterpriseContextChunksFromRows(chunks, 'Genesys contact center renewal', {
      recordTypes: ['vendors_contract_inventory', 'renewal_calendar'],
      freshnessStatuses: ['fresh'],
      minConfidence: 0.8,
      limit: 5,
    });

    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.vectorPending)).toBe(true);
    expect(hits.every((hit) => ['vendors_contract_inventory', 'renewal_calendar'].includes(hit.chunk.chunkMetadata.record_type))).toBe(true);
    expect(hits[0].chunk.chunkText.toLowerCase()).toContain('genesys');
  });

  it('does not leak other tenants or inactive records through filters', () => {
    const inactive = { ...chunks[0], chunkMetadata: { ...chunks[0].chunkMetadata, lifecycle_state: 'superseded' } };
    const crossTenant = { ...chunks[1], tenantKey: 'apexretail', chunkId: 'apexretail:test:summary:v1' };
    const hits = retrieveEnterpriseContextChunksFromRows([inactive, crossTenant, ...chunks.slice(2)], 'Epic clinical', {
      tenantKey: 'meridian',
      recordTypes: ['cmdb_applications_services'],
      limit: 10,
    });

    expect(hits.some((hit) => hit.chunk.chunkId === inactive.chunkId)).toBe(false);
    expect(hits.some((hit) => hit.chunk.tenantKey === 'apexretail')).toBe(false);
  });
});
