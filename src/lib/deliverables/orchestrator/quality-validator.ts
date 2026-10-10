// Deliverable quality gate — runs before export.
//
// BLOCKS (export refused) when the artifact would embarrass a senior team:
//   raw internal tags / source ids in body · weak-prose-dominated · missing expected
//   tables · no source register · no client-to-complete despite gaps · unsupported
//   claims · too short for the artifact type · no decision section · no recommendation.
// WARNS (advisory) when the artifact is mechanical/thin/generic/under-using evidence.

import type {
  DeliverableIntelligenceRequest,
  ExpectedExhibit,
  GovernedEvidenceItem,
  QualityValidationResult,
  RenderableDeliverable,
  RenderableExhibit,
} from "./types";
import { carriesRequiredEvidenceSignal } from "./evidence-signals";
import { scanForInternalLeaks } from "./source-register";
import { countBodyWords } from "@/lib/deliverables/shared/body-word-count";
import { judgeSlideCount } from "@/lib/deliverables/slide-contract";
import { findExcludedNumericClaims } from "./excluded-numeric-claims";
import { validatePublicSourceCitations } from "./public-source-citations";
import { validateValueModelFigures } from "./value-model-figures";
import {
  LEGACY_FIGURE_LINEAGE,
  figureLineagePolicy,
  judgeFigureSentence,
  registerCitationIds,
  untracedFigures,
  type FigureLineagePolicy,
} from "./numeric-lineage-tokens";
import {
  classifySlideDensity,
  deckContractExpectsDiagram,
  deckContractIdForDeliverable,
  isGenericSlideTitle,
  MAX_SUPPORTING_POINTS,
} from "@/lib/deliverables/shared/deck-story-contract";

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

const SCAFFOLD_WORD = "place" + "holder";
const VISUAL_WORDS = "(?:matrix|diagram|chart|exhibit|visual|table)";
const TBD_WORD = "t" + "bd";
const VISUAL_TO_BE_ADDED = [
  "visual",
  String.raw`\s+to\s+be\s+`,
  "(?:inserted|added)",
].join("");
const FILLER_TEXT = ["lorem", String.raw`\s+`, "ipsum"].join("");
const VISIBLE_EXHIBIT_PLACEHOLDER_RE = new RegExp(
  String.raw`\b(?:${SCAFFOLD_WORD}\s*:\s*${VISUAL_WORDS}|${VISUAL_WORDS}\s+${SCAFFOLD_WORD}|${SCAFFOLD_WORD}\s+${VISUAL_WORDS}|${TBD_WORD}\s+${VISUAL_WORDS}|${VISUAL_TO_BE_ADDED}|${FILLER_TEXT})\b`,
  "i",
);

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

function collectVisibleExhibitPlaceholders(
  doc: RenderableDeliverable,
): string[] {
  const hits = new Set<string>();

  for (const section of doc.generatedSections) {
    const sectionText = `${section.title}\n${section.rawBodyMarkdown ?? section.bodyMarkdown}`;
    if (VISIBLE_EXHIBIT_PLACEHOLDER_RE.test(sectionText)) {
      hits.add(section.title || section.key);
    }
  }

  for (const exhibit of doc.exhibits) {
    const exhibitText = `${exhibit.title}\n${exhibit.description}`;
    if (VISIBLE_EXHIBIT_PLACEHOLDER_RE.test(exhibitText)) {
      hits.add(exhibit.title || exhibit.key);
    }
  }

  return Array.from(hits).slice(0, 5);
}

function excerptSentence(sentence: string): string {
  return sentence.replace(/\s+/g, " ").trim().slice(0, 180);
}

