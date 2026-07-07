// GET /api/v1/moves/board-grade-mobilize-packet
//
// Streams the board-grade Mobilize & Go-Decision Packet.
//
// TWO modes, selected by the `?moveId=` query parameter:
//
//   • `?moveId=<id>` — the GENERIC, kernel-derived packet for a REAL,
//     originated Move. The route loads that Move's recorded data (industry
//     code, charter, baseline metrics), runs the Moves Expert Kernel via
//     `renderMoveMobilizePacketHtml`, and renders the kernel-derived deck.
//     When the Move binds a curated Domain Function Pack the deck is the full
//     bound Mobilize packet — the mobilization-plan structure inherited from
//     the pack, the go-decision the kernel's REAL verdict. When it does not,
//     the renderer produces the honest UNBOUND deck — never a fabricated
//     packet, never a fabricated `go`.
//
//   • no `moveId` — the Apex "Contact Center AI Routing" REFERENCE deck, the
//     hand-authored reference artifact called for by the Moves Board-Grade
//     Artifact Blueprint (§11 / Appendix A.7). This is the honest fallback for
//     a missing `moveId`: a real, complete reference deck rather than an empty
//     state.
//
// The body is a single self-contained HTML string: all CSS inlined, every
// exhibit an inline SVG or HTML diagram, the slide-switch script inline, no
// external <script>, <link> or remote <img>. It opens offline and prints
// cleanly.
//
// Auth: a valid Clerk session. For a `moveId` request the Move is loaded
// behind `getProgramById` — tenancy-scoped and RBAC-gated — so a caller can
// only render a Move on their own tenant. The reference deck is additionally
// scoped to the Apex tenant by `assertBoardGradeTenancy`.
//
// The renderers are deterministic and pure. Apex's honest go-decision is
// `no_go`, and a generic Move's go-decision is the kernel's real verdict —
// both are valid rendered outcomes, never an error.

import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  renderApexMobilizePacketHtml,
  renderMoveMobilizePacketHtml,
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
        "[GET /api/v1/moves/board-grade-mobilize-packet] move load error",
        { err, moveId },
      );
      moveInput = null;
    }

    if (moveInput) {
      const download = params.get("download") === "1";
      const filename = `mobilize-packet-${moveId}-${generatedOn}.html`;
      const orchestrated = await maybeRenderOrchestratedMoveArtifact({
        req,
        routePath: "/api/v1/moves/board-grade-mobilize-packet",
        moveId,
        moveInput,
        generatedOn,
        renderedBy: user.personId ?? user.clerkUserId,
        userClientKey: user.metadataClientKey,
        artifactId: "mobilize-packet",
        title: "Mobilize & Go-Decision Packet",
        filename,
        deliverableType: "mobilization_plan",
        phaseOrStage: "P5_mobilize",
        artifactStandard: "moves.board_grade.mobilization_plan",
        decisionContext:
          "Approve mobilization, owners, workplan, readiness gates, go/no-go posture, and early execution controls for the Move.",
        audience: ["cio", "cfo", "program_leadership", "steering_committee"],
      });
      if (orchestrated) return orchestrated;

      // The generic renderer is pure; a throw here would be a renderer bug.
      // Memoised per day, keyed by the move id so two Moves never collide.
      let html: string;
      try {
        html = cachedRender(
          `move-mobilize-packet:html:${moveId}:${generatedOn}`,
          () => renderMoveMobilizePacketHtml(moveInput!, generatedOn),
        );
      } catch (err) {
        console.error(
          "[GET /api/v1/moves/board-grade-mobilize-packet] move render error",
          { err, moveId },
        );
        return Response.json(
          {
            error: "render_failed",
            detail:
              err instanceof Error
                ? err.message
                : "Move board-grade Mobilize packet render failed.",
          },
          { status: 500 },
        );
      }

      const artifactRecord = await persistBoardGradeMoveArtifact({
        clientId: moveInput.tenant_key ?? user.metadataClientKey,
        moveId,
        artifactId: "mobilize-packet",
        title: "Mobilize & Go-Decision Packet",
        html,
        renderedBy: user.personId ?? user.clerkUserId,
        routePath: "/api/v1/moves/board-grade-mobilize-packet",
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
    "GET /api/v1/moves/board-grade-mobilize-packet",
  );
  if (tenancyDenied) return tenancyDenied;

  // The renderer is pure; a throw here would be a genuine renderer bug.
  // Memoised per day via the date-keyed in-process cache.
  let html: string;
  try {
    html = cachedRender(`mobilize-packet:html:${generatedOn}`, () =>
      renderApexMobilizePacketHtml(generatedOn),
    );
  } catch (err) {
    console.error(
      "[GET /api/v1/moves/board-grade-mobilize-packet] render error",
      { err },
    );
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error
            ? err.message
            : "Board-grade Mobilize & Go-Decision Packet render failed.",
      },
      { status: 500 },
    );
  }

  // `?download=1` serves it as a file; default is inline for in-browser view.
  const download = params.get("download") === "1";
  const filename = `apex-mobilize-packet-${generatedOn}.html`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-kernel-move": "apex:move:contact-center-ai-routing",
      "x-kernel-verdict": "no_go",
      ...(download
        ? {
            "content-disposition": `attachment; filename="${filename}"`,
          }
        : {}),
    },
  });
}
