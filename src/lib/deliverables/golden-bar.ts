// Golden-bar acceptance — the deterministic "does this artifact meet the bar?"
// check used by the QA gate at every slice. The bar is set by the manually
// generated decks in docs/build/golden-artifacts/. A generated artifact passes
// only if it is a real visual consulting artifact: rendered SVG/visuals, no
// `[DATA GAP]`, not prose-only, and (when a contract exists) the required
// exhibits are present.

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import {
  visualContractFor,
  checkVisualArtifactContract,
} from "./visual-artifact-contract";

export interface GoldenBarResult {
  pass: boolean;
  svgCount: number;
  hasDataGap: boolean;
  proseOnly: boolean;
  missingVisuals: string[];
  missingTables: string[];
  wordCount: number;
  forbiddenLanguageHits: string[];
  missingExactEvidenceTerms: string[];
  missingTaxonomyTerms: string[];
  rawClientFacingIdHits: string[];
  reasons: string[];
  /** True when the artifact exceeds `maximumWordCount`. May block when configured. */
  overMaximumWordCount: boolean;
  /** Quantified ($ or %) claims with no nearby evidence-qualifying language. Informational only. */
  unsupportedClaimSignals: string[];
  /**
   * Section (h1-h4) headings that appear more than once in the rendered
   * artifact, e.g. the model authoring "Current State Overview" twice in the
   * same document. Informational only — same rationale as
   * overMaximumWordCount when unenforced: rolling this out as a hard block
   * without having exercised it against real generated content across every
   * profile risks a new generation-blocking failure on a live Move.
   */
  duplicateSectionHeadings: string[];
  /** Deterministic 0-100 score derived from the checks above — replaces the old fixed 96/null. */
  qualityScore: number;
}

export interface GoldenBarOptions {
  minimumWordCount?: number;
  /**
   * Concision ceiling. Defaults to advisory-only so deep artifacts can warn
   * without blocking. Set `enforceMaximumWordCount` for concise executive
   * artifacts where the rendered output must fit the contract.
   */
  maximumWordCount?: number;
  enforceMaximumWordCount?: boolean;
  /**
   * When set, a document between `maximumWordCount` and this value is an
   * advisory (does not block acceptance) even when `enforceMaximumWordCount`
   * is true — only crossing THIS value blocks. See the matching
   * `advisoryBandMax` field in the orchestrator's QualityBar for the
   * rationale (2026-07-25 live-generation review).
   */
  advisoryMaximumWordCount?: number;
  forbiddenLanguage?: readonly string[];
  requiredExactEvidenceTerms?: readonly string[];
  requiredTaxonomyTerms?: readonly string[];
  forbidClientFacingRawIds?: boolean;
}

/**
 * Evidence-qualifying language the generation prompt itself asks for (see
 * claimClassificationBlock / evidencePriorityRuleBlock in
 * strategic-moves-artifact-standard.ts). A quantified claim near one of these
 * phrases is treated as sourced or explicitly flagged as an assumption/gap,
 * not hallucinated.
 */
const EVIDENCE_QUALIFYING_PHRASES = [
  "evidence supports",
  "evidence indicates",
  "evidence shows",
  "stakeholder notes suggest",
  "remains an assumption",
  "assumption for review",
  "cannot be finalized",
  "inferred from evidence",
  "inferred observation",
  "extracted metric",
  "structured csv",
  "structured xlsx",
  "missing evidence",
  "decision needed",
  "pending evidence",
  "not yet captured",
  "not yet approved",
  "illustrative",
  "estimate based on",
  "per uploaded",
  "sourced from",
  "based on uploaded",
  "data gap",
] as const;

const QUANTIFIED_CLAIM_PATTERN =
  /[^.!?]*(?:\$\s?[\d][\d,]*(?:\.\d+)?\s?(?:k|m|bn|million|billion)?\b|\b\d+(?:\.\d+)?\s?%)[^.!?]*[.!?]/gi;

/** Quantified ($/%) sentences with no nearby evidence-qualifying language. */
export function findUnsupportedQuantifiedClaims(
  plainText: string,
  limit = 20,
): string[] {
  const sentences = plainText.match(QUANTIFIED_CLAIM_PATTERN) ?? [];
  const flagged: string[] = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const qualified = EVIDENCE_QUALIFYING_PHRASES.some((phrase) =>
      lower.includes(phrase),
    );
    if (!qualified) {
      flagged.push(sentence.trim().slice(0, 160));
      if (flagged.length >= limit) break;
    }
  }
  return flagged;
}

/** Deterministic 0-100 score from the same signals the golden bar already computes. */
function computeQualityScore(input: {
  pass: boolean;
  overMaximumWordCount: boolean;
  unsupportedClaimCount: number;
  duplicateHeadingCount: number;
}): number {
  let score = input.pass ? 92 : 55;
  score -= Math.min(input.unsupportedClaimCount, 8) * 3;
  if (input.overMaximumWordCount) score -= 6;
  score -= Math.min(input.duplicateHeadingCount, 6) * 4;
  return Math.max(0, Math.min(100, score));
}

