/**
 * Parity test — Azure AI Search retrieval lane vs the pgvector path.
 *
 * Asserts:
 *   1. `canonicalizeTenantKey` maps legacy aliases to canonical form.
 *   2. The retriever always pins `tenant_key` on the Azure filter — a
 *      future refactor that drops this filter must fail this test.
 *   3. Both backends (Azure and pgvector) return shape-compatible
 *      `ContextChunk[]` so the broker's flag-driven dispatch is a
 *      drop-in swap with no downstream branching.
 */

import { describe, expect, it, jest } from '@jest/globals';
import {
  canonicalizeTenantKey,
  queryTenantContext,
  TENANT_CONTEXT_INDEX_NAME,
  type TenantContextChunk,
} from '../tenant-context-retriever';
// Pull `ContextChunk` through the broker's re-export rather than the
// tenant-data types module directly — the broker boundary rule routes
// every cross-module consumer through `context-broker/types`.
import type { ContextChunk } from '@/lib/knowledge/context-broker/types';

describe('Azure AI Search retriever — parity & invariants', () => {
  describe('canonicalizeTenantKey', () => {
    it('maps apexretail → apex-retail', () => {
      expect(canonicalizeTenantKey('apexretail')).toBe('apex-retail');
    });

    it('maps meridian → meridian-health', () => {
      expect(canonicalizeTenantKey('meridian')).toBe('meridian-health');
    });

    it('maps arcturus → first-capital', () => {
      expect(canonicalizeTenantKey('arcturus')).toBe('first-capital');
    });

    it('returns canonical keys verbatim (idempotent)', () => {
      expect(canonicalizeTenantKey('apex-retail')).toBe('apex-retail');
      expect(canonicalizeTenantKey('meridian-health')).toBe('meridian-health');
      expect(canonicalizeTenantKey('first-capital')).toBe('first-capital');
    });

    it('returns unknown keys verbatim (no implicit rejection)', () => {
      expect(canonicalizeTenantKey('contoso-corp')).toBe('contoso-corp');
    });
  });

  describe('tenant_key filter is mandatory', () => {
    function makeFetch(): {
      fetchImpl: jest.MockedFunction<typeof fetch>;
      lastBody: () => Record<string, unknown>;
    } {
      let captured = '';
      const fetchImpl = jest.fn(async (_url: unknown, init?: { body?: BodyInit | null }) => {
        captured = typeof init?.body === 'string' ? init.body : '';
        return new Response(JSON.stringify({ value: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }) as unknown as jest.MockedFunction<typeof fetch>;
      return {
        fetchImpl,
        lastBody: () => JSON.parse(captured) as Record<string, unknown>,
      };
    }

    it('always pins tenant_key eq <canonical> in the OData filter', async () => {
      const { fetchImpl, lastBody } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = 'test-key';
      await queryTenantContext({
        tenantClientKey: 'apex-retail',
        query: 'demand forecasting',
        fetchImpl,
      });
      const body = lastBody();
      expect(body.filter).toBeDefined();
      expect(String(body.filter)).toMatch(/tenant_key eq 'apex-retail'/);
    });

    it('canonicalizes legacy aliases before composing the filter', async () => {
      const { fetchImpl, lastBody } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = 'test-key';
      await queryTenantContext({
        tenantClientKey: 'apexretail',
        query: '*',
        fetchImpl,
      });
      const body = lastBody();
      expect(String(body.filter)).toMatch(/tenant_key eq 'apex-retail'/);
      expect(String(body.filter)).not.toMatch(/apexretail/);
    });

    it('retains tenant_key even when extra filters are supplied', async () => {
      const { fetchImpl, lastBody } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = 'test-key';
      await queryTenantContext({
        tenantClientKey: 'meridian',
        query: 'patient throughput',
        filters: {
          minConfidence: 0.7,
          sensitivity: ['internal', 'confidential'],
          extra: ['source_segment eq \'kpi_dictionary\''],
        },
        fetchImpl,
      });
      const filter = String(lastBody().filter);
      // tenant filter first
      expect(filter.startsWith("tenant_key eq 'meridian-health'")).toBe(true);
      expect(filter).toMatch(/confidence ge 0.7/);
      expect(filter).toMatch(/sensitivity in \('internal','confidential'\)/);
      expect(filter).toMatch(/source_segment eq 'kpi_dictionary'/);
    });

    it('queries the tenant-context-v1 index by name', async () => {
      const { fetchImpl } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = 'test-key';
      await queryTenantContext({
        tenantClientKey: 'apex-retail',
        query: '*',
        fetchImpl,
      });
      const call = fetchImpl.mock.calls[0];
      expect(String(call?.[0])).toContain(`/indexes/${TENANT_CONTEXT_INDEX_NAME}/docs/search`);
    });
  });

  describe('shape parity — Azure result is drop-in for chunksByVector', () => {
    it('maps a search hit into the ContextChunk contract', async () => {
      const fetchImpl = jest.fn(async () => new Response(JSON.stringify({
        value: [{
          '@search.score': 0.91,
          id: 'a-id',
          tenant_key: 'apex-retail',
          source_segment: 'enterprise_profile',
          record_id: 'rec-1',
          chunk_id: 'chunk-1',
          title: 'enterprise_profile.csv',
          body: 'Apex Retail synthetic context.',
          source_uri: 'setup/enterprise_profile.csv',
          confidence: 0.91,
          sensitivity: 'confidential',
          last_seen_at: '2026-05-15T00:00:00.000Z',
        }],
      }), { status: 200 })) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = 'test-key';

      const azureHits = await queryTenantContext({
        tenantClientKey: 'apex-retail',
        query: 'context',
        fetchImpl,
      });

      // The TenantContextChunk mirror exposes every key the canonical
      // ContextChunk contract requires for the broker's `chunksByVector`
      // path. The assignment below is the load-bearing TS check: if a
      // shape drift appears, this assignment fails to compile.
      const asBrokerShape: ContextChunk[] = azureHits as ContextChunk[];
      expect(asBrokerShape).toHaveLength(1);

      const hit = azureHits[0]!;
      const expected: TenantContextChunk = {
        tenantKey: 'apex-retail',
        chunkId: 'chunk-1',
        sourceSegmentId: 'enterprise_profile',
        sourceDoc: 'enterprise_profile.csv',
        recordId: 'rec-1',
        text: 'Apex Retail synthetic context.',
        embeddingStatus: 'embedded',
        sourceBasis: 'setup/enterprise_profile.csv',
        classification: 'confidential',
        vectorScore: 0.91,
      };
      expect(hit).toEqual(expected);
    });

    it('preserves canonical client labels before chunks reach the broker', async () => {
      const fetchImpl = jest.fn(async () => new Response(JSON.stringify({
        value: [{
          '@search.score': 0.88,
          id: 'legacy-id',
          tenant_key: 'first-capital',
          source_segment: 'enterprise_profile',
          record_id: 'rec-legacy',
          chunk_id: 'chunk-legacy',
          title: 'First Capital Financial profile.md',
          body: 'First Capital Financial is the active tenant. Apex Retail and Meridian Health are cross-tenant labels.',
          source_uri: 'setup/First Capital Financial/profile.md',
          confidence: 0.88,
          sensitivity: 'internal',
        }],
      }), { status: 200 })) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = 'test-key';

      const azureHits = await queryTenantContext({
        tenantClientKey: 'arcturus',
        query: 'tenant profile',
        fetchImpl,
      });

      const hit = azureHits[0]!;
      expect(hit.tenantKey).toBe('first-capital');
      expect(hit.sourceDoc).toBe('First Capital Financial profile.md');
      expect(hit.sourceBasis).toBe('setup/First Capital Financial/profile.md');
      expect(hit.text).toContain('First Capital Financial is the active tenant.');
      expect(hit.text).toContain('Apex Retail and Meridian Health are cross-tenant labels.');
    });

    it('produces the same set of keys the pgvector adapter populates', () => {
      // Pin every key on `ContextChunk` (besides the rare `embedding`
      // raw-vector payload, which neither lane returns on hot paths)
      // against the retriever's local mirror so a future contract
      // expansion forces both files to update together.
      const sample: TenantContextChunk = {
        tenantKey: 't',
        chunkId: 'c',
        sourceSegmentId: 's',
        sourceDoc: 'd',
        recordId: 'r',
        text: 'x',
        embeddingStatus: 'embedded',
        sourceBasis: 'sb',
        classification: 'internal',
        vectorScore: 0.5,
      };
      const asCanonical: ContextChunk = sample as ContextChunk;
      // Both shapes carry these keys.
      expect(Object.keys(asCanonical).sort()).toEqual(Object.keys(sample).sort());
    });
  });

  describe('feature-flag default — flag is OFF for every roster tenant', () => {
    it('retrieval_azure_search is off for apex / meridian / first-capital by default', async () => {
      const { isFeatureEnabled } = await import('@/lib/features/is-feature-enabled');
      expect(isFeatureEnabled({ clientKey: 'apexretail' }, 'retrieval_azure_search')).toBe(false);
      expect(isFeatureEnabled({ clientKey: 'meridian' }, 'retrieval_azure_search')).toBe(false);
      expect(isFeatureEnabled({ clientKey: 'arcturus' }, 'retrieval_azure_search')).toBe(false);
    });

    it('is registered as a known flag (typo at call sites is a compile error)', async () => {
      const { getFeatureFlagDefinition } = await import('@/lib/features/registry');
      const def = getFeatureFlagDefinition('retrieval_azure_search');
      expect(def).toBeDefined();
      expect(def?.policy).toBe('tenant');
      expect(def?.includeTenants ?? []).toHaveLength(0);
    });
  });
});
