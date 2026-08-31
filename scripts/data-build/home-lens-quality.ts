/**
 * Output-level lens quality for the Home chapter writer.
 *
 * The existing lens tests (`scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`) read the
 * page-prompt contract JSON and assert it contains the strings its own author wrote in the same
 * commit. That proves the contracts are *declared* distinct. It cannot detect the failure that
 * actually matters -- eight hats, one voice -- because it never looks at generated prose.
 *
 * Everything here scores generated output instead. All of it is pure and deterministic so it can be
 * tested without a model call; the only caller that needs Claude is the measurement run that
 * produces the chapters being scored.
 */

/* ------------------------------------------------------------------------------------------------
 * Lens vocabulary signatures
 *
 * Naive pairwise similarity between two chapters is dominated by shared enterprise nouns (the
 * tenant name, "applications", "vendors") and reports healthy divergence even when every chapter is
 * written in one voice. The question is not "are these texts different" but "did the hat change the
 * writing", so each lens declares the term class it is supposed to over-index on, and separation is
 * measured against how much the *other* chapters use that same class.
 * ---------------------------------------------------------------------------------------------- */

export type LensTermClass =
  | "money_decision"
  | "architecture_dependency"
  | "value_governance"
  | "testimony_attribution"
  | "data_grain"
  | "operating_accountability"
  | "strategy_bets";

export const LENS_TERM_CLASSES: Record<LensTermClass, readonly string[]> = {
  money_decision: [
    "decision", "decide", "board", "capital", "invest", "investment", "spend", "cost", "margin",
    "revenue", "exposure", "urgency", "consequence", "trade-off", "tradeoff", "priority", "choice",
  ],
  architecture_dependency: [
    "architecture", "integration", "dependency", "platform", "hosting", "estate", "component",
    "interface", "throughput", "latency", "coupling", "tier", "topology", "workload", "resilience",
  ],
  value_governance: [
    "attested", "attestation", "baseline", "benefit", "committed", "realized", "unrealized",
    "measured", "forecast", "variance", "target", "kpi", "governance", "accountable", "owner",
  ],
  testimony_attribution: [
    "interview", "leader", "leaders", "quoted", "said", "described", "perception", "sentiment",
    "disagree", "consensus", "theme", "stakeholder", "reported", "view", "views",
  ],
  data_grain: [
    "grain", "dimension", "denominator", "row", "rows", "record", "records", "field", "lineage",
    "source", "coverage", "completeness", "duplicate", "reconcile", "count",
  ],
  operating_accountability: [
    "process", "handoff", "workflow", "role", "roles", "workforce", "capacity", "ownership",
    "escalation", "throughput", "manual", "friction", "accountability", "function", "team",
  ],
  strategy_bets: [
    "bet", "bets", "ambition", "pool", "pools", "segment", "segments", "model", "growth",
    "differentiation", "position", "strategy", "strategic", "roadmap", "horizon",
  ],
};

/** A chapter as this module needs it -- deliberately structural, so tests can build one by hand. */
export interface ScorableChapter {
  chapterId: string;
  /** The Claude-generated prose. Assigned claim statements are NOT part of this. */
  prose: string;
  /** The deterministic statements routed to this chapter; their words are excluded from scoring. */
  claimStatements: string[];
  /** The term class this chapter's lens is supposed to over-index on. */
  expectedClass: LensTermClass;
}

const WORD_RE = /[a-z][a-z-]*/g;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(WORD_RE) ?? [];
}

/**
 * Words that came from the deterministic claims are shared input, not writing style -- a chapter
 * routed a claim about "integration latency" would otherwise score as architecture-voiced no matter
 * what hat wrote the prose around it. Same for tenant proper nouns, which every chapter repeats.
 */
function excludedWords(chapter: ScorableChapter, tenantNouns: readonly string[]): Set<string> {
  const excluded = new Set<string>(tenantNouns.map((noun) => noun.toLowerCase()));
  for (const statement of chapter.claimStatements) {
    for (const word of tokenize(statement)) excluded.add(word);
  }
  return excluded;
}

export interface LensSignature {
  chapterId: string;
  expectedClass: LensTermClass;
  wordsScored: number;
  /** Rate per 1000 scored words, per term class. */
  rates: Record<LensTermClass, number>;
}

export function buildLensSignature(
  chapter: ScorableChapter,
  tenantNouns: readonly string[] = [],
): LensSignature {
  const excluded = excludedWords(chapter, tenantNouns);
  const words = tokenize(chapter.prose).filter((word) => !excluded.has(word));
  const rates = {} as Record<LensTermClass, number>;
  for (const [className, terms] of Object.entries(LENS_TERM_CLASSES) as Array<[LensTermClass, readonly string[]]>) {
    const termSet = new Set(terms);
    const hits = words.filter((word) => termSet.has(word)).length;
    rates[className] = words.length === 0 ? 0 : (1000 * hits) / words.length;
  }
  return { chapterId: chapter.chapterId, expectedClass: chapter.expectedClass, wordsScored: words.length, rates };
}

