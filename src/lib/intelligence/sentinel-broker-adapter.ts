import 'server-only';

import {
  buildEnterpriseAgentContextBundle,
  type EnterpriseAgentContextBundle,
  type EnterpriseAgentContextRequest,
  type EnterpriseAgentName,
  type EnterpriseContextSurface,
} from '@/lib/knowledge/agent-context-broker';
import { assertTenantAlignmentWithJwt } from '@/lib/rls/tenant-alignment';

// Sentinel-side adapter · Surface 2 PR-INT-A.
//
// Mirror of ProgramsBrokerAdapter, scoped to the Intelligence surface.
// Sentinel is the librarian agent — corpus-wide retrieval and citation
// discipline — so:
//   • agentName defaults to 'Sentinel'
//   • surface defaults to the semantic 'intelligence' broker key
//   • programId is OPTIONAL because Intelligence reasons across the
//     corpus, not inside one program scope
//
// Per the broker boundary doc: app-tier code (agents, routes, components)
// must NOT directly import EnterpriseDataRoom seeds, vector stores, or
// graph stores. Every Intelligence-surface read goes through this seam.
//
// Phase 5 · Step 9 · Tenant alignment gate:
// buildSentinelContextBundleVerified() asserts JWT tenant matches the
// requested tenantKey before invoking the broker. Call this variant from
// API routes. buildSentinelContextBundle() (no-assert variant) remains for
// internal/service-role call sites where JWT is not present.

export interface SentinelBrokerRequest {
  /** Tenant client key, e.g. 'apex-retail'. */
  tenantKey: string;
  /** Optional program scope. Sentinel reasons corpus-wide by default. */
  programId?: string;
  /** Agent acting in this turn; defaults to 'Sentinel'. */
  agentName?: EnterpriseAgentName;
  /** Optional broker surface; defaults to the semantic Intelligence surface. */
  surface?: EnterpriseContextSurface;
  /** Forwarded to the broker contract; defaults to false. */
  allowL4RawContext?: boolean;
  /** Forwarded to the broker contract; defaults to false. */
  includeGraphNeighborhood?: boolean;
  /** Forwarded to the broker contract; broker chooses when omitted. */
  requestedDomains?: EnterpriseAgentContextRequest['requestedDomains'];
}

export function buildSentinelContextBundle(
  request: SentinelBrokerRequest,
): EnterpriseAgentContextBundle {
  return buildEnterpriseAgentContextBundle({
    tenantKey: request.tenantKey,
    programId: request.programId,
    agentName: request.agentName ?? 'Sentinel',
    surface: request.surface ?? 'intelligence',
    allowL4RawContext: request.allowL4RawContext ?? false,
    includeGraphNeighborhood: request.includeGraphNeighborhood ?? false,
    requestedDomains: request.requestedDomains,
  });
}

// Tenant-verified variant. Throws a structured error if the JWT claim
// does not match the requested tenantKey. Use in API routes where the
// authenticated user context is available.
export async function buildSentinelContextBundleVerified(
  request: SentinelBrokerRequest,
): Promise<EnterpriseAgentContextBundle> {
  const alignmentError = await assertTenantAlignmentWithJwt(request.tenantKey);
  if (alignmentError) {
    const err = new Error(alignmentError.message) as Error & { code: string; jwtTenantKey: string | null };
    err.code = alignmentError.code;
    err.jwtTenantKey = alignmentError.jwtTenantKey;
    throw err;
  }
  return buildSentinelContextBundle(request);
}
