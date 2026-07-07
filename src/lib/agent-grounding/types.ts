export type AgentGroundingAgent = 'sentinel' | 'atlas' | 'nexus' | 'source' | 'steward';

export type AgentGroundingTenant =
  | 'apex-retail'
  | 'meridian-health'
  | 'skyharbor-air'
  | 'first-capital';

export type AgentGroundingSeverity = 'P0' | 'P1' | 'P2' | 'P3';

export interface AgentGroundingCase {
  id: string;
  agent: AgentGroundingAgent;
  tenant: AgentGroundingTenant;
  persona: string;
  category:
    | 'tenant-profile'
    | 'tenant-data'
    | 'industry-context'
    | 'hybrid-comparison'
    | 'missing-data'
    | 'cross-tenant'
    | 'source-governance'
    | 'plain-english'
    | 'agent-lane';
  surface: string;
  prompt: string;
  expected: {
    requiredTerms: string[];
    forbiddenTerms: string[];
    requiresTenantFacts: boolean;
    requiresCorpusContext: boolean;
    requiresEvidence: boolean;
    requiresHonestRefusal: boolean;
    requiresDataGap: boolean;
    minActionCues: number;
  };
}

export interface AgentGroundingCapturedAnswer {
  id: string;
  answer: string;
  status?: number;
  mode?: 'live' | 'fallback' | 'unknown';
  latencyMs?: number;
  error?: string;
}

export interface AgentGroundingIssue {
  severity: AgentGroundingSeverity;
  code:
    | 'transport_failure'
    | 'fallback_mode'
    | 'missing_answer'
    | 'missing_required_term'
    | 'forbidden_term'
    | 'tenant_truth_failure'
    | 'tenant_leak'
    | 'missing_corpus_context'
    | 'missing_evidence'
    | 'missing_honest_refusal'
    | 'missing_data_gap'
    | 'raw_internal_id'
    | 'implementation_leak'
    | 'fake_precision'
    | 'weak_actionability'
    | 'cxo_quality';
  message: string;
  evidence?: string;
}

export interface AgentGroundingScore {
  id: string;
  agent: AgentGroundingAgent;
  tenant: AgentGroundingTenant;
  persona: string;
  category: AgentGroundingCase['category'];
  surface: string;
  prompt: string;
  answer: string;
  status: number | null;
  mode: 'live' | 'fallback' | 'unknown';
  latencyMs: number | null;
  score: number;
  passed: boolean;
  issues: AgentGroundingIssue[];
}

export interface AgentGroundingSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  byAgent: Record<string, { total: number; passed: number; failed: number }>;
  byTenant: Record<string, { total: number; passed: number; failed: number }>;
  byCategory: Record<string, { total: number; passed: number; failed: number }>;
  bySeverity: Record<AgentGroundingSeverity, number>;
  blockers: number;
}

export interface AgentGroundingReport {
  generatedAt: string;
  summary: AgentGroundingSummary;
  scores: AgentGroundingScore[];
}
