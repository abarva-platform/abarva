import 'server-only';

import {
  buildEnterpriseAgentContextBundle,
  buildEnterpriseAgentContextBundleAsync,
  type EnterpriseAgentContextBundle,
  type EnterpriseAgentContextRequest,
  type EnterpriseAgentName,
  type EnterpriseContextSurface,
} from '@/lib/knowledge/agent-context-broker';

export interface ProgramsBrokerRequest {
  /** Tenant client key, e.g. 'apex-retail'. */
  tenantKey: string;
  /**
   * Program id to scope the broker request. Optional because the
   * /programs list surface has no active program — the broker still
   * returns tenant-wide context (people, program inventory) on that
   * surface.
   */
  programId?: string;
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

/**
 * TD-5 — async two-source variant. Routes the same Programs broker
 * request through {@link buildEnterpriseAgentContextBundleAsync},
 * which prefers persisted tenant data when the adapter reports rows
 * for the tenant and otherwise falls back to the synchronous fixture
 * path. Surface, defaults, and bundle shape match the sync entry
 * point above.
 */
export function buildProgramsContextBundleAsync(
  request: ProgramsBrokerRequest,
): Promise<EnterpriseAgentContextBundle> {
  return buildEnterpriseAgentContextBundleAsync({
    tenantKey: request.tenantKey,
    programId: request.programId,
    agentName: request.agentName,
    surface: request.surface ?? 'programs',
    allowL4RawContext: request.allowL4RawContext ?? false,
    includeGraphNeighborhood: request.includeGraphNeighborhood ?? false,
    requestedDomains: request.requestedDomains,
  });
}

/**
 * PR-R · format the broker bundle into a prompt block for Nexus on
 * the /programs surfaces. Founder feedback #1: "[Nexus] does not have
 * the context of existing org structure ... who is who in IT".
 *
 * The block names the tenant, lists the executive bench (people
 * domain) with role + decision rights, and lists the program
 * inventory. Provenance and citations are intentionally omitted — the
 * goal is to ground Nexus in *who* and *what*, not to surface broker
 * internals to the model.
 *
 * Returns '' if the bundle has no people / no programs (so the system
 * prompt stays clean for unknown tenants).
 */
export function formatProgramsBrokerBundleForPrompt(
  bundle: EnterpriseAgentContextBundle,
): string {
  const tenantSummary = bundle.items.find((i) => i.kind === 'tenant_summary');
  const people = bundle.items.filter((i) => i.kind === 'person');
  const programs = bundle.items.filter((i) => i.kind === 'program');
  // TD-5 — persisted-source bundles carry these new kinds. The fixture
  // path never emits them, so the sections only appear when the
  // adapter served the bundle. Rendered as small, bounded blocks so
  // prompt budget is respected.
  const kpis = bundle.items.filter((i) => i.kind === 'kpi_metric');
  const crossProgramSignals = bundle.items.filter(
    (i) => i.kind === 'cross_program_signal',
  );

  if (
    people.length === 0 &&
    programs.length === 0 &&
    kpis.length === 0 &&
    crossProgramSignals.length === 0 &&
    !tenantSummary
  ) {
    return '';
  }

  const sections: string[] = ['TENANT CONTEXT (from broker — use this when the user references roles, people, or other programs):'];

  if (tenantSummary) {
    sections.push(`Tenant: ${tenantSummary.title}. ${tenantSummary.summary}`);
  }

  if (people.length > 0) {
    sections.push(
      'Executive bench / IT leadership:',
      ...people.map((p) => `  - ${p.title}. ${p.summary}`),
    );
  }

  if (programs.length > 0) {
    sections.push(
      'Active program inventory:',
      ...programs.map((p) => `  - ${p.title} — ${p.summary}`),
    );
  }

  if (kpis.length > 0) {
    sections.push(
      'KPI dictionary (current vs target with provenance):',
      ...kpis.map((k) => `  - ${k.title}. ${k.summary}`),
    );
  }

  if (crossProgramSignals.length > 0) {
    sections.push(
      'Cross-program signals (portfolio-wide patterns):',
      ...crossProgramSignals.map((s) => `  - ${s.title}. ${s.summary}`),
    );
  }

  sections.push(
    'Use these names verbatim when discussing sponsorship, leadership, or escalation. Do not invent role titles or people the bench does not list.',
  );

  return sections.join('\n');
}
