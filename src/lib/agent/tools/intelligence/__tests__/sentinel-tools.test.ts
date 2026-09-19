/**
 * Sentinel tool handlers · PR-INT-C verification.
 *
 * Covers the pre-flight validation paths and the keyword-overlap
 * fallback logic. The "happy path" full-handler test depends on
 * getActiveClientRow + the broker, which is exercised below via a
 * mock of the active-client module.
 */

import { searchPatternsTool } from '../searchPatterns';
import { patternNeighborhoodTool } from '../patternNeighborhood';
import { evidenceLookupTool } from '../evidenceLookup';
import type { ToolContext } from '../../registry';
import {
  getPatternManifestEntries,
  getPatternManifestEntry,
} from '@/lib/intelligence/pattern-manifest';

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(),
}));

import { getActiveClientRow } from '@/lib/active-client';
const mockedGetActiveClientRow = getActiveClientRow as jest.MockedFunction<typeof getActiveClientRow>;

interface CapturedWrites {
  buffer: string[];
  ctx: ToolContext;
}

function makeCtx(surface = '/intelligence'): CapturedWrites {
  const buffer: string[] = [];
  const ctx: ToolContext = {
    request: new Request('http://localhost/'),
    surface,
    writer: {
      write(text: string) {
        buffer.push(text);
      },
    },
  };
  return { buffer, ctx };
}

/**
 * Neighborhood roots are DERIVED from the live manifest, never named.
 *
 * Three cases in this file named `pattern_ai_use_case_portfolio`. The
 * corpus re-keyed its entries from `pattern_*` slugs to `PAT-*` codes —
 * that pattern is `PAT-AI-004` today — so the id stopped resolving and
 * the cases went red, in a directory no workflow runs. Substituting
 * `PAT-AI-004` would only move the expiry date, so the root is chosen
 * by the property each case actually needs.
 *
 * Both helpers fail closed rather than skipping: a corpus with no
 * traversable edge, or with no isolated entry, is a finding about the
 * corpus and must not read as a passing test.
 */
function connectedRootId(): string {
  const patterns = getPatternManifestEntries();
  const byId = new Map(patterns.map((entry) => [entry.id, entry]));
  // A self-edge is not a neighbor: the handler seeds `visited` with the
  // root id, so an entry whose only related id is itself traverses to
  // nothing.
  const neighborsOf = (id: string): string[] => {
    const entry = byId.get(id);
    if (!entry) return [];
    return entry.relatedPatternIds.filter((related) => related !== id && byId.has(related));
  };
  // Require a root that expands at TWO hops, not one. The depth case
  // below asserts depth 2 reaches strictly more than depth 1, and a
  // one-hop-only root would make that assertion unsatisfiable while
  // looking like a corpus problem.
  const root = patterns.find((entry) => {
    const firstHop = neighborsOf(entry.id);
    if (firstHop.length === 0) return false;
    const reached = new Set<string>([entry.id, ...firstHop]);
    return firstHop.some((id) => neighborsOf(id).some((next) => !reached.has(next)));
  });
  if (!root) {
    throw new Error('pattern manifest has no entry whose related patterns expand at depth 2');
  }
  return root.id;
}

function isolatedRootId(): string {
  const patterns = getPatternManifestEntries();
  const byId = new Map(patterns.map((entry) => [entry.id, entry]));
  const root = patterns.find((entry) =>
    entry.relatedPatternIds.every((related) => related === entry.id || !byId.has(related)),
  );
  if (!root) {
    throw new Error('pattern manifest has no entry without a resolvable related pattern id');
  }
  return root.id;
}

const APEX_CLIENT = {
  id: 'apex-uuid',
  name: 'Apex Retail Group',
  industry_code: 'retail',
  key: 'apex-retail' as const,
};

