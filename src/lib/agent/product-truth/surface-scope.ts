// Global aVa Product Truth + Scope Guard — surface scope registry.
//
// What each surface's agent is allowed to answer, and what it must not
// claim about capabilities outside its own surface. Deliberately thin: the
// per-agent voice doctrines (src/lib/agent/voice-doctrine/*.ts) already own
// tone/word-cap/persona rules per surface; this registry owns only the
// product-truth dimension — which surface owns which capability claims, so
// e.g. Home's aVa doesn't claim a Source-only capability is available on
// Home.

export type ProductSurfaceKey =
  | "moves"
  | "source"
  | "tower"
  | "home"
  | "intelligence"
  | "setup";

export interface SurfaceScopeEntry {
  surface: ProductSurfaceKey;
  /** What this surface's agent may answer from its own deterministic state. */
  ownedScope: string;
  /** Surfaces this agent may hand off to when the question leaves its scope. */
  handoffTargets: readonly ProductSurfaceKey[];
  /** What this surface must redirect elsewhere rather than answer directly. */
  redirectScope: string;
}

export const SURFACE_SCOPE_REGISTRY: ReadonlyArray<SurfaceScopeEntry> = [
  {
    surface: "moves",
    ownedScope:
      "Phase state, checklist, gate criteria, evidence gaps, feed-forward, approved Inputs Packs for the active Move.",
    handoffTargets: ["intelligence", "source", "tower"],
    redirectScope:
      "Broad ad hoc industry/market strategy not tied to the active Move → Intelligence. Vendor/contract/commercial validation → Source. Value measurement/metric contracts → Tower.",
  },
  {
    surface: "source",
    ownedScope:
      "Sourcing-event state: stage gates, vendor responses, pricing, value levers, for the active event.",
    handoffTargets: ["moves", "tower"],
    redirectScope:
      "Move-level phase/workflow questions → Moves. Portfolio-wide value measurement → Tower.",
  },
  {
    surface: "tower",
    ownedScope: "Portfolio/initiative value, adoption, and metric-contract state.",
    handoffTargets: ["moves", "source"],
    redirectScope:
      "How to execute a specific Move's phase work → Moves. Sourcing/vendor mechanics → Source.",
  },
  {
    surface: "home",
    ownedScope: "Tenant context/evidence coverage and what's loaded vs. answerable.",
    handoffTargets: ["intelligence"],
    redirectScope: "Advisory/strategic synthesis → Intelligence.",
  },
  {
    surface: "intelligence",
    ownedScope: "Tenant-grounded advisory synthesis across the whole context corpus.",
    handoffTargets: ["moves", "source", "tower"],
    redirectScope:
      "Executing a specific Move/sourcing-event/Tower action → the owning surface (Moves/Source/Tower).",
  },
  {
    surface: "setup",
    ownedScope: "Data-health, coverage, ingestion, and governance state for the tenant.",
    handoffTargets: ["intelligence"],
    redirectScope: "Advisory synthesis over that data → Intelligence.",
  },
] as const;

export function getSurfaceScope(surface: string): SurfaceScopeEntry | undefined {
  return SURFACE_SCOPE_REGISTRY.find((entry) => entry.surface === surface);
}
