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

export type SourceType =
  | 'VENDOR'
  | 'PATTERN'
  | 'TOPIC'
  | 'RESEARCH'
  | 'REGULATION'
  | 'BENCHMARK'
  | 'INSIGHT'
  | 'GENERAL'
  | 'WORLDVIEW'
  | 'TENANT'
  | 'GRAPH'
  | 'SURFACE';

export interface AskSource {
  type: SourceType;
  name: string;
  id: string | null;
  detail: string;
  url?: string;
  confidence?: number;
  /**
   * Optional structured rows emitted by retrievers that already read typed
   * source data. This is the source-owned visual contract: the model narrates
   * and interprets, while tables/charts/graphs render from cited rows.
   */
  structured?: AskStructuredPayload;
}

export type AskStructuredCell = string | number | null;

export interface AskStructuredColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date';
}

export interface AskStructuredChartHint {
  kind?: 'cost-stack' | 'bar' | 'quadrant-matrix';
  labelKey: string;
  valueKey: string;
  title?: string;
}

export interface AskStructuredGraphHint {
  fromKey: string;
  toKey: string;
  labelKey?: string;
  title?: string;
}

export interface AskStructuredTable {
  id: string;
  title: string;
  columns: AskStructuredColumn[];
  rows: Array<Record<string, AskStructuredCell>>;
  note?: string;
  chart?: AskStructuredChartHint;
  graph?: AskStructuredGraphHint;
}

export interface AskStructuredPayload {
  tables: AskStructuredTable[];
}

export interface RetrievalResult {
  sources: AskSource[];
  averageConfidence: number;
  coverageReport?: import('@/lib/knowledge/coverage').CoverageReport;
}

export interface AskSurfaceContext {
  activeTab?: string | null;
  activeClient?: string | null;
  clientKey?: string | null;
  module?: string | null;
  provider?: string | null;
  sourceProvider?: string | null;
  evaluationCaseId?: string | null;
  evalCaseId?: string | null;
  caseId?: string | null;
  sourceV4?: unknown;
  substrate?: unknown;
  pageFacts?: string[];
  stageFacts?: string[];
  tenantFacts?: string[];
  vendorFacts?: string[];
  useCaseFacts?: string[];
  graphFacts?: string[];
  riskFacts?: string[];
  strategyFacts?: string[];
  sourceFacts?: string[];
  qualityFacts?: string[];
  facts?: string[];
}
