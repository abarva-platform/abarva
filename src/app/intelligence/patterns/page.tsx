// INT-IDX-GRAPH — Intelligence pattern graph browser page.
// I4: PatternGraphShell (server component) with ProvenanceRibbon.
// View models built server-side via buildPatternGraphShellView() and buildPatternGraphView().
// Nodes: lifecycle stage + degree. Edges: kind + weight. Hub patterns highlighted.

import { PatternGraphShell } from '@/components/intelligence/PatternGraphShell';
import { buildPatternGraphShellView } from '@/lib/sentinel/pattern-graph-shell-view';
import { buildPatternGraphView } from '@/lib/sentinel/pattern-graph-read-model';

export const metadata = {
  title: 'Pattern Graph · Intelligence',
};

export default function PatternGraphRoute() {
  const shell = buildPatternGraphShellView('graph');
  const graph = buildPatternGraphView();
  return <PatternGraphShell shell={shell} graph={graph} />;
}
