// Whether the signed-in tenancy context may read a Move on the engagement
// console.
//
// `/engagements/[engagementId]` is a LIVE Moves surface — the path lights the
// Moves nav tab in both chromes — and it loaded its Move with
// `getEngagementByAnyId(engagementId)`, which filters on the id alone. The
// client column is never named, and the client it reads through
// (`getAzureWriteFluentClient`) is the data-plane compat client, not a
// per-request session, so no row-level policy narrows it either. The route
// group's layout guards the responsible-AI acknowledgment and training only.
// A signed-in user of any tenant who held an engagement UUID or
// `graph_node_id` therefore rendered that Move's console: its name, sponsor,
// charter, phase rail, deliverables, topics, contradictions and recent turns.
//
// Every sibling Moves surface already fences. `strategic-moves/[moveId]/
// phase/[phaseNum]` resolves `requireTenancy()`; the program routes load
// through `getProgramById`, which filters on `ctx.clientId`.
//
// Why this is a decider over a swapped loader. `getProgramById` applies
// `canReadProgram`, which is tenancy AND per-Move RBAC (`programIdsAllowed`).
// Routing the console through it would add an authorization condition the page
// never had, and a user whose roster does not list the Move would lose a
// surface that works for them today. The fence this module states is the
// tenancy half only: nothing that reads today stops reading unless the Move
// belongs to a different client.
//
// What it deliberately does NOT decide. Two states fail OPEN, because
// refusing them would withdraw a working surface on something other than
// evidence of a cross-tenant read:
//
//   * The Move records no client. Seeded and legacy engagement rows carry a
//     null `client_id`, and a null is not a different tenant — it is a row
//     that cannot answer the question.
//   * The context resolves no client. `requireTenancy` throws for an
//     unauthenticated session, a missing active client and a tenant-lookup
//     outage alike, and an outage must not read as a tenant mismatch.
//
// Only a recorded client on BOTH sides, differing, is a refusal. That is the
// one state in which the page is certainly showing one tenant another
// tenant's Move.
//
// The comparison is case-insensitive on trimmed text. Both sides are UUIDs
// from the same column family and Postgres renders them lowercase, so a
// difference of case is a difference of spelling and not of tenant; deciding
// otherwise would turn a representation detail into a refusal. Tenant-key
// representation mismatch has already cost this product one silent emptiness,
// so the normalisation is stated here rather than assumed at the call site.

/** Why `decideEngagementTenantAccess` allowed or refused the read. */
export type EngagementTenantAccessReason =
  /** Both sides record the same client. */
  | "same_client"
  /** The Move records no client, so it cannot name a different one. */
  | "engagement_client_unrecorded"
  /** The request resolved no client — unauthenticated, no active client, or a lookup outage. */
  | "context_client_unresolved"
  /** Both sides record a client and they differ. The only refusal. */
  | "cross_tenant";

export type EngagementTenantAccessDecision = {
  /** May the console render this Move? */
  allow: boolean;
  reason: EngagementTenantAccessReason;
};

function normalized(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed.toLowerCase();
}

/**
 * Decide whether the engagement console may render a Move.
 *
 * `engagementClientId` is `engagements.client_id`; `contextClientId` is
 * `TenancyCtx.clientId`, or null when tenancy did not resolve. See the module
 * note for why only a definite mismatch refuses.
 */
export function decideEngagementTenantAccess(input: {
  engagementClientId?: string | null;
  contextClientId?: string | null;
}): EngagementTenantAccessDecision {
  const engagementClient = normalized(input.engagementClientId);
  if (engagementClient === null) {
    return { allow: true, reason: "engagement_client_unrecorded" };
  }
  const contextClient = normalized(input.contextClientId);
  if (contextClient === null) {
    return { allow: true, reason: "context_client_unresolved" };
  }
  return engagementClient === contextClient
    ? { allow: true, reason: "same_client" }
    : { allow: false, reason: "cross_tenant" };
}

/**
 * True when the console must refuse the read. The console answers a refusal
 * with `notFound()` — the same answer it already gives an id that resolves to
 * no Move — so a cross-tenant id cannot be distinguished from an absent one
 * and the surface confirms nothing about another tenant's records.
 */
export function engagementReadIsCrossTenant(input: {
  engagementClientId?: string | null;
  contextClientId?: string | null;
}): boolean {
  return !decideEngagementTenantAccess(input).allow;
}
