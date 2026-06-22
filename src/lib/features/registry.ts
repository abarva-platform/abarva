// Feature-flag registry · A3 (backlog 2026-05-14)
//
// Canonical contract for what ships to all tenants vs what's pinned per
// client. Avoids the "rolling a feature to one pilot tenant first" branch
// hell that ad-hoc tenant gates produce.
//
// Two flag policies:
//
//   - `platform` — default ON for every tenant. The norm. Most features
//     ship this way. Tenants can be excluded individually via the
//     `excludeTenants` allowlist for staged rollback.
//
//   - `tenant`   — default OFF for every tenant. Opt-in per tenant via
//     the `includeTenants` allowlist. Use for tenant-bespoke pilots,
//     beta-tester previews, or staged rollouts that start with one.
//
// The flag set is intentionally static (not a remote feature-flag
// service) for the pilot phase. When we outgrow this — most likely
// when the second paid pilot needs different on/off configurations —
// swap the body of `isFeatureEnabled` for a remote lookup against
// Statsig, LaunchDarkly, or Configcat. The signature stays.
//
// References:
//   - docs/BACKLOG-2026-05-14.md  A3 row
//   - src/lib/auth/tenancy.ts     TenancyCtx
//   - src/lib/client-config.ts    ClientKey

import type { ClientKey } from "@/lib/client-config";

/**
 * Two flag policies. See file-header comment.
 */
export type FeatureFlagPolicy = "platform" | "tenant";

export interface FeatureFlagDefinition {
  /** Stable identifier. Snake-case. Used at every call site. */
  readonly key: FeatureFlagKey;
  /** Short human-readable summary. Surfaced in any future flag-UI. */
  readonly summary: string;
  /** Default-on (platform) or default-off (tenant). See header. */
  readonly policy: FeatureFlagPolicy;
  /**
   * Platform flags: tenants explicitly *excluded* from the rollout. Use to
   * stage a rollback for one tenant without flipping the global default.
   */
  readonly excludeTenants?: ReadonlyArray<ClientKey>;
  /**
   * Tenant flags: tenants explicitly *included* in the rollout. The
   * default for everyone else is off.
   */
  readonly includeTenants?: ReadonlyArray<ClientKey>;
}

/**
 * Canonical set of feature keys. Extend here when adding a new flag.
 * Using a literal union (rather than `string`) so every call site is
 * compile-time-checked.
 */
export type FeatureFlagKey =
  // Reserved for the first real feature gates. Keep at least one
  // platform-default and one tenant-default entry so the policy
  // distinction is exercised in tests.
  | "intelligence_brief_v4"
  | "first_capital_substrate_overlay"
  | "retrieval_azure_search"
  | "scb_shared_engine_home"
  | "scb_shared_engine_intelligence"
  | "scb_shared_engine_source"
  | "scb_shared_engine_moves"
  | "scb_shared_engine_tower"
  | "graph_neo4j_enabled"
  | "tower_synthesis_apex_demo_fixture"
  | "discovery_intake_v2"
  | "moves_orchestrated_deliverables"
  | "moves_workforce_economics"
  | "moves_decision_storytelling"
  | "workspace_explorer_source"
  | "workspace_explorer_moves"
  | "source_simple_front"
  | "source_strategy_auto_draft"
  | "source_strategy_at_p0"
  | "context_corpus_explorer_enabled"
  | "source_reasoning_spine"
  | "deliverable_structured_exhibits"
  | "deliverable_quality_contract"
  | "home_react_surface";

