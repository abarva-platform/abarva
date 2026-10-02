// Decomposed generation helpers (Slice 0).
//
// The orchestrator generates each planned section in its own bounded-parallel call, then
// assembles the RenderableDeliverable in code — so total length scales with section COUNT,
// not a single call's output ceiling (truncation becomes structurally impossible). These
// helpers are pure and unit-tested without the model.
//
// IMPORTANT: repairUncitedFigures MUST mirror the quality gate's regexes exactly
// (quality-validator.ts `countUnsupportedClaims`) so a section the gate would block for an
// uncited figure is deterministically repaired to a surfaced placeholder — never fabricated.

import "server-only";

import type {
  DeliverableIntelligenceRequest,
  DeliverableArtifactBrief,
  GovernedEvidenceItem,
  RenderableDeliverable,
  RenderableExhibit,
  RenderableSection,
  RenderableTable,
  SourceRegisterEntry,
} from "./types";
import { sanitizeClientFacingArtifactMarkdown } from "@/lib/deliverables/client-facing-artifact-sanitize";
import { clientCompleteReasonLabel } from "./client-complete-labels";
import { carriesRequiredEvidenceSignal } from "./evidence-signals";
import { humanizeSourceFamily } from "./source-register";
import { deckContract } from "@/lib/deliverables/shared/deck-story-contract";
import { SLIDE_BANDS } from "@/lib/deliverables/slide-contract";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";

/** Bounded-concurrency map that preserves input order. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  const cap = Math.max(1, Math.min(limit, items.length || 1));
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i] as T, i);
    }
  }
  await Promise.all(Array.from({ length: cap }, () => worker()));
  return out;
}

// Mirror of quality-validator.ts countUnsupportedClaims — keep in lockstep.
const FACT_LIKE =
  /(\$\s?\d|\b\d{1,3}(?:,\d{3})+\b|\b\d+%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/;
const FACT_TOKEN_RE =
  /(\$\s?\d[\d,]*(?:\.\d+)?[kmb]?|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/gi;
const SUPPORTED =
  /\[\d+\]|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING|\(open input\s*[\u2013\u2014-]\s*see Open Inputs Required\)/i;
const DECISIVE_RECOMMENDATION =
  /\b(recommend|approve|approval|decision|decide|proceed|hold|stop|fund|invest|select|award|endorse|choose|do not approve)\b/i;

export interface UnsupportedFigureClaim {
  sectionKey: string;
  sectionTitle: string;
  claim: string;
  treatment: "assumption_to_validate" | "open_input_required";
}

export function extractUnsupportedFigureClaims(markdown: string): string[] {
  if (!markdown) return [];
  return markdown
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => FACT_LIKE.test(s) && !SUPPORTED.test(s));
}

function normalizeFactToken(value: string): string {
  return value.toLowerCase().replace(/[\s,$]/g, "");
}

function factTokens(value: string): string[] {
  const matches = value.match(FACT_TOKEN_RE) ?? [];
  return Array.from(new Set(matches.map(normalizeFactToken)));
}

function sentenceEvidenceCitations(
  sentence: string,
  evidence: readonly GovernedEvidenceItem[],
): number[] {
  const tokens = factTokens(sentence);
  if (tokens.length === 0) return [];
  const backedTokens = new Set<string>();
  const citations = new Set<number>();
  for (const item of evidence) {
    const itemTokens = new Set(factTokens(`${item.label} ${item.statement}`));
    const matchingTokens = tokens.filter((token) => itemTokens.has(token));
    if (matchingTokens.length > 0) {
      matchingTokens.forEach((token) => backedTokens.add(token));
      citations.add(item.citationNumber);
    }
  }
  if (tokens.some((token) => !backedTokens.has(token))) return [];
  return Array.from(citations).sort((a, b) => a - b);
}

function appendCitations(
  sentence: string,
  citations: readonly number[],
): string {
  const suffix = citations.map((n) => `[${n}]`).join("");
  if (!suffix) return sentence;
  return sentence.replace(
    /([.!?])?(\s*)$/u,
    (_match, punctuation = "", whitespace = "") => {
      if (punctuation) return ` ${suffix}${punctuation}${whitespace}`;
      return ` ${suffix}${whitespace}`;
    },
  );
}

/**
 * Add citations only when an uncited numeric/date token exactly appears in the governed
 * evidence bundle. This is intentionally narrower than `repairUncitedFigures`: it fixes
 * citation omissions for known facts, while invented/transformed figures still flow to
 * the unsupported-claim blocker.
 */