describe('searchPatternsTool', () => {
  beforeEach(() => {
    mockedGetActiveClientRow.mockReset();
  });

  it('rejects empty query with actionable recovery', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await searchPatternsTool.handler({ query: '   ' }, ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('invalid_query');
      expect(result.recovery).toMatch(/plain English/);
    }
  });

  it('returns no_active_client when getActiveClientRow returns null', async () => {
    mockedGetActiveClientRow.mockResolvedValue(null);
    const { ctx } = makeCtx();
    const result = await searchPatternsTool.handler({ query: 'AI portfolio' }, ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('no_active_client');
    }
  });

  it('emits pattern-match artifacts when matches are found', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx, buffer } = makeCtx();
    const result = await searchPatternsTool.handler(
      { query: 'AI use case portfolio', limit: 3 },
      ctx,
    );
    expect(result.success).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.some((line) => line.includes('[[artifact:pattern-match]]'))).toBe(true);
    if (result.success) {
      expect(result.data.tenant_key).toBe('apex-retail');
      expect(result.data.retrieval_mode).toBe('keyword_overlap_v1');
      expect(typeof result.data.result_count).toBe('number');
    }
  });

  it('returns success with result_count 0 when no patterns match', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx, buffer } = makeCtx();
    const result = await searchPatternsTool.handler({ query: 'zxqkj' }, ctx);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.result_count).toBe(0);
    }
    expect(buffer.some((line) => line.includes('[[artifact:'))).toBe(false);
  });

  it('clamps limit to MAX_LIMIT', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await searchPatternsTool.handler({ query: 'pattern AI', limit: 999 }, ctx);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.results as unknown[]).length).toBeLessThanOrEqual(20);
    }
  });

  /**
   * Keyword scores are a count of query tokens present, so they tie heavily
   * at the top: a four-token query puts 72 corpus entries at the maximum.
   * The handler then slices, and which few come back is decided by corpus
   * insertion order, not relevance — stably enough across calls to look
   * deliberate. These two cases pin that the handler says so when the slice
   * cannot be a ranking, and stays quiet when it can.
   */
  it('warns that the returned slice is corpus order when the top score ties wider than the slice', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await searchPatternsTool.handler(
      { query: 'AI use case portfolio', limit: 3 },
      ctx,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.ranking_caveat).toBe('string');
      expect(result.data.ranking_caveat).toContain('decided by corpus order');
      // The caveat must be computed over the FULL scored list, not the
      // slice — computed over the slice it could never fire, which is the
      // way this wiring would most plausibly be got wrong.
      const tied = Number(
        /(\d+) corpus patterns at the same top score/.exec(
          String(result.data.ranking_caveat),
        )?.[1],
      );
      expect(tied).toBeGreaterThan(3);
    }
  });

  it('does not warn when a long, specific query separates its results', async () => {
    // The negative control, and it took a measurement to write honestly. The
    // first draft used a pattern's own name on the assumption that searching
    // for a thing by its name must separate. It does not: a two-token name
    // like "Analytics Modernization" ties 578 entries at the top, and over a
    // sample of the corpus the caveat fires for 32.5% of by-own-name
    // searches at limit 20. A long query does separate — this one ties 3 —
    // which is what makes the caveat discriminating rather than constant.
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await searchPatternsTool.handler(
      {
        query: 'vendor lock-in concentration risk in application managed services',
        limit: 20,
      },
      ctx,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ranking_caveat).toBeUndefined();
    }
  });
});

