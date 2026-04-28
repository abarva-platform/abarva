/**
 * DATA2 — data-lineage-inspector-view integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildLineageInspectorView('apexretail') with no selectedNodeId → selectedNodeId: null, detail: null
 *   - buildLineageInspectorView('apexretail', 'lineage-src-erp') → detail non-null, node has kind: source_system
 *   - buildLineageInspectorView('apexretail', 'nonexistent') → detail: null
 *   - For lineage-src-erp: inboundEdges.length === 0, outboundEdges.length > 0
 *   - For lineage-surface-programs: outboundEdges.length === 0, inboundEdges.length > 0
 *   - upstreamChain for lineage-surface-programs includes source node ids
 *   - downstreamChain for lineage-src-erp includes downstream node ids
 *   - getLineageNodeDetail returns same result as buildLineageInspectorView detail
 *   - getLineageNodeDetail returns null for unknown nodeId
 *   - describeNodeDetail returns non-empty string for valid detail
 *   - honestNote mentions 'stubs'
 *   - deterministicSeed: true
 *   - Determinism
 *   - Module hygiene
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildLineageInspectorView,
  getLineageNodeDetail,
  describeNodeDetail,
  type LineageInspectorView,
  type LineageInspectorNodeDetail,
} from '@/lib/admin/data-lineage-inspector-view';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/admin/data-lineage-inspector-view.ts';

function readSource(): string {
  return readFileSync(resolve(root, SOURCE_PATH), 'utf8');
}

// ---------------------------------------------------------------------------
// buildLineageInspectorView — no selectedNodeId
// ---------------------------------------------------------------------------

describe('DATA2 — buildLineageInspectorView: apexretail, no selection', () => {
  let view: LineageInspectorView;

  beforeAll(() => {
    view = buildLineageInspectorView('apexretail');
  });

  it('selectedNodeId is null', () => {
    expect(view.selectedNodeId).toBeNull();
  });

  it('detail is null', () => {
    expect(view.detail).toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('totalNodes is 6', () => {
    expect(view.totalNodes).toBe(6);
  });

  it('totalEdges is 5', () => {
    expect(view.totalEdges).toBe(5);
  });

  it('graph is present', () => {
    expect(view.graph).toBeDefined();
  });

  it('graph.deterministicSeed is true', () => {
    expect(view.graph.deterministicSeed).toBe(true);
  });

  it('honestNote is a non-empty string', () => {
    expect(typeof view.honestNote).toBe('string');
    expect(view.honestNote.length).toBeGreaterThan(0);
  });

  it('honestNote mentions stubs', () => {
    expect(view.honestNote.toLowerCase()).toContain('stub');
  });
});

// ---------------------------------------------------------------------------
// buildLineageInspectorView — lineage-src-erp selected
// ---------------------------------------------------------------------------

describe('DATA2 — buildLineageInspectorView: apexretail, lineage-src-erp', () => {
  let view: LineageInspectorView;
  let detail: LineageInspectorNodeDetail;

  beforeAll(() => {
    view = buildLineageInspectorView('apexretail', 'lineage-src-erp');
    detail = view.detail as LineageInspectorNodeDetail;
  });

  it('selectedNodeId is lineage-src-erp', () => {
    expect(view.selectedNodeId).toBe('lineage-src-erp');
  });

  it('detail is non-null', () => {
    expect(view.detail).not.toBeNull();
  });

  it('node has kind: source_system', () => {
    expect(detail.node.kind).toBe('source_system');
  });

  it('node has nodeId: lineage-src-erp', () => {
    expect(detail.node.nodeId).toBe('lineage-src-erp');
  });

  it('inboundEdges.length is 0 (source node has no inbound edges)', () => {
    expect(detail.inboundEdges.length).toBe(0);
  });

  it('inboundCount is 0', () => {
    expect(detail.inboundCount).toBe(0);
  });

  it('outboundEdges.length > 0', () => {
    expect(detail.outboundEdges.length).toBeGreaterThan(0);
  });

  it('outboundCount > 0', () => {
    expect(detail.outboundCount).toBeGreaterThan(0);
  });

  it('deterministicSeed is true', () => {
    expect(detail.deterministicSeed).toBe(true);
  });

  it('stubNote is a non-empty string', () => {
    expect(typeof detail.stubNote).toBe('string');
    expect(detail.stubNote.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildLineageInspectorView — nonexistent nodeId → detail: null
// ---------------------------------------------------------------------------

describe('DATA2 — buildLineageInspectorView: apexretail, nonexistent node', () => {
  let view: LineageInspectorView;

  beforeAll(() => {
    view = buildLineageInspectorView('apexretail', 'nonexistent');
  });

  it('detail is null for unknown nodeId', () => {
    expect(view.detail).toBeNull();
  });

  it('selectedNodeId is still set to the requested id', () => {
    expect(view.selectedNodeId).toBe('nonexistent');
  });

  it('graph is still populated', () => {
    expect(view.graph.totalNodes).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// lineage-surface-programs — outbound 0, inbound > 0
// ---------------------------------------------------------------------------

describe('DATA2 — buildLineageInspectorView: lineage-surface-programs', () => {
  let detail: LineageInspectorNodeDetail;

  beforeAll(() => {
    const view = buildLineageInspectorView('apexretail', 'lineage-surface-programs');
    detail = view.detail as LineageInspectorNodeDetail;
  });

  it('detail is non-null', () => {
    expect(detail).not.toBeNull();
  });

  it('outboundEdges.length is 0 (terminal surface)', () => {
    expect(detail.outboundEdges.length).toBe(0);
  });

  it('outboundCount is 0', () => {
    expect(detail.outboundCount).toBe(0);
  });

  it('inboundEdges.length > 0', () => {
    expect(detail.inboundEdges.length).toBeGreaterThan(0);
  });

  it('inboundCount > 0', () => {
    expect(detail.inboundCount).toBeGreaterThan(0);
  });

  it('node has kind: analytics_surface', () => {
    expect(detail.node.kind).toBe('analytics_surface');
  });

  it('upstreamChain includes lineage-src-erp (source node)', () => {
    expect(detail.upstreamChain).toContain('lineage-src-erp');
  });

  it('upstreamChain includes lineage-src-spend (source node)', () => {
    expect(detail.upstreamChain).toContain('lineage-src-spend');
  });

  it('upstreamChain has length >= 1', () => {
    expect(detail.upstreamChain.length).toBeGreaterThanOrEqual(1);
  });

  it('downstreamChain is empty (no descendants from terminal surface)', () => {
    expect(detail.downstreamChain.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// downstreamChain for lineage-src-erp
// ---------------------------------------------------------------------------

describe('DATA2 — downstreamChain for lineage-src-erp', () => {
  let detail: LineageInspectorNodeDetail;

  beforeAll(() => {
    const view = buildLineageInspectorView('apexretail', 'lineage-src-erp');
    detail = view.detail as LineageInspectorNodeDetail;
  });

  it('downstreamChain has length >= 1', () => {
    expect(detail.downstreamChain.length).toBeGreaterThanOrEqual(1);
  });

  it('downstreamChain includes lineage-ingest-cdp', () => {
    expect(detail.downstreamChain).toContain('lineage-ingest-cdp');
  });

  it('downstreamChain includes lineage-surface-programs (transitive)', () => {
    expect(detail.downstreamChain).toContain('lineage-surface-programs');
  });
});

// ---------------------------------------------------------------------------
// getLineageNodeDetail mirrors buildLineageInspectorView detail
// ---------------------------------------------------------------------------

describe('DATA2 — getLineageNodeDetail', () => {
  it('returns same result as buildLineageInspectorView detail for lineage-src-erp', () => {
    const viewDetail = buildLineageInspectorView(
      'apexretail',
      'lineage-src-erp',
    ).detail as LineageInspectorNodeDetail;
    const directDetail = getLineageNodeDetail('apexretail', 'lineage-src-erp') as LineageInspectorNodeDetail;

    expect(directDetail).not.toBeNull();
    expect(directDetail.node.nodeId).toBe(viewDetail.node.nodeId);
    expect(directDetail.inboundCount).toBe(viewDetail.inboundCount);
    expect(directDetail.outboundCount).toBe(viewDetail.outboundCount);
  });

  it('returns null for unknown nodeId', () => {
    const result = getLineageNodeDetail('apexretail', 'does-not-exist');
    expect(result).toBeNull();
  });

  it('returns null for valid nodeId in unknown tenant', () => {
    const result = getLineageNodeDetail('unknown-tenant', 'lineage-src-erp');
    expect(result).toBeNull();
  });

  it('returned detail has deterministicSeed: true', () => {
    const detail = getLineageNodeDetail('apexretail', 'lineage-src-erp');
    expect(detail?.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// describeNodeDetail
// ---------------------------------------------------------------------------

describe('DATA2 — describeNodeDetail', () => {
  let detail: LineageInspectorNodeDetail;

  beforeAll(() => {
    detail = getLineageNodeDetail(
      'apexretail',
      'lineage-src-erp',
    ) as LineageInspectorNodeDetail;
  });

  it('returns a non-empty string', () => {
    const desc = describeNodeDetail(detail);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('includes the node label', () => {
    expect(describeNodeDetail(detail)).toContain(detail.node.label);
  });

  it('includes "inbound"', () => {
    expect(describeNodeDetail(detail)).toContain('inbound');
  });

  it('includes "outbound"', () => {
    expect(describeNodeDetail(detail)).toContain('outbound');
  });

  it('includes the inbound count as a string', () => {
    expect(describeNodeDetail(detail)).toContain(
      String(detail.inboundCount),
    );
  });
});

// ---------------------------------------------------------------------------
// deterministicSeed: true
// ---------------------------------------------------------------------------

describe('DATA2 — deterministicSeed', () => {
  it('buildLineageInspectorView result has deterministicSeed: true', () => {
    const view = buildLineageInspectorView('apexretail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('detail has deterministicSeed: true when node found', () => {
    const view = buildLineageInspectorView('apexretail', 'lineage-src-erp');
    expect(view.detail?.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Determinism across calls
// ---------------------------------------------------------------------------

describe('DATA2 — determinism across calls', () => {
  it('buildLineageInspectorView returns same totalNodes on repeated calls', () => {
    const v1 = buildLineageInspectorView('apexretail');
    const v2 = buildLineageInspectorView('apexretail');
    expect(v1.totalNodes).toBe(v2.totalNodes);
  });

  it('buildLineageInspectorView with node returns same inboundCount on repeated calls', () => {
    const v1 = buildLineageInspectorView('apexretail', 'lineage-src-erp');
    const v2 = buildLineageInspectorView('apexretail', 'lineage-src-erp');
    expect(v1.detail?.inboundCount).toBe(v2.detail?.inboundCount);
  });

  it('getLineageNodeDetail returns same upstreamChain length on repeated calls', () => {
    const d1 = getLineageNodeDetail('apexretail', 'lineage-surface-programs');
    const d2 = getLineageNodeDetail('apexretail', 'lineage-surface-programs');
    expect(d1?.upstreamChain.length).toBe(d2?.upstreamChain.length);
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('DATA2 — module hygiene', () => {
  let src: string;

  beforeAll(() => {
    src = readSource();
  });

  it('does not call Date.now()', () => {
    expect(src).not.toContain('Date.now(');
  });

  it('does not call Math.random()', () => {
    expect(src).not.toContain('Math.random(');
  });

  it('does not construct new Date(', () => {
    expect(src).not.toContain('new Date(');
  });

  it('does not call fetch(', () => {
    expect(src).not.toContain('fetch(');
  });

  it('does not import useState', () => {
    expect(src).not.toContain('useState');
  });

  it('does not import useEffect', () => {
    expect(src).not.toContain('useEffect');
  });

  it('does not import from supabase', () => {
    expect(src).not.toContain('@supabase/supabase-js');
  });

  it('does not import from @clerk/nextjs', () => {
    expect(src).not.toContain('@clerk/nextjs');
  });

  it('does not contain "Coming soon"', () => {
    expect(src).not.toContain('Coming soon');
  });

  it('does not contain "TBD"', () => {
    expect(src).not.toContain('TBD');
  });
});
