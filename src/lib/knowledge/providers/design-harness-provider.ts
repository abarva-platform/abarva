/**
 * DesignHarnessProvider: illustrative prototype data ONLY, for local development
 * and visual review of Knowledge UI layout/interaction. Mirrors the mock data
 * shape from the airline-demo-new Knowledge prototype (xdc-script.js).
 *
 * Hard rule (feedback_governed_ui_provider_render_gate): this provider must never
 * be selectable for a governed/canonical tenant, in development or production.
 * `assertDesignHarnessAllowed` is the single enforcement point -- call it before
 * constructing this provider anywhere it could plausibly be reached from a route
 * that also serves real tenants.
 */

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import type { GovernedKnowledgeProvider } from "./governed-knowledge-provider";

/**
 * Tenants that are real, in-progress (or synthetic-fixture) tenants but are not
 * yet in CANONICAL_TENANT_KEYS or datasets/tenant-inputs/tenant-input-registry.json
 * on every branch -- confirmed for airline-demo-new by both the 2026-07-29 lineage
 * audit (SD-15: correctly absent from CANONICAL_TENANTS.ts on every branch checked)
 * and this session's own check of this branch. Relying on CANONICAL_TENANT_KEYS
 * alone would let illustrative data flow under a real tenant key just because
 * registration hasn't landed on this branch yet -- exactly the gap this list closes.
 * Remove an entry only once the tenant is confirmed registered AND the removal is
 * intentional, not just because the check stopped throwing.
 */
const RESERVED_IN_FLIGHT_TENANT_KEYS: readonly string[] = [
  "airline-demo-new",
  "healthcare-demo-new",
];

export class DesignHarnessNotAllowedError extends Error {
  constructor(tenantKey: string) {
    super(
      `DesignHarnessProvider cannot be selected for tenant "${tenantKey}": it is a ` +
        "canonical tenant. Illustrative data must never reach a governed tenant's UI, " +
        "in any environment. Use GovernedKnowledgeProvider instead.",
    );
    this.name = "DesignHarnessNotAllowedError";
  }
}

/** Throws if `tenantKey` is a real canonical tenant (airline-demo-new included --
 * it IS canonical; illustrative data does not become acceptable just because the
 * live data isn't reconciled yet). Call this before any DesignHarnessProvider use. */
export function assertDesignHarnessAllowed(tenantKey: string): void {
  if (
    (CANONICAL_TENANT_KEYS as readonly string[]).includes(tenantKey) ||
    RESERVED_IN_FLIGHT_TENANT_KEYS.includes(tenantKey)
  ) {
    throw new DesignHarnessNotAllowedError(tenantKey);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DesignHarnessProvider is disabled in production regardless of tenant key.",
    );
  }
}

/**
 * Placeholder factory -- the real illustrative dataset (ported from the
 * prototype's mock constants) is bulk-build scope, not foundational scaffolding.
 * This stub exists so the guard above has something concrete to gate, and so
 * call sites can be written against the final shape now.
 */
export function createDesignHarnessProvider(
  devTenantKey: string,
): GovernedKnowledgeProvider {
  assertDesignHarnessAllowed(devTenantKey);
  throw new Error(
    "createDesignHarnessProvider: illustrative dataset not yet ported from the " +
      "prototype. See KNOWLEDGE_UI_IMPLEMENTATION_PLAN.md for build sequencing.",
  );
}
