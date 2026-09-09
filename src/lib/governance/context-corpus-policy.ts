/*
 * AbarVa Confidential — Trade Secret (TS-05)
 * Protected under the AbarVa Trade Secret Policy (docs/ip/trade-secret-policy.md) and
 * Trade Secret Register (docs/ip/trade-secret-register.md). Do not distribute externally
 * or expose outside the tenant boundary. Access requires NDA + IP assignment (T075).
 */
// =============================================================================
// AbarVa Context & Corpus Governance — canonical policy contract (PR-1)
// -----------------------------------------------------------------------------
// The single source of truth for what makes a context/corpus object agent-usable.
// Every dataset (tenant context, industry corpus, evidence, pattern, chunk, …)
// MUST conform to GovernedObject before any agent (Nexus, Sentinel, Atlas,
// Source, Tower, Steward, or future agents) may use it.
//
// Conforms to docs/governance/CONTEXT_CORPUS_DATA_ARCHITECTURE.md (PR-0) and
// docs/governance/CONTEXT_CORPUS_POLICY.md. Pure types + Zod + pure gating
// functions — no I/O. PR-3 migrations + PR-4 validators + PR-5 runtime bundle
// all build on this.
// =============================================================================

import { z } from "zod";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

/** Bump when the contract changes; forces re-validation. */
export const POLICY_VERSION = "1.0.0";

/** Scope sentinel for tenant-neutral (shared corpus) objects. */
export const CORPUS_GLOBAL_SCOPE = "corpus_global";

// ── Controlled enums ─────────────────────────────────────────────────────────

export const SOURCE_LAYERS = [
  "tenant_context",
  "industry_corpus",
  "product_docs",
  "uploaded_evidence",
  "artifact",
  "pattern",
  "signal",
  "metric",
  "source_event",
  "move",
  "vendor",
  "system",
  "kpi",
  "financial",
  "graph_edge",
  "search_chunk",
] as const;
export type SourceLayer = (typeof SOURCE_LAYERS)[number];

export const ENTERPRISE_AREAS = [
  "front_office",
  "middle_office",
  "back_office",
  "cross_enterprise",
] as const;
export type EnterpriseArea = (typeof ENTERPRISE_AREAS)[number];

export const CLASSIFICATIONS = [
  "public",
  "internal",
  "confidential",
  "pii",
  "phi",
  "restricted",
] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

/** Classifications that may NEVER enter shared corpus or an agent bundle by default. */
export const SENSITIVE_CLASSIFICATIONS: ReadonlySet<Classification> = new Set([
  "pii",
  "phi",
  "restricted",
]);

export const AGENT_READINESS = [
  "not_reviewed",
  "committed_not_indexed",
  "agent_ready",
  "restricted",
  "quarantined",
  "blocked",
  "retired",
] as const;
export type AgentReadiness = (typeof AGENT_READINESS)[number];

/** Loaded ≠ indexed ≠ retrievable. Only the indexed states are retrievable. */
export const RETRIEVABILITY = [
  "not_indexed",
  "committed_not_indexed",
  "fts_indexed",
  "search_indexed",
] as const;
export type Retrievability = (typeof RETRIEVABILITY)[number];
export const RETRIEVABLE_STATES: ReadonlySet<Retrievability> = new Set([
  "fts_indexed",
  "search_indexed",
]);

export const APPLICABLE_AGENTS = [
  "nexus",
  "sentinel",
  "atlas",
  "source",
  "tower",
  "steward",
] as const;
export type ApplicableAgent = (typeof APPLICABLE_AGENTS)[number];

export const CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unverified",
] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const MOVE_PHASES = ["P0", "P1", "P2", "P3", "P4", "P5"] as const;
export type MovePhase = (typeof MOVE_PHASES)[number];

// industry / function / process_area / use_case_category are large, evolving
// taxonomies — required + non-empty here, constrained to closed enums in a
// follow-up once the taxonomy is ratified (tracked in the enforcement tracker).

// ── Provenance lineage (append-only; never stripped through any hop) ──────────

