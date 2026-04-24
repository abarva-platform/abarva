export type SentinelConfidenceBand = 'high' | 'medium' | 'thin';

export interface SentinelCitation {
  slug: string;
  label: string;
  href: string;
  evidenceCount: number;
  observationCount: number;
  deliverableCount: number;
  freshnessLabel: string;
}

export interface SentinelQueryResponse {
  response: string;
  routeType: 'llm' | 'manifest_fallback';
  confidence: SentinelConfidenceBand;
  citations: SentinelCitation[];
  suggestions: string[];
  activePatternSlug: string | null;
}
