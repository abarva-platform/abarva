// INT-IDX-GRAPH — Intelligence pattern graph browser page.
// I4: PatternGraphShell (server component) with ProvenanceRibbon.
// View models built server-side via buildPatternGraphShellView() and buildPatternGraphView().
// Nodes: lifecycle stage + degree. Edges: kind + weight. Hub patterns highlighted.

import { TenantIdentityStrip } from '@/components/tenant/TenantIdentityStrip';
import { PatternGraphShell } from '@/components/intelligence/PatternGraphShell';
import { getActiveClientRow } from '@/lib/active-client';
import { buildPatternGraphShellView } from '@/lib/sentinel/pattern-graph-shell-view';
import { buildPatternGraphView } from '@/lib/sentinel/pattern-graph-read-model';

export const metadata = {
  title: 'Pattern Graph · Intelligence',
};

export default async function PatternGraphRoute() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const shell = buildPatternGraphShellView('graph');
  const graph = buildPatternGraphView();
  return (
    <>
      <div style={{ padding: '24px 32px 0', background: '#F8F7F4' }}>
        <TenantIdentityStrip clientName={activeClient?.name} surface="Intelligence patterns" />
      </div>
      <PatternGraphShell
        shell={shell}
        graph={graph}
        tenantName={activeClient?.name ?? 'Client workspace'}
      />
    </>
  );
}

// Per-request render (tenant-scoped reads / useSearchParams CSR bailout) — no static prerender.
export const dynamic = 'force-dynamic';
