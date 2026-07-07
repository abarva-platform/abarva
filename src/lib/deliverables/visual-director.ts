// Visual Director (spec §7) — turn a Story's exhibit plan into rendered exhibits.
//
// For each page it resolves the exhibit type to a render pipeline (adapter → shared-engine
// function). Where a pipeline exists and the model has the content, it emits a real SVG; otherwise
// it emits a gap-honest "exhibit pending" card (never an empty or fabricated visual) and records
// the reason. It NEVER throws — a single bad exhibit degrades to a gap-card, the deck still builds.
//
// PR4 wires the value/economics family (the Workforce Economics convergence) and the new tree
// family end-to-end; the architecture/RACI/org adapters land in the next PR (their exhibit types
// degrade to gap-cards until then, honestly flagged by the capability map).

import {
  investmentWaterfall,
  economicsStrip,
  optionScorecard,
  costStack,
} from "@/lib/visual-system";
import { issueTree } from "@/lib/visual-system/tree-exhibit";
import { gapCard } from "@/lib/visual-system/gap-card";
import { resolveExhibitRenderer } from "@/lib/visual-system/exhibit-dsl";
import {
  toValueWaterfallSteps,
  toEconomicsTiles,
  toDecisionScorecardOptions,
  toValueStackSegments,
  toValueTree,
  toClaimTree,
} from "@/lib/visual-system/exhibit-adapters";
import type { ExhibitType, Story } from "@/lib/deliverables/story/types";
import type { MoveDecisionModel } from "@/lib/deliverables/decision-model/types";

type Pipe = (m: MoveDecisionModel) => string | null;

/** Exhibit types this PR renders for real; everything else degrades to a gap-card. */
const PIPELINE: Partial<Record<ExhibitType, Pipe>> = {
  ValueWaterfall: (m) => {
    const s = toValueWaterfallSteps(m);
    return s ? investmentWaterfall(s) : null;
  },
  KeyMessageCard: (m) => {
    const t = toEconomicsTiles(m);
    return t ? economicsStrip(t) : null;
  },
  DecisionScorecard: (m) => {
    const o = toDecisionScorecardOptions(m);
    return o ? optionScorecard(o) : null;
  },
  OptionMatrix: (m) => {
    const o = toDecisionScorecardOptions(m);
    return o ? optionScorecard(o) : null;
  },
  TradeoffMatrix: (m) => {
    const o = toDecisionScorecardOptions(m);
    return o ? optionScorecard(o) : null;
  },
  ConstraintStack: (m) => {
    const s = toValueStackSegments(m);
    return s ? costStack(s) : null;
  },
  ValueTree: (m) => {
    const t = toValueTree(m);
    return t ? issueTree(t, { title: "Value tree" }) : null;
  },
  IssueTree: (m) => {
    const t = toClaimTree(m);
    return t ? issueTree(t, { title: "Issue tree" }) : null;
  },
  RootCauseTree: (m) => {
    const t = toClaimTree(m);
    return t ? issueTree(t, { title: "Root cause tree" }) : null;
  },
  DecisionTree: (m) => {
    const t = toClaimTree(m);
    return t ? issueTree(t, { title: "Decision tree" }) : null;
  },
};

export interface RenderedExhibit {
  pageNo: number;
  exhibitType: ExhibitType;
  status: "rendered" | "gap";
  /** A complete inline <svg> string. */
  svg: string;
  evidence: number[];
  /** Present when status === 'gap' — why it degraded. */
  gapReason?: string;
}

export function renderStoryExhibits(story: Story, model: MoveDecisionModel): RenderedExhibit[] {
  return story.pages.map((page) => {
    const pipe = PIPELINE[page.exhibitType];
    let svg: string | null = null;
    if (pipe) {
      try {
        svg = pipe(model);
      } catch {
        svg = null; // a single bad exhibit must never break the deck
      }
    }
    if (svg) {
      return {
        pageNo: page.pageNo,
        exhibitType: page.exhibitType,
        status: "rendered",
        svg,
        evidence: page.supportingEvidence,
      };
    }
    const cap = resolveExhibitRenderer(page.exhibitType);
    const reason = cap.status === "needs_build" ? cap.note : "insufficient model content for this exhibit";
    return {
      pageNo: page.pageNo,
      exhibitType: page.exhibitType,
      status: "gap",
      svg: gapCard(page.exhibitType, reason),
      evidence: page.supportingEvidence,
      gapReason: reason,
    };
  });
}

export interface VisualCoverage {
  total: number;
  rendered: number;
  gap: number;
}

export function visualCoverage(exhibits: RenderedExhibit[]): VisualCoverage {
  const rendered = exhibits.filter((e) => e.status === "rendered").length;
  return { total: exhibits.length, rendered, gap: exhibits.length - rendered };
}