export function repairEvidenceBackedUncitedFigures(
  markdown: string,
  evidence: readonly GovernedEvidenceItem[],
): string {
  if (!markdown || evidence.length === 0) return markdown;
  const sentences = markdown.split(/(?<=[.!?])\s+/);
  let changed = false;
  const repaired = sentences.map((sentence) => {
    if (!FACT_LIKE.test(sentence) || SUPPORTED.test(sentence)) return sentence;
    const citations = sentenceEvidenceCitations(sentence, evidence);
    if (citations.length === 0) return sentence;
    changed = true;
    return appendCitations(sentence, citations);
  });
  return changed ? repaired.join(" ") : markdown;
}

/**
 * Deterministically surface any client-fact-looking figure (number/$/%/date) that lacks a
 * [n] citation, an approved assumption, or a placeholder — by tagging the sentence
 * `[CLIENT TO COMPLETE]`. Conservative: it never removes or invents a figure, it only marks
 * an ungrounded one as needing client input, which is exactly what the governance demands
 * (surface gaps, never fabricate). This is what keeps a decomposed section past the gate.
 */
export function repairUncitedFigures(markdown: string): string {
  if (!markdown) return markdown;
  const sentences = markdown.split(/(?<=[.!?])\s+/);
  let changed = false;
  const repaired = sentences.map((s) => {
    if (FACT_LIKE.test(s) && !SUPPORTED.test(s)) {
      changed = true;
      return s.replace(
        /([.!?])?\s*$/,
        " [ASSUMPTION TO VALIDATE: numeric/date/value claim requires client confirmation or cited source before it is treated as committed.]$1",
      );
    }
    return s;
  });
  return changed ? repaired.join(" ") : markdown;
}

// Mirror of transformation-gates.ts checkOpenInputs PLACEHOLDER_PATTERNS — keep in lockstep.
const OPEN_INPUT_PLACEHOLDER_SOURCES: ReadonlyArray<{
  source: string;
  flags: string;
}> = [
  { source: "\\[CLIENT TO COMPLETE[^\\]]*\\]", flags: "gi" },
  { source: "\\bclient[-\\s]to[-\\s]complete\\b", flags: "gi" },
  { source: "\\bTBC\\b", flags: "g" },
  { source: "\\bto be confirmed\\b", flags: "gi" },
];

export interface ConsolidatedOpenInput {
  sectionKey: string;
  sectionTitle: string;
  detail: string;
}

/**
 * A structured field from the model, as text.
 *
 * The synthesis pass returns JSON, and a field typed as text here can arrive
 * as a number, a boolean, null, or a nested value — a table cell holding 64
 * rather than "64". Every repair below calls string methods on these fields,
 * so one numeric cell failed the whole build with a TypeError.
 */
export function structuredText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeOpenInputDetail(detail: unknown): string {
  const normalized = structuredText(detail)
    .replace(
      /\[CLIENT TO COMPLETE:?\s*([^\]]*)\]/gi,
      (_match, inner: string) =>
        inner?.trim()
          ? `Client input required: ${inner.trim()}`
          : "Client input required",
    )
    .replace(/\bTBC\b/g, "requires confirmation")
    .replace(/\bto be confirmed\b/gi, "requires confirmation")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || "Client input required";
}

function normalizeUnsupportedClaimForOpenInputs(claim: string): string {
  const normalized = normalizeOpenInputDetail(claim);
  if (!FACT_LIKE.test(normalized) || SUPPORTED.test(normalized))
    return normalized;
  return `${normalized} [ASSUMPTION TO VALIDATE: numeric/date/value claim requires client confirmation or cited source before it is treated as committed.]`;
}

function repairStructuredClientFactText(value: unknown): string {
  return repairUncitedFigures(normalizeOpenInputDetail(value));
}

