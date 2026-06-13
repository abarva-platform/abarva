// GET /api/v1/moves/board-grade-estimate-model
//
// Streams the board-grade Estimate & Financial Model.
//
// TWO modes, selected by the `?moveId=` query parameter:
//
//   • `?moveId=<id>` — the GENERIC, kernel-derived Estimate & Financial Model
//     for a REAL, originated Move. The route loads that Move's recorded data
//     (industry code, charter, baseline metrics), runs the Moves Expert Kernel
//     via `renderMoveEstimateModelHtml`, and renders the kernel-derived deck.
//     When the Move binds a curated Domain Function Pack the deck is the full
//     bound Estimate Model — the effort decomposition, the role-mix cost
//     build-up, the rate card, the value forecast and the haircuts, every
//     figure a labelled planning estimate or range. When it does not, the
//     renderer produces the honest UNBOUND deck — never a fabricated estimate.
//
//   • no `moveId` — the Apex "Contact Center AI Routing" REFERENCE deck, the
//     hand-authored reference artifact called for by the Moves Board-Grade
//     Artifact Blueprint (§8 / Appendix A.4). This is the honest fallback for
//     a missing `moveId`: a real, complete reference deck rather than an empty
//     state.
//
// Blueprint §8's full form is an XLSX workbook; this route serves the HTML
// summary deck. The body is a single self-contained HTML string: all CSS
// inlined, every exhibit an inline SVG, the slide-switch script inline, no
// external <script>, <link> or remote <img>. It opens offline and prints
// cleanly.
//
// Auth: a valid Clerk session. For a `moveId` request the Move is loaded
// behind `getProgramById` — tenancy-scoped and RBAC-gated — so a caller can
// only render a Move on their own tenant. The reference deck is additionally
// scoped to the Apex tenant by `assertBoardGradeTenancy`.
//
// The renderers are deterministic and pure. Apex's honest verdict is `shape`
// with a blocked payback (the cost-per-contact baseline is a declared seed
// gap); a generic Move's verdict is the kernel's real recommendation — both
// are valid rendered outcomes, never an error.

import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  renderApexEstimateModelHtml,
  renderMoveEstimateModelHtml,
} from "@/lib/programs/expert-kernel/exports/board-grade";
import { cachedRender } from "@/lib/programs/expert-kernel/exports/board-grade/render-cache";
import { assertBoardGradeTenancy } from "@/lib/programs/board-artifacts/board-grade-route-guard";
import {
  generatedArtifactResponseHeaders,
  persistBoardGradeMoveArtifact,
} from "@/lib/programs/board-artifacts/board-grade-persistence";
import { loadMoveBusinessCaseInput } from "@/lib/programs/board-artifacts/load-move-business-case-input";
import { maybeRenderOrchestratedMoveArtifact } from "@/lib/programs/board-artifacts/orchestrated-move-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest): Promise<Response> {
  // --- Auth — a valid session. -------------------------------------------
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return Response.json(
      { error: "unauthorized", detail: "A signed-in session is required." },
      { status: 401 },
    );
  }

  const generatedOn = new Date().toISOString().slice(0, 10);
  const params = new URL(req.url).searchParams;
  const moveId = params.get("moveId")?.trim() || "";

  // ─────────────────────────────────────────────────────────────────────────
  // GENERIC MODE — `?moveId=` present. Render that Move's kernel-derived deck.
  // ─────────────────────────────────────────────────────────────────────────
  if (moveId) {
    // The Move is loaded behind a tenancy-scoped, RBAC-gated query — a caller
    // can only render a Move on their own tenant. `null` means the Move does
    // not exist or is not accessible: fall back honestly to the reference.
    let moveInput: Awaited<ReturnType<typeof loadMoveBusinessCaseInput>>;
    try {
      moveInput = await loadMoveBusinessCaseInput(moveId);
    } catch (err) {
      console.error(
        "[GET /api/v1/moves/board-grade-estimate-model] move load error",
        { err, moveId },
      );
      moveInput = null;
    }

    if (moveInput) {
      const download = params.get("download") === "1";
      const filename = `estimate-model-${moveId}-${generatedOn}.html`;
      const orchestrated = await maybeRenderOrchestratedMoveArtifact({
        req,
        routePath: "/api/v1/moves/board-grade-estimate-model",
        moveId,
        moveInput,
        generatedOn,
        renderedBy: user.personId ?? user.clerkUserId,
        userClientKey: user.metadataClientKey,
        artifactId: "estimate-model",
        title: "Estimate & Financial Model",
        filename,
        deliverableType: "estimate_model",
        phaseOrStage: "P4_estimate",
        artifactStandard: "moves.board_grade.estimate_model",
        decisionContext:
          "Approve the investment estimate, run-cost posture, cost drivers, and estimation confidence for the Move.",
        audience: ["cfo", "cio", "steering_committee"],
      });
      if (orchestrated) return orchestrated;

      // The generic renderer is pure; a throw here would be a renderer bug.
      // Memoised per day, keyed by the move id so two Moves never collide.
      let html: string;
      try {
        html = cachedRender(
          `move-estimate-model:html:${moveId}:${generatedOn}`,
          () => renderMoveEstimateModelHtml(moveInput!, generatedOn),
        );
      } catch (err) {
        console.error(
          "[GET /api/v1/moves/board-grade-estimate-model] move render error",
          { err, moveId },
        );
        return Response.json(
          {
            error: "render_failed",
            detail:
              err instanceof Error
                ? err.message
                : "Move board-grade Estimate & Financial Model render failed.",
          },
          { status: 500 },
        );
      }

      const artifactRecord = await persistBoardGradeMoveArtifact({
        clientId: moveInput.tenant_key ?? user.metadataClientKey,
        moveId,
        artifactId: "estimate-model",
        title: "Estimate & Financial Model",
        html,
        renderedBy: user.personId ?? user.clerkUserId,
        routePath: "/api/v1/moves/board-grade-estimate-model",
        generatedOn,
      });
      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-kernel-move": `move:${moveId}`,
          ...generatedArtifactResponseHeaders(artifactRecord),
          ...(download
            ? { "content-disposition": `attachment; filename="${filename}"` }
            : {}),
        },
      });
    }
    // moveInput is null — the Move is not accessible. Fall through to the
    // honest reference fallback below.
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REFERENCE MODE — no `moveId` (or an inaccessible one). The Apex
  // "Contact Center AI Routing" reference deck.
  // ─────────────────────────────────────────────────────────────────────────

  // --- Tenancy — the reference artifact is Apex-owned. -------------------
  const tenancyDenied = await assertBoardGradeTenancy(
    "GET /api/v1/moves/board-grade-estimate-model",
  );
  if (tenancyDenied) return tenancyDenied;

  // The renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`estimate-model:html:${generatedOn}`, () =>
      renderApexEstimateModelHtml(generatedOn),
    );
  } catch (err) {
    console.error(
      "[GET /api/v1/moves/board-grade-estimate-model] render error",
      { err },
    );
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error
            ? err.message
            : "Board-grade Estimate & Financial Model render failed.",
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = params.get("download") === "1";
  const filename = `apex-estimate-model-${generatedOn}.html`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-kernel-move": "apex:move:contact-center-ai-routing",
      "x-kernel-verdict": "shape",
      ...(download
        ? {
            "content-disposition": `attachment; filename="${filename}"`,
          }
        : {}),
    },
  });
}
