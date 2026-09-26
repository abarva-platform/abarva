/**
 * The Presentation Composer prompt.
 *
 * The model is not asked to write prose. The prose is already governed and
 * approved; asking for it again is how a deck drifts from its document. It is
 * asked to decide what the argument is, slide by slide, and to write the Python
 * that draws it.
 */
import type { PresentationPacket } from "@/lib/deliverables/composer/presentation-packet";

export const COMPOSER_SYSTEM = `You compose executive presentations for an enterprise advisory firm. Your audience is a CIO, a CFO and a COO in a steering committee, and the deck exists to get one decision made.

You write PYTHON that draws the deck using an approved SDK. You do not write the client's facts — those are given to you, already approved, and you may compress or rephrase them but never change what they claim.

WHAT SEPARATES A GOOD DECK FROM THE ONE YOU ARE REPLACING

The deck you are replacing put one document section on each slide, gave each slide a topic label, and filled it with a paragraph. That is a section list, not an argument. What you produce must differ on every one of these:

1. TITLES ARE ASSERTIONS. "Integration Architecture" is a label. "Eleven point-to-point seams collapse to one sanctioned path" is a message. Every title states what the slide proves, in the client's own terms, and the titles read in sequence as the argument.
2. ONE IDEA PER SLIDE, COMPOSED FOR THAT IDEA. A comparison is a grid. A sequence is a flow with connectors. A magnitude is a metric with its context beside it. A dependency is a diagram. Do not reach for the same arrangement twice in a row — if two consecutive slides look alike, you have not thought about the second one.
3. THE CANVAS IS 13.333 x 7.5 INCHES AND YOU SHOULD USE IT. Wide comparisons go wide. Do not stack everything in a 6-inch column down the left.
4. WHITESPACE IS A CHOICE, NOT LEFTOVER SPACE. A slide with one number and one sentence can be the strongest in the deck.
5. EVIDENCE IS VISIBLE BUT NOT LOUD. Citations and caveats belong in a small footer line or in speaker notes, not in the body at 12pt.

HARD RULES — a deck that breaks one of these is rejected by a deterministic gate, not by taste:

- Every material number you write MUST come from the AUTHORITATIVE FIGURES list. Currency, percentages, counts, rates, durations, headcount, ratios, KPI values. You may reformat a figure ($81,400,000,000 -> $81.4B) but you may not round it into a different claim, and you may not invent one.
- If you need a number that is not in the list but follows arithmetically from figures that are, declare it in derivedFigures with its inputs and operation. It will be recomputed. A wrong derivation fails the deck.
- Structural numbering is fine, but write it as structural: "1.", "Step 2", "Phase 3", "Q3", "3 / 7". A bare small integer standing alone reads as a claim and will be treated as one.
- A bare year is only allowed if it is one of CALENDAR YEARS IN THE ARTIFACT.
- Do not change the recommendation, the ask, the scope, the named owners or the material dates.
- No shape may fall outside the canvas. The SDK raises if you try; use measure_text and fit_text rather than guessing.
- Do not write placeholder text, lorem ipsum, "TBD", or a slide whose only content is its title.

OUTPUT

Return ONE JSON object and nothing else:

{
  "slideStoryPlan": [ { "slideId", "title", "purpose", "decisionContribution", "sourceFactIds": [], "figureIds": [], "visualIntent", "slideType": "cover|divider|content|appendix", "designation": "core|appendix" } ],
  "derivedFigures": [ { "value", "unit", "fromFigureIds": [], "operation": "sum|difference|percent_of", "label" } ],
  "pythonSource": "..."
}

The plan states intent; it must NOT contain coordinates. The Python decides composition.

The Python must:
- begin with "import sdk"
- build one sdk.Deck(), add slides in plan order, and finish with d.save("deck.pptx")
- import nothing except sdk, math, json, re, textwrap, datetime, itertools, functools, collections, typing, dataclasses, decimal, statistics, enum, copy, fractions
- never call eval, exec, open, getattr with a computed name, or any dunder attribute`;

export function buildComposerUser(packet: PresentationPacket, sdkSource: string): string {
  const figures = packet.figures
    .map((f) => `  ${f.figureId}  ${f.unit.padEnd(7)} ${String(f.value).padEnd(14)} ${f.label}  [renderings: ${f.formattedVariants.slice(0, 4).join(", ")}]`)
    .join("\n");

  const sections = packet.sections
    .map((s) => `### ${s.title}  (factId: ${s.factId}, citations: ${s.citationsUsed.join(", ") || "none"})\n${s.bodyMarkdown}`)
    .join("\n\n");

  const tables = packet.tables
    .map((t) => `### TABLE ${t.key} — ${t.title}\n${[t.columns, ...t.rows].map((r) => r.join(" | ")).join("\n")}`)
    .join("\n\n");

  const exhibits = packet.exhibits
    .map((e) => `### EXHIBIT ${e.key} — ${e.title} (${e.kind})\n${e.description}\n${e.data ? JSON.stringify(e.data, null, 1) : "(no structured data)"}`)
    .join("\n\n");

  return [
    `THE PRESENTATION SDK — this is the complete API available to your Python. Read it before composing; it is the only thing you may call.`,
    "```python",
    sdkSource,
    "```",
    ``,
    `=== THE DECISION ===`,
    `Client: ${packet.clientDisplayName}    Initiative: ${packet.initiativeDisplayName}`,
    `Audience: ${packet.audience.join(", ")}`,
    `Decision this deck must get made: ${packet.decisionSupported}`,
    `Artifact: ${packet.title}${packet.subtitle ? ` — ${packet.subtitle}` : ""}`,
    `Target length: ${packet.slideGuidance.min}–${packet.slideGuidance.max} slides. ${packet.slideGuidance.purpose}`,
    ``,
    `=== THE APPROVED RECOMMENDATION (do not alter its meaning) ===`,
    packet.recommendation,
    ``,
    `=== THE APPROVED NEXT ACTIONS ===`,
    packet.nextActions.map((a, i) => `${i + 1}. ${a}`).join("\n"),
    ``,
    `=== AUTHORITATIVE FIGURES — the only numbers you may assert ===`,
    figures,
    ``,
    `=== CALENDAR YEARS IN THE ARTIFACT ===`,
    packet.calendarYears.join(", ") || "(none)",
    ``,
    `=== APPROVED NARRATIVE (compress freely; do not contradict) ===`,
    sections,
    ``,
    `=== APPROVED TABLES ===`,
    tables || "(none)",
    ``,
    `=== APPROVED EXHIBITS ===`,
    exhibits || "(none)",
    ``,
    `Compose the deck. Return the single JSON object described in your instructions.`,
  ].join("\n");
}

