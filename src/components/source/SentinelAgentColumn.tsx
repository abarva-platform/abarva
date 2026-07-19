import type { CSSProperties, ReactNode } from 'react';
import { AgentColumn } from '@/components/shell/AgentColumn';
import type { AgentAction } from '@/components/shell/AgentColumn';

const SOURCE_AVA = { initials: 'aV', name: 'aVa', role: 'Source advisor' };

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
  /** Optional provenance ribbon rendered directly below the synthesis quote. */
  provenanceSlot?: ReactNode;
  agentContext?: string;
  actions?: AgentAction[];
  surface?: string;
  onActionClick?: (letter: 'A' | 'B' | 'C') => void;
  columnStyle?: CSSProperties;
}

export function SentinelAgentColumn({
  quote = 'Source workspace ready. aVa is ready to help review evidence, risks, and next actions.',
  synthesisNode,
  provenanceSlot,
  agentContext,
  actions = DEFAULT_ACTIONS,
  surface = 'source',
  onActionClick,
  columnStyle,
}: SentinelAgentColumnProps) {
  return (
    <AgentColumn
      agent={SOURCE_AVA}
      quote={quote}
      synthesisNode={synthesisNode}
      provenanceSlot={provenanceSlot}
      agentContext={agentContext}
      actions={actions}
      surface={surface}
      onActionClick={onActionClick}
      columnStyle={columnStyle}
    />
  );
}
