import {
  ARCHITECTURE_V2_EXHIBITS,
  type ArchitectureExhibitKey,
} from "@/lib/visual-system/architecture-model";
import {
  architectureVisualPanels,
  type ArchitectureVisualExhibit,
} from "@/lib/visual-system/architecture-html-renderer";

/**
 * How the architecture section of a generated deck is shaped, from a Claude
 * Design review (2026-10-08). The structured architecture model can emit up to
 * 13 governed visuals; rendering all 13 as bare standalone slides in a row made
 * the deck long and argument-less. Instead the section is a FIXED board
 * storyline whose length is bounded by the story, not by how many visuals the
 * model happens to produce.
 *
 * - A short headline run: up to five "argument + diagram" 2-up slides, in a
 *   fixed order and chosen by ROLE (never backfilled from the reference tier).
 *   The visual's `soWhat` is the governing message; its `decisionImplication`
 *   is the sub-line. Pairing is DETERMINISTIC from the model's own governed
 *   fields — the architecture keys are never exposed to the LLM authoring pass,
 *   so a board-scrutinised architecture claim traces to the structured model,
 *   not to a generative pass.
 * - Two "standalone-with-takeaway" visuals appear in the body only beside a
 *   headline beat that is on stage (their anchor); otherwise they fall to the
 *   appendix.
 * - Everything else runs in a labelled reference/appendix section.
 *
 * Every non-headline visual still carries its `soWhat`/`decisionImplication`
 * takeaway when rendered, so no slide is ever a bare diagram.
 */

/** The five headline beats, in board-storyline order. */
export const ARCHITECTURE_HEADLINE_ORDER: readonly ArchitectureExhibitKey[] = [
  "current_state_gaps_map",
  "target_conceptual_architecture",
  "ai_recommendation_control_flow",
  "human_approval_override_model",
  "implementation_waves",
];

/**
 * Visuals that render standalone (with a takeaway band) in the body, but only
 * when their anchor headline is on stage. Keyed to the beat they sit beside.
 */
export const ARCHITECTURE_BODY_STANDALONE: ReadonlyArray<{
  id: ArchitectureExhibitKey;
  anchor: ArchitectureExhibitKey;
}> = [
  // "how we work today" sits beside the current-state problem beat
  { id: "current_state_operating_flow", anchor: "current_state_gaps_map" },
  // the audit/telemetry trust story sits beside the human-control beat
  {
    id: "governance_audit_telemetry_flow",
    anchor: "human_approval_override_model",
  },
];

export type ArchitectureDeckPage =
  | { kind: "divider"; eyebrow: string; title: string }
  | { kind: "headline"; visual: ArchitectureVisualExhibit; continuation?: boolean }
  | { kind: "standalone"; visual: ArchitectureVisualExhibit; continuation?: boolean };

/** Keep the executive argument ahead of the reference visuals. */
export function splitArchitectureDeckPages(
  pages: readonly ArchitectureDeckPage[],
): { body: ArchitectureDeckPage[]; appendix: ArchitectureDeckPage[] } {
  const hasHeadline = pages.some((page) => page.kind === "headline");
  if (!hasHeadline) return { body: [], appendix: [...pages] };
  const appendixStart = pages.findIndex(
    (page) =>
      page.kind === "divider" &&
      page.eyebrow === "ARCHITECTURE — REFERENCE",
  );
  return appendixStart < 0
    ? { body: [...pages], appendix: [] }
    : {
        body: pages.slice(0, appendixStart),
        appendix: pages.slice(appendixStart),
      };
}

/**
 * Order the present architecture visuals into the bounded board storyline.
 * Every present visual panel is emitted exactly once; dividers are added only
 * when a section has content. Returns an empty list when no visuals are present.
 */
export function composeArchitectureDeckPages(
  visuals: readonly ArchitectureVisualExhibit[],
): ArchitectureDeckPage[] {
  const byId = new Map(visuals.map((v) => [v.id, v]));
  const pages: ArchitectureDeckPage[] = [];
  const emitted = new Set<ArchitectureExhibitKey>();
  const addPanels = (
    kind: "headline" | "standalone",
    visual: ArchitectureVisualExhibit,
  ) => {
    architectureVisualPanels(visual).forEach((panel, index) => {
      pages.push({
        kind: index === 0 ? kind : "standalone",
        continuation: index > 0,
        visual: panel,
      });
    });
  };

  const headlinesPresent = ARCHITECTURE_HEADLINE_ORDER.filter((id) =>
    byId.has(id),
  );

  if (headlinesPresent.length > 0) {
    pages.push({
      kind: "divider",
      eyebrow: "ARCHITECTURE",
      title: "From today's gaps to the target, and how we get there",
    });
    for (const id of ARCHITECTURE_HEADLINE_ORDER) {
      const visual = byId.get(id);
      if (!visual) continue;
      addPanels("headline", visual);
      emitted.add(id);
      // Body standalones anchored to this beat, right after it.
      for (const { id: stId, anchor } of ARCHITECTURE_BODY_STANDALONE) {
        if (anchor !== id) continue;
        const st = byId.get(stId);
        if (st && !emitted.has(stId)) {
          addPanels("standalone", st);
          emitted.add(stId);
        }
      }
    }
  }

  // Everything still present and not yet emitted → reference/appendix run,
  // in the canonical exhibit order.
  const rest = ARCHITECTURE_V2_EXHIBITS.filter(
    (id) => byId.has(id) && !emitted.has(id),
  );
  if (rest.length > 0) {
    pages.push({
      kind: "divider",
      eyebrow:
        headlinesPresent.length > 0
          ? "ARCHITECTURE — REFERENCE"
          : "ARCHITECTURE",
      title:
        headlinesPresent.length > 0
          ? "Appendix A — Architecture reference"
          : "The governed architecture model",
    });
    for (const id of rest) {
      const visual = byId.get(id);
      if (visual) {
        addPanels("standalone", visual);
        emitted.add(id);
      }
    }
  }

  return pages;
}
