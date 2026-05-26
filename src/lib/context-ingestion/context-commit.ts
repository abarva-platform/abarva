import type { ContextApprovalItem } from './approval-queue';
import { buildEvidenceRows } from './evidence-writer';
import type { ContextEvidenceRow, ExtractedContextFact } from './types';

export interface CommittedContextLayer {
  tenantKey: 'northstar';
  committedFacts: ExtractedContextFact[];
  evidenceRows: ContextEvidenceRow[];
  availableToAgents: boolean;
  unlockedSurfaces: string[];
}

export function commitApprovedFacts(items: ContextApprovalItem[]): CommittedContextLayer {
  const committedFacts = items
    .filter((item) => item.state === 'approved')
    .map((item) => item.fact);
  return {
    tenantKey: 'northstar',
    committedFacts,
    evidenceRows: buildEvidenceRows(committedFacts),
    availableToAgents: committedFacts.length > 0,
    unlockedSurfaces: ['Sentinel', 'Source', 'Moves', 'Tower'],
  };
}
