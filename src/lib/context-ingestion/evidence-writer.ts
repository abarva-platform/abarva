import type { ContextEvidenceRow, ExtractedContextFact } from './types';

export function buildEvidenceRows(facts: ExtractedContextFact[]): ContextEvidenceRow[] {
  return facts.map((fact) => ({
    evidenceId: `evidence:${fact.id}`,
    factId: fact.id,
    claim: `${fact.entityKey}.${fact.field} = ${fact.valueText || '[blank]'}`,
    sourceText: `${fact.sourceLocator.fileName}${fact.sourceLocator.row ? ` row ${fact.sourceLocator.row}` : ''}`,
    sourceLocator: fact.sourceLocator,
    confidence: fact.confidence,
    freshness: '2026-05-26',
    ownerRole: fact.approvalRole,
  }));
}
