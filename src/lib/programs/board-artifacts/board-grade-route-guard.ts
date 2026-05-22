// Tenancy guard for the `/api/v1/moves/board-grade-*` export routes.
//
// Every board-grade route serves the SAME fixed substrate — the Apex Retail
// "Contact Center AI Routing" Move. A signed-in session alone is not a
// sufficient gate: a Meridian Health or First Capital user has no business
// receiving another tenant's costed business case, CFO pack, or dossier.
//
// `assertBoardGradeTenancy` resolves the caller's active tenant from the
// server-trusted session (Clerk metadata pin → active-client cookie → email
// inference — never request input) and confirms it is the tenant the
// board-grade artifact belongs to. Anything else is a 403; the route returns
// the response and renders nothing.

import { getActiveClientKey } from '@/lib/active-client';
import type { ClientKey } from '@/lib/client-config';

/**
 * The tenant the board-grade artifact set is bound to. Today every shipped
 * board-grade deck is the Apex "Contact Center AI Routing" reference Move, so
 * the routes are scoped to the Apex tenant key.
 */
export const BOARD_GRADE_ARTIFACT_TENANT: ClientKey = 'apexretail';

/**
 * Assert the caller's active tenant owns the board-grade artifact. Returns a
 * 403 `Response` to short-circuit the route when it does not, or `null` when
 * the caller is in-tenant and the route may proceed.
 */
export async function assertBoardGradeTenancy(
  routeName: string,
): Promise<Response | null> {
  let activeKey: ClientKey;
  try {
    activeKey = await getActiveClientKey();
  } catch {
    // If the tenant cannot be resolved, fail closed — never serve the
    // artifact on an indeterminate tenancy.
    return Response.json(
      {
        error: 'forbidden',
        detail: 'Active tenant could not be resolved for this request.',
      },
      { status: 403 },
    );
  }

  if (activeKey !== BOARD_GRADE_ARTIFACT_TENANT) {
    console.warn(`[${routeName}] cross-tenant access blocked`, {
      activeTenant: activeKey,
      artifactTenant: BOARD_GRADE_ARTIFACT_TENANT,
    });
    return Response.json(
      {
        error: 'forbidden',
        detail:
          'This board-grade artifact belongs to a different tenant and is ' +
          'not available on the active tenant.',
      },
      { status: 403 },
    );
  }

  return null;
}