function isSupportedExternalBenchmarkClaim(sentence: string): boolean {
  if (
    !/\b(external[_ -]?benchmark|external reference|reference pattern|sensitivity[- ]?(?:only|framing)|for sensitivity)\b/i.test(
      sentence,
    ) &&
    !/\bexternal\b[^\n|]{0,80}\bbenchmark\b/i.test(sentence)
  ) {
    return false;
  }

  if (
    /\b(annual|total|savings?|benefits?|ROI|return|payback|NPV)\b/i.test(
      sentence,
    ) &&
    !/\bnot\b.{0,120}\b(savings?|benefits?|ROI|return|client[- ]specific|internal|baseline|claim|fact)\b/i.test(
      sentence,
    )
  ) {
    return false;
  }

  return /\bnot\b.{0,120}\b(client[- ]specific|internal|baseline|savings?|benefits?|claim|fact)\b|sensitivity[- ]only|for sensitivity|per minute|\/min\b/i.test(
    sentence,
  );
}

/**
 * Collect client-fact-looking claims that lack a [n] citation, assumption, or placeholder.
 *
 * Under the assumptions register (`policy.enforced`) a bare
 * `[ASSUMPTION TO VALIDATE` no longer supports a figure; a known `[A:ID]`
 * does, when every figure the evidence does not back matches a cited row's
 * figure. See `judgeFigureSentence`.
 */
