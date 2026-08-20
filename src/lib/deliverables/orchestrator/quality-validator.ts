// Deliverable quality gate — runs before export.
//
// BLOCKS (export refused) when the artifact would embarrass a senior team:
//   raw internal tags / source ids in body · weak-prose-dominated · missing expected
//   tables · no source register · no client-to-complete despite gaps · unsupported
//   claims · too short for the artifact type · no decision section · no recommendation.
// WARNS (advisory) when the artifact is mechanical/thin/generic/under-using evidence.

import type {
  DeliverableIntelligenceRequest,
  QualityValidationResult,
  RenderableDeliverable,
} from "./types";
import { scanForInternalLeaks } from "./source-register";
import { countBodyWords } from "@/lib/deliverables/shared/body-word-count";

const DECISION_RE =
  /\b(decision|recommend|we recommend|the ask|approval sought|go\/no-go)\b/i;
const TENSION_RE =
  /\b(tension|trade-?off|why now|the problem|leakage|at stake|the case for change|core challenge)\b/i;
const GENERIC_PHRASES = [
  "in today's fast-paced",
  "leverage synergies",
  "best-in-class solution",
  "world-class",
  "cutting-edge",
  "it is important to note that",
  "in conclusion,",
  "holistic approach",
  "paradigm shift",
];

function wordCount(s: string): number {
  return (s.trim().match(/\S+/g) ?? []).length;
}

/**
 * A substantial section that ends mid-sentence likely got cut off at the token ceiling.
 *
 * The signal is a PROSE cutoff. A complete section legitimately ends on a markdown
 * structure — a table row, a list item, a heading, a fenced block, or an emphasised
 * label — none of which carry sentence punctuation. Decomposed per-section generation
 * routinely ends a section on its risk table or its next-steps list, so we judge the
 * last non-empty LINE: structural endings are complete; only a prose line ending without
 * terminal punctuation (and not on a markdown token) is treated as truncated.
 */
