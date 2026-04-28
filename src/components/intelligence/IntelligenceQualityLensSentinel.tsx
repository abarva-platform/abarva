'use client';

// I7 · INT-LNS-QUALITY — Client island for the quality lens Sentinel column.
//
// Wraps AgentColumn for the Intelligence knowledge quality lens page.
// Actions navigate to the library or solutions catalog.

import { useRouter } from 'next/navigation';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

interface IntelligenceQualityLensSentinelProps {
  agentQuote: string;
  agentContext: string;
}

const QUALITY_LENS_ACTIONS: AgentAction[] = [
  {
    letter: 'A',
    text: 'View pattern library',
    detail: 'Return to the full Intelligence pattern library.',
  },
  {
    letter: 'B',
    text: 'View solution archetypes',
    detail: 'Open the Solutions catalog to browse archetypes.',
  },
];

export function IntelligenceQualityLensSentinel({
  agentQuote,
  agentContext,
}: IntelligenceQualityLensSentinelProps) {
  const router = useRouter();

  return (
    <AgentColumn
      agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
      quote={agentQuote}
      agentContext={agentContext}
      actions={QUALITY_LENS_ACTIONS}
      surface="intelligence"
      onActionClick={(letter) => {
        if (letter === 'A') router.push('/intelligence');
        if (letter === 'B') router.push('/intelligence/solutions');
      }}
    />
  );
}
