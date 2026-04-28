'use client';

// I3 · INT-DTL-SIGNAL — Client island for the signal detail Sentinel column.
//
// Wraps AgentColumn for the Intelligence signal detail reading view.
// No live data, no model calls, no fetch().

import { useRouter } from 'next/navigation';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

interface IntelligenceSignalDetailSentinelProps {
  agentQuote: string;
  agentContext: string;
  signalId: string;
}

function buildSignalDetailActions(signalId: string): AgentAction[] {
  return [
    {
      letter: 'A',
      text: 'Back to signal stream',
      detail: 'Return to the full signal stream index.',
    },
    {
      letter: 'B',
      text: 'View affected patterns',
      detail: `See which patterns ${signalId.toUpperCase()} touches.`,
    },
  ];
}

export function IntelligenceSignalDetailSentinel({
  agentQuote,
  agentContext,
  signalId,
}: IntelligenceSignalDetailSentinelProps) {
  const router = useRouter();
  const actions = buildSignalDetailActions(signalId);

  return (
    <AgentColumn
      agent={{ initials: 'Sn', name: 'Sentinel', role: 'Signal Monitor' }}
      quote={agentQuote}
      agentContext={agentContext}
      actions={actions}
      surface="intelligence"
      onActionClick={(letter) => {
        if (letter === 'A') router.push('/intelligence/signals');
        // B: view affected patterns — no-op in shell (patterns not yet linked)
      }}
    />
  );
}