function looksTruncated(markdown: string): boolean {
  const trimmed = markdown.trim();
  if (trimmed.length < 200) return false; // short sections aren't truncation evidence
  const lines = trimmed.split("\n");
  const lastLine = (lines[lines.length - 1] ?? "").trim();
  // complete markdown structures end without sentence punctuation — not truncation
  if (/^[#>|]/.test(lastLine)) return false; // heading / blockquote / table row
  if (/^([-*+]|\d+[.)])\s/.test(lastLine)) return false; // list item
  if (lastLine.includes("|")) return false; // table row (with or without leading pipe)
  if (/[*_`)\]}]$/.test(lastLine)) return false; // bold/italic/code/link/paren/brace close
  const last = trimmed[trimmed.length - 1];
  // acceptable prose endings: sentence punctuation, closing bracket/quote, or table pipe
  return !/[.!?:)\]"'»”|`]/.test(last);
}

/**
 * A raw tenant slug ("skyharbor", "apex_retail", "first-capital") — lowercase,
 * no spaces, or with `_`/`-` joiners — is not a client-facing display name.
 */
function looksLikeRawSlug(name: string): boolean {
  const n = name.trim();
  if (!n || n === "Client" || n === "Tenant") return false; // honest placeholders are fine
  if (/[\s]/.test(n)) return false; // has spaces → a real name
  if (/[_-]/.test(n)) return true; // snake/kebab joiner → slug
  return n === n.toLowerCase() && /^[a-z0-9]+$/.test(n); // single lowercase token
}

/** Count client-fact-looking claims that lack a [n] citation, assumption, or placeholder. */
function countUnsupportedClaims(body: string): number {
  // sentences asserting numbers/dollars/dates/percentages are client-fact candidates
  const sentences = body.split(/(?<=[.!?])\s+/);
  const factLike =
    /(\$\s?\d|\b\d{1,3}(?:,\d{3})+\b|\b\d+%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/;
  const supported =
    /\[\d+\]|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING|\(open input\s*[\u2013\u2014-]\s*see Open Inputs Required\)/i;
  let n = 0;
  for (const s of sentences) {
    if (factLike.test(s) && !supported.test(s)) n++;
  }
  return n;
}

export function validateDeliverableQuality(
  doc: RenderableDeliverable,
  req: DeliverableIntelligenceRequest,
): QualityValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const qb = req.qualityBar;

  const body = doc.generatedSections
    .map((s) => `${s.title}\n${s.bodyMarkdown}`)
    .join("\n\n");
  // The word band measures argument length. When the artifact's contract opts
  // in, exhibits/tables/appendices are excluded so a well-exhibited document is
  // not penalised for its exhibits. `body` above stays whole on purpose — leak
  // scanning and claim scanning must still see table content.
  const bodyWordCount = countBodyWords(doc.generatedSections, {
    excludeNonProse: qb.excludeNonProseFromBody === true,
  });
  const sectionCount = doc.generatedSections.length;
  const tableCount = doc.tables.length;
  const leakedInternalTags = scanForInternalLeaks(body);
  // Section titles are structural labels, not factual prose. Including a title
  // such as "FY2026 transition horizon" in the sentence scanner creates a
  // blocker that the deterministic body repair can never resolve. Scan the
  // same bodyMarkdown surface that repairUncitedFigures normalizes.
  const unsupportedClaimCount = countUnsupportedClaims(
    doc.generatedSections.map((s) => s.bodyMarkdown).join("\n\n"),
  );

  const hasSourceRegister = doc.sourceRegister.length > 0;
  const hasDecisionSection = doc.generatedSections.some((s) =>
    DECISION_RE.test(`${s.title} ${s.bodyMarkdown}`),
  );
  const hasRecommendation = wordCount(doc.recommendation) >= 12;
  const hasRiskTable = doc.tables.some((t) =>
    /risk|issue|dependenc/i.test(t.title),
  );
  const clientCompleteCount = doc.clientCompleteChecklist.length;
  const hasCentralTension = TENSION_RE.test(body);
  const hasOptionsConsidered =
    /\boptions?\s+(considered|evaluated)\b/i.test(body) ||
    doc.tables.some((t) => /option/i.test(t.title));
  const hasEvidenceGapsNoted =
    /\[EVIDENCE MISSING|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE/.test(
      body,
    ) || clientCompleteCount > 0;

  // ── BLOCKERS ──
  if (leakedInternalTags.length > 0)
    blockers.push(
      `internal tags/ids leaked into body: ${leakedInternalTags.join(", ")}`,
    );
  if (unsupportedClaimCount > 0)
    blockers.push(
      `${unsupportedClaimCount} unsupported client-fact claim(s) (number/date/$/% with no [n], assumption, or placeholder)`,
    );
  if (sectionCount < qb.minSections)
    blockers.push(`only ${sectionCount} sections; minimum ${qb.minSections}`);
  if (bodyWordCount < qb.minBodyWords)
    blockers.push(
      `document too short: ${bodyWordCount} words; minimum ${qb.minBodyWords}`,
    );
  if (qb.targetBodyWordsMax && bodyWordCount > qb.targetBodyWordsMax) {
    const withinAdvisoryBand =
      qb.advisoryBandMax !== undefined && bodyWordCount <= qb.advisoryBandMax;
    if (withinAdvisoryBand) {
      warnings.push(
        `Advisory: this document is ${bodyWordCount} words, slightly longer than the recommended executive target (${qb.targetBodyWordsMax}) but remains within the acceptable review range (up to ${qb.advisoryBandMax}).`,
      );
    } else {
      const bandNote = qb.advisoryBandMax
        ? ` (advisory band up to ${qb.advisoryBandMax})`
        : "";
      const message = `document too long for this artifact: ${bodyWordCount} words; target ceiling ${qb.targetBodyWordsMax}${bandNote} — use the target range as a discipline boundary, not permission to omit necessary analysis; do not add filler or generic prose to reach it, but a document this far past its ceiling usually means sections drifted off the decision this artifact exists to support`;
      if (qb.enforceMaxAsBlocker) blockers.push(message);
      else warnings.push(message);
    }
  }
  if (qb.requiresSourceRegister && !hasSourceRegister)
    blockers.push("no source register");
  if (qb.requiresDecisionSection && !hasDecisionSection)
    blockers.push("no executive decision section");
  if (qb.requiresRecommendation && !hasRecommendation)
    blockers.push("no clear recommendation");
  if (qb.requiresRiskTable && !hasRiskTable)
    blockers.push("no risk/issues/dependencies table");
  if (qb.requiresCitations && hasSourceRegister && !/\[\d+\]/.test(body))
    blockers.push("source register present but body cites nothing [n]");
  if (
    qb.requiresClientCompleteChecklistWhenGaps &&
    req.missingEvidence.length + req.clientCompleteItems.length > 0 &&
    clientCompleteCount === 0
  ) {
    blockers.push(
      "evidence gaps/client-complete items exist but the document has no client-to-complete checklist",
    );
  }
  // expected-tables-but-none guard (mechanical/empty)
  if (tableCount === 0 && req.qualityBar.requiresRiskTable)
    blockers.push("no tables where tables are expected");
  // tiny/unreadable formatting
  if (req.formattingProfile.bodyPointSize < 10)
    blockers.push(
      `body point size ${req.formattingProfile.bodyPointSize} is too small to read`,
    );
  // likely truncation — a substantial section that ends mid-sentence (no
  // terminal punctuation / closing) suggests the model hit the token ceiling.
  const truncatedSections = doc.generatedSections.filter((s) =>
    looksTruncated(s.bodyMarkdown),
  );
  if (truncatedSections.length > 0) {
    blockers.push(
      `output appears truncated in section(s): ${truncatedSections.map((s) => s.key).join(", ")}`,
    );
  }
  // tenant display name casing — a raw lowercase slug ("skyharbor", "apex_retail")
  // must never reach a board document; it should be the canonical display name.
  if (looksLikeRawSlug(doc.clientDisplayName)) {
    blockers.push(
      `tenant display name "${doc.clientDisplayName}" looks like a raw slug, not a proper client name`,
    );
  }

  // ── WARNINGS ──
  const genericHits = GENERIC_PHRASES.filter((p) =>
    body.toLowerCase().includes(p),
  );
  if (genericHits.length >= 2)
    warnings.push(
      `generic/weak prose detected: ${genericHits.slice(0, 4).join("; ")}`,
    );
  if (doc.exhibits.length === 0)
    warnings.push(
      "document lacks exhibits — consider decision/architecture/roadmap visuals",
    );
  // ── reference-contract enforcement (REF_EXECUTIVE_ROADMAP pilot) ──
  // requiredExhibitElements were only ever read into the prompt before this;
  // this is the first real check that the generated exhibit actually
  // contains them. Advisory-only until proven on real generations.
  for (const spec of qb.requiredExhibitElementsByKind ?? []) {
    const matching = doc.exhibits.filter((e) => e.kind === spec.kind);
    if (matching.length === 0) continue;
    for (const exhibit of matching) {
      const haystack = `${exhibit.title} ${exhibit.description}`.toLowerCase();
      const missing = spec.elements.filter(
        (el) => !haystack.includes(el.toLowerCase()),
      );
      if (missing.length > 0) {
        warnings.push(
          `${spec.kind} exhibit "${exhibit.title}" is missing required elements: ${missing.join(", ")}`,
        );
      }
    }
  }
  if (qb.forbiddenContentPatterns?.length) {
    const hits = qb.forbiddenContentPatterns
      .map((re) => body.match(re)?.[0])
      .filter((m): m is string => Boolean(m));
    if (hits.length > 0) {
      warnings.push(
        `content reads like an implementation schedule, not an executive artifact: found ${hits.slice(0, 3).join(", ")}`,
      );
    }
  }
  // ── story-first title enforcement (roadmap fast-follow, 2026-07-25) ──
  // A technically compliant exhibit is not enough if the title is still a
  // bare category label — the title must be the executive conclusion.
  if (qb.titleRule) {
    const title = doc.title.trim();
    const isGeneric = qb.titleRule.genericForbiddenPatterns.some((re) =>
      re.test(title),
    );
    const titleWordCount = title.split(/\s+/).filter(Boolean).length;
    if (isGeneric || titleWordCount < qb.titleRule.minWords) {
      warnings.push(
        `title "${title}" reads as a category label, not an executive conclusion — state the sequencing thesis in the title itself`,
      );
    }
  }
  const avgSectionWords = sectionCount
    ? Math.round(bodyWordCount / sectionCount)
    : 0;
  if (avgSectionWords > 0 && avgSectionWords < 90)
    warnings.push(
      `thin sections (avg ${avgSectionWords} words) — synthesis may be weak`,
    );
  const citedNumbers = new Set(
    (body.match(/\[(\d+)\]/g) ?? []).map((m) => Number(m.replace(/\D/g, ""))),
  );
  const evidenceUsedRatio = req.governedEvidenceBundle.length
    ? citedNumbers.size / req.governedEvidenceBundle.length
    : 1;
  if (req.governedEvidenceBundle.length >= 3 && evidenceUsedRatio < 0.5) {
    warnings.push(
      `only ${citedNumbers.size}/${req.governedEvidenceBundle.length} evidence items used — evidence underused`,
    );
  }
  if (doc.recommendation && wordCount(doc.recommendation) < 40)
    warnings.push(
      "recommendation is brief — may be too generic for a board artifact",
    );
  // Narrative-spine — this artifact must argue a case, not just fill sections.
  if (qb.requiresCentralTension && !hasCentralTension)
    warnings.push(
      "no clear central tension/why-now framing detected — the document should read as an argument, not a list of sections",
    );
  if (qb.requiresOptionsConsidered && !hasOptionsConsidered)
    warnings.push(
      "no options-considered framing detected — a real alternative should be weighed, not just the recommended path presented as inevitable",
    );
  if (qb.requiresEvidenceGapsNoted && !hasEvidenceGapsNoted)
    warnings.push(
      "no evidence gaps/assumptions/client-to-complete markers detected — what remains unproven should be stated, not implied away",
    );

  const wordBand: QualityValidationResult["metrics"]["wordBand"] = (() => {
    if (bodyWordCount < qb.minBodyWords) return "under";
    if (!qb.targetBodyWordsMax) return "n/a";
    if (bodyWordCount <= qb.targetBodyWordsMax) return "pass";
    if (qb.advisoryBandMax && bodyWordCount <= qb.advisoryBandMax)
      return "advisory";
    return "excessive";
  })();

  return {
    pass: blockers.length === 0,
    blockers,
    warnings,
    metrics: {
      sectionCount,
      bodyWordCount,
      tableCount,
      hasSourceRegister,
      hasDecisionSection,
      hasRecommendation,
      hasRiskTable,
      clientCompleteCount,
      unsupportedClaimCount,
      leakedInternalTags,
      hasCentralTension,
      hasOptionsConsidered,
      hasEvidenceGapsNoted,
      readingTimeMinutes: Math.max(1, Math.round(bodyWordCount / 200)),
      manualEditNeeded: warnings.length > 0 || blockers.length > 0,
      wordBand,
    },
  };
}
