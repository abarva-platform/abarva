import type { ReactNode } from 'react';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

const SENTINEL = { initials: 'Sn', name: 'Sentinel', role: 'Validator' };

const DEFAULT_ACTIONS: AgentAction[] = [
  {
    letter: 'A',
    text: 'Review active events',
    detail: 'See all sourcing events in current stages',
  },
  {
    letter: 'B',
    text: 'Open AMS Vendor Consolidation',
    detail: 'Stage 7 BAFO — Vendor B pending staffing data',
  },
  {
    letter: 'C',
    text: 'Check value ledger',
    detail: '$2.1M attributed, $890K pending confirmation',
  },
];

interface SentinelAgentColumnProps {
  quote?: string;
  /** When provided, renders in place of the static quote string. */
  synthesisNode?: ReactNode;
  agentContext?: string;
  actions?: AgentAction[];
  surface?: string;
  onActionClick?: (letter: 'A' | 'B' | 'C') => void;
}

export function SentinelAgentColumn({
  quote = 'Source workspace ready. Paper aesthetic active. Sentinel listening.',
  synthesisNode,
  agentContext,
  actions = DEFAULT_ACTIONS,
  surface = 'source',
  onActionClick,
}: SentinelAgentColumnProps) {
  return (
    <AgentColumn
      agent={SENTINEL}
      quote={quote}
      synthesisNode={synthesisNode}
      agentContext={agentContext}
      actions={actions}
      surface={surface}
      onActionClick={onActionClick}
    />
  );
}
