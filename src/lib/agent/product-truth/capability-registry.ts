// Global aVa Product Truth + Scope Guard — capability registry.
//
// Curated, machine-readable subset of docs/architecture/specialist-catalog.md
// (the `not_built` / `partial` entries — the ones an agent could plausibly
// overclaim) plus the tenant-gated flags from src/lib/features/registry.ts
// and the public platform "what AbarVa is NOT" facts
// (src/app/(maestro)/platform/page.tsx). This is a curated subset, not a
// full mirror — expand it as new overclaim risks are found, keeping the
// `implementation_pointer`/source comment on each entry so it stays
// traceable back to the catalog or registry it was seeded from.

import type { ProductCapabilityEntry } from "./types";

export const PRODUCT_CAPABILITY_REGISTRY: ReadonlyArray<ProductCapabilityEntry> = [
  // ── Setup / Admin (Steward) — not_built, per specialist-catalog.md §5.1 ──
  {
    key: "coverage_scorer",
    surface: "setup",
    label: "per-segment coverage scoring against tenant baselines",
    maturity: "not_built",
    claimGuidance:
      "This is cataloged as a concept only — no coverage score exists yet. Say it is not built, not that it runs.",
    triggerPhrases: [
      /coverage score/i,
      /scores? .*(coverage|completeness) per segment/i,
    ],
  },
  {
    key: "staleness_detector",
    surface: "setup",
    label: "automatic staleness detection against freshness thresholds",
    maturity: "not_built",
    claimGuidance:
      "No automatic staleness flagging exists yet. Do not claim records are auto-flagged as stale.",
    triggerPhrases: [/(automatically |auto-)?flags? (records |data )?(older than|stale)/i],
  },

  // ── Intelligence (Sentinel) — partial, per specialist-catalog.md §8 ──
  {
    key: "four_mode_router",
    surface: "intelligence",
    label: "4-mode toggle UI for Intelligence answer routing",
    maturity: "partial",
    claimGuidance:
      "The routing logic exists but the 4-mode toggle UI is not complete. Do not claim the user can switch modes in the UI today.",
    triggerPhrases: [/(switch|toggle|select) (between |among )?(the )?(four|4) modes?/i],
  },

  // ── Moves (Nexus) — tenant-gated pilot flags, per src/lib/features/registry.ts ──
  {
    key: "moves_orchestrated_deliverables",
    surface: "moves",
    label: "Claude-authored (orchestrated) board-grade deliverables",
    maturity: "pilot_tenant_only",
    pilotTenants: ["skyharbor", "lakeshore"],
    claimGuidance:
      "Orchestrated authoring is live only for the enrolled pilot tenants — other tenants get the deterministic template deck. Never claim this runs for a tenant not in pilotTenants.",
    triggerPhrases: [/orchestrated (deliverable|business.case)/i, /claude.authored deck/i],
  },
  {
    key: "moves_pattern_assembly",
    surface: "moves",
    label: "Claude-assembled candidate solution options",
    maturity: "pilot_tenant_only",
    pilotTenants: ["lakeshore", "skyharbor"],
    claimGuidance:
      "Pattern assembly is live only for enrolled pilot tenants. Never imply every tenant has this button.",
    triggerPhrases: [/assemble(s)? solution options/i, /pattern assembly/i],
  },
  {
    key: "moves_workforce_economics",
    surface: "moves",
    label: "Workforce Economics estimate-twice view",
    maturity: "pilot_tenant_only",
    pilotTenants: ["lakeshore"],
    claimGuidance:
      "This attaches to the Costed Business-Case Pack only for enrolled tenants, and only when the Move resolves to a curated Domain Function Pack. Do not claim it's universally available.",
    triggerPhrases: [/estimate.twice/i, /workforce economics/i],
  },
  {
    key: "moves_decision_storytelling",
    surface: "moves",
    label: "exhibit-led executive deck (decision storytelling)",
    maturity: "pilot_tenant_only",
    pilotTenants: ["lakeshore"],
    claimGuidance:
      "Decision-storytelling decks are pilot-only for enrolled tenants. Do not claim every deliverable renders this way.",
    triggerPhrases: [/decision.storytelling/i, /exhibit.led (executive )?deck/i],
  },

  // ── Platform-level — what AbarVa is NOT, per src/app/(maestro)/platform/page.tsx ──
  {
    key: "platform_not_data_platform",
    surface: "platform",
    label: "a data platform / data warehouse replacement",
    maturity: "not_built",
    claimGuidance:
      "AbarVa consumes tenant data; it does not replace Snowflake, Databricks, or the modern data stack. Never claim AbarVa is or replaces a data platform.",
    triggerPhrases: [/replaces? (snowflake|databricks|your data (warehouse|platform|stack))/i],
  },
  {
    key: "platform_not_rpa",
    surface: "platform",
    label: "an RPA / task-automation platform",
    maturity: "not_built",
    claimGuidance:
      "AbarVa orchestrates decisions and intelligence; task automation is not its surface. Never claim it replaces an RPA tool.",
    triggerPhrases: [/replaces? (your )?(rpa|robotic process automation)/i],
  },
  {
    key: "platform_not_consulting_replacement",
    surface: "platform",
    label: "a consulting-firm replacement",
    maturity: "not_built",
    claimGuidance:
      "AbarVa augments expertise with platform infrastructure; senior human judgment still anchors material decisions. Never claim AbarVa replaces consultants or a consulting engagement outright.",
    triggerPhrases: [
      /replaces? (your |the )?consult(ing|ants?)/i,
      /no longer need(s)? (a |your )?consult(ing firm|ants?)/i,
    ],
  },
] as const;

const REGISTRY_BY_KEY: ReadonlyMap<string, ProductCapabilityEntry> = new Map(
  PRODUCT_CAPABILITY_REGISTRY.map((entry) => [entry.key, entry] as const),
);

export function getCapabilityEntry(key: string): ProductCapabilityEntry | undefined {
  return REGISTRY_BY_KEY.get(key);
}

export function listNotBuiltCapabilities(): ReadonlyArray<ProductCapabilityEntry> {
  return PRODUCT_CAPABILITY_REGISTRY.filter((entry) => entry.maturity === "not_built");
}

/**
 * Whether a pilot_tenant_only capability is actually live for the given
 * tenant key. Returns true unconditionally for shipped capabilities, false
 * for not_built, and checks pilotTenants membership for pilot_tenant_only /
 * partial (partial capabilities are never fully "live").
 */
export function isCapabilityLiveForTenant(
  key: string,
  tenantKey: string | null | undefined,
): boolean {
  const entry = getCapabilityEntry(key);
  if (!entry) return true; // unknown key — not this registry's concern
  if (entry.maturity === "shipped") return true;
  if (entry.maturity === "not_built" || entry.maturity === "partial") return false;
  if (!tenantKey) return false;
  return (entry.pilotTenants ?? []).includes(tenantKey);
}
