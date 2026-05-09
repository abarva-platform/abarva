import type { AgentGroundingDisclosure } from '@/lib/intelligence/canonical/agent-grounding-disclosure';

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

export type SentinelGroundingGapType =
  | 'canonical_index_unavailable'
  | 'canonical_pattern_no_match'
  | 'pattern_to_evidence_gap'
  | 'tenant_pattern_assumption_gap'
  | 'artifact_gap'
  | 'kpi_gap'
  | 'guardrail_gap'
  | 'failure_mode_gap'
  | 'phase_requirement_gap';

export type SentinelGroundingGapSeverity = 'info' | 'warning' | 'critical';

export interface SentinelGroundingGap {
  type: SentinelGroundingGapType;
  severity: SentinelGroundingGapSeverity;
  source: 'canonical_pattern_index' | 'pattern_manifest' | 'tenant_program_map';
  patternId: string | null;
  patternLabel: string | null;
  detail: string;
  missing: string[];
}

export interface SentinelGroundingSummary {
  source: 'canonical_pattern_index';
  status: 'ready' | 'empty' | 'no_match' | 'error';
  checkedPatternCount: number;
  canonicalPatternIds: string[];
  warnings: string[];
  gaps: SentinelGroundingGap[];
}

export interface SentinelQueryResponse {
  response: string;
  routeType: 'llm' | 'manifest_fallback';
  confidence: SentinelConfidenceBand;
  citations: SentinelCitation[];
  suggestions: string[];
  activePatternSlug: string | null;
  grounding: SentinelGroundingSummary;
  groundingDisclosure: AgentGroundingDisclosure;
}
