export interface FreshnessInput {
  score: number;
  publishedAt?: string | Date | null;
  halfLifeDays?: number;
}

const DAY_MS = 86_400_000;

export function applyFreshnessDecay(input: FreshnessInput): number {
  const { score, publishedAt, halfLifeDays } = input;
  if (!publishedAt) return score;
  const ts = typeof publishedAt === 'string' ? Date.parse(publishedAt) : publishedAt.getTime();
  if (!Number.isFinite(ts)) return score;
  const ageDays = Math.max(0, (Date.now() - ts) / DAY_MS);
  const hl = halfLifeDays ?? 365;
  const decay = Math.exp(-Math.LN2 * (ageDays / hl));
  return score * decay;
}

export function decayedScoreForChunks<T extends { score?: number; publishedAt?: string | Date | null; halfLifeDays?: number }>(
  chunks: T[],
): Array<T & { decayedScore: number }> {
  return chunks.map((c) => ({
    ...c,
    decayedScore: applyFreshnessDecay({
      score: c.score ?? 1,
      publishedAt: c.publishedAt ?? null,
      halfLifeDays: c.halfLifeDays,
    }),
  }));
}