export const ProvenanceSchema = z.object({
  source_file: z.string().nullable().optional(),
  ingestion_run_id: z.string().nullable().optional(),
  parse_method: z.string().nullable().optional(),
  committed_at: z.string().nullable().optional(),
  indexed_at: z.string().nullable().optional(),
  index_name: z.string().nullable().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

// ── The canonical governed object (one shape for every tenant + both planes) ──

export const GovernedObjectSchema = z.object({
  id: z.string().min(1),
  /** clientId for tenant objects; null only when client_key === corpus_global. */
  tenant_id: z.string().min(1).nullable(),
  /** Canonical cover key (CANONICAL_TENANT_KEYS) or corpus_global. Never a real client name. */
  client_key: z.string().min(1),
  object_type: z.string().min(1),
  source_layer: z.enum(SOURCE_LAYERS),
  industry: z.string().min(1).nullable(),
  enterprise_area: z.enum(ENTERPRISE_AREAS).nullable(),
  function: z.string().min(1).nullable(),
  process_area: z.string().min(1).nullable(),
  use_case_category: z.string().min(1).nullable(),
  strategic_move_phase_applicability: z.array(z.enum(MOVE_PHASES)).default([]),
  applicable_agents: z.array(z.enum(APPLICABLE_AGENTS)).default([]),
  source_basis: z.string().min(1).nullable(),
  source_references: z.array(z.string()).default([]),
  classification: z.enum(CLASSIFICATIONS),
  compliance_basis: z.string().nullable(),
  agent_readiness_status: z.enum(AGENT_READINESS),
  retrievability: z.enum(RETRIEVABILITY),
  confidence_level: z.enum(CONFIDENCE_LEVELS).nullable(),
  confidence_rationale: z.string().nullable(),
  cited_render_verified_at: z.string().nullable(),
  last_reviewed_at: z.string().nullable(),
  owner: z.string().nullable(),
  data_domains: z.array(z.string()).default([]),
  required_kpis: z.array(z.string()).default([]),
  baseline_requirements: z.array(z.string()).default([]),
  measurement_method: z.string().nullable(),
  value_levers: z.array(z.string()).default([]),
  known_failure_modes: z.array(z.string()).default([]),
  guardrails: z.array(z.string()).default([]),
  human_in_loop_controls: z.array(z.string()).default([]),
  allowed_agent_actions: z.array(z.string()).default([]),
  blocked_agent_actions: z.array(z.string()).default([]),
  provenance: ProvenanceSchema.nullable(),
  policy_version: z.string().default(POLICY_VERSION),
  contract_hash: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type GovernedObject = z.infer<typeof GovernedObjectSchema>;

// ── Gating: is this object actually agent-usable? ────────────────────────────

export type PolicyDecision = "pass" | "warn" | "block";

export interface PolicyEvaluation {
  decision: PolicyDecision;
  agentReady: boolean;
  errors: string[]; // block-level violations
  warnings: string[];
}

export function isCanonicalClientKey(key: string): boolean {
  return (
    key === CORPUS_GLOBAL_SCOPE ||
    (CANONICAL_TENANT_KEYS as readonly string[]).includes(key)
  );
}

/**
 * Evaluate a governed object against the policy. `block` => must NOT enter any
 * agent bundle. `agentReady` requires a clean, fully-grounded, indexed,
 * cite-render-verified object — the contract that prevents "loaded but not
 * indexed" / "indexed but not surfaced" from reaching a client.
 */
export function evaluateGovernedObject(input: unknown): PolicyEvaluation {
  const parsed = GovernedObjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      decision: "block",
      agentReady: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      ),
      warnings: [],
    };
  }
  const o = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hard blocks.
  if (
    o.agent_readiness_status === "blocked" ||
    o.agent_readiness_status === "quarantined"
  ) {
    errors.push(`agent_readiness_status is ${o.agent_readiness_status}`);
  }
  if (o.agent_readiness_status === "retired") {
    errors.push("object is retired");
  }
  if (o.client_key !== CORPUS_GLOBAL_SCOPE && o.tenant_id == null) {
    errors.push("tenant object missing tenant_id");
  }
  if (!isCanonicalClientKey(o.client_key)) {
    errors.push(
      `client_key "${o.client_key}" is not a canonical tenant key or corpus_global`,
    );
  }
  // PHI/PII/restricted may not live in shared corpus.
  if (
    (o.source_layer === "industry_corpus" ||
      o.source_layer === "product_docs") &&
    SENSITIVE_CLASSIFICATIONS.has(o.classification)
  ) {
    errors.push(
      `sensitive classification "${o.classification}" cannot be in shared corpus`,
    );
  }

  // Requirements to be agent_ready (else warn + not ready, but not a hard block).
  const readyGaps: string[] = [];
  if (!o.source_basis) readyGaps.push("missing source_basis");
  if (!o.confidence_level) readyGaps.push("missing confidence_level");
  if (!o.provenance) readyGaps.push("missing provenance");
  if (!RETRIEVABLE_STATES.has(o.retrievability)) {
    readyGaps.push(`not retrievable (retrievability=${o.retrievability})`);
  }
  if (!o.cited_render_verified_at)
    readyGaps.push("not cite-render-verified end-to-end");

  const claimsReady = o.agent_readiness_status === "agent_ready";
  if (claimsReady && readyGaps.length > 0) {
    // Claiming ready while failing the gate is a block — this is the core defect class.
    errors.push(`agent_ready but ${readyGaps.join("; ")}`);
  }
  if (!claimsReady && readyGaps.length > 0) {
    warnings.push(`not agent_ready: ${readyGaps.join("; ")}`);
  }

  const decision: PolicyDecision =
    errors.length > 0 ? "block" : warnings.length > 0 ? "warn" : "pass";
  const agentReady =
    decision !== "block" &&
    claimsReady &&
    readyGaps.length === 0 &&
    o.agent_readiness_status === "agent_ready";
  return { decision, agentReady, errors, warnings };
}

/** Convenience: would this object be allowed into an agent bundle? */
export function isAgentUsable(input: unknown): boolean {
  return evaluateGovernedObject(input).decision !== "block";
}
