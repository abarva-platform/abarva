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
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";

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
const SUPPORTED =
  /\[\d+\]|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING|\(open input\s*[\u2013\u2014-]\s*see Open Inputs Required\)/i;

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

function normalizeOpenInputDetail(detail: string): string {
  const normalized = detail
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

function repairStructuredClientFactText(value: string): string {
  return repairUncitedFigures(normalizeOpenInputDetail(value));
}

function repairStructuredTable(table: RenderableTable): RenderableTable {
  return {
    ...table,
    columns: table.columns.map((column) => normalizeOpenInputDetail(column)),
    rows: table.rows.map((row) =>
      row.map((cell) => repairStructuredClientFactText(cell)),
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
      evidenceFamily: e.evidenceFamily,
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
  tables?: RenderableTable[];
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

function expectedExhibitsForProfile(
  req: DeliverableIntelligenceRequest,
  brief?: DeliverableArtifactBrief,
): RenderableExhibit[] {
  const byKey = new Map<string, RenderableExhibit>();
  for (const ex of brief?.expectedExhibits ?? []) {
    byKey.set(ex.key, {
      key: ex.key,
      title: ex.title,
      kind: ex.kind,
      description: ex.purpose,
      targetFormat: ex.preferredFormat,
    });
  }
  const deliverableKey = deliverableKeyForOrchestratorType(req.deliverableType);
  if (deliverableKey) {
    const profile = DELIVERABLE_PROFILES[deliverableKey];
    for (const key of profile.requiredExhibits) {
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          title: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (m) => m.toUpperCase()),
          kind:
            key.includes("roadmap") || key.includes("calendar")
              ? "timeline"
              : key.includes("map") || key.includes("flow")
                ? "flow"
                : "matrix",
          description: `Profile-required view for ${profile.title}; populated from cited evidence, assumptions, and open inputs.`,
          targetFormat: profile.defaultFormat === "xlsx" ? "xlsx" : "docx",
        });
      }
    }
  }
  return [...byKey.values()];
}

function fallbackRecommendation(
  req: DeliverableIntelligenceRequest,
  sections: readonly RenderableSection[],
  synth: SynthesisResult,
): string {
  const supplied = synth.recommendation?.trim();
  if (supplied && supplied.split(/\s+/).length >= 12) return supplied;

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
  const firstSentence = recommendationSection?.bodyMarkdown
    .replace(/[#*_`>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .find((sentence) =>
      /\brecommend|approve|hold|proceed|p2\b/i.test(sentence),
    );
  if (firstSentence && firstSentence.split(/\s+/).length >= 12) {
    return firstSentence;
  }

  if (req.module === "moves" && req.deliverableType === "charter") {
    return `We recommend the sponsor review this concise Charter and approve P2 Discovery only with the stated scope, decision rights, evidence plan, assumptions, and caveats carried forward as the governed source of truth.`;
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
      c.reason,
      c.owner,
      "Confirm during sponsor review before phase advancement.",
    ]);
  }

  if (
    rows.length === 0 &&
    req.module === "moves" &&
    req.deliverableType === "charter"
  ) {
    rows.push(
      [
        "Sponsor cadence and decision attendance",
        "Risk",
        "P2 can lose momentum if accountable roles are not present for working sessions and gates.",
        "Executive sponsor / Move lead",
        "Confirm sponsor cadence and operating-owner attendance before P2 close.",
      ],
      [
        "Evidence readiness for P2 Discovery",
        "Dependency",
        "Current-state findings should not be finalized until uploaded evidence is reviewed and accepted.",
        "Evidence owners",
        "Use the P2 evidence plan and Files & Evidence review before Approve & Build.",
      ],
      [
        "Scope expansion beyond the charter boundary",
        "Issue",
        "Uncontrolled expansion can turn Discovery into solution design before facts are proven.",
        "Move lead / operating owner",
        "Hold out-of-scope requests as P3 options unless the sponsor revises the Charter.",
      ],
    );
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
    bodyMarkdown: repairUncitedFigures(section.bodyMarkdown),
    rawBodyMarkdown: section.rawBodyMarkdown ?? section.bodyMarkdown,
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
  return {
    title: honestTitle(req, synth),
    subtitle: synth.subtitle,
    clientDisplayName: req.clientDisplayName,
    initiativeDisplayName: req.initiativeDisplayName,
    generatedSections: finalSections,
    tables,
    exhibits: expectedExhibitsForProfile(req, options.brief),
    sourceRegister: buildSourceRegister(evidence, finalSections),
    assumptions: req.approvedAssumptions ?? [],
    clientCompleteChecklist: checklist,
    recommendation: repairStructuredClientFactText(
      fallbackRecommendation(req, finalSections, synth),
    ),
    nextActions,
  };
}
