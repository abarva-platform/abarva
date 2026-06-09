// Production/Lab Azure Verification · contract (PR-5).
//
// Ties the framework together: drives golden (PR-2) + matrix (PR-6) questions
// through the real agent, applies golden assertions, claim/citation validation
// (PR-4), and the wisdom rubric (PR-3) on top of the context-bundle trace
// (PR-1), and aggregates a verification summary + remediation backlog.
//
// The agent driver is INJECTED so the runner is pure and testable in lab mode;
// the live driver (HTTP to Nexus/Sentinel) only exists in the run script and is
// gated on a real Azure DATABASE_URL reachable from Azure Container Apps.

import type { AgentContextTrace, TraceAgent, TraceSurface } from '@/lib/agent-trace/types';
import type { AgentResponseEvaluation, RemediationLane } from '@/lib/agent-eval/types';
import type { ClaimValidationResult } from '@/lib/agent-claims/types';
import type { GoldenAssertionResult } from '@/lib/agent-golden';

/** A question the harness can drive (golden or matrix). */
export interface VerificationQuestion {
  id: string;
  tenantKey: string;
  question: string;
  /** Which agent/surface to route to (default sentinel/intelligence). */
  agent?: TraceAgent;
}

/** The observed output of one real agent answer. */
export interface AgentDriverOutput {
  trace: AgentContextTrace;
  answerText: string;
}

/** Injected: calls the real Nexus/Sentinel path and returns trace + answer. */
export type AgentDriver = (q: VerificationQuestion) => Promise<AgentDriverOutput>;

export interface QuestionResult {
  questionId: string;
  tenantKey: string;
  agent: TraceAgent;
  surface: TraceSurface;
  golden?: GoldenAssertionResult;
  claim?: ClaimValidationResult;
  evaluation?: AgentResponseEvaluation;
  hasTrace: boolean;
  hasCitations: boolean;
  productionReady: boolean;
  failureReasons: string[];
}

export interface TenantRollup {
  tenantKey: string;
  total: number;
  passed: number;
  failed: number;
}

export interface VerificationSummary {
  generatedNote: string;
  mode: 'live_azure' | 'lab_structural';
  tenantsTested: string[];
  totalQuestions: number;
  passFailByTenant: TenantRollup[];
  passFailByAgent: Record<string, { passed: number; failed: number }>;
  passFailBySurface: Record<string, { passed: number; failed: number }>;
  traceCoveragePct: number;
  citationCoveragePct: number;
  unsupportedClaimCount: number;
  tenantLeakageCount: number;
  wisdomScoreDistribution: Record<string, number>;
  topFailureModes: Array<{ reason: string; count: number }>;
  remediationBacklog: Array<{ lane: RemediationLane; count: number }>;
}
