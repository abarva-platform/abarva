import 'server-only';

import {
  buildEnterpriseAgentContextBundle,
  type EnterpriseAgentContextBundle,
  type EnterpriseAgentContextRequest,
  type EnterpriseAgentName,
  type EnterpriseContextSurface,
} from '@/lib/knowledge/agent-context-broker';

export interface ProgramsBrokerRequest {
  /** Tenant client key, e.g. 'apex-retail'. */
  tenantKey: string;
  /** Program id to scope the broker request. */
  programId: string;
  /** Agent acting in this turn. Determines what the broker reveals. */
  agentName: EnterpriseAgentName;
  /** Optional broker surface; defaults to the semantic Programs surface. */
  surface?: EnterpriseContextSurface;
  /** Forwarded to the broker contract; defaults to false. */
  allowL4RawContext?: boolean;
  /** Forwarded to the broker contract; defaults to false. */
  includeGraphNeighborhood?: boolean;
  /** Forwarded to the broker contract; broker chooses when omitted. */
  requestedDomains?: EnterpriseAgentContextRequest['requestedDomains'];
}

export function buildProgramsContextBundle(
  request: ProgramsBrokerRequest,
): EnterpriseAgentContextBundle {
  return buildEnterpriseAgentContextBundle({
    tenantKey: request.tenantKey,
    programId: request.programId,
    agentName: request.agentName,
    surface: request.surface ?? 'programs',
    allowL4RawContext: request.allowL4RawContext ?? false,
    includeGraphNeighborhood: request.includeGraphNeighborhood ?? false,
    requestedDomains: request.requestedDomains,
  });
}
