import {
  buildUniversalDimensionDossier as buildDossierFromSources,
  routeDimensionQuestion,
  type DossierSurface,
  type UniversalDimensionDossier,
} from '@/lib/semantic-dossiers';

import { getCachedHomeKnowDossier, setCachedHomeKnowDossier } from './dossier-session-cache';
import { loadHomeKnowDossierSources } from './dossier-source-loader';

function sourceSignature(sources: Record<string, unknown[]>): string {
  return Object.entries(sources)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => `${key}:${rows.length}`)
    .join('|');
}

export function buildHomeKnowDimensionDossier(args: {
  tenantKey: string;
  question: string;
  requestedSurface?: DossierSurface;
}): { dossier: UniversalDimensionDossier; cacheHit: boolean; sourceSignature: string } {
  const route = routeDimensionQuestion(args.question, args.requestedSurface ?? 'home');
  const sourceKeys = route.requiredSources.map((source) => source.sourceKey);
  const sources = loadHomeKnowDossierSources(args.tenantKey, sourceKeys);
  const signature = sourceSignature(sources);
  const cached = getCachedHomeKnowDossier({
    tenantKey: args.tenantKey,
    question: args.question,
    sourceSignature: signature,
  });
  if (cached) return { dossier: cached, cacheHit: true, sourceSignature: signature };

  const dossier = buildDossierFromSources({
    tenantKey: args.tenantKey,
    question: args.question,
    requestedSurface: args.requestedSurface ?? 'home',
    sources,
  });
  setCachedHomeKnowDossier({
    tenantKey: args.tenantKey,
    question: args.question,
    sourceSignature: signature,
    dossier,
  });
  return { dossier, cacheHit: false, sourceSignature: signature };
}