function repairStructuredTable(table: RenderableTable): RenderableTable {
  const columns: unknown[] = Array.isArray(table.columns) ? table.columns : [];
  const rows: unknown[] = Array.isArray(table.rows) ? table.rows : [];
  return {
    ...table,
    columns: columns.map((column) => normalizeOpenInputDetail(column)),
    rows: rows.map((row) =>
      (Array.isArray(row) ? row : [row]).map((cell) =>
        repairStructuredClientFactText(cell),
      ),
    ),
  };
}

function repairStructuredChecklist(
  checklist: RenderableDeliverable["clientCompleteChecklist"],
): RenderableDeliverable["clientCompleteChecklist"] {
  return checklist.map((item) => ({
    ...item,
    label: repairStructuredClientFactText(item.label),
    owner: repairStructuredClientFactText(String(item.owner)),
    reason: item.reason,
    ...(item.placeholderText
      ? {
          placeholderText: repairStructuredClientFactText(item.placeholderText),
        }
      : {}),
  }));
}

function repairStructuredDeckSlides(
  deckSlides: RenderableDeliverable["deckSlides"] | undefined,
): RenderableDeliverable["deckSlides"] | undefined {
  const repaired = (deckSlides ?? [])
    .map((slide) => ({
      ...slide,
      ...(slide.title
        ? { title: repairStructuredClientFactText(slide.title) }
        : {}),
      governingMessage: repairStructuredClientFactText(slide.governingMessage),
      points: (Array.isArray(slide.points) ? slide.points : []).map(
        repairStructuredClientFactText,
      ),
      ...(slide.speakerNotes
        ? { speakerNotes: repairStructuredClientFactText(slide.speakerNotes) }
        : {}),
      citationsUsed: (slide.citationsUsed ?? []).filter((n) =>
        Number.isFinite(n),
      ),
    }))
    .filter((slide) => slide.governingMessage.trim().length > 0);
  return repaired.length > 0 ? repaired : undefined;
}

const P2_DISCOVERY_DECK_SLIDES = deckContract(
  "REF_DECK_P2_DISCOVERY_READOUT",
).slides;

const ROOT_CAUSE_SLIDE_KEYS = new Set([
  "executive_answer",
  "what_is_not_working",
  "root_causes",
  "metrics_evidence",
  "implications",
  "proceed_hold_stop",
]);

