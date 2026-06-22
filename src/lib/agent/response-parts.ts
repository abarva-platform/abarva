export type AgentResponseTone = 'neutral' | 'good' | 'warning' | 'danger' | 'info';

export interface AgentMetric {
  label: string;
  value: string;
  tone?: AgentResponseTone;
}

export interface AgentTextPart {
  type: 'text';
  title?: string;
  text: string;
}

export interface AgentMetricStripPart {
  type: 'metricStrip';
  title?: string;
  metrics: AgentMetric[];
}

export interface AgentTablePart {
  type: 'table';
  title: string;
  columns: string[];
  rows: string[][];
  caption?: string;
}

export interface AgentBarChartPart {
  type: 'barChart';
  title: string;
  unit?: string;
  bars: Array<{
    label: string;
    value: number;
    displayValue?: string;
    tone?: AgentResponseTone;
  }>;
  caption?: string;
}

export interface AgentCitationsPart {
  type: 'citations';
  title?: string;
  citations: Array<{
    label: string;
    excerpt: string;
    confidence: string;
    sourceDoc?: string;
  }>;
}

export interface AgentNextActionPart {
  type: 'nextAction';
  label: string;
  detail: string;
  confidence?: string;
}

export type AgentResponsePart =
  | AgentTextPart
  | AgentMetricStripPart
  | AgentTablePart
  | AgentBarChartPart
  | AgentCitationsPart
  | AgentNextActionPart;