/** Extract the visible text of every h1-h4 heading in a rendered artifact. */
function extractHeadingTexts(html: string): string[] {
  const matches = html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi);
  const texts: string[] = [];
  for (const match of matches) {
    const text = match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) texts.push(text);
  }
  return texts;
}

/**
 * Section headings the model authored more than once in the same document
 * (case/whitespace-insensitive), e.g. two "Current State Overview" sections.
 * Returns each duplicated heading once, in first-seen order.
 */
export function findDuplicateSectionHeadings(html: string): string[] {
  const headings = extractHeadingTexts(html);
  const counts = new Map<string, number>();
  for (const heading of headings) {
    const key = heading.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const heading of headings) {
    const key = heading.toLowerCase();
    if ((counts.get(key) ?? 0) > 1 && !seen.has(key)) {
      seen.add(key);
      duplicates.push(heading);
    }
  }
  return duplicates;
}

/** Extract the visual/table "kinds" present in a rendered HTML artifact (heuristic). */
function normaliseForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function wordAppears(lowerHtml: string, word: string): boolean {
  if (lowerHtml.includes(word)) return true;
  if (word.endsWith("s") && lowerHtml.includes(word.slice(0, -1))) return true;
  return lowerHtml.includes(`${word}s`);
}

function requiredExhibitAppears(html: string, requirement: string): boolean {
  const lower = html.toLowerCase();
  const normalisedHtml = normaliseForMatch(html);
  const normalisedRequirement = normaliseForMatch(requirement);
  if (normalisedHtml.includes(normalisedRequirement)) return true;

  const words = requirement
    .toLowerCase()
    .replace(/\b(vs|and|or|to|the|a|an|of)\b/g, " ")
    .replace(/\b(table|diagram|chart|map|matrix)\b/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1);
  return words.every((word) => wordAppears(lower, word));
}

function extractExhibitKinds(
  html: string,
  artifactKey?: DeliverableKey,
): { visuals: string[]; tables: string[] } {
  const lower = html.toLowerCase();
  const visualMarkers = [
    "conceptual",
    "logical",
    "physical",
    "current-state",
    "current state",
    "target-state",
    "data-flow",
    "data flow",
    "pattern",
    "roadmap",
    "timeline",
    "trajectory",
    "value tree",
    "stakeholder",
    "process map",
    "root-cause",
    "heatmap",
    "approach",
    "native",
  ];
  const tableMarkers = [
    "matrix",
    "scorecard",
    "baseline",
    "evidence",
    "traceability",
    "raci",
    "tradeoff",
    "decision record",
    "cost",
    "gap matrix",
    "options",
    "kpi",
  ];
  const visuals = visualMarkers.filter((m) => lower.includes(m));
  // a visual marker only "counts" if there's an actual diagram/svg/flow nearby
  const tables = tableMarkers.filter((m) => lower.includes(m));
  const contract = artifactKey ? visualContractFor(artifactKey) : undefined;
  if (contract) {
    visuals.push(
      ...contract.requiredVisuals.filter((need) =>
        requiredExhibitAppears(html, need),
      ),
    );
    tables.push(
      ...contract.requiredTables.filter((need) =>
        requiredExhibitAppears(html, need),
      ),
    );
  }
  return { visuals, tables };
}

