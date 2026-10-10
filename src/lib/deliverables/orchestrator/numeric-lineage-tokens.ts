// The figures the numeric-lineage check examines, and how two renderings of
// the same figure are recognised as equal.
//
// One definition, used by the citation repair (which adds a citation when
// every figure in a sentence matches governed evidence) and by the quality
// gate's blocker message (which names the figures that matched nothing).

import type {
  DeliverableIntelligenceRequest,
  GovernedEvidenceItem,
} from "./types";

export const FACT_TOKEN_RE =
  /(\$\s?\d[\d,]*(?:\.\d+)?[kmb]?|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/gi;

export function normalizeFactToken(value: string): string {
  return value.toLowerCase().replace(/[\s,$]/g, "");
}

export function factTokens(value: string): string[] {
  const matches = value.match(FACT_TOKEN_RE) ?? [];
  return Array.from(new Set(matches.map(normalizeFactToken)));
}

/**
 * The figures in a sentence that match no governed evidence, as written.
 *
 * Same tokens and same exact-match rule as the citation repair. This changes
 * nothing about what is supported; it names what was not, so a blocked table
 * can be read. Before this, the blocker quoted the first characters of the
 * table and left the reader to guess which figure in it had failed to trace.
 */
export function untracedFigures(
  sentence: string,
  evidence: readonly GovernedEvidenceItem[],
): string[] {
  const backed = new Set(
    evidence.flatMap((item) => factTokens(`${item.label} ${item.statement}`)),
  );
  const seen = new Set<string>();
  const untraced: string[] = [];
  for (const raw of sentence.match(FACT_TOKEN_RE) ?? []) {
    const token = normalizeFactToken(raw);
    if (backed.has(token) || seen.has(token)) continue;
    seen.add(token);
    untraced.push(raw.trim());
  }
  return untraced;
}

// ── What counts as lineage for a figure ──────────────────────────────────────
//
// The quality gate (`quality-validator.ts`) and the section repairs
// (`section-generation.ts`) must agree, sentence by sentence, on whether a
// figure is traced — otherwise a sentence the repair leaves alone is one the
// gate blocks, or the reverse. Both read the definitions below.

/**
 * A Move assumptions-register ID body: area prefix + sequence (`V3`, `DL12`).
 * The single definition — `src/lib/programs/assumption-register/model.ts`
 * builds its parser from it. Every use is anchored (`^…$` or between `[A:` and
 * `]`), so `DL3` can only read as delivery row 3.
 */
export const REGISTER_ID_PATTERN = "(DL|V|D|A)([1-9]\\d*)";

/** A register citation as written in a document: `[A:V3]`. Global — use with `matchAll`. */
export const REGISTER_CITATION_RE = new RegExp(
  `\\[A:${REGISTER_ID_PATTERN}\\]`,
  "g",
);

/** Every register ID cited in a text, in order of first appearance. */
export function registerCitationIds(text: string): string[] {
  const ids: string[] = [];
  for (const match of text.matchAll(REGISTER_CITATION_RE)) {
    const id = `${match[1]}${match[2]}`;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** The markers that made a figure sentence "supported" before the register. */
const LEGACY_SUPPORTED_MARKER_RE =
  /\[\d+\]|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING|\(open input\s*[–—-]\s*see Open Inputs Required\)/i;

/**
 * The same markers less `[ASSUMPTION TO VALIDATE`. Under the register a bare
 * assumption tag no longer launders a number: the figure must cite evidence
 * `[n]` or a register row `[A:ID]` whose figure it states.
 */
const REGISTER_SUPPORTED_MARKER_RE =
  /\[\d+\]|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING|\(open input\s*[–—-]\s*see Open Inputs Required\)/i;

/**
 * How a generation judges figure lineage.
 *   - `enforced: false` — exactly the rule before the register existed.
 *   - `enforced: true` — the register governs: `registerFigures` holds, per
 *     citable register ID, the normalised figure tokens that row stands on;
 *     `evidence` is the governed bundle a figure may otherwise trace to.
 */
export type FigureLineagePolicy =
  | { enforced: false; publicSourceFigures?: ReadonlyMap<number, ReadonlySet<string>> }
  | {
      enforced: true;
      registerFigures: ReadonlyMap<string, ReadonlySet<string>>;
      evidence: readonly GovernedEvidenceItem[];
      publicSourceFigures?: ReadonlyMap<number, ReadonlySet<string>>;
    };

export const LEGACY_FIGURE_LINEAGE: FigureLineagePolicy = { enforced: false };

/** The lineage policy a request declares. */
export function figureLineagePolicy(
  req: Pick<
    DeliverableIntelligenceRequest,
    | "assumptionRegisterEnforced"
    | "approvedAssumptions"
    | "governedEvidenceBundle"
    | "publicSources"
  >,
): FigureLineagePolicy {
  const publicSourceFigures = req.publicSources
    ? new Map(
        req.publicSources.map((source) => [
          source.citationNumber,
          new Set(factTokens(source.excerpt)),
        ]),
      )
    : undefined;
  if (req.assumptionRegisterEnforced !== true)
    return publicSourceFigures
      ? { enforced: false, publicSourceFigures }
      : LEGACY_FIGURE_LINEAGE;
  const registerFigures = new Map<string, ReadonlySet<string>>();
  for (const row of req.approvedAssumptions ?? []) {
    if (!row.registerId) continue;
    registerFigures.set(row.registerId, new Set(factTokens(row.figure ?? "")));
  }
  return {
    enforced: true,
    registerFigures,
    evidence: req.governedEvidenceBundle ?? [],
    ...(publicSourceFigures ? { publicSourceFigures } : {}),
  };
}

/** The supported-marker regex for a policy (no register citation; see `judgeFigureSentence`). */
export function supportedMarkerRe(policy: FigureLineagePolicy): RegExp {
  return policy.enforced
    ? REGISTER_SUPPORTED_MARKER_RE
    : LEGACY_SUPPORTED_MARKER_RE;
}

export type FigureSentenceVerdict =
  | { supported: true }
  | {
      supported: false;
      /** Register IDs the sentence cites that this generation's register does not hold. */
      unknownRegisterIds: string[];
      /** Known register IDs the sentence cites. */
      citedRegisterIds: string[];
      /** Figures matching neither the evidence nor any cited register row, as written. */
      unmatchedFigures: string[];
    };

/**
 * Is this figure-bearing sentence traced?
 *
 * Legacy: any supported marker. Enforced: `[n]`, a client-complete /
 * evidence-missing / open-input marker, or one or more KNOWN register
 * citations such that every figure the evidence does not back matches a
 * figure of a cited row (same normalisation as the evidence match: case,
 * spaces, `,` and `$` ignored). An unknown register ID supports nothing.
 */
export function judgeFigureSentence(
  sentence: string,
  policy: FigureLineagePolicy,
): FigureSentenceVerdict {
  const citedPublicNumbers = [...sentence.matchAll(/\[S:([1-9]\d*)\]/g)].map(
    (match) => Number(match[1]),
  );
  if (citedPublicNumbers.length && policy.publicSourceFigures) {
    const allowed = new Set<string>();
    for (const number of citedPublicNumbers) {
      for (const token of policy.publicSourceFigures.get(number) ?? [])
        allowed.add(token);
    }
    if (factTokens(sentence).every((token) => allowed.has(token))) {
      return { supported: true };
    }
  }
  if (supportedMarkerRe(policy).test(sentence)) return { supported: true };
  if (!policy.enforced) {
    return {
      supported: false,
      unknownRegisterIds: [],
      citedRegisterIds: [],
      unmatchedFigures: [],
    };
  }
  const cited = registerCitationIds(sentence);
  const known = cited.filter((id) => policy.registerFigures.has(id));
  const unknown = cited.filter((id) => !policy.registerFigures.has(id));
  const allowed = new Set<string>();
  for (const id of known) {
    for (const token of policy.registerFigures.get(id) ?? [])
      allowed.add(token);
  }
  const unmatchedFigures = untracedFigures(sentence, policy.evidence).filter(
    (raw) => !allowed.has(normalizeFactToken(raw)),
  );
  if (known.length > 0 && unmatchedFigures.length === 0) {
    return { supported: true };
  }
  return {
    supported: false,
    unknownRegisterIds: unknown,
    citedRegisterIds: known,
    unmatchedFigures,
  };
}
