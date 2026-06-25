import type { UniversalDimensionDossier } from '@/lib/semantic-dossiers';

interface CacheEntry {
  value: UniversalDimensionDossier;
  expiresAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

function keyFor(args: { tenantKey: string; question: string; sourceSignature: string }): string {
  return `${args.tenantKey}::${args.question.trim().toLowerCase()}::${args.sourceSignature}`;
}

export function getCachedHomeKnowDossier(args: {
  tenantKey: string;
  question: string;
  sourceSignature: string;
}): UniversalDimensionDossier | null {
  const key = keyFor(args);
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    CACHE.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedHomeKnowDossier(args: {
  tenantKey: string;
  question: string;
  sourceSignature: string;
  dossier: UniversalDimensionDossier;
  ttlMs?: number;
}): void {
  CACHE.set(keyFor(args), {
    value: args.dossier,
    expiresAt: Date.now() + (args.ttlMs ?? DEFAULT_TTL_MS),
  });
}

export function clearHomeKnowDossierCache(): void {
  CACHE.clear();
}