function cosine(a: Record<LensTermClass, number>, b: Record<LensTermClass, number>): number {
  const keys = Object.keys(LENS_TERM_CLASSES) as LensTermClass[];
  let dot = 0, na = 0, nb = 0;
  for (const key of keys) {
    dot += a[key] * b[key];
    na += a[key] * a[key];
    nb += b[key] * b[key];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface LensDivergenceReport {
  signatures: LensSignature[];
  /**
   * Per chapter: how much more it uses its own lens's term class than the other chapters do.
   * <= 0 means the hat did not change the writing for that lens.
   */
  separations: Array<{ chapterId: string; expectedClass: LensTermClass; ownRate: number; othersMeanRate: number; separation: number }>;
  /** The lens whose hat landed least. This is the finding to act on. */
  weakestLens: { chapterId: string; separation: number } | null;
  /** The most interchangeable pair of chapters by signature. 1.0 means indistinguishable voices. */
  mostSimilarPair: { a: string; b: string; cosine: number } | null;
  /** Mean separation across chapters -- one headline number for the variant table. */
  meanSeparation: number;
}

export function scoreLensDivergence(
  chapters: ScorableChapter[],
  tenantNouns: readonly string[] = [],
): LensDivergenceReport {
  const signatures = chapters.map((chapter) => buildLensSignature(chapter, tenantNouns));

  const separations = signatures.map((signature) => {
    const others = signatures.filter((other) => other.chapterId !== signature.chapterId);
    const othersMeanRate = others.length === 0
      ? 0
      : others.reduce((sum, other) => sum + other.rates[signature.expectedClass], 0) / others.length;
    const ownRate = signature.rates[signature.expectedClass];
    return {
      chapterId: signature.chapterId,
      expectedClass: signature.expectedClass,
      ownRate: round(ownRate),
      othersMeanRate: round(othersMeanRate),
      separation: round(ownRate - othersMeanRate),
    };
  });

  let mostSimilarPair: LensDivergenceReport["mostSimilarPair"] = null;
  for (let i = 0; i < signatures.length; i += 1) {
    for (let j = i + 1; j < signatures.length; j += 1) {
      const similarity = round(cosine(signatures[i].rates, signatures[j].rates));
      if (!mostSimilarPair || similarity > mostSimilarPair.cosine) {
        mostSimilarPair = { a: signatures[i].chapterId, b: signatures[j].chapterId, cosine: similarity };
      }
    }
  }

  const weakestLens = separations.length === 0
    ? null
    : separations.reduce((worst, current) => (current.separation < worst.separation ? current : worst));

  return {
    signatures,
    separations,
    weakestLens: weakestLens ? { chapterId: weakestLens.chapterId, separation: weakestLens.separation } : null,
    mostSimilarPair,
    meanSeparation: separations.length === 0
      ? 0
      : round(separations.reduce((sum, item) => sum + item.separation, 0) / separations.length),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ------------------------------------------------------------------------------------------------
 * must_not_do, checked against output
 *
 * `lens_contracts[*].must_not_do` splits into two classes and the report says which is which. Class
 * A has a deterministic oracle and is checked here. Class B needs a judgment call and is reported as
 * UNCHECKED rather than silently implying coverage the run does not have.
 * ---------------------------------------------------------------------------------------------- */

export interface MustNotDoViolation {
  chapterId: string;
  rule: string;
  statement: string;
  detail: string;
}

const NUMBER_RE = /\b\d[\d,]*(?:\.\d+)?\b/g;

function numbersIn(text: string): string[] {
  return (text.match(NUMBER_RE) ?? []).map((raw) => raw.replace(/,/g, ""));
}

/**
 * The chapter prompt states the assigned claims are "the ONLY source of content for this chapter",
 * so any figure in the generated prose that is not in those claims was invented. Years and small
 * ordinals are excluded -- "the first" and "2026" are prose, not asserted quantities.
 */
export function findInventedNumbers(chapter: ScorableChapter): MustNotDoViolation[] {
  const allowed = new Set(chapter.claimStatements.flatMap((statement) => numbersIn(statement)));
  const violations: MustNotDoViolation[] = [];
  for (const sentence of splitSentences(chapter.prose)) {
    for (const number of numbersIn(sentence)) {
      const numeric = Number(number);
      if (Number.isFinite(numeric) && numeric >= 1900 && numeric <= 2100) continue;
      if (Number.isFinite(numeric) && numeric <= 10 && !number.includes(".")) continue;
      if (allowed.has(number)) continue;
      violations.push({
        chapterId: chapter.chapterId,
        rule: "quote a number that is not in the packet",
        statement: sentence.trim(),
        detail: `${number} does not appear in any claim routed to this chapter`,
      });
    }
  }
  return violations;
}

/**
 * The CTO lens must not count deployments as applications. This one has an exact oracle: the typed
 * views already separate `application_v` from `application_deployment_v`, so any figure the prose
 * asserts as an application count must equal the canonical application count -- and matching the
 * deployment count instead is the specific, previously-shipped double-count defect, so name it.
 */
export function findApplicationCountErrors(
  chapter: ScorableChapter,
  counts: { applications: number; deployments: number },
): MustNotDoViolation[] {
  const violations: MustNotDoViolation[] = [];
  for (const sentence of splitSentences(chapter.prose)) {
    if (!/\bapplications?\b/i.test(sentence)) continue;
    for (const number of numbersIn(sentence)) {
      const value = Number(number);
      if (!Number.isFinite(value) || value <= 10) continue;
      if (value === counts.applications) continue;
      violations.push({
        chapterId: chapter.chapterId,
        rule: "count deployments as applications",
        statement: sentence.trim(),
        detail: value === counts.deployments
          ? `${value} is the deployment count, not the application count (${counts.applications})`
          : `${value} matches neither the application count (${counts.applications}) nor the deployment count (${counts.deployments})`,
      });
    }
  }
  return violations;
}

const TECHNOLOGY_ENTITY_RE = /\b(application|applications|system|systems|platform|platforms|server|servers|database|databases|vendor|vendors|integration|integrations|instance|instances)\b/gi;
const VENDOR_ENTITY_OPENING_RE =
  /\b(?:vendor|vendors|supplier|suppliers|contract|contracts|contracted|commercial exposure|MSA|statement of work|managed service|outsourc(?:e|ed|ing))\b/i;
const LEGAL_ENTITY_OPENING_RE =
  /^(?:[A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5}\s+)(?:Corporation|Corp\.?|Incorporated|Inc\.?|LLC|Ltd\.?|Limited|Company|Co\.?|Systems|Services)\b/;

/**
 * Class B, and the definition is stated so the number is interpretable: the Executive Brief's
 * opening sentence must carry no record count and at most one technology-entity reference. This is
 * a proxy for "start with a technology inventory", not a proof of it.
 */
export function findInventoryOpening(chapter: ScorableChapter): MustNotDoViolation[] {
  const [opening] = splitSentences(chapter.prose);
  if (!opening) return [];
  const entityHits = opening.match(TECHNOLOGY_ENTITY_RE)?.length ?? 0;
  const hasRecordCount = numbersIn(opening).some((number) => Number(number) > 10);
  if (entityHits <= 1 && !hasRecordCount) return [];
  return [{
    chapterId: chapter.chapterId,
    rule: "start with a technology inventory",
    statement: opening.trim(),
    detail: `opening sentence carries ${entityHits} technology-entity reference(s)` +
      (hasRecordCount ? " and a record count" : ""),
  }];
}

/**
 * Executive identity pages must not open by making one supplier the answer to "who is this
 * enterprise?" Commercial concentration is a valid finding on commercial pages, but it is the
 * wrong lede for the boardroom overview unless that page's contract explicitly permits it.
 */
export function findVendorLedOpening(
  chapter: ScorableChapter,
  options: { allowVendorOpening?: boolean } = {},
): MustNotDoViolation[] {
  if (options.allowVendorOpening) return [];
  const [opening] = splitSentences(chapter.prose);
  if (!opening) return [];
  const trimmed = opening.trim();
  const isNamedVendorOpening = LEGAL_ENTITY_OPENING_RE.test(trimmed) && VENDOR_ENTITY_OPENING_RE.test(trimmed);
  const isSupplierCategoryOpening = /^(?:the\s+)?(?:largest|top|leading|primary|dominant)\s+(?:vendor|supplier|contract)/i.test(trimmed);
  if (!isNamedVendorOpening && !isSupplierCategoryOpening) return [];
  return [{
    chapterId: chapter.chapterId,
    rule: "open executive identity on a vendor or supplier",
    statement: trimmed,
    detail: "opening sentence names commercial concentration before business model, segment economics, accountability, value, or exposure",
  }];
}

export const JUDGMENT_CLASS_RULES_UNCHECKED = [
  "turn record counts into strategy",
  "infer the business model from application counts",
  "promote interview testimony to fact without corroboration",
  "fill strategic gaps with generic healthcare or airline strategy",
  "treat expected value as realized value",
  "calculate ROI in prose",
  "turn missing proof into a negative conclusion",
] as const;

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0);
}
