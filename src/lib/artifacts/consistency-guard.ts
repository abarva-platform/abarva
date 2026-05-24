import type { BoardPackFact } from './types';

export interface ConsistencyGuardResult {
  ok: boolean;
  findings: string[];
}

function normalizeMoney(value: string): string[] {
  const matches = value.match(/\$[\d,.]+(?:[MBK])?/gi);
  return matches ?? [];
}

export function runArtifactConsistencyGuard(args: {
  renderedText: string;
  facts: BoardPackFact[];
  evidenceLedgerIds: string[];
  kernelVerdict?: 'fund' | 'shape' | 'hold' | 'no_go';
}): ConsistencyGuardResult {
  const findings: string[] = [];
  const rendered = args.renderedText;

  for (const fact of args.facts) {
    if (!rendered.includes(fact.evidenceLedgerId)) {
      findings.push(`missing evidence_ledger_id ${fact.evidenceLedgerId} for fact ${fact.id}`);
    }

    for (const money of normalizeMoney(fact.value)) {
      if (!rendered.includes(money)) {
        findings.push(`money figure ${money} from fact ${fact.id} is absent from rendered output`);
      }
    }
  }

  for (const evidenceId of args.evidenceLedgerIds) {
    if (!rendered.includes(evidenceId)) {
      findings.push(`declared evidence_ledger_id ${evidenceId} is absent from rendered output`);
    }
  }

  if (
    (args.kernelVerdict === 'shape' || args.kernelVerdict === 'hold' || args.kernelVerdict === 'no_go') &&
    /\b(fund|award|proceed)\b/i.test(rendered)
  ) {
    findings.push(`kernel verdict ${args.kernelVerdict} forbids fund/award/proceed language`);
  }

  return {
    ok: findings.length === 0,
    findings,
  };
}

