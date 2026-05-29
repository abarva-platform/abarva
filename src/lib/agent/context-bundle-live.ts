import 'server-only';

import {
  buildAgentContext,
  type AgentContextBundle,
  type AgentSurface,
} from './context-bundle';
import { isFixtureMode } from '@/lib/admin/data/admin-data-mode';
import { getAdminBlockers } from '@/lib/admin/data/admin-blockers-adapter';

/**
 * Server-only async variant of buildAgentContext that enriches with live DB
 * data when ADMIN_DATA_MODE=live. The base `context-bundle.ts` module is
 * intentionally browser-safe because client renderers import its constants and
 * types; live data access stays here so Azure/pg never enters client bundles.
 */
export async function buildAgentContextAsync(
  tenantSlug: string,
  surface: AgentSurface,
  page: string,
): Promise<AgentContextBundle> {
  const base = buildAgentContext(tenantSlug, surface, page);
  if (isFixtureMode()) return base;

  try {
    const liveBlockers = await getAdminBlockers(tenantSlug);
    const pageBlockers = liveBlockers
      .filter((b) => b.status === 'open' || b.status === 'in_progress')
      .slice(0, 5)
      .map((b) => ({ id: b.id, label: b.title, severity: b.severity }));
    return {
      ...base,
      blockers: pageBlockers,
      evidence: {
        ...base.evidence,
        sources: liveBlockers.length > 0 ? base.evidence.sources : 0,
        strength: pageBlockers.some((b) => b.severity === 'critical')
          ? 'thin'
          : base.evidence.strength,
      },
    };
  } catch {
    return base;
  }
}
