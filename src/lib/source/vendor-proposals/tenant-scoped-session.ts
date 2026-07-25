import "server-only";

// The tenant-context mechanism for the governed vendor-proposal-facts flow
// (RLS/tenant-isolation workstream, PR A). This is the first live
// application code path in this codebase that actually switches the
// Postgres connection into the restricted `authenticated` role and sets
// `request.jwt.claims` for a real request — the same mechanism
// tests/security/rls-regression.sql already uses to exercise RLS offline.
// Every other Source read/write path today runs under the app's elevated
// "control" connection and never assumes `authenticated`, which means the
// real (non-`USING (true)`) RLS policies already defined on many Source
// tables are currently decorative for live traffic — enabled, but never
// actually constraining the connecting role. This module is the fix, scoped
// to the vendor-proposal-facts tables: from here on, RLS on
// source_vendor_proposal_facts / source_vendor_proposal_fact_reviews is a
// REAL second line of defense behind the application-layer tenant/event
// checks already in vendor-proposal-facts.ts, not just an enabled-but-inert
// policy.
//
// `createTxSession` (azureSession.ts) already gives each call a real,
// individually-checked-out `pg` client wrapped in BEGIN/COMMIT/ROLLBACK —
// unlike the shared singleton connection behind postgresCompat.ts's fluent
// client (max: 1 by default, no transaction, no session isolation), a
// per-call `SET LOCAL ROLE` / `set_config(..., true)` here is scoped to
// exactly this transaction and is guaranteed to reset at COMMIT/ROLLBACK —
// safe even under connection-pool reuse.

import {
  createTxSession,
  type SqlRunner,
} from "@/lib/data-plane/read-adapters/azureSession";

const APPLICATION_NAME = "source-vendor-proposal-facts";

/**
 * The caller's real, server-resolved identity — never trusted from a
 * request body. Callers derive this from `requireTenancy()` /
 * `getActiveClientRow()` / `getCurrentUser()` at the route layer before
 * calling into this module.
 */
export interface VendorProposalFactsIdentity {
  /** Matches source_vendor_proposal_facts.client_key and
   * source_events.client_key — the app-era tenant key (e.g. "meridian"),
   * the same string current_tenant_key() resolves to for these tables. */
  tenantKey: string;
  /** Clerk publicMetadata.role, or a safe default. Not load-bearing for the
   * read/insert policies on these tables (they only require a tenant_key
   * match), but carried through for fidelity, audit, and is_maestro()
   * cross-tenant admin reads. */
  role: string;
  /** Clerk user id or resolved person id — the `sub` claim. */
  userId: string;
}

/**
 * Runs `fn` inside a real transaction with the connection switched to the
 * `authenticated` role and `request.jwt.claims` set to `identity`. Resets
 * automatically at COMMIT/ROLLBACK (role and GUC are transaction-scoped:
 * `SET LOCAL` and `set_config(..., is_local = true)`).
 */
export async function withVendorProposalFactsSession<T>(
  identity: VendorProposalFactsIdentity,
  fn: (run: SqlRunner) => Promise<T>,
): Promise<T> {
  const tx = createTxSession(APPLICATION_NAME);
  return tx(async (run) => {
    await run(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({
        tenant_key: identity.tenantKey,
        role: identity.role,
        sub: identity.userId,
      }),
    ]);
    // Role names cannot be parameterized in SET — this is a fixed literal,
    // never derived from caller input.
    await run(`SET LOCAL ROLE authenticated`, []);
    return fn(run);
  });
}