function contractedP2SlidesFor(deliverableType: string) {
  if (deliverableType === "discovery_report") return P2_DISCOVERY_DECK_SLIDES;
  if (deliverableType === "root_cause_worksheet") {
    return P2_DISCOVERY_DECK_SLIDES.filter((slide) =>
      ROOT_CAUSE_SLIDE_KEYS.has(slide.id),
    );
  }
  return [];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]*\)/g, " ")
    .replace(/[#*_`>|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(text: string): string {
  const clean = stripMarkdown(text);
  const sentence = clean.match(/.+?[.!?](?:\s|$)/)?.[0]?.trim() ?? clean;
  return sentence.split(/\s+/).slice(0, 26).join(" ");
}

function sectionForSlide(
  slideId: string,
  sections: readonly RenderableSection[],
): RenderableSection | undefined {
  const lookup = sections.map((section) => ({
    section,
    haystack: `${section.key} ${section.title}`.toLowerCase(),
  }));
  const needlesBySlide: Record<string, string[]> = {
    executive_answer: ["exec", "summary", "answer", "recommendation"],
    what_we_assessed: ["approach", "evidence", "scope"],
    current_state: ["current", "baseline", "workflow", "process"],
    what_is_working: ["working", "strength", "preserve", "readiness"],
    what_is_not_working: ["gap", "pain", "not_working", "maturity"],
    root_causes: ["root", "cause", "maturity", "gap"],
    metrics_evidence: ["metric", "baseline", "evidence", "confidence"],
    implications: ["implication", "p3", "design", "readiness"],
    readiness: ["readiness", "data", "control", "governance"],
    proceed_hold_stop: ["recommendation", "verdict", "continue", "decision"],
  };
  for (const needle of needlesBySlide[slideId] ?? []) {
    const hit = lookup.find((candidate) => candidate.haystack.includes(needle));
    if (hit) return hit.section;
  }
  return sections[0];
}

function ensureContractedDeckSlides(args: {
  req: DeliverableIntelligenceRequest;
  sections: readonly RenderableSection[];
  repairedSlides: RenderableDeliverable["deckSlides"] | undefined;
  recommendation: string;
  nextActions: readonly string[];
}): RenderableDeliverable["deckSlides"] | undefined {
  if (!args.req.outputFormats.includes("pptx")) return args.repairedSlides;
  const contractSlides = contractedP2SlidesFor(args.req.deliverableType);
  if (contractSlides.length === 0) return args.repairedSlides;

  const key = args.req.deliverableType as DeliverableKey;
  const band = SLIDE_BANDS[key];
  if (!band) return args.repairedSlides;

  const current = args.repairedSlides ?? [];
  if (current.length >= band.min && current.length <= band.max) return current;

  const currentByKey = new Map(
    current
      .filter((slide) => slide.key)
      .map((slide) => [slide.key as string, slide]),
  );
  const normalized = contractSlides.map((contractSlide) => {
    const existing = currentByKey.get(contractSlide.id);
    if (existing) return existing;
    const source = sectionForSlide(contractSlide.id, args.sections);
    const sourceSentence = source ? firstSentence(source.bodyMarkdown) : "";
    const governingMessage =
      sourceSentence ||
      (contractSlide.id === "proceed_hold_stop"
        ? firstSentence(args.recommendation)
        : `${contractSlide.label}: ${contractSlide.purpose}`);
    const actionLine =
      contractSlide.id === "proceed_hold_stop" && args.nextActions.length > 0
        ? `Next action: ${args.nextActions[0]}`
        : contractSlide.requiredElements[0];
    const citationsUsed = source?.citationsUsed?.filter((n) =>
      Number.isFinite(n),
    );
    return {
      key: contractSlide.id,
      title: contractSlide.label,
      governingMessage,
      points: [contractSlide.purpose, actionLine].filter(Boolean).slice(0, 3),
      speakerNotes: [
        source ? `Grounded in section "${source.title}".` : null,
        citationsUsed && citationsUsed.length > 0
          ? `Citations used: ${citationsUsed.join(", ")}.`
          : "No additional facts introduced by the deterministic deck normalizer.",
      ]
        .filter(Boolean)
        .join(" "),
      ...(citationsUsed && citationsUsed.length > 0 ? { citationsUsed } : {}),
    };
  });

  return normalized.slice(0, band.max);
}

/**
 * Sections are generated independently (one bounded-parallel model call each), so a
 * section may legitimately mark its OWN missing input inline per the prompt's own
 * instruction ("mark as [CLIENT TO COMPLETE]") without violating the "one per
 * section" guidance it was given. But the quality gate counts scattered placeholders
 * across the WHOLE assembled document — so N independently-compliant sections still
 * read as "scattered" and block export, even though no single generation call
 * disobeyed its instruction. There is no cross-section view at generation time to
 * prevent this, so consolidate deterministically after the fact: pull every inline
 * mention out of each section's body into ONE shared Open Inputs Required table,
 * leaving a pointer in the body that does not itself match the scattered-placeholder
 * scan (so the consolidated body never re-trips the same check).
 */
export function consolidateOpenInputPlaceholders(
  sections: readonly RenderableSection[],
): { sections: RenderableSection[]; harvested: ConsolidatedOpenInput[] } {
  const harvested: ConsolidatedOpenInput[] = [];
  const cleaned = sections.map((s) => {
    let body = s.bodyMarkdown;
    for (const { source, flags } of OPEN_INPUT_PLACEHOLDER_SOURCES) {
      body = body.replace(new RegExp(source, flags), (match) => {
        harvested.push({
          sectionKey: s.key,
          sectionTitle: s.title,
          detail: match,
        });
        return "(open input — see Open Inputs Required)";
      });
    }
    return body === s.bodyMarkdown ? s : { ...s, bodyMarkdown: body };
  });
  return { sections: cleaned, harvested };
}

/** A one-line summary of a section for the synthesis pass (titles + a clipped body). */
export function summariseSection(s: RenderableSection): {
  title: string;
  summary: string;
} {
  return {
    title: s.title,
    summary: s.bodyMarkdown.replace(/\s+/g, " ").slice(0, 400),
  };
}

function documentTextForSignalCheck(
  sections: readonly RenderableSection[],
  tables: readonly RenderableTable[],
  recommendation: string,
  nextActions: readonly string[],
): string {
  return [
    sections.map((s) => `${s.title}\n${s.bodyMarkdown}`).join("\n\n"),
    tables
      .map(
        (t) =>
          `${t.title}\n${t.columns.join(" | ")}\n${t.rows.map((r) => r.join(" | ")).join("\n")}`,
      )
      .join("\n\n"),
    recommendation,
    nextActions.join("\n"),
  ].join("\n\n");
}

function appendMissingEvidenceSignals(
  req: DeliverableIntelligenceRequest,
  sections: readonly RenderableSection[],
  tables: readonly RenderableTable[],
  recommendation: string,
  nextActions: readonly string[],
): RenderableSection[] {
  const required = req.requiredEvidenceSignals ?? [];
  if (required.length === 0) return [...sections];
  const haystack = documentTextForSignalCheck(
    sections,
    tables,
    recommendation,
    nextActions,
  );
  const missing = required.filter(
    (signal) =>
      !carriesRequiredEvidenceSignal(haystack, signal.label, signal.statement),
  );
  if (missing.length === 0) return [...sections];
  return [
    ...sections,
    {
      key: "evidence_signals_carried_forward",
      title: "Evidence Signals Carried Forward",
      bodyMarkdown: missing
        .map(
          (signal) =>
            `- ${signal.label}: ${signal.statement} [${signal.citationNumber}]`,
        )
        .join("\n"),
      rawBodyMarkdown: missing
        .map(
          (signal) =>
            `- ${signal.label}: ${signal.statement} [${signal.citationNumber}]`,
        )
        .join("\n"),
      groundingMode: "governed_facts",
      citationsUsed: missing.map((signal) => signal.citationNumber),
    },
  ];
}

/**
 * Build the source register from the UNION of evidence actually cited across the sections —
 * the quality gate blocks when `requiresSourceRegister` and the register is empty.
 */
export function buildSourceRegister(
  evidence: readonly GovernedEvidenceItem[],
  sections: readonly RenderableSection[],
): SourceRegisterEntry[] {
  const used = new Set<number>();
  for (const s of sections) for (const n of s.citationsUsed ?? []) used.add(n);
  return evidence
    .filter((e) => used.has(e.citationNumber))
    .map((e) => ({
      citationNumber: e.citationNumber,
      label: e.label,
      evidenceFamily: humanizeSourceFamily(e.evidenceFamily),
      confidence: e.confidence,
      asOf: e.asOf,
    }));
}

/** The doc-level fields the synthesis pass returns (the structured artifacts the gate checks). */
export interface SynthesisResult {
  title?: string;
  subtitle?: string;
  recommendation?: string;
  nextActions?: string[];
  deckSlides?: RenderableDeliverable["deckSlides"];
  tables?: RenderableTable[];
  exhibits?: RenderableExhibit[];
  clientCompleteChecklist?: RenderableDeliverable["clientCompleteChecklist"];
}

function honestTitle(
  req: DeliverableIntelligenceRequest,
  synth: SynthesisResult,
): string {
  const fallback = `${req.deliverableType.replace(/_/g, " ")} — ${req.initiativeDisplayName}`;
  const modelTitle =
    synth.title && synth.title.trim() ? synth.title.trim() : fallback;
  if (req.module !== "moves") return modelTitle;
  switch (req.deliverableType) {
    case "business_case":
      return `Business Case Readiness Memo — ${req.initiativeDisplayName}`;
    case "estimate_model":
    case "financial_model":
      return `Financial Model Input Register — ${req.initiativeDisplayName}`;
    case "value_measurement_contract":
      return `Value Measurement Contract — Measurement Framework`;
    default:
      return modelTitle;
  }
}

function openInputsTable(
  req: DeliverableIntelligenceRequest,
  unsupportedClaims: readonly UnsupportedFigureClaim[],
): RenderableTable | null {
  const rows: string[][] = [];
  for (const m of req.missingEvidence ?? []) {
    rows.push([
      m.label,
      normalizeOpenInputDetail(m.whyItMatters),
      normalizeOpenInputDetail(m.completionPath),
      "Open input",
    ]);
  }
  for (const c of unsupportedClaims) {
    rows.push([
      c.sectionTitle,
      normalizeUnsupportedClaimForOpenInputs(c.claim),
      c.treatment === "assumption_to_validate"
        ? "Confirm the assumption or replace it with a cited source."
        : "Provide supporting source evidence before asserting this as fact.",
      c.treatment === "assumption_to_validate"
        ? "Labeled assumption in draft"
        : "Open input required",
    ]);
  }
  if (rows.length === 0) return null;
  return {
    key: "open_inputs_required",
    title: "Open Inputs Required",
    columns: [
      "Area",
      "Input needed",
      "How to close",
      "Treatment in this artifact",
    ],
    rows,
    targetFormat: "docx",
  };
}

const GENERIC_EXHIBIT_DESCRIPTION =
  /profile-required view|populated from cited evidence|shows the user, ai, human decision|decision implication to confirm/i;

function repairStructuredValue(value: unknown): unknown {
  if (typeof value === "string") return repairStructuredClientFactText(value);
  if (Array.isArray(value))
    return value.map((item) => repairStructuredValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        repairStructuredValue(nested),
      ]),
    );
  }
  return value;
}

