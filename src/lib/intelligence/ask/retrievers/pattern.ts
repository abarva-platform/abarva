import { getGraphDriver } from '@/lib/graph/driver';
import type { RetrievalResult, AskSource } from '../types';

export async function retrievePattern(entities: string[]): Promise<RetrievalResult> {
  if (entities.length === 0) return { sources: [], averageConfidence: 0 };

  const driver = (() => {
    try { return getGraphDriver(); } catch { return null; }
  })();
  if (!driver) return { sources: [], averageConfidence: 0 };

  const session = driver.session();
  const sources: AskSource[] = [];

  try {
    for (const entity of entities.slice(0, 3)) {
      const code = /^F\d{3}$/.test(entity) ? entity : null;
      const cypher = code
        ? `MATCH (p:GenomePattern {code: $code}) RETURN p.code AS code, p.name AS name, p.failure_rate_pct AS rate, p.description AS description`
        : `MATCH (p:GenomePattern) WHERE p.name CONTAINS $q OR p.code CONTAINS $q
           RETURN p.code AS code, p.name AS name, p.failure_rate_pct AS rate, p.description AS description LIMIT 5`;
      const res = await session.run(cypher, code ? { code } : { q: entity });
      for (const rec of res.records) {
        sources.push({
          type: 'PATTERN',
          name: `${rec.get('code')} · ${rec.get('name')}`,
          id: String(rec.get('code') ?? ''),
          detail: [
            typeof rec.get('rate') === 'number' ? `Historical failure rate ${rec.get('rate')}%` : null,
            (rec.get('description') as string | null) ?? null,
          ]
            .filter(Boolean)
            .join(' · '),
          confidence: 0.9,
        });
      }
    }
  } catch (err) {
    console.error('[ask-intelligence/pattern]', err);
  } finally {
    await session.close();
  }

  const avg = sources.length > 0 ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length : 0;
  return { sources, averageConfidence: avg };
}
