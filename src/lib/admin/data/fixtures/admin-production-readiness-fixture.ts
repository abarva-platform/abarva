/**
 * ADMIN-DATA2 — Admin production-readiness fixture.
 *
 * Lifts HISTORY_STRIP from `production-readiness-page-view.ts` and combines
 * with AdminBlockerRow data from the blockers fixture.
 */

import type {
  AdminProductionReadinessSnapshot,
  AdminReadinessHistoryEntry,
  AdminReadinessTile,
} from '../admin-production-readiness-adapter-types';
import { adminBlockersFixture } from './admin-blockers-fixture';

const GENERATED_AT = '2026-04-26T00:00:00.000Z';

const HISTORY: ReadonlyArray<AdminReadinessHistoryEntry> = [
  {
    at: '2026-04-27',
    scope: 'pilot',
    status: 'partial',
    note: 'Connector blockers added (W32F seed expansion).',
  },
  {
    at: '2026-04-21',
    scope: 'production',
    status: 'blocked',
    note: 'SOC2 audit not initiated — production stays blocked.',
  },
  {
    at: '2026-04-14',
    scope: 'demo',
    status: 'ready',
    note: 'Apex Retail rich seed approved; guided demo cleared.',
  },
  {
    at: '2026-04-07',
    scope: 'pilot',
    status: 'partial',
    note: 'Identity connector verified; access path unblocked.',
  },
  {
    at: '2026-03-31',
    scope: 'demo',
    status: 'partial',
    note: 'Initial Apex seed staged; guided demo provisional.',
  },
];

export function adminProductionReadinessFixture(
  tenantSlug: string,
): AdminProductionReadinessSnapshot {
  if (tenantSlug !== 'apex-retail') {
    return {
      tenantSlug,
      tiles: [],
      blockers: [],
      history: [],
      generatedAt: GENERATED_AT,
    };
  }

  const blockers = adminBlockersFixture(tenantSlug);
  const pilotImpact = blockers.filter((b) => b.pilotImpact);
  const productionImpact = blockers.filter((b) => b.productionImpact);

  const tiles: ReadonlyArray<AdminReadinessTile> = [
    {
      scope: 'demo',
      status: 'ready',
      failingCriteria: [],
    },
    {
      scope: 'pilot',
      status: pilotImpact.length > 0 ? 'partial' : 'ready',
      failingCriteria: [
        'Connectors configured',
        'Evidence approved',
      ],
    },
    {
      scope: 'production',
      status: productionImpact.length > 0 ? 'blocked' : 'partial',
      failingCriteria: [
        'Model gateway live',
        'SOC2 controls met',
      ],
    },
  ];

  return {
    tenantSlug,
    tiles,
    blockers,
    history: HISTORY,
    generatedAt: GENERATED_AT,
  };
}
