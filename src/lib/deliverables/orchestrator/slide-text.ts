// Slide-face text for the section-fallback deck.
//
// Two invariants, and the second is the one this module exists for:
//
//   1. A slide is scanned, not read — document-length prose stays off the face.
//   2. A claim on the face is a WHOLE claim. Nothing is cut at a word count and
//      finished with an ellipsis.
//
// The previous implementation enforced (1) by breaking (2): every point past a
// fixed word cap was amputated mid-sentence, so a finding could lose its
// qualifier, its number, or its verb and still be printed as the finding. A
// claim that does not fit is now either shortened at a boundary where what
// remains is still a complete statement, or kept off the face entirely and
// carried in the speaker notes. It is never printed in part.
//
// Pure functions, no renderer dependency, so both invariants can be tested on
// text rather than on a zipped deck.

export const MAX_SLIDE_BULLETS = 6;
export const MAX_GOVERNING_WORDS = 34;
export const MAX_BULLET_WORDS = 32;

/** A shortened claim below this is more likely a fragment than a statement. */
const MIN_COMPLETE_CLAUSE_WORDS = 5;

export function normaliseSlideText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function cleanMarkdownForSlideText(line: string): string {
  return normaliseSlideText(
    line
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1"),
  );
}

export function splitSlideSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z\[“"'])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function wordCount(text: string): number {
  return text.split(" ").filter(Boolean).length;
}

// ── Scaffolding labels ──
//
// An authored section sometimes opens a paragraph with a label that names the
// paragraph's job in the document ("Section verdict.") rather than saying
// anything. Sentence-splitting then hands that label to the slide as its
// governing message, and the slide's headline becomes two words about the
// document's own structure.
//
// STRUCTURAL labels refer to the artifact itself and are never content.
// IDIOM labels are ordinary consulting lead-ins: fine inside a paragraph,
// meaningless alone as a headline.

const STRUCTURAL_LABEL =
  "(?:section|slide)\\s+(?:boundary|verdict|summary|takeaway|purpose|headline|thesis|message|conclusion)" +
  "|governing\\s+(?:message|thought|point)" +
  "|speaker\\s+notes?";

const IDIOM_LABEL = "(?:the\\s+)?bottom\\s+line|key\\s+takeaway|so\\s+what";

const LEADING_LABEL_PATTERN = new RegExp(
  `^(?:${STRUCTURAL_LABEL}|${IDIOM_LABEL})\\s*(?:[.:]|\\s[—–-])\\s*`,
  "i",
);

const STRUCTURAL_LINE_LEAD_PATTERN = new RegExp(
  // Optional list marker, then the label in one of two shapes. Wrapped in
  // emphasis, the wrapper delimits it. Bare, it must be terminated — so
  // "Section summary tables follow" stays a sentence, not a label.
  "^(\\s*(?:[-*]\\s+|\\d+[.)]\\s+)?)(?:" +
    `(?:\\*\\*|__)(?:${STRUCTURAL_LABEL})\\s*[.:]?\\s*(?:\\*\\*|__)\\s*[.:]?\\s*(?:[—–-]\\s*)?` +
    "|" +
    `(?:${STRUCTURAL_LABEL})\\s*(?:[.:]|\\s[—–-])\\s*` +
    ")",
  "i",
);

const STRUCTURAL_LEAD_PATTERN = new RegExp(
  `^(?:${STRUCTURAL_LABEL})\\s*(?:[.:]|\\s[—–-])\\s*`,
  "i",
);

/** Below this, what follows an idiom lead-in is a fragment, not a claim. */
const MIN_CLAIM_AFTER_IDIOM_WORDS = 4;

