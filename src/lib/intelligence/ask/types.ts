export type AskIntent =
  | 'vendor_lookup'
  | 'vendor_comparison'
  | 'pattern_inquiry'
  | 'topic_synthesis'
  | 'research_query'
  | 'regulation_query'
  | 'benchmark_query'
  | 'insight_query'
  | 'general_synthesis';

export interface IntentClassification {
  intent: AskIntent;
  entities: string[];
  confidence: number;
}

export type SourceType = 'VENDOR' | 'PATTERN' | 'TOPIC' | 'RESEARCH' | 'REGULATION' | 'BENCHMARK' | 'INSIGHT' | 'GENERAL';

export interface AskSource {
  type: SourceType;
  name: string;
  id: string | null;
  detail: string;
  url?: string;
  confidence?: number;
}

export interface RetrievalResult {
  sources: AskSource[];
  averageConfidence: number;
}
