import { CANONICAL_TENANT_KEYS } from '@/lib/tenant/aliases';

import { buildConnectorsPageView } from '@/lib/admin/connectors-page-view';
import { buildOverviewPageView } from '@/lib/admin/overview-page-view';
import { buildProductionReadinessPageView } from '@/lib/admin/production-readiness-page-view';
import { buildUsersAccessPageView } from '@/lib/admin/users-access-page-view';

import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentContextAsync } from '@/lib/agent/context-bundle-live';

// U-501 — the producer half of U-010.
//
// e49e6d5f2 (#2653) retired the admin provenance chips, and U-010 (#8104,
// merge d72030df3) removed the three dead props from the components that
// rendered them: `contextUsed` on StewardEditorial, `mode` and `agent` on
// ContextBar. It did not remove the admin page-view fields that fed them, so
// six view builders kept computing three values with no consumer.
//
// These are runtime key assertions, not source greps: a comment naming the
// field cannot satisfy them, and neither can a renamed symbol.
//
// Four of the six views are guarded here, not all six. `architecture` and
// `build-progress` are reached by no product entry point — `audit:lib-orphans`
// classifies both as unreferenced, and importing them here moved them, and
// seven modules behind them, to `testOnly`. That gate exists to catch exactly
// this: a test written for code nothing calls. Their retired fields are removed
// with the rest, because the removal is mechanical and typechecked, but a guard
// over an unmounted screen would be a coverage number with nothing behind it.
// Filed separately; see U-502.

const TENANT = CANONICAL_TENANT_KEYS[0];

type AnyRecord = Record<string, unknown>;

async function buildAll(): Promise<ReadonlyArray<readonly [string, AnyRecord]>> {
  const [connectors, overview, readiness, usersAccess] = await Promise.all([
    buildConnectorsPageView(TENANT),
    buildOverviewPageView(),
    buildProductionReadinessPageView(TENANT, 'Apex Retail Group'),
    buildUsersAccessPageView(TENANT),
  ]);
  return [
    ['connectors', connectors as unknown as AnyRecord],
    ['overview', overview as unknown as AnyRecord],
    ['production-readiness', readiness as unknown as AnyRecord],
    ['users-access', usersAccess as unknown as AnyRecord],
  ];
}

describe('U-501 — admin page views carry no field retired with the provenance chips', () => {
  let views: ReadonlyArray<readonly [string, AnyRecord]>;

  beforeAll(async () => {
    views = await buildAll();
  });

  it('builds every product-reached admin page view', () => {
    expect(views).toHaveLength(4);
  });

  describe('retired ContextBar inputs are absent from context', () => {
    for (const field of ['mode', 'agent'] as const) {
      it(`no admin view emits context.${field}`, () => {
        const offenders = views
          .filter(([, view]) => {
            const context = view.context as AnyRecord | undefined;
            return context !== undefined && Object.hasOwn(context, field);
          })
          .map(([name]) => name);
        expect(offenders).toEqual([]);
      });
    }
  });

  describe('retired StewardEditorial input is absent from editorial', () => {
    it('no admin view emits editorial.contextUsed', () => {
      const offenders = views
        .filter(([, view]) => {
          const editorial = view.editorial as AnyRecord | undefined;
          return editorial !== undefined && Object.hasOwn(editorial, 'contextUsed');
        })
        .map(([name]) => name);
      expect(offenders).toEqual([]);
    });
  });

  describe('the fields the surviving components DO read are still emitted', () => {
    // A removal that took the whole object with it would pass the assertions
    // above. These are the inputs ContextBar and StewardEditorial still
    // destructure, and every admin view that has a context/editorial block
    // must keep them.
    for (const field of ['tenant', 'data', 'liveStatus', 'liveStatusKind'] as const) {
      it(`every admin context still emits ${field}`, () => {
        const missing = views
          .filter(([, view]) => {
            const context = view.context as AnyRecord | undefined;
            return context !== undefined && !Object.hasOwn(context, field);
          })
          .map(([name]) => name);
        expect(missing).toEqual([]);
      });
    }

    for (const field of ['title', 'body', 'evidenceStrength', 'primaryAction'] as const) {
      it(`every admin editorial still emits ${field}`, () => {
        const missing = views
          .filter(([, view]) => {
            const editorial = view.editorial as AnyRecord | undefined;
            return editorial !== undefined && !Object.hasOwn(editorial, field);
          })
          .map(([name]) => name);
        expect(missing).toEqual([]);
      });
    }
  });

  describe('the shared agent editorial keeps contextUsed', () => {
    // Non-admin surfaces read it — the Sentinel evidence brief and the
    // Intelligence workflow canvas both assert it is non-empty. Only the
    // admin view shapes drop the field; a fix that reached into the shared
    // builder would fail here.
    it('generateStewardEditorial still produces a non-empty contextUsed', async () => {
      const ctx = await buildAgentContextAsync(TENANT, 'admin', 'production-readiness');
      const editorial = generateStewardEditorial(ctx);
      expect(editorial.contextUsed.length).toBeGreaterThan(0);
    });
  });
});
