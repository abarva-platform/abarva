// Deliverable Quality Transformation — storyline deck (W3)
//
// The board-final artifact model: a storyline-led executive deck where each
// slide carries ONE governing message, the decision is visible by slide 2, and
// evidence/traceability lives in speaker notes — never on the slide. Renders to
// a premium self-contained HTML deck now; the same model feeds the native PPTX
// renderer at wiring time (expert-kernel pptx-renderer).
//
// Used for Executive Handoff and Diagnostic Readout profiles.

import type { ExhibitId } from "@/lib/deliverables/profiles/types";

export type SlideKind =
  | "decision_headline"
  | "decision_requested"
  | "situation"
  | "findings"
  | "value"
  | "recommendation"
  | "solution"
  | "roadmap"
  | "risks"
  | "decisions"
  | "appendix";

export interface Slide {
  kind: SlideKind;
  /** The single governing message — becomes the slide title. */
  governingMessage: string;
  /** Concise supporting points — never a text wall. */
  points?: string[];
  /** Referenced exhibit (drawn by the visual layer). */
  exhibit?: ExhibitId;
  /** Evidence / traceability lives here, not on the slide. */
  speakerNotes?: string;
}

export interface StorylineDeck {
  engagement: string;
  client: string;
  title: string;
  slides: Slide[];
}

export interface DeckValidationIssue {
  level: "error" | "warn";
  message: string;
}

const MAX_POINTS_PER_SLIDE = 6;

/** Validate the storyline discipline (the gate for board decks). */
export function validateStorylineDeck(deck: StorylineDeck): DeckValidationIssue[] {
  const issues: DeckValidationIssue[] = [];
  // Decision must be visible by slide 2.
  const firstTwo = deck.slides.slice(0, 2).map((s) => s.kind);
  if (
    !firstTwo.includes("decision_headline") &&
    !firstTwo.includes("decision_requested")
  ) {
    issues.push({
      level: "error",
      message: "Decision is not visible by slide 2.",
    });
  }
  for (const [i, s] of deck.slides.entries()) {
    if (!s.governingMessage?.trim()) {
      issues.push({
        level: "error",
        message: `Slide ${i + 1} has no governing message.`,
      });
    }
    if ((s.points?.length ?? 0) > MAX_POINTS_PER_SLIDE) {
      issues.push({
        level: "warn",
        message: `Slide ${i + 1} is text-wall heavy (${s.points!.length} points).`,
      });
    }
  }
  return issues;
}

export interface HandoffInput {
  engagement: string;
  client: string;
  decisionHeadline: string;
  decisionRequested: string;
  situation: string;
  findings: string[];
  valueStory: string;
  recommendation: string;
  solutionConcept: string;
  roadmap: string[];
  risks: { risk: string; mitigation: string }[];
  decisionsRequired: string[];
  evidenceSummary?: string;
}

/** Build a board-grade Executive Handoff storyline deck. */
export function buildHandoffDeck(input: HandoffInput): StorylineDeck {
  const slides: Slide[] = [
    {
      kind: "decision_headline",
      governingMessage: input.decisionHeadline,
      exhibit: "decision_headline",
      speakerNotes: input.evidenceSummary,
    },
    {
      kind: "decision_requested",
      governingMessage: input.decisionRequested,
    },
    { kind: "situation", governingMessage: input.situation },
    {
      kind: "findings",
      governingMessage: "What we learned",
      points: input.findings,
    },
    {
      kind: "value",
      governingMessage: input.valueStory,
      exhibit: "value_story",
    },
    { kind: "recommendation", governingMessage: input.recommendation },
    {
      kind: "solution",
      governingMessage: input.solutionConcept,
      exhibit: "target_state_architecture",
    },
    {
      kind: "roadmap",
      governingMessage: "How we deliver it",
      points: input.roadmap,
      exhibit: "roadmap_lanes",
    },
    {
      kind: "risks",
      governingMessage: "Risks we manage from day one",
      points: input.risks.map((r) => `${r.risk} → ${r.mitigation}`),
      exhibit: "risks_and_mitigations",
    },
    {
      kind: "decisions",
      governingMessage: "Decisions we need today",
      points: input.decisionsRequired,
    },
  ];
  return {
    engagement: input.engagement,
    client: input.client,
    title: "Executive Handoff",
    slides,
  };
}

/** Exhibit ids actually placed on the deck (for the visual-completeness gate). */
export function deckExhibits(deck: StorylineDeck): ExhibitId[] {
  return deck.slides
    .map((s) => s.exhibit)
    .filter((e): e is ExhibitId => Boolean(e));
}

function esc(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Render the storyline deck as a premium self-contained HTML deck. */
export function renderDeckHtml(deck: StorylineDeck): string {
  const slides = deck.slides
    .map((s, i) => {
      const points = s.points?.length
        ? `<ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`
        : "";
      const exhibit = s.exhibit
        ? `<div class="exhibit">Exhibit · ${esc(s.exhibit.replace(/_/g, " "))}</div>`
        : "";
      const notes = s.speakerNotes
        ? `<div class="notes"><span>Speaker notes</span> ${esc(s.speakerNotes)}</div>`
        : "";
      return `<div class="slide" data-kind="${s.kind}">
        <div class="slide-no">${i + 1}</div>
        <h2>${esc(s.governingMessage)}</h2>
        ${points}${exhibit}${notes}
      </div>`;
    })
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(deck.engagement)} — ${esc(deck.title)}</title>
<style>
  :root{--bg:#F8F7F4;--ink:#1a1a1a;--muted:#6b6b66;--line:#e2e0d9;--accent:#1a1a1a;--data:#2f6f6a}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;padding:40px 0}
  h1,h2{font-family:Georgia,serif;font-weight:400}
  .head{max-width:1000px;margin:0 auto 24px;padding:0 28px}
  .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
  .deck{max-width:1000px;margin:0 auto;display:flex;flex-direction:column;gap:22px;padding:0 28px}
  .slide{position:relative;aspect-ratio:16/9;background:#fff;border:1px solid var(--line);border-radius:12px;padding:42px 46px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 1px 0 rgba(0,0,0,.02)}
  .slide-no{position:absolute;top:18px;right:22px;font-family:Georgia,serif;color:var(--muted);font-size:14px}
  .slide h2{font-size:27px;line-height:1.2;margin:0 0 14px;max-width:80%}
  .slide ul{margin:6px 0 0;padding-left:20px;font-size:16px;line-height:1.6}
  .slide li{margin:3px 0}
  .exhibit{margin-top:18px;align-self:flex-start;border:1px dashed var(--line);border-radius:8px;padding:10px 16px;color:var(--data);font-size:13px;background:#fbfbf9}
  .notes{position:absolute;left:46px;right:46px;bottom:20px;font-size:11.5px;color:var(--muted);border-top:1px solid var(--line);padding-top:8px}
  .notes span{text-transform:uppercase;letter-spacing:.06em;font-size:10px;color:#a8a59c;margin-right:6px}
  [data-kind="decision_headline"]{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
  [data-kind="decision_headline"] .slide-no{color:#888}
  [data-kind="decision_requested"]{border-left:4px solid var(--accent)}
</style></head>
<body>
  <div class="head"><div class="kicker">${esc(deck.client)} · ${esc(deck.title)}</div></div>
  <div class="deck">${slides}</div>
</body></html>`;
}
