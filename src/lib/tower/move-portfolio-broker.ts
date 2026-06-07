import 'server-only';

import {
  buildEnterpriseAgentContextBundleAsync,
  TENANT_DATA_PERSISTED_WARNING,
  type EnterpriseAgentContextItem,
} from '@/lib/knowledge/agent-context-broker';
import { getPhaseLabel } from '@/lib/programs/phase-labels';
import {
  buildTowerAdoptionRealizationView,
  readOutcomeLedger,
  type OutcomeLedgerEntryView,
  type OutcomeLedgerView,
} from '@/lib/tower/outcome-ledger';
import { buildSourceRiskView } from '@/lib/tower/source-risk';
import {
  buildMovePortfolioCards,
  type MovePortfolioCard,
  type PortfolioMoveRef,
} from '@/lib/tower/move-portfolio-card';

export interface BrokerMovePortfolioResult {
  readonly cards: readonly MovePortfolioCard[];
  readonly source: 'broker_persisted' | 'empty';
  readonly warnings: readonly string[];
}

const DEFAULT_TOWER_PHASE_LABEL = `${getPhaseLabel(5)} -> Tower`;

function contextIdsForProgram(item: EnterpriseAgentContextItem): readonly string[] {
  const ids = new Set<string>();
  for (const id of item.provenanceIds) {
    const trimmed = id.trim();
    if (trimmed) ids.add(trimmed);
  }
  if (item.id.startsWith('ctx:')) {
    const withoutPrefix = item.id.slice(4);
    if (withoutPrefix) ids.add(withoutPrefix);
  }
  return [...ids];
}

function phaseLabelFromSummary(summary: string): string {
  const pCode = summary.match(/\bP([0-5])\b/i);
  if (pCode) return getPhaseLabel(Number(pCode[1]));

  const phaseNumber = summary.match(/\b(?:phase|current_phase)\s*[:=]?\s*([0-5])\b/i);
  if (phaseNumber) return getPhaseLabel(Number(phaseNumber[1]));

  return DEFAULT_TOWER_PHASE_LABEL;
}

function moveRefsFromBrokerContext(
  items: readonly EnterpriseAgentContextItem[],
  ledger: OutcomeLedgerView,
): readonly PortfolioMoveRef[] {
  const moveLedgerEntries = ledger.entries.filter(
    (entry): entry is OutcomeLedgerEntryView =>
      entry.subjectKind === 'move' && entry.subjectRef.trim().length > 0,
  );
  const moveIdsInLedger = new Set(moveLedgerEntries.map((entry) => entry.subjectRef));
  if (moveIdsInLedger.size === 0) return [];

  const programItems = items.filter((item) => item.kind === 'program');
  const refs: PortfolioMoveRef[] = [];
  const seen = new Set<string>();

  for (const item of programItems) {
    const ids = contextIdsForProgram(item);
    const matchingMoveId = ids.find((id) => moveIdsInLedger.has(id));
    if (!matchingMoveId || seen.has(matchingMoveId)) continue;
    seen.add(matchingMoveId);
    refs.push({
      moveId: matchingMoveId,
      moveName: item.title,
      phaseLabel: phaseLabelFromSummary(item.summary),
    });
  }

  return refs;
}

export async function readBrokerMovePortfolioCards(
  tenantClientKey: string | null | undefined,
): Promise<BrokerMovePortfolioResult> {
  if (!tenantClientKey) {
    return { cards: [], source: 'empty', warnings: [] };
  }

  try {
    const [broker, ledger] = await Promise.all([
      buildEnterpriseAgentContextBundleAsync({
        tenantKey: tenantClientKey,
        agentName: 'Atlas',
        surface: 'tower',
      }),
      readOutcomeLedger(tenantClientKey),
    ]);

    if (!broker.warnings.includes(TENANT_DATA_PERSISTED_WARNING)) {
      return { cards: [], source: 'empty', warnings: broker.warnings };
    }

    const moves = moveRefsFromBrokerContext(broker.items, ledger);
    if (moves.length === 0) {
      return { cards: [], source: 'empty', warnings: broker.warnings };
    }

    return {
      cards: buildMovePortfolioCards({
        moves,
        ledger,
        sourceRisk: buildSourceRiskView({
          tenantClientKey,
          handoffs: [],
          ledger,
        }),
        adoptionRealization: buildTowerAdoptionRealizationView(ledger),
      }),
      source: 'broker_persisted',
      warnings: broker.warnings,
    };
  } catch {
    return { cards: [], source: 'empty', warnings: [] };
  }
}