function repairStructuredExhibit(
  exhibit: RenderableExhibit,
): RenderableExhibit {
  return {
    key: repairStructuredClientFactText(String(exhibit.key ?? "")),
    title: repairStructuredClientFactText(String(exhibit.title ?? "")),
    kind: exhibit.kind,
    description: repairStructuredClientFactText(
      String(exhibit.description ?? ""),
    ),
    targetFormat: exhibit.targetFormat,
    ...(exhibit.data
      ? {
          data: repairStructuredValue(
            exhibit.data,
          ) as RenderableExhibit["data"],
        }
      : {}),
  };
}

function exhibitHasStructuredData(exhibit: RenderableExhibit): boolean {
  const data = exhibit.data;
  if (!data || typeof data !== "object") return false;
  switch (data.kind) {
    case "flow":
      return (
        Array.isArray(data.nodes) &&
        data.nodes.length >= 2 &&
        Array.isArray(data.edges) &&
        data.edges.length >= 1
      );
    case "matrix":
    case "heatmap":
    case "comparison":
      return Array.isArray(data.cells) && data.cells.length >= 2;
    case "timeline":
    case "roadmap":
      return (
        Array.isArray(data.lanes) &&
        data.lanes.some(
          (lane) => Array.isArray(lane.items) && lane.items.length > 0,
        )
      );
    case "value_tree":
      return Boolean(
        data.root?.label &&
        Array.isArray(data.branches) &&
        data.branches.length > 0,
      );
    case "conceptual_architecture":
    case "logical_architecture":
    case "physical_architecture":
    case "agent_orchestration":
      return (
        Array.isArray(data.lanes) &&
        data.lanes.some(
          (lane) => Array.isArray(lane.items) && lane.items.length > 0,
        )
      );
    default:
      return false;
  }
}

