'use client';

// I5 · INT-IDX-SOLUTIONS — Client island for the solutions index Sentinel column.
//
// Wraps AgentColumn for the Intelligence solutions index page.
// Actions A and B navigate back to the library or to the first solution.

import { useRouter } from 'next/navigation';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

interface IntelligenceSolutionsSentinelProps {
  agentQuote: string;
  agentContext: string;
  firstSolutionId?: string;
}

function buildSolutionsActions(firstSolutionId?: string): AgentAction[] {
  return [
    {
      letter: 'A',
      text: 'Back to pattern library',
      detail: 'Return to the full Intelligence pattern library.',
    },
    {
      letter: 'B',
      text: firstSolutionId ? `View ${firstSolutionId} detail` : 'View first solution',
      detail: 'Open the solution composition manifest.',
    },
  ];
}

export function IntelligenceSolutionsSentinel({
  agentQuote,
  agentContext,
  firstSolutionId,
}: IntelligenceSolutionsSentinelProps) {
  const router = useRouter();
  const actions = buildSolutionsActions(firstSolutionId);

  return (
    <AgentColumn
      agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
      quote={agentQuote}
      agentContext={agentContext}
      actions={actions}
      surface="intelligence"
      onActionClick={(letter) => {
        if (letter === 'A') router.push('/intelligence');
        if (letter === 'B' && firstSolutionId)
          router.push(`/intelligence/solutions/${firstSolutionId}`);
      }}
    />
  );
}
