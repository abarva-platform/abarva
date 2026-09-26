/**
 * The authoritative number ledger, and the lineage gate over a RENDERED deck.
 *
 * The ledger is built from governed content BEFORE the composer is called. A
 * material numeric claim that reaches a slide without a ledger entry blocks —
 * and is never repaired afterwards by relabelling it an assumption, because that
 * converts a hallucination into governed state, which is the exact failure the
 * gate exists to prevent.
 *
 * "Material" is doing real work. The composer legitimately writes "1 / 2 / 3",
 * "Step 2", "Q3" and a slide number, and a gate that demanded a governed source
 * for every digit would be switched off within a week. The structural allowlist
 * below is therefore small, closed, and deterministic — each rule states the
 * exact shape it exempts, so nothing widens by accident.
 */

import type { InspectedDeck } from '../orchestrator/deck-inspection';

export type FigureUnit = 'usd' | 'percent' | 'count' | 'metric' | 'date';

export interface LedgerEntry {
  figureId: string;
  value: number;
  unit: FigureUnit;
  label: string;
  /** Renderings of this figure a deck may legitimately use. */
  formattedVariants: string[];
  citationNumber?: number;
  sourceRef: string;
}

/**
 * A figure the composer computed from ledger figures. The plan must declare it;
 * the gate recomputes it. Arithmetic over governed numbers is not automatically
 * governed — "total addressable saving" is a claim, and a wrong sum is a wrong
 * claim whether or not its inputs were real.
 */
export interface DerivedFigure {
  value: number;
  unit: FigureUnit;
  fromFigureIds: string[];
  operation: 'sum' | 'difference' | 'percent_of';
  label: string;
}

export interface NumericClaim {
  raw: string;
  value: number;
  unit: FigureUnit;
  /** Decimal places the rendering shows — sets the matching tolerance. */
  precision: number;
  slide: number;
  run: string;
}

export type LineageFinding =
  | { kind: 'unsupported_figure'; slide: number; claim: string; run: string; message: string }
  | { kind: 'bad_derivation'; claim: string; expected: number; declared: number; message: string };

export interface LineageVerdict {
  ok: boolean;
  claimsChecked: number;
  matchedToLedger: number;
  matchedToDerived: number;
  exemptStructural: number;
  findings: LineageFinding[];
}

// ── extraction ───────────────────────────────────────────────────────────────

const MONEY =
  /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s?(bn|b|billion|m|mm|million|k|thousand)?\b/gi;
const PERCENT = /(\d+(?:\.\d+)?)\s?%/g;
const BARE_NUMBER = /(?<![\w.$])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?![\w%])/g;
/**
 * ISO dates must be consumed BEFORE bare numbers.
 *
 * "2028-06-30" is one claim — a contractual renewal date — not three numbers.
 * The first version of this extractor had no date rule, and the day component of
 * every governed date surfaced as an unsupported bare "30": eight findings on the
 * baseline deck, none of them a real defect, all of them noise that would have
 * taught a reader to ignore the gate.
 */
const ISO_DATE = /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g;

const SCALE: Record<string, number> = {
  bn: 1e9, b: 1e9, billion: 1e9,
  m: 1e6, mm: 1e6, million: 1e6,
  k: 1e3, thousand: 1e3,
};

