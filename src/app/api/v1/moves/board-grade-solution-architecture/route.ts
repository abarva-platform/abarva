// GET /api/v1/moves/board-grade-solution-architecture
//
// Streams the board-grade Solution Architecture Pack.
//
// TWO modes, selected by the `?moveId=` query parameter:
//
//   • `?moveId=<id>` — the GENERIC, pack-bound deck for a REAL, originated
//     Move. The route loads that Move's recorded data (industry code, charter,
//     baseline metrics), binds it to its curated Domain Function Pack for the
//     solution-architecture artifact, and renders the kernel-derived target-
//     state architecture deck via `renderMoveSolutionArchitectureHtml`. When
//     the Move binds a curated pack the deck is the full bound architecture;
//     when it does not, the renderer produces the honest UNBOUND deck — never
//     a fabricated architecture.
//
//   • no `moveId` — the Apex "Contact Center AI Routing" REFERENCE deck, the
//     hand-authored reference artifact called for by the Moves Board-Grade
//     Artifact Blueprint (§7 / Appendix A.3). This is the honest fallback for
//     a missing `moveId`: a real, complete reference deck rather than an empty
//     state.
//
// The body is a single self-contained HTML string: all CSS inlined, every
// exhibit an inline SVG architecture diagram, the slide-switch script inline,
// no external assets. It opens offline and prints cleanly.
//
// Auth: a valid Clerk session. For a `moveId` request, the Move is loaded
// behind `loadMoveBusinessCaseInput` — tenancy-scoped and RBAC-gated — so a
// caller can only render a Move on their own tenant. The reference deck is
// additionally scoped to the Apex tenant by `assertBoardGradeTenancy`.
//
// The renderers are deterministic and pure. An honest `conditional` / `hold`
// verdict, or an unbound Move, is a valid rendered outcome, never an error.

import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  renderApexSolutionArchitectureHtml,
  renderMoveSolutionArchitectureHtml,
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
  // GENERIC MODE — `?moveId=` present. Render that Move's pack-bound deck.
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
        "[GET /api/v1/moves/board-grade-solution-architecture] move load error",
        { err, moveId },
      );
      moveInput = null;
    }

    if (moveInput) {
      const download = params.get("download") === "1";
      const filename = `solution-architecture-pack-${moveId}-${generatedOn}.html`;
      const orchestrated = await maybeRenderOrchestratedMoveArtifact({
        req,
        routePath: "/api/v1/moves/board-grade-solution-architecture",
        moveId,
        moveInput,
        generatedOn,
        renderedBy: user.personId ?? user.clerkUserId,
        userClientKey: user.metadataClientKey,
        artifactId: "solution-architecture",
        title: "Solution Architecture Pack",
        filename,
        deliverableType: "target_architecture",
        phaseOrStage: "P3_design",
        artifactStandard: "moves.board_grade.target_architecture",
        decisionContext:
          "Approve the target architecture, key design choices, integration posture, and implementation implications for the Move.",
        audience: ["cio", "cto", "ciso", "steering_committee"],
      });
      if (orchestrated) return orchestrated;

      // The generic renderer is pure; a throw here would be a renderer bug.
      // Memoised per day, keyed by the move id so two Moves never collide.
      let html: string;
      try {
        html = cachedRender(
          `move-solution-architecture:html:${moveId}:${generatedOn}`,
          () => renderMoveSolutionArchitectureHtml(moveInput!, generatedOn),
        );
      } catch (err) {
        console.error(
          "[GET /api/v1/moves/board-grade-solution-architecture] move render error",
          { err, moveId },
        );
        return Response.json(
          {
            error: "render_failed",
            detail:
              err instanceof Error
                ? err.message
                : "Move board-grade Solution Architecture render failed.",
          },
          { status: 500 },
        );
      }

      const artifactRecord = await persistBoardGradeMoveArtifact({
        clientId: moveInput.tenant_key ?? user.metadataClientKey,
        moveId,
        artifactId: "solution-architecture",
        title: "Solution Architecture Pack",
        html,
        renderedBy: user.personId ?? user.clerkUserId,
        routePath: "/api/v1/moves/board-grade-solution-architecture",
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

  // --- Tenancy — the artifact is Apex-owned; block cross-tenant access. ---
  const tenancyDenied = await assertBoardGradeTenancy(
    "GET /api/v1/moves/board-grade-solution-architecture",
  );
  if (tenancyDenied) return tenancyDenied;

  // The renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`solution-architecture:html:${generatedOn}`, () =>
      renderApexSolutionArchitectureHtml(generatedOn),
    );
  } catch (err) {
    console.error(
      "[GET /api/v1/moves/board-grade-solution-architecture] render error",
      { err },
    );
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error
            ? err.message
            : "Board-grade Solution Architecture Pack render failed.",
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = params.get("download") === "1";
  const filename = `apex-solution-architecture-pack-${generatedOn}.html`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-kernel-move": "apex:move:contact-center-ai-routing",
      "x-kernel-verdict": "conditional",
      ...(download
        ? {
            "content-disposition": `attachment; filename="${filename}"`,
          }
        : {}),
    },
  });
}