describe('patternNeighborhoodTool', () => {
  beforeEach(() => {
    mockedGetActiveClientRow.mockReset();
  });

  it('rejects empty patternId', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await patternNeighborhoodTool.handler({ patternId: '   ' }, ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('invalid_pattern_id');
    }
  });

  it('returns pattern_not_found for unknown patternId', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await patternNeighborhoodTool.handler(
      { patternId: 'pattern_does_not_exist' },
      ctx,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('pattern_not_found');
    }
  });

  it('emits pattern-match + graph-neighborhood artifacts for each neighbor (depth=1)', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx, buffer } = makeCtx();
    const result = await patternNeighborhoodTool.handler({ patternId: connectedRootId() }, ctx);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.root_id).toBe(connectedRootId());
      expect(result.data.tenant_key).toBe('apex-retail');
      expect(typeof result.data.neighbor_count).toBe('number');
      expect((result.data.neighbor_count as number)).toBeGreaterThan(0);
    }
    // PR-INT-D · expect a graph-neighborhood summary AND per-neighbor
    // pattern-match cards.
    expect(buffer.some((line) => line.includes('[[artifact:graph-neighborhood]]'))).toBe(true);
    expect(buffer.some((line) => line.includes('[[artifact:pattern-match]]'))).toBe(true);
  });

  it('does not emit graph-neighborhood when there are no neighbors', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx, buffer } = makeCtx();
    // This case previously asserted the *contrapositive* — it re-ran the
    // connected root and checked that a graph-neighborhood WAS emitted,
    // which is what the case above already proves. Its own comment said
    // so. The `neighbors.length > 0` guard in the handler had therefore
    // never been exercised. It is now: an isolated root must succeed,
    // report zero neighbors, and emit no artifact of either kind.
    const result = await patternNeighborhoodTool.handler({ patternId: isolatedRootId() }, ctx);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.neighbor_count).toBe(0);
    }
    expect(buffer.some((line) => line.includes('[[artifact:graph-neighborhood]]'))).toBe(false);
    expect(buffer.some((line) => line.includes('[[artifact:pattern-match]]'))).toBe(false);
  });

  it('walks deeper than depth=1 when requested', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const root = connectedRootId();
    const depth1 = await patternNeighborhoodTool.handler({ patternId: root, depth: 1 }, ctx);
    const depth2 = await patternNeighborhoodTool.handler({ patternId: root, depth: 2 }, ctx);
    // Both calls are asserted successful BEFORE the comparison. The
    // previous version guarded the comparison behind
    // `if (depth1.success && depth2.success)`, so once the named root
    // was retired from the corpus both calls failed, the branch never
    // ran, and the case stayed green while asserting nothing.
    expect(depth1.success).toBe(true);
    expect(depth2.success).toBe(true);
    if (depth1.success && depth2.success) {
      // Strictly greater, not `>=`. The root is chosen to expand at two
      // hops, so `>=` would also hold if the handler ignored `depth`
      // entirely — which is exactly the regression this case exists for.
      expect(depth2.data.neighbor_count as number).toBeGreaterThan(
        depth1.data.neighbor_count as number,
      );
    }
  });

  it('offers the model a worked pattern id only if the corpus can resolve it', () => {
    // `input_schema` is handed verbatim to the model by
    // `toAnthropicToolDefinition`, so an example id written here is an
    // instruction the model can act on. The schema used to name
    // `pattern_ai_use_case_portfolio`, retired from the corpus when it
    // was re-keyed, so following the tool's own documentation produced
    // `pattern_not_found`. Any id-shaped literal the schema offers must
    // resolve; naming none is also acceptable, and is what it does now.
    const properties = (patternNeighborhoodTool.input_schema as {
      properties?: Record<string, { description?: string }>;
    }).properties;
    const described = `${properties?.patternId?.description ?? ''} ${patternNeighborhoodTool.description}`;
    const quoted = described.match(/'[^']+'/g) ?? [];
    const unresolvable = quoted
      .map((literal) => literal.slice(1, -1))
      .filter((candidate) => /^(pattern_|PAT-)/.test(candidate))
      .filter((candidate) => !getPatternManifestEntry(candidate));
    expect(unresolvable).toEqual([]);
  });
});

describe('evidenceLookupTool', () => {
  beforeEach(() => {
    mockedGetActiveClientRow.mockReset();
  });

  it('rejects empty claim', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await evidenceLookupTool.handler({ claim: '   ' }, ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('invalid_claim');
    }
  });

  it('returns no_active_client when getActiveClientRow returns null', async () => {
    mockedGetActiveClientRow.mockResolvedValue(null);
    const { ctx } = makeCtx();
    const result = await evidenceLookupTool.handler(
      { claim: 'Privacy attestation pending for Vendor C' },
      ctx,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('no_active_client');
    }
  });

  it('routes through SentinelBrokerAdapter and emits evidence-highlight artifacts', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx, buffer } = makeCtx();
    const result = await evidenceLookupTool.handler(
      { claim: 'Privacy attestation pending for Vendor C' },
      ctx,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tenant_key).toBe('apex-retail');
      expect(result.data.retrieval_mode).toBe('broker_citations_keyword_v1');
      expect(typeof result.data.result_count).toBe('number');
    }
    // Apex Retail has citations seeded; expect at least one highlight.
    expect(buffer.some((line) => line.includes('[[artifact:evidence-highlight]]'))).toBe(true);
  });
});

describe('Sentinel tools · surface registration', () => {
  it("all three tools register only for '/intelligence'", () => {
    expect(searchPatternsTool.surfaces).toEqual(['/intelligence']);
    expect(patternNeighborhoodTool.surfaces).toEqual(['/intelligence']);
    expect(evidenceLookupTool.surfaces).toEqual(['/intelligence']);
  });
});