function decimals(text: string): number {
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * Structural numbers the composer owns.
 *
 * Each rule names the exact shape it exempts. `slideIndex` is passed so the
 * slide-number rule can check the number IS this slide's number rather than
 * exempting every small integer that happens to sit alone in a run.
 */
function isStructural(run: string, raw: string, slideIndex: number, calendarYears: Set<number>): boolean {
  const trimmed = run.trim();
  const n = Number(raw.replace(/,/g, ''));

  // Slide number: the run is the number, and the number is this slide's.
  if (trimmed === raw && n === slideIndex) return true;
  // Sequence label: "3.", "3)", "Step 3", "Phase 3", "Horizon 3", "3 / 7".
  //
  // A BARE "3" is deliberately NOT exempt here. The first version of this rule
  // exempted any standalone integer 1-20, which meant the SDK's own add_metric
  // primitive — whose value sits alone in its run — could print an invented
  // headline number and pass. Structural numbering has to be written as
  // structural ("3.", "Step 3") rather than inferred from being small.
  if (/^\d{1,2}[.)]$/.test(trimmed) && n >= 1 && n <= 20) return true;
  if (/^(step|phase|horizon|wave|stage|option|h)\s?\d{1,2}$/i.test(trimmed)) return true;
  if (/^\d{1,2}\s?\/\s?\d{1,2}$/.test(trimmed)) return true;
  // Calendar scaffolding already present in governed dates.
  if (/^(q[1-4]|fy\d{2,4}|h[12])$/i.test(trimmed)) return true;
  if (Number.isInteger(n) && n >= 1900 && n <= 2100 && calendarYears.has(n)) return true;
  return false;
}

export function extractNumericClaims(
  deck: InspectedDeck,
  calendarYears: Set<number> = new Set(),
  calendarDates: Set<string> = new Set(),
): { claims: NumericClaim[]; structural: number } {
  const claims: NumericClaim[] = [];
  let structural = 0;

  for (const slide of deck.slides) {
    for (let run of slide.textRuns) {
      const seen = new Set<string>();
      const push = (raw: string, value: number, unit: FigureUnit, precision: number) => {
        const key = `${raw}|${unit}`;
        if (seen.has(key)) return;
        seen.add(key);
        if (isStructural(run, raw.replace(/[^0-9.,]/g, ''), slide.index, calendarYears)) {
          structural += 1;
          return;
        }
        claims.push({ raw, value, unit, precision, slide: slide.index, run });
      };

      // Dates first, and the rest of the extraction runs over a run with the
      // dates masked out, so no component of a date is read as a loose number.
      for (const m of run.matchAll(ISO_DATE)) {
        if (calendarDates.has(m[0])) {
          structural += 1;
          continue;
        }
        claims.push({ raw: m[0], value: Number.NaN, unit: 'date', precision: 0, slide: slide.index, run });
      }
      run = run.replace(ISO_DATE, (d) => ' '.repeat(d.length));

      for (const m of run.matchAll(MONEY)) {
        const digits = m[1].replace(/,/g, '');
        const scale = m[2] ? SCALE[m[2].toLowerCase()] ?? 1 : 1;
        push(m[0].trim(), Number(digits) * scale, 'usd', decimals(digits));
      }
      for (const m of run.matchAll(PERCENT)) {
        push(m[0].trim(), Number(m[1]), 'percent', decimals(m[1]));
      }
      const masked = run.replace(MONEY, (s) => ' '.repeat(s.length)).replace(PERCENT, (s) => ' '.repeat(s.length));
      for (const m of masked.matchAll(BARE_NUMBER)) {
        const digits = m[1].replace(/,/g, '');
        push(m[1], Number(digits), 'count', decimals(digits));
      }
    }
  }
  return { claims, structural };
}

// ── matching ─────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.replace(/[\s,]/g, '').toLowerCase();
}

/**
 * Tolerance implied by how the number was WRITTEN.
 *
 * "$81.4B" is a faithful rendering of 81,400,000,000 and also of
 * 81,personally-rounded; one decimal place at billions scale means the claim is
 * only asserting to within 50 million. Demanding exactness would fail every
 * legitimately abbreviated figure, which is how a lineage gate gets disabled.
 */
function toleranceFor(claim: NumericClaim): number {
  const magnitude = Math.abs(claim.value);
  if (claim.unit === 'usd') {
    const scale = magnitude >= 1e9 ? 1e9 : magnitude >= 1e6 ? 1e6 : magnitude >= 1e3 ? 1e3 : 1;
    return (scale / Math.pow(10, claim.precision)) / 2;
  }
  return 0.5 / Math.pow(10, claim.precision);
}

