// scripts/tenant-bootstrap-verify.ts
//
// A2c · the critical assertion: for a given tenant, the broker must
// emit non-empty data for all 15 coverage-by-domain tiles AND all 6
// synthesized context cards.
//
// Why this step exists. The audit 2026-05-13 found that the
// seed → broker → UI pipeline is many-to-many. Loading the 14-segment
// folder is necessary but not sufficient; the broker has to
// successfully normalize + synthesize the rendered shape, or the
// /intelligence#enterprise-context surface ships blank tiles to the
// CXO. This module is what makes `tenant-bootstrap` a real verb.
//
// Shape:
//   - Pulls the enterprise-context overview the same way the UI does
//     (via lib/enterprise-context/intelligence-read-model)
//   - Returns a structured report the orchestrator can pretty-print
//   - Pure function modulo the DB read, so it can be exercised from a
//     unit test by mocking the read-model
//
// Not done in this slice (carry-forward):
//   - Actual hit against a deployed Azure Container App (#1950) — that
//     comes once Key Vault env projection lands and /api/health is wired
//   - Multi-region / multi-tenant batch run

import type { ClientKey } from '@/lib/client-config';

const EXPECTED_COVERAGE_TILES = [
  'org_decision_rights',
  'facilities_business_units',
  'cmdb_applications_services',
  'ci_relationships_dependencies',
  'vendors_contract_inventory',
  'renewal_calendar',
  'spend_baseline',
  'policies_procedures',
  'incidents',
  'problems',
  'changes',
  'slas',
  'initiative_portfolio',
  'data_domains_stewardship',
  'risk_compliance_register',
] as const;

const EXPECTED_CONTEXT_CARDS = [
  'platform-and-service-reliability',
  'incident-problem-pressure',
  'contract-renewal-exposure',
  'spend-baseline-confidence',
  'policy-ai-guardrails',
  'initiative-dependency-map',
] as const;

export interface VerifyTenantRenderReport {
  ok: boolean;
  tenant: ClientKey;
  tilesPopulated: number;
  cardsPopulated: number;
  missingTiles: string[];
  missingCards: string[];
  warnings: string[];
}

/**
 * Verify that the broker emits a complete enterprise-context overview
 * for the given tenant. Returns a structured report; never throws on
 * "data missing" — callers check `report.ok`.
 *
 * Throws only if the underlying read-model module fails to load (e.g.,
 * missing env vars). That's a configuration error, not a verification
 * failure.
 */
export async function verifyTenantRender(
  tenant: ClientKey,
): Promise<VerifyTenantRenderReport> {
  const warnings: string[] = [];

  // Dynamic import keeps the orchestrator's compile graph light when
  // the user just runs --help or --dry-run.
  let buildEnterpriseContextOverview: (
    args: { tenantKey: ClientKey },
  ) => Promise<{
    domainsCoverage?: ReadonlyArray<{ domain: string; rowCount: number }>;
    cards?: ReadonlyArray<{ key: string }>;
    counts?: Record<string, number>;
  }>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (await import('@/lib/enterprise-context/intelligence-read-model')) as any;
    if (typeof mod.buildEnterpriseContextOverview !== 'function') {
      throw new Error(
        'enterprise-context/intelligence-read-model does not export buildEnterpriseContextOverview. ' +
          'Update verify-render to match the current read-model API.',
      );
    }
    buildEnterpriseContextOverview = mod.buildEnterpriseContextOverview;
  } catch (err) {
    throw new Error(
      `Could not load enterprise-context read-model: ${err instanceof Error ? err.message : err}`,
    );
  }

  let overview: Awaited<ReturnType<typeof buildEnterpriseContextOverview>>;
  try {
    overview = await buildEnterpriseContextOverview({ tenantKey: tenant });
  } catch (err) {
    throw new Error(
      `read-model invocation threw: ${err instanceof Error ? err.message : err}`,
    );
  }

  const populatedTiles = new Set<string>();
  for (const tile of overview.domainsCoverage ?? []) {
    if (tile.rowCount > 0) populatedTiles.add(tile.domain);
  }
  const missingTiles = EXPECTED_COVERAGE_TILES.filter((t) => !populatedTiles.has(t));

  const cardKeys = new Set<string>(
    (overview.cards ?? []).map((c) => c.key),
  );
  const missingCards = EXPECTED_CONTEXT_CARDS.filter((c) => !cardKeys.has(c));

  if (overview.counts?.evidence != null && overview.counts.evidence === 0) {
    warnings.push(
      'broker reports 0 evidence rows for tenant; context cards may render but with low confidence',
    );
  }

  return {
    ok: missingTiles.length === 0 && missingCards.length === 0,
    tenant,
    tilesPopulated: EXPECTED_COVERAGE_TILES.length - missingTiles.length,
    cardsPopulated: EXPECTED_CONTEXT_CARDS.length - missingCards.length,
    missingTiles,
    missingCards,
    warnings,
  };
}
