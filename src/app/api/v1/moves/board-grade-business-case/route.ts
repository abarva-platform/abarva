// GET /api/v1/moves/board-grade-business-case
//
// Streams the board-grade Costed Business-Case Pack.
//
// TWO modes, selected by the `?moveId=` query parameter:
//
//   • `?moveId=<id>` — the GENERIC, kernel-derived deck for a REAL,
//     originated Move. The route loads that Move's recorded data (industry
//     code, charter, baseline metrics), runs the Moves Expert Kernel via
//     `renderMoveCostedBusinessCaseHtml`, and renders the kernel-derived deck.
//     When the Move binds a curated Domain Function Pack the deck is the full
//     bound business case; when it does not, the renderer produces the honest
//     UNBOUND deck — never a fabricated business case.
//
//   • no `moveId` — the Apex "Contact Center AI Routing" REFERENCE deck, the
//     hand-authored reference artifact called for by the Moves Board-Grade
//     Artifact Blueprint (§9 / §13). This is the honest fallback for a
//     missing `moveId`: a real, complete reference deck rather than an empty
//     state. The reference deck also serves an editable PowerPoint via
//     `?format=pptx`.
//
// Two HTML representations are served from one route:
//   • Default — a single self-contained HTML deck: all CSS inlined, every
//     exhibit an inline SVG, no external assets. `?download=1` serves it as a
//     file attachment.
//   • `?format=pptx` — an editable 16:9 PowerPoint, REFERENCE deck only.
//
// Auth: a valid Clerk session. For a `moveId` request, the Move is loaded
// behind `getProgramById` — tenancy-scoped and RBAC-gated — so a caller can
// only render a Move on their own tenant. The reference deck is additionally
// scoped to the Apex tenant by `assertBoardGradeTenancy`.
//
// The renderers are deterministic and pure. An honest `shape` / `kill`
// verdict, or an unbound Move, is a valid rendered outcome, never an error.