function matchesLedger(claim: NumericClaim, ledger: LedgerEntry[]): LedgerEntry | null {
  const wanted = normalize(claim.raw);
  if (claim.unit === 'date') {
    return ledger.find((e) => e.formattedVariants.some((v) => normalize(v) === wanted)) ?? null;
  }
  for (const entry of ledger) {
    if (entry.formattedVariants.some((v) => normalize(v) === wanted)) return entry;
  }
  const tol = toleranceFor(claim);
  for (const entry of ledger) {
    // 'metric' entries are unit-agnostic: a baseline of 71.4 may be written
    // "71.4%" or "71.4", and the governed statement is the same claim.
    const unitOk = entry.unit === claim.unit || entry.unit === 'metric' || claim.unit === 'metric';
    if (unitOk && Math.abs(entry.value - claim.value) <= tol) return entry;
  }
  return null;
}

function checkDerivation(d: DerivedFigure, ledger: LedgerEntry[]): number | null {
  const parts = d.fromFigureIds.map((id) => ledger.find((e) => e.figureId === id));
  if (parts.some((p) => !p)) return null;
  const values = (parts as LedgerEntry[]).map((p) => p.value);
  switch (d.operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'difference':
      return values.slice(1).reduce((a, b) => a - b, values[0] ?? 0);
    case 'percent_of':
      return values.length === 2 && values[1] !== 0 ? (values[0] / values[1]) * 100 : null;
  }
}

export interface LineageOptions {
  ledger: LedgerEntry[];
  derived?: DerivedFigure[];
  /** Years the governed artifact already carries; anything else is a claim. */
  calendarYears?: Set<number>;
  /** Exact dates the governed artifact already carries. */
  calendarDates?: Set<string>;
}

export function validateDeckLineage(deck: InspectedDeck, opts: LineageOptions): LineageVerdict {
  const {
    ledger,
    derived = [],
    calendarYears = new Set<number>(),
    calendarDates = new Set<string>(),
  } = opts;
  const findings: LineageFinding[] = [];

  // A declared derivation that does not recompute is a finding in its own right,
  // whether or not the deck went on to print it.
  const validDerived: DerivedFigure[] = [];
  for (const d of derived) {
    const expected = checkDerivation(d, ledger);
    if (expected === null || Math.abs(expected - d.value) > Math.max(1, Math.abs(expected) * 0.005)) {
      findings.push({
        kind: 'bad_derivation',
        claim: d.label,
        expected: expected ?? Number.NaN,
        declared: d.value,
        message:
          expected === null
            ? `derived figure "${d.label}" names a figureId that is not in the ledger`
            : `derived figure "${d.label}" declares ${d.value} but ${d.operation} over its inputs gives ${expected}`,
      });
    } else {
      validDerived.push(d);
    }
  }

  const { claims, structural } = extractNumericClaims(deck, calendarYears, calendarDates);
  let matchedLedger = 0;
  let matchedDerived = 0;

  for (const claim of claims) {
    if (matchesLedger(claim, ledger)) {
      matchedLedger += 1;
      continue;
    }
    const tol = toleranceFor(claim);
    if (validDerived.some((d) => Math.abs(d.value - claim.value) <= tol)) {
      matchedDerived += 1;
      continue;
    }
    findings.push({
      kind: 'unsupported_figure',
      slide: claim.slide,
      claim: claim.raw,
      run: claim.run.slice(0, 120),
      message:
        claim.unit === 'date'
          ? `slide ${claim.slide}: date "${claim.raw}" is not a date the governed artifact carries`
          : `slide ${claim.slide}: "${claim.raw}" has no governed figure and is not a declared derivation`,
    });
  }

  return {
    ok: findings.length === 0,
    claimsChecked: claims.length,
    matchedToLedger: matchedLedger,
    matchedToDerived: matchedDerived,
    exemptStructural: structural,
    findings,
  };
}