function collectUnsupportedClaims(
  body: string,
  evidence: readonly GovernedEvidenceItem[] = [],
  policy: FigureLineagePolicy = LEGACY_FIGURE_LINEAGE,
  allowExternalBenchmarkShortcut = true,
): string[] {
  // sentences asserting numbers/dollars/dates/percentages are client-fact candidates
  const sentences = body.split(/(?<=[.!?])\s+/);
  const factLike =
    /(\$\s?\d|\b\d{1,3}(?:,\d{3})+\b|\b\d+%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/;
  const claims: string[] = [];
  for (const s of sentences) {
    if (!factLike.test(s) || (allowExternalBenchmarkShortcut && isSupportedExternalBenchmarkClaim(s))) continue;
    const verdict = judgeFigureSentence(s, policy);
    if (verdict.supported) continue;
    if (verdict.citedRegisterIds.length > 0) {
      // A register citation was made and a figure in the sentence is not the
      // cited row's figure (and not in evidence) — name both.
      claims.push(
        `${excerptSentence(s)} [figures matching neither evidence nor the cited register row(s) ${verdict.citedRegisterIds.map((id) => `[A:${id}]`).join(", ")}: ${verdict.unmatchedFigures.slice(0, 6).join(", ")}]`,
      );
      continue;
    }
    // Name the figures that trace to nothing. The claim is blocked either
    // way; this is what lets a reader find the figure inside a long table.
    const untraced = untracedFigures(s, evidence).slice(0, 6);
    claims.push(
      untraced.length > 0
        ? `${excerptSentence(s)} [figures with no match in evidence: ${untraced.join(", ")}]`
        : excerptSentence(s),
    );
  }
  return claims;
}

/**
 * Greedy one-to-one match of expected exhibits against produced ones.
 *
 * One-to-one and not merely "is a matrix present": a brief that asks for two
 * matrices and receives one would otherwise report both satisfied, and the
 * shortfall would disappear in exactly the case it exists to catch.
 *
 * Matched in two passes, because kind alone cannot say WHICH exhibit arrived.
 * 86 of the 105 structure x pack briefs this registry can compose declare two
 * or more expected exhibits of the same kind (the AMS pack alone asks for three
 * matrices), and a single-pass match by kind credits them in declaration order.
 * It then names the losers of that order as missing — so an exhibit that was
 * delivered gets reported absent while the one actually absent is counted as
 * received. The count was right and the diagnosis was wrong, which is worse
 * than silence: an operator reads a specific title and goes looking for a
 * visual that is already in the document.
 *
 * Pass 1 claims the pairs that identify each other — same kind AND the same
 * title or key, compared loosely, since the prompt names expected exhibits by
 * title and the author echoes it. Pass 2 is the original rule over whatever is
 * left, so no brief loses a match it had before. `received` is unchanged for
 * every input: within one kind both passes leave a maximal matching, so the
 * total is still the sum over kinds of min(expected, produced). Only the
 * attribution moves.
 */
function exhibitIdentity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function identifiesSameExhibit(
  want: ExpectedExhibit,
  got: RenderableExhibit,
): boolean {
  if (want.kind !== got.kind) return false;
  const wantTitle = exhibitIdentity(want.title);
  const wantKey = exhibitIdentity(want.key);
  const gotTitle = exhibitIdentity(got.title);
  const gotKey = exhibitIdentity(got.key);
  if (wantTitle && (wantTitle === gotTitle || wantTitle === gotKey)) return true;
  if (wantKey && (wantKey === gotKey || wantKey === gotTitle)) return true;
  return false;
}

function matchExpectedExhibits(
  expected: readonly ExpectedExhibit[],
  produced: readonly RenderableExhibit[],
): { received: number; missing: string[] } {
  const unconsumed: Array<RenderableExhibit | null> = [...produced];
  const matched = expected.map(() => false);
  let received = 0;

  const claim = (at: number): void => {
    unconsumed[at] = null;
    received += 1;
  };

  // pass 1 — the pairs that name each other
  expected.forEach((want, i) => {
    const at = unconsumed.findIndex(
      (got) => got !== null && identifiesSameExhibit(want, got),
    );
    if (at === -1) return;
    matched[i] = true;
    claim(at);
  });

  // pass 2 — by kind, over what pass 1 did not claim
  expected.forEach((want, i) => {
    if (matched[i]) return;
    const at = unconsumed.findIndex(
      (got) => got !== null && got.kind === want.kind,
    );
    if (at === -1) return;
    matched[i] = true;
    claim(at);
  });

  return {
    received,
    missing: expected.filter((_, i) => !matched[i]).map((want) => want.title),
  };
}

export function validateDeliverableQuality(
  doc: RenderableDeliverable,
  req: DeliverableIntelligenceRequest,
  opts: { expectedExhibits?: readonly ExpectedExhibit[] } = {},
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
  const visibleExhibitPlaceholders = collectVisibleExhibitPlaceholders(doc);
  // Section titles are structural labels, not factual prose — a title such as
  // "FY2026 transition horizon" would raise a blocker no repair could resolve,
  // so only body text is scanned.
  //
  // Scan what the MODEL wrote, not what repair rewrote. `repairUncitedFigures`
  // appends "[ASSUMPTION TO VALIDATE: ...]" to every uncited figure, and that
  // tag is itself one of the `supported` markers — so scanning the repaired body
  // made this blocker structurally unreachable, and an invented figure passed
  // purely because it had been relabelled. An assumption the model DECLARED
  // still passes; one it was caught inventing now fails.
  const lineage = figureLineagePolicy(req);
  const unsupportedClaimExamples = collectUnsupportedClaims(
    doc.generatedSections
      .map((s) => s.rawBodyMarkdown ?? s.bodyMarkdown)
      .join("\n\n"),
    req.governedEvidenceBundle,
    lineage,
    req.publicSources === undefined,
  );
  const unsupportedClaimCount = unsupportedClaimExamples.length;

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
  const wholeDocumentText = [
    doc.title,
    doc.subtitle ?? "",
    doc.generatedSections
      .map((section) => section.rawBodyMarkdown ?? section.bodyMarkdown)
      .join("\n\n"),
    body,
    doc.tables
      .map(
        (t) =>
          `${t.title}\n${t.columns.join(" | ")}\n${t.rows
            .map((row) => row.join(" | "))
            .join("\n")}`,
      )
      .join("\n\n"),
    doc.recommendation,
    doc.nextActions.join("\n"),
    (doc.deckSlides ?? [])
      .flatMap((slide) => [
        slide.title ?? "",
        slide.governingMessage,
        ...(slide.points ?? []),
        slide.speakerNotes ?? "",
      ])
      .join("\n"),
    doc.exhibits
      .map(
        (exhibit) =>
          `${exhibit.title}\n${exhibit.description}\n${JSON.stringify(exhibit.data ?? {})}`,
      )
      .join("\n\n"),
    doc.sourceRegister
      .map(
        (source) =>
          `${source.label} ${source.evidenceFamily} ${source.asOf ?? ""}`,
      )
      .join("\n"),
    doc.assumptions.map((assumption) => assumption.statement).join("\n"),
    doc.clientCompleteChecklist
      .map((item) => `${item.label} ${item.placeholderText}`)
      .join("\n"),
  ].join("\n\n");
  const excludedNumericClaimHits = findExcludedNumericClaims(
    wholeDocumentText,
    req.prohibitedNumericClaims ?? [],
  );
  const missingRequiredEvidenceSignals = (req.requiredEvidenceSignals ?? [])
    .filter(
      (signal) =>
        !carriesRequiredEvidenceSignal(
          wholeDocumentText,
          signal.label,
          signal.statement,
        ),
    )
    .map((signal) => `${signal.label} [${signal.citationNumber}]`);

  // A register citation must resolve to a row this generation was given. An
  // ID outside it — invented, proposed, rejected or superseded — is a citation
  // a reader cannot follow, wherever in the document it sits.
  const unknownRegisterIds = lineage.enforced
    ? registerCitationIds(wholeDocumentText).filter(
        (id) => !lineage.registerFigures.has(id),
      )
    : [];

  // ── BLOCKERS ──
  blockers.push(...validatePublicSourceCitations(doc, req));
  blockers.push(...validateValueModelFigures(doc, req));
  if (unknownRegisterIds.length > 0)
    blockers.push(
      `cites assumptions-register row(s) that are not in this Move's citable register: ${unknownRegisterIds
        .map((id) => `[A:${id}]`)
        .join(", ")}`,
    );
  if (leakedInternalTags.length > 0)
    blockers.push(
      `internal tags/ids leaked into body: ${leakedInternalTags.join(", ")}`,
    );
  if (visibleExhibitPlaceholders.length > 0)
    blockers.push(
      `visible exhibit placeholder(s) remain in client artifact: ${visibleExhibitPlaceholders.join(", ")}`,
    );
  if (unsupportedClaimCount > 0)
    blockers.push(
      `${unsupportedClaimCount} unsupported client-fact claim(s) (${lineage.enforced ? "number/date/$/% with no [n], matching register citation [A:ID], or placeholder" : "number/date/$/% with no [n], assumption, or placeholder"}): ${unsupportedClaimExamples
        .slice(0, 3)
        .map((s) => `"${s}"`)
        .join("; ")}`,
    );
  if (excludedNumericClaimHits.length > 0) {
    blockers.push(
      `explicitly excluded numeric claim(s) from governed evidence appear in the artifact: ${excludedNumericClaimHits
        .map((claim) => `${claim.sourceLabel} [${claim.citationNumber}]`)
        .join("; ")}`,
    );
  }
  if (sectionCount < qb.minSections)
    blockers.push(`only ${sectionCount} sections; minimum ${qb.minSections}`);

  // Deck length, for deliverables that produce one. The band is declared per
  // deck in slide-contract.ts; a deliverable with no band is not a deck and is
  // judged by the section and word bars above instead.
  //
  // The ceiling is the half that matters. An artifact can satisfy every section
  // and citation rule and still fail in the room by being thirty slides long,
  // and that is a failure this pipeline has no other way to see.
  //
  // Judge the deck only when a deck is actually produced — when PPTX is an
  // output format. A document-primary deliverable (DOCX/XLSX) can carry
  // latent deckSlides the synthesis volunteered that no renderer turns into a
  // deck; judging those against the deck's slide band blocked a DOCX business
  // case for having three slides, a band its writer was never given and its
  // output never shows. This is the same PPTX condition under which the writer
  // is told the band (deckLengthInstruction) and the slides are contracted
  // (ensureContractedDeckSlides), so the three now agree.
  if (
    req.outputFormats.includes("pptx") &&
    doc.deckSlides &&
    doc.deckSlides.length > 0
  ) {
    const verdict = judgeSlideCount(
      req.deliverableType as Parameters<typeof judgeSlideCount>[0],
      doc.deckSlides.length,
      qb.slideFloor,
    );
    if (!verdict.ok) blockers.push(verdict.message);

    // Deck story-contract quality — ADVISORY (non-blocking) on first wiring, so
    // activating a previously-unenforced bar never inverts the gate on a deck
    // that was acceptable before. Each warning names the exact slide(s) so the
    // signal is actionable, and the generator is told the same contract via
    // deckStoryContractInstruction — the writer sees every bar it is judged on.
    const slides = doc.deckSlides;
    const labelLed = slides.filter((s) =>
      isGenericSlideTitle(s.governingMessage ?? ""),
    );
    if (labelLed.length > 0) {
      const examples = labelLed
        .slice(0, 3)
        .map((s) => `"${(s.governingMessage ?? "").trim()}"`)
        .join(", ");
      warnings.push(
        `Advisory: ${labelLed.length} of ${slides.length} slides lead with a label, not an argument — a slide title should state the conclusion (e.g. ${examples}).`,
      );
    }

    const tooDense = slides.filter((s) => {
      const visible = [s.governingMessage ?? "", ...(s.points ?? [])]
        .join(" ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      return classifySlideDensity(visible) === "too_dense";
    });
    if (tooDense.length > 0) {
      warnings.push(
        `Advisory: ${tooDense.length} of ${slides.length} slides are too dense for a room — split or move the detail to speaker notes / the appendix.`,
      );
    }

    const overPointed = slides.filter(
      (s) => (s.points?.length ?? 0) > MAX_SUPPORTING_POINTS,
    );
    if (overPointed.length > 0) {
      warnings.push(
        `Advisory: ${overPointed.length} of ${slides.length} slides carry more than ${MAX_SUPPORTING_POINTS} supporting points — more than one idea; split the slide.`,
      );
    }

    const contractId = deckContractIdForDeliverable(req.deliverableType);
    if (
      contractId &&
      deckContractExpectsDiagram(contractId) &&
      !slides.some((s) => (s.exhibitKey ?? "").trim().length > 0)
    ) {
      warnings.push(
        `Advisory: this deck's story contract calls for at least one diagram, but no slide links an exhibit — an all-text deck of this type reads as a section list, not an argument.`,
      );
    }
  }
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
  if (missingRequiredEvidenceSignals.length > 0) {
    blockers.push(
      `required evidence signal(s) missing from client artifact: ${missingRequiredEvidenceSignals.join("; ")}`,
    );
  }
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
  // ── expected-exhibit shortfall (C-514) ──
  // The warning above fires only when the document has NO exhibits at all. A
  // brief that asked for three and received one produced no signal of any kind,
  // and since the synthesis pass is now allowed to omit an exhibit rather than
  // fabricate one, that partial case is the likely one. `RenderableExhibit.data`
  // already says the gate "should surface the missing visual"; this is where it
  // does. Advisory on purpose — refusing the export is a product decision.
  const exhibitMatch = opts.expectedExhibits
    ? matchExpectedExhibits(opts.expectedExhibits, doc.exhibits)
    : null;
  if (exhibitMatch && exhibitMatch.missing.length > 0) {
    warnings.push(
      `expected exhibits: ${exhibitMatch.received} of ${opts.expectedExhibits!.length} received — missing: ${exhibitMatch.missing
        .map((t) => `"${t}"`)
        .join(", ")}`,
    );
  }
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
      requiredEvidenceSignalCount: req.requiredEvidenceSignals?.length ?? 0,
      missingRequiredEvidenceSignalCount: missingRequiredEvidenceSignals.length,
      ...(exhibitMatch
        ? {
            expectedExhibitCount: opts.expectedExhibits!.length,
            receivedExpectedExhibitCount: exhibitMatch.received,
            missingExpectedExhibits: exhibitMatch.missing,
          }
        : {}),
      readingTimeMinutes: Math.max(1, Math.round(bodyWordCount / 200)),
      manualEditNeeded: warnings.length > 0 || blockers.length > 0,
      wordBand,
    },
  };
}
