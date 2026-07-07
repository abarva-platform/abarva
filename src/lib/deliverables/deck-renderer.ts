// Executive deck renderer (spec §10) — the PRIMARY deliverable form: a 16:9, exhibit-led deck.
//
// Maps a Story (answer-first pages, PR2) + its rendered exhibits (Visual Director, PR4) onto the
// shared deck grammar (PR3/visual-system/deck): a cover, then one slide per page with the page's
// CONCLUSION headline as the takeaway, the page's hero exhibit, a short implication lede, and a
// quiet footer carrying decision-relevance + evidence. This is what replaces the prose DOCX as the
// board-facing artifact — "visuals carry the argument", one message + one visual per page (spec §11).
//
// Deterministic: same inputs (incl. an injected generated-on date) yield the same HTML. Additive +
// inert — wiring this into the live orchestrator generate path (behind a tenant flag, with a live
// proof) is a later step. The DOCX technical appendix (Story.appendixSections + section prose) is a
// separate companion render.

import {
  renderDeckDocument,
  slideShell,
  heroExhibit,
  coverSlide,
  lede,
  type DeckSlide,
  type DeckMeta,
  type FooterFact,
  type CoverInput,
} from "@/lib/visual-system/deck";
import type { Story, RoleInStory, ArchetypeKey } from "@/lib/deliverables/story/types";
import type { MoveDecisionModel } from "@/lib/deliverables/decision-model/types";
import type { RenderedExhibit } from "./visual-director";

const ARCHETYPE_LABEL: Record<ArchetypeKey, string> = {
  initiative_charter: "Initiative Charter",
  discover_and_diagnose: "Discover & Diagnose",
  target_architecture: "Target State Architecture",
  sourcing_strategy: "Sourcing Strategy",
  operating_model: "Operating Model",
  roadmap: "Execution Roadmap",
  value_model: "Value Model / Business Case",
  handoff: "Handoff Package",
};

function prettyRole(role: RoleInStory): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface DeckRenderOptions {
  /** ISO date the deck was generated — injected for deterministic output. */
  generatedOnIso: string;
  tenantLabel?: string;
  tenantKey?: string;
}

export function renderExecutiveDeck(
  story: Story,
  model: MoveDecisionModel,
  exhibits: RenderedExhibit[],
  opts: DeckRenderOptions,
): string {
  const archetypeLabel = ARCHETYPE_LABEL[story.archetypeKey];
  const tenantLabel = opts.tenantLabel ?? model.clientDisplayName;
  const exhibitByPage = new Map(exhibits.map((e) => [e.pageNo, e]));

  const coverInput: CoverInput = {
    brand: "AbarVa · Moves",
    eyebrow: `${archetypeLabel} · Board-grade artifact`,
    title: model.initiativeDisplayName,
    tenantLine: opts.tenantKey ? `${tenantLabel} · ${opts.tenantKey}` : tenantLabel,
    lede: model.answerFirstRecommendation,
    meta: [
      { label: "Governing decision", value: model.governingDecision },
      { label: "Pages", value: String(story.pages.length) },
      { label: "Evidence cited", value: String(model.evidenceBundle.length) },
    ],
    hint: "Use ← → to move through the deck",
  };

  const cover: DeckSlide = {
    id: "cover",
    navLabel: "Cover",
    navPreview: model.answerFirstRecommendation,
    render: () => coverSlide(coverInput),
  };

  const sectionSlides: DeckSlide[] = story.pages.map((page) => {
    const ex = exhibitByPage.get(page.pageNo);
    const role = prettyRole(page.roleInStory);
    const hero = ex
      ? heroExhibit(role, ex.svg, ex.status === "gap" ? ex.gapReason : undefined)
      : "";
    const footer: FooterFact[] = [
      { key: "Decision relevance", val: page.decisionRelevance },
      ...(page.supportingEvidence.length
        ? [{ key: "Evidence", val: page.supportingEvidence.map((n) => `[${n}]`).join(" ") }]
        : []),
      { key: "Role", val: role },
    ];
    return {
      id: `p${page.pageNo}`,
      navLabel: role,
      navPreview: page.headline,
      render: (slideNo: number, slideCount: number) =>
        slideShell({
          id: `p${page.pageNo}`,
          slideNo,
          slideCount,
          headerBrand: "AbarVa · Moves",
          navLabel: role,
          sectionNo: page.pageNo,
          takeaway: page.headline,
          hero: (page.implication ? lede(page.implication) : "") + hero,
          footer,
        }),
    };
  });

  const meta: DeckMeta = {
    brand: "AbarVa · Moves",
    artifactLabel: archetypeLabel,
    moveLabel: model.initiativeDisplayName,
    tenantLabel,
    tenantKey: opts.tenantKey ?? "",
    generatedOn: opts.generatedOnIso,
    verdict: {
      label: model.requiredDecisions.length ? "DECIDE" : "REVIEW",
      sub: model.governingDecision,
    },
    documentTitle: `${model.initiativeDisplayName} — ${archetypeLabel}`,
  };

  return renderDeckDocument(meta, [cover, ...sectionSlides]);
}