function exhibitHasDiagramReadyContent(exhibit: RenderableExhibit): boolean {
  if (!exhibitHasStructuredData(exhibit)) return false;
  const description = exhibit.description?.trim() ?? "";
  if (!exhibit.key?.trim() || !exhibit.title?.trim() || !description) {
    return false;
  }
  if (GENERIC_EXHIBIT_DESCRIPTION.test(description)) return false;
  const clauses = description
    .split(/\s*(?:→|->|;|\n|\.\s+)\s*/g)
    .map((p) => p.trim())
    .filter(Boolean);
  return clauses.length >= 3;
}

function renderableExhibitsFromSynthesis(
  synth: SynthesisResult,
): RenderableExhibit[] {
  const byKey = new Map<string, RenderableExhibit>();
  for (const exhibit of synth.exhibits ?? []) {
    const repaired = repairStructuredExhibit(exhibit);
    if (!exhibitHasDiagramReadyContent(repaired)) continue;
    byKey.set(repaired.key, repaired);
  }
  return [...byKey.values()];
}

function fallbackRecommendation(
  req: DeliverableIntelligenceRequest,
  sections: readonly RenderableSection[],
  synth: SynthesisResult,
): string {
  const supplied = synth.recommendation?.trim();
  if (
    supplied &&
    supplied.split(/\s+/).length >= 12 &&
    DECISIVE_RECOMMENDATION.test(supplied.slice(0, 260))
  ) {
    return supplied;
  }

  // Matches "Authorization & Immediate Next Steps" (the Charter's redesigned
  // 2026-07-25 closing section) as well as the older "recommendation"/
  // "handoff" naming other deliverable types still use. Deliberately does NOT
  // match bare "decision" — the Charter's own "Charter Decision" section
  // would otherwise be picked up first (wrong section: that's the up-front
  // authorize/hold call, not the closing recommendation/next-steps content).
  const recommendationSection = sections.find((s) =>
    /recommendation|handoff|authorization|next.?steps/i.test(
      `${s.key} ${s.title}`,
    ),
  );
  const recommendationSentences =
    recommendationSection?.bodyMarkdown
      .replace(/[#*_`>|-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean) ?? [];
  const decisiveIndex = recommendationSentences.findIndex((sentence) =>
    DECISIVE_RECOMMENDATION.test(sentence),
  );
  const firstSentence =
    decisiveIndex >= 0
      ? [
          recommendationSentences[decisiveIndex],
          recommendationSentences[decisiveIndex + 1],
        ]
          .filter(Boolean)
          .join(" ")
      : undefined;
  if (firstSentence && firstSentence.split(/\s+/).length >= 12) {
    return firstSentence.replace(/^choose\b/i, "We recommend choosing");
  }

  if (req.module === "moves" && req.deliverableType === "charter") {
    return `We recommend the sponsor review this concise Charter and approve Discovery only with the stated scope, decision rights, authorization conditions, assumptions, and caveats carried forward; detailed workshop instructions belong in the separate Discovery Workshop Guide.`;
  }

  return `We recommend sponsor review of this artifact before the next governed phase decision, with unresolved evidence gaps and client-complete items carried forward explicitly.`;
}

function fallbackRiskTable(
  req: DeliverableIntelligenceRequest,
  tables: readonly RenderableTable[],
): RenderableTable | null {
  if (!req.qualityBar.requiresRiskTable) return null;
  if (tables.some((t) => /risk|issue|dependenc/i.test(t.title))) return null;

  const rows: string[][] = [];
  for (const m of req.missingEvidence ?? []) {
    rows.push([
      m.label,
      "Dependency",
      m.whyItMatters,
      "Evidence owner",
      m.completionPath,
    ]);
  }
  for (const c of req.clientCompleteItems ?? []) {
    rows.push([
      c.label,
      "Open decision",
      clientCompleteReasonLabel(c.reason),
      c.owner,
      "Confirm during sponsor review before phase advancement.",
    ]);
  }

  if (rows.length === 0 && req.module === "moves") {
    if (req.deliverableType === "charter") {
      rows.push(
        [
          "Sponsor cadence and decision attendance",
          "Risk",
          "P2 can lose momentum if accountable roles are not present for working sessions and gates.",
          "Executive sponsor / Move lead",
          "Confirm sponsor cadence and operating-owner attendance before P2 close.",
        ],
        [
          "Discovery working-session readiness",
          "Dependency",
          "Current-state findings should not be finalized until uploaded evidence, workshop notes, and client corrections are reviewed and accepted.",
          "Evidence owners",
          "Use the separate Discovery Workshop Guide / Evidence Request Pack and Files & Evidence review before the Discovery gate.",
        ],
        [
          "Scope expansion beyond the charter boundary",
          "Issue",
          "Uncontrolled expansion can turn Discovery into solution design before facts are proven.",
          "Move lead / operating owner",
          "Hold out-of-scope requests as P3 options unless the sponsor revises the Charter.",
        ],
      );
    } else {
      rows.push(
        [
          "Evidence-to-decision traceability",
          "Dependency",
          "The phase decision should stay tied to approved evidence, assumptions, and open inputs.",
          "Move lead / evidence owners",
          "Review the source register and open-input table before gate approval.",
        ],
        [
          "Governance and control ownership",
          "Risk",
          "The design can drift if decision rights, approval points, or control owners remain implicit.",
          "Sponsor / accountable operating owner",
          "Name owners and approval cadence before the next phase commits execution work.",
        ],
        [
          "Implementation sequencing",
          "Issue",
          "Roadmap planning depends on resolving critical path dependencies before commitments are made.",
          "Workstream leads",
          "Carry dependencies into roadmap sequencing and mobilization readiness checks.",
        ],
      );
    }
  }

  if (rows.length === 0) return null;
  return {
    key: "risk_register",
    title: "Risk / Issues / Dependencies",
    columns: [
      "Item",
      "Type",
      "Implication",
      "Owner",
      "Mitigation / next action",
    ],
    rows: rows.slice(0, 5),
    targetFormat: "docx",
  };
}

/**
 * Assemble the final RenderableDeliverable in code from the per-section drafts + the synthesis
 * result. No monolithic render call → no single-blob ceiling. Falls back to the request's own
 * client-complete items so the "gaps exist but no checklist" gate never trips spuriously.
 */
export function assembleDeliverable(
  req: DeliverableIntelligenceRequest,
  sections: RenderableSection[],
  synth: SynthesisResult,
  evidence: readonly GovernedEvidenceItem[],
  options: {
    brief?: DeliverableArtifactBrief;
    unsupportedClaims?: readonly UnsupportedFigureClaim[];
  } = {},
): RenderableDeliverable {
  const { sections: cleanedSections, harvested } =
    consolidateOpenInputPlaceholders(sections);
  // Consolidation is itself a transformation after the per-section repair, so
  // repair runs once more on the RENDERED surface — a later normalization must
  // not reintroduce an untagged figure into what a reader sees.
  //
  // `rawBodyMarkdown` is deliberately carried through untouched: the quality
  // gate judges what the model actually wrote. Repairing before validation made
  // the unsupported-claim blocker unreachable, because the tag repair appends is
  // itself one of the gate's own "supported" markers.
  const finalSections = cleanedSections.map((section) => ({
    ...section,
    bodyMarkdown: sanitizeClientFacingArtifactMarkdown(
      repairUncitedFigures(
        repairEvidenceBackedUncitedFigures(section.bodyMarkdown, evidence),
      ),
    ),
    rawBodyMarkdown: repairEvidenceBackedUncitedFigures(
      section.rawBodyMarkdown ?? section.bodyMarkdown,
      evidence,
    ),
  }));
  const combinedClaims: UnsupportedFigureClaim[] = [
    ...(options.unsupportedClaims ?? []),
    ...harvested.map((h) => ({
      sectionKey: h.sectionKey,
      sectionTitle: h.sectionTitle,
      claim: h.detail,
      treatment: "open_input_required" as const,
    })),
  ];
  const openInputs = openInputsTable(req, combinedClaims);
  const tables = (synth.tables ?? []).map(repairStructuredTable);
  if (openInputs && !tables.some((t) => t.key === openInputs.key)) {
    tables.push(openInputs);
  }
  const riskTable = fallbackRiskTable(req, tables);
  if (riskTable) tables.push(riskTable);
  const checklist =
    synth.clientCompleteChecklist && synth.clientCompleteChecklist.length > 0
      ? repairStructuredChecklist(synth.clientCompleteChecklist)
      : repairStructuredChecklist(req.clientCompleteItems ?? []);
  const nextActions = (synth.nextActions ?? []).map(
    repairStructuredClientFactText,
  );
  const recommendation = repairStructuredClientFactText(
    fallbackRecommendation(req, finalSections, synth),
  );
  const sectionsWithSignals = appendMissingEvidenceSignals(
    req,
    finalSections,
    tables,
    recommendation,
    nextActions,
  );
  const generatedSections = sectionsWithSignals;
  const deckSlides = ensureContractedDeckSlides({
    req,
    sections: generatedSections,
    repairedSlides: repairStructuredDeckSlides(synth.deckSlides),
    recommendation,
    nextActions,
  });
  return {
    title: honestTitle(req, synth),
    subtitle: synth.subtitle,
    clientDisplayName: req.clientDisplayName,
    initiativeDisplayName: req.initiativeDisplayName,
    generatedSections,
    deckSlides,
    tables,
    exhibits: renderableExhibitsFromSynthesis(synth),
    sourceRegister: buildSourceRegister(evidence, sectionsWithSignals),
    assumptions: req.approvedAssumptions ?? [],
    clientCompleteChecklist: checklist,
    recommendation,
    nextActions,
  };
}
