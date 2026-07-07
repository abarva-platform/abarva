// Tenant invariant for durable deliverable generation.
//
// The run row is not an authority for tenant ownership. It is an instruction
// queued by a request. Before enqueueing or processing a Move deliverable, verify
// the source Move still belongs to the same client/tenant as the run.

import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import type { DeliverableModule } from "./types";

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

interface SourceOwner {
  clientId: string | null;
  tenantKey: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TenantInvariantResult =
  | { ok: true; sourceKind: "move" | "source_event" | "unsupported"; sourceId: string | null }
  | {
      ok: false;
      code: "source_not_found" | "tenant_mismatch";
      sourceKind: "move" | "source_event";
      sourceId: string;
      detail: string;
      expectedClientId: string;
      expectedTenantKey: string;
      actualClientId: string | null;
      actualTenantKey: string | null;
    };

export interface ValidateTenantInvariantInput {
  module: DeliverableModule | string;
  sourceArtifactRef: string;
  clientId: string;
  tenantKey: string;
}

function moveIdFromSourceRef(sourceArtifactRef: string): string {
  const trimmed = sourceArtifactRef.trim();
  const match = /^move:([^:]+)(?::|$)/.exec(trimmed);
  return (match?.[1] ?? trimmed).trim();
}

function sourceEventIdFromSourceRef(sourceArtifactRef: string): string {
  const trimmed = sourceArtifactRef.trim();
  const match = /^source(?:_event)?:([^:]+)(?::|$)/.exec(trimmed);
  return (match?.[1] ?? trimmed).trim();
}

async function lookupMoveOwner(moveId: string, db: DbClient): Promise<SourceOwner | null> {
  let query = db
    .from("engagements")
    .select("id, graph_node_id, client_id");
  query = UUID_RE.test(moveId) ? query.eq("id", moveId) : query.eq("graph_node_id", moveId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`tenant invariant move lookup failed: ${error.message}`);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const clientId = typeof row.client_id === "string" ? row.client_id : null;
  const tenantKey = clientId ? await lookupClientTenantKey(clientId, db) : null;
  return {
    clientId,
    tenantKey,
  };
}

async function lookupClientTenantKey(clientId: string, db: DbClient): Promise<string | null> {
  const { data, error } = await db
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw new Error(`tenant invariant client lookup failed: ${error.message}`);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  for (const key of ["tenant_key", "key", "slug"]) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

async function lookupSourceEventOwner(sourceEventId: string, db: DbClient): Promise<SourceOwner | null> {
  let query = db
    .from("source_events")
    .select("id, event_code, client_key");
  query = UUID_RE.test(sourceEventId) ? query.eq("id", sourceEventId) : query.eq("event_code", sourceEventId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`tenant invariant source-event lookup failed: ${error.message}`);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const tenantKey = typeof row.client_key === "string" ? row.client_key : null;
  return {
    clientId: null,
    tenantKey,
  };
}

function compareOwner(args: {
  sourceKind: "move" | "source_event";
  sourceId: string;
  owner: SourceOwner | null;
  expectedClientId: string;
  expectedTenantKey: string;
}): TenantInvariantResult {
  const expectedTenant = canonicalTenantKey(args.expectedTenantKey);
  const actualTenant = args.owner?.tenantKey ? canonicalTenantKey(args.owner.tenantKey) : null;
  if (!args.owner) {
    return {
      ok: false,
      code: "source_not_found",
      sourceKind: args.sourceKind,
      sourceId: args.sourceId,
      detail: `${args.sourceKind} source was not found for deliverable generation.`,
      expectedClientId: args.expectedClientId,
      expectedTenantKey: expectedTenant,
      actualClientId: null,
      actualTenantKey: null,
    };
  }

  const clientMatches = !args.owner.clientId || args.owner.clientId === args.expectedClientId;
  const tenantMatches = actualTenant === expectedTenant;
  // Moves are authored under engagements.client_id. Some lab schemas do not
  // duplicate tenant_key on engagements (or even clients), so a verified
  // source client match is enough when no tenant key can be resolved.
  const clientOnlyMatch = clientMatches && Boolean(args.owner.clientId) && !args.owner.tenantKey;
  if (clientMatches && (tenantMatches || clientOnlyMatch)) {
    return { ok: true, sourceKind: args.sourceKind, sourceId: args.sourceId };
  }

  return {
    ok: false,
    code: "tenant_mismatch",
    sourceKind: args.sourceKind,
    sourceId: args.sourceId,
    detail: `${args.sourceKind} source tenant does not match the active generation tenant.`,
    expectedClientId: args.expectedClientId,
    expectedTenantKey: expectedTenant,
    actualClientId: args.owner.clientId,
    actualTenantKey: actualTenant,
  };
}

export async function validateDeliverableTenantInvariant(
  input: ValidateTenantInvariantInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<TenantInvariantResult> {
  if (input.module === "moves") {
    const sourceId = moveIdFromSourceRef(input.sourceArtifactRef);
    return compareOwner({
      sourceKind: "move",
      sourceId,
      owner: await lookupMoveOwner(sourceId, db),
      expectedClientId: input.clientId,
      expectedTenantKey: input.tenantKey,
    });
  }

  if (input.module === "source") {
    const sourceId = sourceEventIdFromSourceRef(input.sourceArtifactRef);
    return compareOwner({
      sourceKind: "source_event",
      sourceId,
      owner: await lookupSourceEventOwner(sourceId, db),
      expectedClientId: input.clientId,
      expectedTenantKey: input.tenantKey,
    });
  }

  return { ok: true, sourceKind: "unsupported", sourceId: null };
}

export function tenantInvariantHttpStatus(result: Exclude<TenantInvariantResult, { ok: true }>): number {
  return result.code === "source_not_found" ? 404 : 403;
}
