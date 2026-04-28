'use client';

// I3 · INT-IDX-SIGNALS — Client island for the signal stream index Sentinel column.
//
// Wraps AgentColumn for the Intelligence signals index page.
// Actions navigate back to library or to the first signal detail.
//
// No live data, no model calls, no fetch().

import { useRouter } from 'next/navigation';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

interface IntelligenceSignalsSentinelProps {
  agentQuote: string;
  agentContext: string;
  firstSignalId?: string;
}

const SIGNALS_ACTIONS: AgentAction[] = [
  {
    letter: 'A',
    text: 'Back to intelligence library',
    detail: 'Return to the pattern library index.',
  },
  {
    letter: 'B',
    text: 'Inspect first signal',
    detail: 'Open the first signal in the stream for full detail.',
  },
];

export function IntelligenceSignalsSentinel({
  agentQuote,
  agentContext,
  firstSignalId,
}: IntelligenceSignalsSentinelProps) {
  const router = useRouter();

  return (
    <AgentColumn
      agent={{ initials: 'Sn', name: 'Sentinel', role: 'Signal Monitor' }}
      quote={agentQuote}
      agentContext={agentContext}
      actions={SIGNALS_ACTIONS}
      surface="intelligence"
      onActionClick={(letter) => {
        if (letter === 'A') router.push('/intelligence');
        if (letter === 'B' && firstSignalId) {
          router.push(`/intelligence/signals/${firstSignalId}`);
        }
      }}
    />
  );
}