/** Remove a leading scaffolding label; returns "" when the text was only a label. */
export function stripScaffoldingLabel(text: string): string {
  const clean = normaliseSlideText(text);
  const stripped = clean.replace(LEADING_LABEL_PATTERN, "");
  if (stripped === clean) return clean;
  if (!stripped) return "";
  // "Bottom line: proceed." — stripping the idiom would leave one word. Keep
  // the sentence as written. A structural label is removed regardless: it is
  // never part of the claim.
  if (
    !STRUCTURAL_LEAD_PATTERN.test(clean) &&
    wordCount(stripped) < MIN_CLAIM_AFTER_IDIOM_WORDS
  ) {
    return clean;
  }
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/**
 * Remove STRUCTURAL scaffolding lead-ins from authored markdown, line by line.
 *
 * Applied before every format renders, so a label about the document's own
 * structure reaches no reader — not only the slide face. Idiom lead-ins
 * ("Bottom line:") are left alone: they are prose, and prose is the author's.
 */
export function stripStructuralScaffolding(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*#{1,6}\s/.test(line) || /^\s*\|.*\|\s*$/.test(line)) return line;
      const match = STRUCTURAL_LINE_LEAD_PATTERN.exec(line);
      if (!match) return line;
      const rest = line.slice(match[0].length);
      if (!rest.trim()) return "";
      return `${match[1]}${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
    })
    .join("\n");
}

/**
 * Return the claim whole, or shortened to a complete independent clause, or
 * null when no complete form fits.
 *
 * A semicolon is the only boundary used. Cutting at a comma, colon, dash, or
 * parenthesis can leave a subject without its predicate ("The baseline —"),
 * which is the defect this replaces.
 */
export function fitWholeClaim(text: string, maxWords: number): string | null {
  const clean = normaliseSlideText(text);
  if (!clean) return null;
  if (wordCount(clean) <= maxWords) return clean;

  const clauses = clean.split(/;\s+/);
  if (clauses.length < 2) return null;
  let kept = "";
  for (const clause of clauses.slice(0, -1)) {
    const candidate = kept ? `${kept}; ${clause}` : clause;
    if (wordCount(candidate) > maxWords) break;
    kept = candidate;
  }
  if (!kept || wordCount(kept) < MIN_COMPLETE_CLAUSE_WORDS) return null;
  return /[.!?]$/.test(kept) ? kept : `${kept}.`;
}

function comparable(text: string): string {
  return normaliseSlideText(text)
    .toLowerCase()
    .replace(/[.!?;:]+$/, "");
}

export interface SectionSlideText {
  /** The headline. A complete claim, or the section title when none fits. */
  governing: string;
  /** True when the section's own opening claim could not be used as the headline. */
  governingIsTitle: boolean;
  bullets: string[];
  /**
   * Claims that were too long to print whole, in full. They go to the speaker
   * notes so shortening the face never deletes the statement.
   */
  heldOffFace: string[];
}

function contentLines(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#{1,6}\s/.test(line))
    .filter((line) => !/^\|.*\|$/.test(line));
}

function claimsFromLine(line: string): string[] {
  return splitSlideSentences(cleanMarkdownForSlideText(line))
    .map(stripScaffoldingLabel)
    .filter(Boolean);
}

export function sectionSlideText(
  markdown: string,
  sectionTitle: string,
  maxBullets: number = MAX_SLIDE_BULLETS,
): SectionSlideText {
  const lines = contentLines(markdown);
  const heldOffFace: string[] = [];

  let openingClaim: string | null = null;
  for (const line of lines) {
    const claims = claimsFromLine(line);
    if (claims.length > 0) {
      openingClaim = claims[0];
      break;
    }
  }

  const title = normaliseSlideText(sectionTitle);
  const fittedOpening = openingClaim
    ? fitWholeClaim(openingClaim, MAX_GOVERNING_WORDS)
    : null;
  if (openingClaim && fittedOpening !== openingClaim) {
    heldOffFace.push(openingClaim);
  }
  const governing = fittedOpening ?? title;

  const hasExplicitBullets = lines.some((line) =>
    /^(?:[-*]\s+|\d+[.)]\s+)/.test(line),
  );
  const candidates = lines.flatMap((line) => {
    const isBullet = /^(?:[-*]\s+|\d+[.)]\s+)/.test(line);
    if (hasExplicitBullets) {
      if (!isBullet) return [];
      const cleaned = stripScaffoldingLabel(cleanMarkdownForSlideText(line));
      return cleaned ? [cleaned] : [];
    }
    return claimsFromLine(line);
  });

  const openingKey = openingClaim ? comparable(openingClaim) : null;
  const seen = new Set<string>();
  const bullets: string[] = [];
  for (const candidate of candidates) {
    const key = comparable(candidate);
    if (key === openingKey || seen.has(key)) continue;
    seen.add(key);
    if (bullets.length >= maxBullets) break;
    const fitted = fitWholeClaim(candidate, MAX_BULLET_WORDS);
    if (fitted !== candidate) heldOffFace.push(candidate);
    if (fitted) bullets.push(fitted);
  }

  return {
    governing,
    governingIsTitle: fittedOpening === null,
    bullets,
    heldOffFace,
  };
}

/**
 * Headline point size for the section slide's 11.8in × 1.1in box.
 *
 * Chosen from the text rather than left to the viewer's shrink-to-fit, which
 * PowerPoint only recomputes on edit: a headline that overflows on open is
 * the same defect as one that was cut.
 */
export function governingFontSize(text: string): number {
  const length = normaliseSlideText(text).length;
  if (length <= 150) return 22;
  if (length <= 200) return 20;
  return 18;
}
