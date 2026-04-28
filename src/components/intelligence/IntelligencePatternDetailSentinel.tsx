'use client';

// I2 · INT-DTL-PATTERN — Client island for the pattern detail Sentinel column.
//
// Wraps AgentColumn for the Intelligence pattern detail reading view.
// No modal, no navigation — the detail page Sentinel column is read-only.
// The only interaction is clicking actions, which navigate back to the index.

import { useRouter } from 'next/navigation';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

interface IntelligencePatternDetailSentinelProps {
  agentQuote: string;
  agentContext: string;
  patternKey: string;
}

// Deterministic actions for any pattern detail page.
function buildDetailActions(patternKey: string): AgentAction[] {
  return [
    {
      letter: 'A',
      text: 'Back to library',
      detail: 'Return to the full pattern library index.',
    },
    {
      letter: 'B',
      text: `View programs using ${patternKey}`,
      detail: 'Scroll to programs section below.',
    },
  ];
}

export function IntelligencePatternDetailSentinel({
  agentQuote,
  agentContext,
  patternKey,
}: IntelligencePatternDetailSentinelProps) {
  const router = useRouter();
  const actions = buildDetailActions(patternKey);

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
