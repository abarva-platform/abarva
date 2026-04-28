'use client';

// I4 · INT-IDX-GRAPH — Client island for the Pattern Graph browser Sentinel column.
//
// Wraps AgentColumn for the Intelligence pattern graph browser.
// No live data, no model calls, no fetch().

import { useRouter } from 'next/navigation';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

interface PatternGraphSentinelProps {
  agentQuote: string;
  agentContext: string;
  totalNodes: number;
  totalEdges: number;
}

function buildGraphActions(totalNodes: number, totalEdges: number): AgentAction[] {
  return [
    {
      letter: 'A',
      text: 'Back to intelligence library',
      detail: 'Return to the full pattern library index.',
    },
    {
      letter: 'B',
      text: `Inspect hub patterns`,
      detail: `Explore the ${totalNodes} nodes and ${totalEdges} edges in the graph.`,
    },
  ];
}

export function PatternGraphSentinel({
  agentQuote,
  agentContext,
  totalNodes,
  totalEdges,
}: PatternGraphSentinelProps) {
  const router = useRouter();
  const actions = buildGraphActions(totalNodes, totalEdges);

  return (
    <AgentColumn
      agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
      quote={agentQuote}
      agentContext={agentContext}
      actions={actions}
      surface="intelligence"
      onActionClick={(letter) => {
        if (letter === 'A') router.push('/intelligence');
        // B: hub patterns — in-page scroll (no-op in shell)
      }}
    />
  );
}
