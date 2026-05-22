// Shared Gamma route handler — one per board-grade reference deck.
//
// Eight thin `route.ts` files (one per `board-grade-<deck>/gamma`) call this
// handler with their deck slug. The handler:
//   1. Auth-gates as the existing board-grade routes do (signed-in session).
//   2. Refuses any `moveId` query parameter — REFERENCE decks only. This is
//      the egress gate that keeps real-tenant data away from the integration
//      until the security review closes.
//   3. Enforces the Apex tenancy guard that every other board-grade route
//      runs (the reference artifacts are Apex-owned).
//   4. Returns a 503 when `GAMMA_API_KEY` is not configured.
//   5. Builds the deck's reference brief, calls the Gamma client, and
//      returns the hosted URL + the signed `.pptx` export URL plus the
//      generation id (for audit) and the rate-limit budget (for the caller
//      to warn at low levels).
//
// The raw `inputText` is NEVER returned in the response and never logged.

import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { assertBoardGradeTenancy } from '@/lib/programs/board-artifacts/board-grade-route-guard';
import {
  generateGammaDeck,
  GammaError,
  isGammaConfigured,
} from './client';
import {
  serializeBoardGradeDeckBrief,
  type BoardGradeDeckSlug,
} from './board-grade-brief';

/** Map a `GammaError.kind` to the honest HTTP status. */
function statusForGammaError(err: GammaError): number {
  switch (err.kind) {
    case 'not_configured':
      return 503;
    case 'timeout':
      return 504;
    case 'gamma_failed':
    case 'unexpected_status':
    case 'transport':
      return 502;
    default:
      return 502;
  }
}

/** Run the Gamma generation pipeline for one board-grade reference deck. */
export async function handleGammaExport(
  req: NextRequest,
  slug: BoardGradeDeckSlug,
  routeName: string,
): Promise<Response> {
  // --- Auth — a valid session. -------------------------------------------
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return Response.json(
      { error: 'unauthorized', detail: 'A signed-in session is required.' },
      { status: 401 },
    );
  }

  // --- Egress gate — REFERENCE decks ONLY. -------------------------------
  // The Gamma integration is scoped to the synthetic Apex reference decks.
  // A real-tenant `?moveId=` deck would egress real-tenant data to Gamma
  // before the 9-item security review and data-egress review close, so we
  // refuse it outright. This is the gate the spec calls out as load-bearing.
  const params = new URL(req.url).searchParams;
  const moveId = params.get('moveId')?.trim();
  if (moveId) {
    return Response.json(
      {
        error: 'forbidden',
        detail:
          'Gamma export is enabled for reference decks only at this time.',
      },
      { status: 403 },
    );
  }

  // --- Tenancy — the reference artifact is Apex-owned. -------------------
  const tenancyDenied = await assertBoardGradeTenancy(routeName);
  if (tenancyDenied) return tenancyDenied;

  // --- Config — return an honest 503 when GAMMA_API_KEY is unset. --------
  if (!isGammaConfigured()) {
    return Response.json(
      {
        error: 'gamma_not_configured',
        detail: 'Gamma integration is not configured.',
      },
      { status: 503 },
    );
  }

  // --- Build the brief and call Gamma. -----------------------------------
  const generatedOn = new Date().toISOString().slice(0, 10);
  const brief = serializeBoardGradeDeckBrief(slug, generatedOn);

  try {
    const result = await generateGammaDeck({
      inputText: brief.inputText,
      additionalInstructions: brief.additionalInstructions,
      numCards: brief.numCards,
      title: brief.title,
      // `inputTextBreaks` pairs with the `\n\n\n` delimiter the serializer
      // emits between cards. If Gamma's behaviour changes, switching to
      // 'auto' is the documented fallback (input still parses safely).
      cardSplit: 'inputTextBreaks',
    });

    return Response.json(
      {
        gammaUrl: result.gammaUrl,
        exportUrl: result.exportUrl,
        generationId: result.generationId,
        gammaId: result.gammaId,
        credits: result.credits,
        rateLimit: result.rateLimit,
        deck: slug,
      },
      {
        status: 200,
        headers: { 'cache-control': 'no-store' },
      },
    );
  } catch (err) {
    if (err instanceof GammaError) {
      // Log the error class + kind — NEVER the inputText or the API key.
      console.error(`[${routeName}] Gamma error`, {
        kind: err.kind,
        message: err.message,
      });
      return Response.json(
        { error: 'gamma_error', detail: err.message, kind: err.kind },
        { status: statusForGammaError(err) },
      );
    }
    console.error(`[${routeName}] unexpected error`, {
      message: err instanceof Error ? err.message : String(err),
    });
    return Response.json(
      {
        error: 'gamma_error',
        detail:
          err instanceof Error
            ? err.message
            : 'Unexpected error while generating the Gamma deck.',
      },
      { status: 502 },
    );
  }
}
