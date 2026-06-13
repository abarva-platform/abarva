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
  | "graph_neo4j_enabled"
  | "tower_synthesis_apex_demo_fixture"
  | "discovery_intake_v2"
  | "moves_orchestrated_deliverables"
  | "workspace_explorer_source"
  | "workspace_explorer_moves";

export const FEATURE_FLAGS: ReadonlyArray<FeatureFlagDefinition> = [
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
    key: "moves_orchestrated_deliverables",
    summary:
      "Author Move board-grade deliverables through the Deliverable Intelligence Orchestrator (governed multi-pass Claude authoring) instead of the deterministic template renderer. Quality/plan gates enforced; falls back to the deterministic deck when the gate blocks. Tenant opt-in; default off so the deterministic path stays the norm until proven per tenant.",
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
