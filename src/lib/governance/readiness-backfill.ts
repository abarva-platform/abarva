// =============================================================================
// Context & Corpus Governance — readiness backfill mapping (PR-3, pure core)
// -----------------------------------------------------------------------------
// Pure, DB-free. Given the signals we can read off an existing source object,
// decide the governance state it should be seeded with in the
// governed_object_readiness sidecar (the additive table from
// 20260608160000_governed_object_readiness.sql).
//
// Core invariant — the #3322 / Lakeshore lesson encoded as code:
//   the backfill NEVER auto-promotes an object to `agent_ready`.
// agent_ready requires end-to-end cite-render verification, which is an earned,
// evidenced runtime transition (PR-5 / PR-7), not something a bulk pass can
// assert. The conservative ceiling for an existing, un-reviewed object is
// `not_reviewed`; sensitive data is fenced (restricted / blocked); un-indexed
// data is `committed_not_indexed`. This is the truthful default, not the
// flattering one.
// =============================================================================

import {
  CORPUS_GLOBAL_SCOPE,
  SENSITIVE_CLASSIFICATIONS,
  type AgentReadiness,
  type Classification,
  type Retrievability,
} from "./context-corpus-policy";

/** Signals read off a source row (conservative defaults where unknown). */
export interface ReadinessSignals {
  source_layer: string;
  client_key: string;
  /** For tenant objects, is the tenant id actually present? (corpus_global: n/a) */
  has_tenant_id: boolean;
  /** Does the object carry a citation / source basis? */
  has_source_basis: boolean;
  /** Does the object carry a confidence level? */
  has_confidence: boolean;
  /** Resolved classification (default 'internal' when none recorded). */
  classification: Classification;
  /** Proven present in a retrievable index (Postgres FTS or Azure AI Search). */
  retrievable: boolean;
  /** Proven cite-render verified end-to-end (the #3322 gate). */
  cite_render_verified: boolean;
}

export interface ProposedReadiness {
  agent_readiness_status: AgentReadiness;
  retrievability: Retrievability;
  reason: string;
}

/**
 * Map source-row signals to the governance state to seed. Mirrors
 * evaluateGovernedObject's gating so the ledger and the runtime gate agree.
 */
export function computeProposedReadiness(
  s: ReadinessSignals,
): ProposedReadiness {
  const retrievability: Retrievability = s.retrievable
    ? "fts_indexed"
    : "committed_not_indexed";
  const isTenant = s.client_key !== CORPUS_GLOBAL_SCOPE;
  const sensitive = SENSITIVE_CLASSIFICATIONS.has(s.classification);

  // Hard fences (mirror evaluateGovernedObject block conditions).
  if (isTenant && !s.has_tenant_id) {
    return {
      agent_readiness_status: "blocked",
      retrievability,
      reason: "tenant object missing tenant_id",
    };
  }
  if (s.source_layer === "industry_corpus" && sensitive) {
    return {
      agent_readiness_status: "blocked",
      retrievability,
      reason: `sensitive classification "${s.classification}" cannot be in shared corpus`,
    };
  }
  if (sensitive) {
    return {
      agent_readiness_status: "restricted",
      retrievability,
      reason: `sensitive classification "${s.classification}" requires explicit clearance`,
    };
  }

  // Grounding gaps -> not_reviewed (needs review before it can be agent_ready).
  const gaps: string[] = [];
  if (!s.has_source_basis) gaps.push("missing source_basis");
  if (!s.has_confidence) gaps.push("missing confidence_level");
  if (gaps.length > 0) {
    return {
      agent_readiness_status: "not_reviewed",
      retrievability,
      reason: gaps.join("; "),
    };
  }

  if (!s.retrievable) {
    return {
      agent_readiness_status: "committed_not_indexed",
      retrievability,
      reason: "committed to DB but not in a retrievable index",
    };
  }

  // Grounded + retrievable but not cite-render-verified: still NOT agent_ready.
  // Promotion to agent_ready is an earned, evidenced transition (PR-5 / PR-7).
  if (!s.cite_render_verified) {
    return {
      agent_readiness_status: "not_reviewed",
      retrievability,
      reason: "not cite-render-verified end-to-end (no auto-promotion)",
    };
  }

  return {
    agent_readiness_status: "agent_ready",
    retrievability,
    reason: "grounded, retrievable, cite-render-verified",
  };
}

/** One store×scope cell of proposed states for the dry-run report. */
export interface BackfillCell {
  client_key: string;
  store: string;
  source_layer: string;
  total: number;
  by_status: Record<AgentReadiness, number>;
}

export interface BackfillSummary {
  total_objects: number;
  by_status: Record<AgentReadiness, number>;
  cells: BackfillCell[];
  /** agent_ready count — MUST be 0 for a pure backfill (no auto-promotion). */
  auto_promoted: number;
}

const ZERO_STATUS: Record<AgentReadiness, number> = {
  not_reviewed: 0,
  committed_not_indexed: 0,
  agent_ready: 0,
  restricted: 0,
  quarantined: 0,
  blocked: 0,
  retired: 0,
};

export function summarizeBackfill(cells: BackfillCell[]): BackfillSummary {
  const by_status: Record<AgentReadiness, number> = { ...ZERO_STATUS };
  let total = 0;
  for (const c of cells) {
    total += c.total;
    for (const k of Object.keys(by_status) as AgentReadiness[]) {
      by_status[k] += c.by_status[k] ?? 0;
    }
  }
  return {
    total_objects: total,
    by_status,
    cells,
    auto_promoted: by_status.agent_ready,
  };
}

export function emptyStatusCounts(): Record<AgentReadiness, number> {
  return { ...ZERO_STATUS };
}

export function renderBackfillReportMarkdown(
  summary: BackfillSummary,
  generatedAt: string,
  mode: "dry-run" | "commit",
): string {
  const lines: string[] = [];
  lines.push("# Context & Corpus Readiness Backfill Report (2026-06-08)");
  lines.push("");
  lines.push(
    `Generated: ${generatedAt} · mode: **${mode}** · target sidecar: ` +
      "`governed_object_readiness` · total objects: " +
      `${summary.total_objects}`,
  );
  lines.push("");
  lines.push(
    "> The backfill never auto-promotes to `agent_ready`. " +
      `Auto-promoted count this run: **${summary.auto_promoted}** (must be 0).`,
  );
  lines.push("");
  lines.push("## Proposed state distribution");
  lines.push("");
  lines.push("| Agent-readiness status | Count |");
  lines.push("|---|---|");
  for (const k of Object.keys(summary.by_status) as AgentReadiness[]) {
    lines.push(`| ${k} | ${summary.by_status[k]} |`);
  }
  lines.push("");
  lines.push("## Per store × scope");
  lines.push("");
  lines.push(
    "| Scope | Store | Layer | Total | not_reviewed | committed_not_indexed | restricted | blocked |",
  );
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const c of summary.cells) {
    lines.push(
      `| ${c.client_key} | ${c.store} | ${c.source_layer} | ${c.total} | ` +
        `${c.by_status.not_reviewed} | ${c.by_status.committed_not_indexed} | ` +
        `${c.by_status.restricted} | ${c.by_status.blocked} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