import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  renderApexCostedBusinessCaseHtml,
  renderApexCostedBusinessCasePptx,
  renderMoveCostedBusinessCaseHtml,
} from "@/lib/programs/expert-kernel/exports/board-grade";
import {
  cachedRender,
  cachedRenderAsync,
} from "@/lib/programs/expert-kernel/exports/board-grade/render-cache";
import { assertBoardGradeTenancy } from "@/lib/programs/board-artifacts/board-grade-route-guard";
import {
  generatedArtifactResponseHeaders,
  persistBoardGradeMoveArtifact,
} from "@/lib/programs/board-artifacts/board-grade-persistence";
import { loadMoveBusinessCaseInput } from "@/lib/programs/board-artifacts/load-move-business-case-input";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { runOrchestratedBusinessCase } from "@/lib/programs/deliverables/orchestrated/run-orchestrated-business-case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The orchestrated path runs up to six sequential board-grade LLM passes, so the
// route needs the platform-max budget. The deterministic path returns instantly.
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
        "[GET /api/v1/moves/board-grade-business-case] move load error",
        { err, moveId },
      );
      moveInput = null;
    }

    if (moveInput) {
      // ── Orchestrated authoring path (flag-gated) ──────────────────────────
      // When the tenant has `moves_orchestrated_deliverables` on, author the
      // deck through the governed multi-pass orchestrator (uses the Move's
      // recorded evidence, cites it, enforces the quality gate). The
      // deterministic deck below is the fallback when the gate blocks or the
      // Move has no recorded evidence. `?engine=deterministic` forces the old
      // path even for a flagged tenant.
      const flagCtx = {
        clientKey: moveInput.tenant_key,
        clientId: moveInput.tenant_key,
      };
      const orchestrate =
        params.get("engine") !== "deterministic" &&
        isFeatureEnabled(flagCtx, "moves_orchestrated_deliverables");

      if (orchestrate) {
        const run = await runOrchestratedBusinessCase({
          moveInput,
          moveId,
          tenantId: moveInput.tenant_key ?? user.metadataClientKey ?? moveId,
          userId: user.personId ?? user.clerkUserId,
          generatedOn,
        }).catch((err) => {
          console.error(
            "[GET /api/v1/moves/board-grade-business-case] orchestration error",
            { err, moveId },
          );
          return null;
        });

        if (run?.ok && run.html) {
          const download = params.get("download") === "1";
          const filename = `costed-business-case-pack-${moveId}-${generatedOn}.html`;
          const artifactRecord = await persistBoardGradeMoveArtifact({
            clientId: moveInput.tenant_key ?? user.metadataClientKey,
            moveId,
            artifactId: "costed-business-case",
            title: "Costed Business-Case Pack",
            html: run.html,
            renderedBy: user.personId ?? user.clerkUserId,
            routePath: "/api/v1/moves/board-grade-business-case",
            generatedOn,
            citedInputIds: run.citedInputIds,
          });
          return new Response(run.html, {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-store",
              "x-kernel-move": `move:${moveId}`,
              "x-deliverable-engine": "orchestrated",
              "x-deliverable-cited-input-count": String(
                run.citedInputIds.length,
              ),
              ...generatedArtifactResponseHeaders(artifactRecord),
              ...(download
                ? {
                    "content-disposition": `attachment; filename="${filename}"`,
                  }
                : {}),
            },
          });
        }
        // Orchestration blocked or errored — fall through to the deterministic
        // deck. The block reason is logged; the response is marked as a fallback.
        console.warn(
          "[GET /api/v1/moves/board-grade-business-case] orchestration not used; falling back to deterministic deck",
          { moveId, reason: run?.blockedReason },
        );
      }

      // WE-3 — Workforce Economics estimate-twice, gated on the tenant flag.
      // Flag OFF ⇒ the renderer is called with no opts and is byte-identical to
      // today. The flag is folded into the cache key so a flagged and an
      // unflagged tenant never share a memoised render.
      const workforceEconomicsEnabled = isFeatureEnabled(
        flagCtx,
        "moves_workforce_economics",
      );

      // The generic renderer is pure; a throw here would be a renderer bug.
      // Memoised per day, keyed by the move id so two Moves never collide.
      let html: string;
      try {
        html = cachedRender(
          `move-costed-business-case:html:${moveId}:${generatedOn}:we${
            workforceEconomicsEnabled ? "1" : "0"
          }`,
          () =>
            renderMoveCostedBusinessCaseHtml(moveInput!, generatedOn, {
              workforceEconomicsEnabled,
            }),
        );
      } catch (err) {
        console.error(
          "[GET /api/v1/moves/board-grade-business-case] move render error",
          { err, moveId },
        );
        return Response.json(
          {
            error: "render_failed",
            detail:
              err instanceof Error
                ? err.message
                : "Move board-grade business-case render failed.",
          },
          { status: 500 },
        );
      }

      const download = params.get("download") === "1";
      const filename = `costed-business-case-pack-${moveId}-${generatedOn}.html`;
      const artifactRecord = await persistBoardGradeMoveArtifact({
        clientId: moveInput.tenant_key ?? user.metadataClientKey,
        moveId,
        artifactId: "costed-business-case",
        title: "Costed Business-Case Pack",
        html,
        renderedBy: user.personId ?? user.clerkUserId,
        routePath: "/api/v1/moves/board-grade-business-case",
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
    "GET /api/v1/moves/board-grade-business-case",
  );
  if (tenancyDenied) return tenancyDenied;

  // `?format=pptx` serves the editable PowerPoint of the reference deck; the
  // PowerPoint renderer is async (it rasterises the SVG exhibits).
  if (params.get("format") === "pptx") {
    let pptx: Buffer;
    try {
      pptx = await cachedRenderAsync(
        `costed-business-case:pptx:${generatedOn}`,
        () => renderApexCostedBusinessCasePptx(generatedOn),
      );
    } catch (err) {
      console.error(
        "[GET /api/v1/moves/board-grade-business-case] pptx render error",
        { err },
      );
      return Response.json(
        {
          error: "render_failed",
          detail:
            err instanceof Error
              ? err.message
              : "Board-grade business-case PowerPoint render failed.",
        },
        { status: 500 },
      );
    }
    const pptxName = `apex-costed-business-case-pack-${generatedOn}.pptx`;
    return new Response(new Uint8Array(pptx), {
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "content-disposition": `attachment; filename="${pptxName}"`,
        "cache-control": "no-store",
        "x-kernel-move": "apex:move:contact-center-ai-routing",
        "x-kernel-verdict": "shape",
      },
    });
  }

  // The HTML renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`costed-business-case:html:${generatedOn}`, () =>
      renderApexCostedBusinessCaseHtml(generatedOn),
    );
  } catch (err) {
    console.error(
      "[GET /api/v1/moves/board-grade-business-case] render error",
      { err },
    );
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error
            ? err.message
            : "Board-grade business-case render failed.",
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = params.get("download") === "1";
  const filename = `apex-costed-business-case-pack-${generatedOn}.html`;

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
