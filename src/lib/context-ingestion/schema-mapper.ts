import type { ExtractedContextFact } from './types';

export interface ContextEntityMutation {
  entityKey: string;
  entityType: string;
  fields: Record<string, unknown>;
  evidenceFactIds: string[];
}

export function mapFactsToContextEntities(facts: ExtractedContextFact[]): ContextEntityMutation[] {
  const byEntity = new Map<string, ExtractedContextFact[]>();
  for (const fact of facts) {
    const bucket = byEntity.get(fact.entityKey) ?? [];
    bucket.push(fact);
    byEntity.set(fact.entityKey, bucket);
  }
  return Array.from(byEntity.entries()).map(([entityKey, entityFacts]) => ({
    entityKey,
    entityType: entityFacts[0]?.entityType ?? 'unknown',
    fields: Object.fromEntries(entityFacts.map((fact) => [fact.field, fact.value])),
    evidenceFactIds: entityFacts.map((fact) => fact.id),
  }));
}