export const FEATURE_FLAGS: ReadonlyArray<FeatureFlagDefinition> = [
  {
    key: "home_react_surface",
    summary:
      "Replaces the static /home Context Explorer iframe (public/home-v2) with the real React Home surface (HomeSurface): the ask is the canonical AvaAsk (shared engine + AgentAnswerRenderer), retiring the fake `answerForAsk` row-globbing. Proven on apexretail, now enabled for all 5 binding-backed tenants. Northstar is intentionally excluded (no binding payload → empty explorer). Can also be toggled per tenant without a deploy via ABARVA_FEATURE_HOME_REACT_SURFACE_TENANTS.",
    policy: "tenant",
    includeTenants: ["apexretail", "arcturus", "skyharbor", "meridian", "lakeshore"],
  },
  {
    key: "deliverable_structured_exhibits",
    summary:
      "Generate the structured exhibit models (ArchitectureModel) for architecture deliverables via the governed generation pass, and render the profile's renderer (premium HTML architecture) instead of prose. Default OFF; tenant opt-in. Falls back to prose on any error. Same governed pipeline for every tenant.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "deliverable_quality_contract",
    summary:
      "Enforce the Deliverable Quality Contract at persistence: a non-client_ready artifact is quarantined as an internal draft rather than served as client-ready. Default OFF (observe-only — the gate always runs and records the state); flip per tenant to enforce, then platform-default once proven.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "context_corpus_explorer_enabled",
    summary:
      "Replaces the /intelligence page with the Context & Corpus Explorer S1 shell: Sentinel rail + 5 tabs (Insights, Explore, Change Log, Coverage & Trust, Corpus). Default OFF — V3 page remains for all tenants until flag is set. Tenant opt-in via includeTenants or ABARVA_FEATURE_CONTEXT_CORPUS_EXPLORER_ENABLED_TENANTS env var.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "source_simple_front",
    summary:
      "Enables the Source Start Here simple front: one calm per-stage screen with up to three evidence asks, one write-document action, and one next-step line. Tenant opt-in; default off so the advanced canvas remains the default until proven live.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "workspace_explorer_source",
    summary:
      "Enables the Source Workspace Explorer surfacing layer: a read-only file/deliverable explorer over existing Source artifact and canvas substrate rows. Tenant opt-in; default off so the current Source canvas remains unchanged.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "workspace_explorer_moves",
    summary:
      "Enables the Moves Workspace Explorer surfacing layer over program attachments, generated artifacts, and deliverables. Tenant opt-in; default off so the current Moves detail surface remains unchanged.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "source_strategy_auto_draft",
    summary:
      "On entering the Strategy stage with no strategy memo yet, auto-runs the governed Draft-with-Sentinel generation once (so the memo appears from the validated P0 facts without a manual click). Reuses the proven, persisted, gap-flagged generation path; the human still confirms archetype/value and the sponsor still endorses. Tenant opt-in; default off so the manual draft stays the norm until proven per tenant.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "source_strategy_at_p0",
    summary:
      "Folds Strategy into P0 origination: on intake approval the event advances straight to Scope and the three GATE-STRATEGY criteria are waived with an audit reason (the strategy is set and endorsed at the P0 approval, which the sponsor co-signs). The Strategy stage is shown done on the rail rather than presented as a separate to-do page. Tenant opt-in; default off so the standard Strategy stage remains the norm until proven per tenant.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_orchestrated_deliverables",
    summary:
      "Author Move board-grade deliverables through the Deliverable Intelligence Orchestrator (governed multi-pass Claude authoring) instead of the deterministic template renderer. Quality/plan gates enforced; falls back to the deterministic deck when the gate blocks. SkyHarbor is enrolled for live board-grade validation; other tenants remain opt-in.",
    policy: "tenant",
    includeTenants: ["skyharbor"],
  },
  {
    key: "moves_workforce_economics",
    summary:
      "Attach the Workforce Economics 'estimate-twice' view (traditional people-only vs AI-native people+agents, with the cost/timeline/headcount delta and the productivity gain) to the Move board-grade Costed Business-Case Pack. The estimate-twice is DERIVED from the kernel's own effort skeleton (headcount × duration × rate-card), so the traditional figure reconciles to the kernel investment — no parallel estimate path. Default OFF; tenant opt-in. Flag off = byte-identical (the engine is not called and no workforce field is attached). Honesty discipline preserved: planning ranges, conservative agent-capacity haircut, NOT a quote. Env allowlist: ABARVA_FEATURE_MOVES_WORKFORCE_ECONOMICS_TENANTS.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "moves_decision_storytelling",
    summary:
      "Render Move deliverables as an exhibit-led executive deck (decision-storytelling pipeline: MoveDecisionModel → Story Director → Visual Director → deck) from the SAME governed generation, instead of the prose HTML. Falls back to prose on any error. Tenant opt-in; default off until live-proven per tenant. Env allowlist: ABARVA_FEATURE_MOVES_DECISION_STORYTELLING_TENANTS.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "discovery_intake_v2",
    summary:
      "Discovery Intake — persist DiscoveryShape (P0 Originate) and DiscoveryPlan (P1 Charter) to engagements.charter JSONB and wire the enhanced capture. Tenant opt-in; default off for staged rollout.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "intelligence_brief_v4",
    summary:
      "V4 Intelligence Brief layout with binding patterns, decision actions, and the move-cascade panel. Default-on platform-wide after PRs #1923 + #1932.",
    policy: "platform",
  },
  {
    key: "first_capital_substrate_overlay",
    summary:
      "First-Capital-only substrate overlay during pilot tuning. Opt-in per tenant. Default off everywhere else.",
    policy: "tenant",
    includeTenants: ["arcturus"],
  },
  {
    key: "retrieval_azure_search",
    summary:
      "Route AgentContextBroker tenant-context retrieval through Azure AI Search (tenant-context-v1) instead of pgvector. Platform-scope intent — staged via tenant allowlist so production cutover happens tenant-by-tenant. Default off everywhere.",
    policy: "tenant",
    // includeTenants intentionally empty — flip on per tenant during
    // cutover. When parity is proven across the roster, swap to
    // `platform` policy with the inverse `excludeTenants` for rollback.
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_home",
    summary:
      "Shared Context Brain on Home: allow Ava/Consilium outputs to drive Home decision-support summaries only after pack readiness and parity proof pass. Default OFF; tenant opt-in only through the W6.1 exposure gate.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_intelligence",
    summary:
      "Shared Context Brain: ground the Intelligence ask in the Consilium expert faculty (router summons expert(s); their authored benchmarks/AI-plays/hedges are injected into synthesis; contributing experts surfaced). Default OFF; tenant opt-in only through the W6.1 exposure gate after pack readiness and parity proof pass.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_source",
    summary:
      "Shared Context Brain on the Source synthesis path: ground sourcing-event synthesis in the Consilium expert(s) for the event (e.g. AMS vendor consolidation → IT Outsourcing & Managed Services expert). Default OFF; tenant opt-in. Wired in /api/source/synthesis; flag off = byte-identical. NOTE on flip: include the flag in the synthesis cache key, or clear the source synthesis cache, when flipping per tenant (current cache key does not vary by flag).",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_moves",
    summary:
      "Shared Context Brain on the Moves/Programs synthesis path: ground program-state synthesis in the Consilium expert(s) for the program subject (industry-fenced via the active client key). Default OFF; tenant opt-in. Wired in /api/programs/synthesis; flag off = byte-identical. NOTE on flip: include the flag in the synthesis cache key, or clear the programs synthesis cache, when flipping per tenant (current cache key does not vary by flag).",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "scb_shared_engine_tower",
    summary:
      "Shared Context Brain on Tower (placeholder hook). Default OFF. Tower currently answers in the browser (public/tower-v2/app.js answerFor); making Tower consume the shared engine requires a server-side answer endpoint (Codex W1.4) before this flag has a consumer.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "source_reasoning_spine",
    summary:
      "Run the Source reasoning spine (Analysis + Recommendation stages) on the generate path and CAPTURE a validated Reasoning Envelope as generation metadata. Default OFF; fully guarded (validate-or-fallback) so flag-off generation is byte-identical to today. Rendering the envelope into the deliverable prose is a separate slice. Tenant opt-in.",
    policy: "tenant",
    includeTenants: [],
  },
  {
    key: "tower_synthesis_apex_demo_fixture",
    summary:
      "Tower synthesis route may use the Apex Retail demo fixture as portfolio input. Tenant-gated to apexretail only — closes the Atlas P0 cross-tenant leak where the Apex fixture was the silent default for every tenant. Default ON for apexretail.",
    policy: "tenant",
    includeTenants: ["apexretail"],
  },
  {
    key: "graph_neo4j_enabled",
    summary:
      "Enables Neo4j-backed graph traversal. Default OFF — Postgres enterprise_graph_* tables are the source of truth. Re-enable per the AZLAB Neo4j re-introduction plan if/when that runs.",
    // Modelled as a `tenant`-policy flag so the global default is OFF.
    // (Platform policy means default ON; we need the opposite.) Flip on
    // per tenant via `includeTenants` only when a controlled lab decides
    // to re-introduce Neo4j; in production the flag stays empty.
    policy: "tenant",
    includeTenants: [],
  },
];

const FEATURE_FLAG_INDEX: ReadonlyMap<FeatureFlagKey, FeatureFlagDefinition> =
  new Map(FEATURE_FLAGS.map((flag) => [flag.key, flag] as const));

export function getFeatureFlagDefinition(
  key: FeatureFlagKey,
): FeatureFlagDefinition | undefined {
  return FEATURE_FLAG_INDEX.get(key);
}

export function listFeatureFlags(): ReadonlyArray<FeatureFlagDefinition> {
  return FEATURE_FLAGS;
}