/** Score a rendered artifact HTML against the golden bar. */
export function meetsGoldenBar(
  html: string,
  artifactKey?: DeliverableKey,
  options: GoldenBarOptions = {},
): GoldenBarResult {
  const reasons: string[] = [];
  const svgCount = (html.match(/<svg/gi) ?? []).length;
  const hasDataGap = /\[?\s*data gap/i.test(html);
  const cssDiagram =
    /class="[^"]*(flow|diagram|arc|matrix|road|med|kgrid|traj)[^"]*"/i.test(
      html,
    );
  const hasVisuals = svgCount > 0 || cssDiagram;
  const tableCount = (
    html.match(/<table|class="[^"]*(matrix|kgrid|scorecard|road)[^"]*"/gi) ?? []
  ).length;
  const proseOnly = !hasVisuals && tableCount === 0;

  if (!hasVisuals)
    reasons.push(
      "no rendered SVG/CSS diagrams (prose-only architecture fails)",
    );
  if (hasDataGap) reasons.push("contains [DATA GAP] — context was not bound");
  if (proseOnly) reasons.push("prose-only — no visuals or tables");

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  if (options.minimumWordCount && wordCount < options.minimumWordCount) {
    reasons.push(
      `needs depth: artifact has ${wordCount} words; minimum is ${options.minimumWordCount}`,
    );
  }
  const overMaximumWordCount = Boolean(
    options.maximumWordCount && wordCount > options.maximumWordCount,
  );
  const withinAdvisoryBand = Boolean(
    overMaximumWordCount &&
    options.advisoryMaximumWordCount &&
    wordCount <= options.advisoryMaximumWordCount,
  );
  const overAdvisoryBand = Boolean(
    options.advisoryMaximumWordCount &&
    wordCount > options.advisoryMaximumWordCount,
  );
  if (overMaximumWordCount) {
    const blocks =
      options.enforceMaximumWordCount &&
      (!options.advisoryMaximumWordCount || overAdvisoryBand);
    const enforcement = blocks
      ? "blocks acceptance"
      : withinAdvisoryBand
        ? "advisory — within acceptable review range, does not block"
        : "informational — does not block";
    reasons.push(
      `runs long: artifact has ${wordCount} words; target ceiling is ${options.maximumWordCount} (${enforcement})`,
    );
  }
  const unsupportedClaimSignals = findUnsupportedQuantifiedClaims(text);
  const duplicateSectionHeadings = findDuplicateSectionHeadings(html);
  if (duplicateSectionHeadings.length) {
    reasons.push(
      `repeats section headings: ${duplicateSectionHeadings.join(", ")} (informational — does not block)`,
    );
  }
  const lowerText = text.toLowerCase();
  const forbiddenLanguageHits = (options.forbiddenLanguage ?? []).filter(
    (term) => lowerText.includes(term.toLowerCase()),
  );
  if (forbiddenLanguageHits.length) {
    reasons.push(
      `contains internal language: ${forbiddenLanguageHits.join(", ")}`,
    );
  }
  const lowerHtml = html.toLowerCase();
  const missingExactEvidenceTerms = (options.requiredExactEvidenceTerms ?? [])
    .filter((term) => term.trim().length > 0)
    .filter((term) => !lowerHtml.includes(term.toLowerCase()));
  if (missingExactEvidenceTerms.length) {
    reasons.push(
      `missing exact evidence terms: ${missingExactEvidenceTerms.join(", ")}`,
    );
  }
  const missingTaxonomyTerms = (options.requiredTaxonomyTerms ?? [])
    .filter((term) => term.trim().length > 0)
    .filter((term) => !lowerHtml.includes(term.toLowerCase()));
  if (missingTaxonomyTerms.length) {
    reasons.push(
      `missing evidence taxonomy terms: ${missingTaxonomyTerms.join(", ")}`,
    );
  }
  const rawClientFacingIdHits =
    options.forbidClientFacingRawIds === true
      ? [
          /\bmove\s+id\s*:/i.test(text) ? "Move ID:" : undefined,
          /\bmove\s*id\b/i.test(text) &&
          /[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i.test(text)
            ? "Move UUID"
            : undefined,
        ].filter((value): value is string => Boolean(value))
      : [];
  if (rawClientFacingIdHits.length) {
    reasons.push(
      `contains client-facing raw/system id label: ${rawClientFacingIdHits.join(", ")}`,
    );
  }

  let missingVisuals: string[] = [];
  let missingTables: string[] = [];
  if (artifactKey && visualContractFor(artifactKey)) {
    const { visuals, tables } = extractExhibitKinds(html, artifactKey);
    const check = checkVisualArtifactContract(artifactKey, { visuals, tables });
    missingVisuals = check.missingVisuals;
    missingTables = check.missingTables;
    if (!check.pass)
      reasons.push(
        `missing required exhibits: ${[...missingVisuals, ...missingTables].join(", ")}`,
      );
  }

  const pass =
    hasVisuals &&
    !hasDataGap &&
    !proseOnly &&
    (!options.minimumWordCount || wordCount >= options.minimumWordCount) &&
    (!options.maximumWordCount ||
      !options.enforceMaximumWordCount ||
      wordCount <= options.maximumWordCount ||
      withinAdvisoryBand) &&
    forbiddenLanguageHits.length === 0 &&
    missingExactEvidenceTerms.length === 0 &&
    missingTaxonomyTerms.length === 0 &&
    rawClientFacingIdHits.length === 0 &&
    missingVisuals.length === 0 &&
    missingTables.length === 0;

  const qualityScore = computeQualityScore({
    pass,
    overMaximumWordCount,
    unsupportedClaimCount: unsupportedClaimSignals.length,
    duplicateHeadingCount: duplicateSectionHeadings.length,
  });

  return {
    pass,
    svgCount,
    hasDataGap,
    proseOnly,
    missingVisuals,
    missingTables,
    wordCount,
    forbiddenLanguageHits,
    missingExactEvidenceTerms,
    missingTaxonomyTerms,
    rawClientFacingIdHits,
    reasons,
    overMaximumWordCount,
    unsupportedClaimSignals,
    duplicateSectionHeadings,
    qualityScore,
  };
}
