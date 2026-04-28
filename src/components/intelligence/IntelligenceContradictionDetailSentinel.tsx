'use client';

// I5 · INT-DTL-CONTRADICTION — Client island for the contradiction detail Sentinel column.
//
// Wraps AgentColumn for the Intelligence contradiction detail page.
// Read-only — detail pages have no modal; action A navigates back to the library.

import { useRouter } from 'next/navigation';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

interface IntelligenceContradictionDetailSentinelProps {
  agentQuote: string;
  agentContext: string;
  contradictionId: string;
}

function buildContradictionActions(): AgentAction[] {
  return [
    {
      letter: 'A',
      text: 'Back to library',
      detail: 'Return to the Intelligence pattern library.',
    },
    {
      letter: 'B',
      text: 'View affected patterns',
      detail: 'Scroll to affected patterns below.',
    },
  ];
}

export function IntelligenceContradictionDetailSentinel({
  agentQuote,
  agentContext,
}: IntelligenceContradictionDetailSentinelProps) {
  const router = useRouter();
  const actions = buildContradictionActions();

  return (
    <AgentColumn
      agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
      quote={agentQuote}
      agentContext={agentContext}
      actions={actions}
      surface="intelligence"
      onActionClick={(letter) => {
        if (letter === 'A') router.push('/intelligence');
      }}
    />
  );
}