/**
 * The code call's context: the accepted plan, and ONLY the governed facts the
 * plan allocated. Re-showing the whole evidence universe invites the code model
 * to reach for a fact the plan never chose, which is factual drift arriving
 * through the back door — and it is the story call's reasoning being paid for
 * twice.
 */
export function buildCodeBatchUser(
  packet: PresentationPacket,
  narrowed: {
    sections: PresentationPacket["sections"];
    tables: PresentationPacket["tables"];
    exhibits: PresentationPacket["exhibits"];
    figures: { figureId: string; value: number; unit: string; label: string; formattedVariants: string[] }[];
  },
  sdkSource: string,
  fullPlan: { slideId: string; title: string }[],
  batch: unknown[],
): string {
  const figures = narrowed.figures
    .map((f) => `  ${f.figureId}  ${f.unit.padEnd(7)} ${String(f.value).padEnd(14)} ${f.label}  [${f.formattedVariants.slice(0, 4).join(", ")}]`)
    .join("\n");

  return [
    `You are writing the PowerPoint composition code for an approved slide story plan. The story is settled — you are deciding geometry, not truth.`,
    ``,
    `THE PRESENTATION SDK — the complete API available to you:`,
    "```python",
    sdkSource,
    "```",
    ``,
    `=== DECK CONTEXT ===`,
    `Client: ${packet.clientDisplayName}   Initiative: ${packet.initiativeDisplayName}   Audience: ${packet.audience.join(", ")}`,
    `Full deck order (for continuity — you are writing only the slides listed below):`,
    fullPlan.map((s, i) => `  ${i + 1}. [${s.slideId}] ${s.title}`).join("\n"),
    ``,
    `=== FIGURES ALLOCATED TO THIS DECK — the only numbers you may write ===`,
    figures || "(none)",
    ``,
    `=== CALENDAR YEARS ALLOWED ===`,
    packet.calendarYears.join(", ") || "(none)",
    ``,
    `=== GOVERNED CONTENT THE PLAN ALLOCATED ===`,
    narrowed.sections.map((s) => `### ${s.factId} — ${s.title}\n${s.bodyMarkdown}`).join("\n\n"),
    ``,
    narrowed.tables.map((t) => `### TABLE ${t.key} — ${t.title}\n${[t.columns, ...t.rows].map((r) => r.join(" | ")).join("\n")}`).join("\n\n"),
    ``,
    narrowed.exhibits.map((e) => `### EXHIBIT ${e.key} — ${e.title} (${e.kind})\n${e.description}\n${e.data ? JSON.stringify(e.data) : ""}`).join("\n\n"),
    ``,
    `=== WRITE THESE SLIDES ===`,
    JSON.stringify(batch, null, 1),
    ``,
    `For EACH slide above write one Python function:`,
    ``,
    "```python",
    `def slide_<slideId>(deck, theme):`,
    `    s = deck.add_slide("paper")      # or a wash/navy background where the composition calls for it`,
    `    y = s.add_title("<the plan's title, verbatim or tightened>")`,
    `    ...`,
    "```",
    ``,
    `Rules for these functions:`,
    `- Take (deck, theme). Call deck.add_slide(...) exactly once. Do NOT call deck.save() — assembly does that.`,
    `- No imports, no module-level code, no helper functions outside the slide function.`,
    `- Realise the slide's visualIntent. Two consecutive slides must not share an arrangement.`,
    `- Use the full 13.333in width. Keep 0.75in side margins and finish above y=7.0.`,
    `- Use measure_text/fit_text rather than guessing; a shape off the canvas raises and fails the whole deck.`,
    `- Cite sources in a small footer line via s.add_footer(...), not in the body.`,
    ``,
    `- Aim for 40-90 lines per slide. A function three times that length is drawing detail no one reads at projection size.`,
    ``,
    `RETURN FORMAT — plain fenced blocks, NOT JSON. For each slide, exactly:`,
    ``,
    `### SLIDE <slideId>`,
    "```python",
    `def slide_<slideId>(deck, theme):`,
    `    ...`,
    "```",
    ``,
    `No prose between blocks. No JSON wrapper.`,
  ].join("\n");
}
