// GET /api/v1/moves/board-grade-cfo-pack
//
// Streams the board-grade CFO Pack — the artifact called for by the Moves
// Board-Grade Artifact Blueprint (§10 / Appendix A.6). A financial challenge,
// not product advocacy: the funding ask, the downside, the do-not-fund
// holdbacks, what Tower will measure, and the evidence/gap audit.
//
// TWO modes, selected by the `?moveId=` query parameter:
//
//   • `?moveId=<id>` — the GENERIC, kernel-derived deck for a REAL,
//     originated Move. The route loads that Move's recorded data (industry
//     code, charter, baseline metrics), runs the Moves Expert Kernel via
//     `renderMoveCfoPackHtml`, and renders the kernel-derived deck. When the
//     Move binds a curated Domain Function Pack the deck is the full CFO Pack;
//     when it does not, the renderer produces the honest UNBOUND deck — never
//     a fabricated CFO pack. The verdict shown is the kernel's REAL
//     recommendation, never a fabricated `go`.
//
//   • no `moveId` — the Apex "Contact Center AI Routing" REFERENCE deck, the
//     hand-authored reference artifact. This is the honest fallback for a
//     missing `moveId`: a real, complete reference deck rather than an empty
//     state.
//
// The body is a single self-contained HTML string: all CSS inlined, every
// exhibit an inline SVG, the slide-switch script inline, no external <script>,
// <link> or remote <img>. It opens offline and prints cleanly.
//
// Auth: a valid Clerk session. For a `moveId` request, the Move is loaded
// behind `loadMoveBusinessCaseInput` — tenancy-scoped and RBAC-gated — so a
// caller can only render a Move on their own tenant. The reference deck is
// additionally scoped to the Apex tenant by `assertBoardGradeTenancy`.
//
// The renderers are deterministic and pure. An honest `shape` / `kill`
// verdict, or an unbound Move, is a valid rendered outcome, never an error.

import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  renderApexCfoPackHtml,
  renderMoveCfoPackHtml,
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
        "[GET /api/v1/moves/board-grade-cfo-pack] move load error",
        { err, moveId },
      );
      moveInput = null;
    }

    if (moveInput) {
      const download = params.get("download") === "1";
      const filename = `cfo-pack-${moveId}-${generatedOn}.html`;
      const orchestrated = await maybeRenderOrchestratedMoveArtifact({
        req,
        routePath: "/api/v1/moves/board-grade-cfo-pack",
        moveId,
        moveInput,
        generatedOn,
        renderedBy: user.personId ?? user.clerkUserId,
        userClientKey: user.metadataClientKey,
        artifactId: "cfo-pack",
        title: "CFO Pack",
        filename,
        deliverableType: "value_model",
        phaseOrStage: "P4_value",
        artifactStandard: "moves.board_grade.value_model",
        decisionContext:
          "Approve the value model, CFO-facing assumptions, realized-value measurement approach, and funding posture for the Move.",
        audience: ["cfo", "board", "steering_committee"],
      });
      if (orchestrated) return orchestrated;

      // The generic renderer is pure; a throw here would be a renderer bug.
      // Memoised per day, keyed by the move id so two Moves never collide.
      let html: string;
      try {
        html = cachedRender(`move-cfo-pack:html:${moveId}:${generatedOn}`, () =>
          renderMoveCfoPackHtml(moveInput!, generatedOn),
        );
      } catch (err) {
        console.error(
          "[GET /api/v1/moves/board-grade-cfo-pack] move render error",
          { err, moveId },
        );
        return Response.json(
          {
            error: "render_failed",
            detail:
              err instanceof Error
                ? err.message
                : "Move board-grade CFO Pack render failed.",
          },
          { status: 500 },
        );
      }

      const artifactRecord = await persistBoardGradeMoveArtifact({
        clientId: moveInput.tenant_key ?? user.metadataClientKey,
        moveId,
        artifactId: "cfo-pack",
        title: "CFO Pack",
        html,
        renderedBy: user.personId ?? user.clerkUserId,
        routePath: "/api/v1/moves/board-grade-cfo-pack",
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
    "GET /api/v1/moves/board-grade-cfo-pack",
  );
  if (tenancyDenied) return tenancyDenied;

  // The renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`cfo-pack:html:${generatedOn}`, () =>
      renderApexCfoPackHtml(generatedOn),
    );
  } catch (err) {
    console.error("[GET /api/v1/moves/board-grade-cfo-pack] render error", {
      err,
    });
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error
            ? err.message
            : "Board-grade CFO Pack render failed.",
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = params.get("download") === "1";
  const filename = `apex-cfo-pack-${generatedOn}.html`;

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
