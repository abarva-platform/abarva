/**
 * Did the uploaded evidence actually reach the artifact's analysis?
 *
 * Not "is the deck better" — whether each specific uploaded fact survived every
 * stage between the upload and the rendered file, and which stage lost the ones
 * that did not.
 *
 * Measured per stage, never as one total. A single "62% of evidence used" hides
 * the difference between evidence that retrieval never surfaced, evidence the
 * planner never assigned, and evidence the writer cited but the deck dropped —
 * three different defects with three different fixes.
 */

export type FactExpectation = 'represented' | 'optional' | 'recharacterised' | 'still_open';

export interface InstrumentedFact {
  factId: string;
  label: string;
  value: number | null;
  /** Renderings that count as this fact appearing. */
  variants: string[];
  tab: string;
  expectation: FactExpectation;
  /** For a gap the upload does not close: what the package says remains open. */
  stillOpen?: string;
}

export type TraceStage = 'bundle' | 'assigned' | 'cited' | 'deck' | 'gapAnalysis';

export interface FactTrace {
  factId: string;
  label: string;
  expectation: FactExpectation;
  reached: Record<TraceStage, boolean>;
  /** The first stage that did NOT carry it, or null if it reached the end. */
  lostAt: TraceStage | null;
  matchedAs: string | null;
}

export interface StageSummary {
  stage: TraceStage;
  required: number;
  reached: number;
}

export interface TraceVerdict {
  ok: boolean;
  facts: FactTrace[];
  stages: StageSummary[];
  /** Required facts that never reached the rendered deck. */
  missingFromDeck: FactTrace[];
  /** Required facts in the deck but absent from its gap/current-state analysis. */
  missingFromGapAnalysis: FactTrace[];
}

const STAGES: TraceStage[] = ['bundle', 'assigned', 'cited', 'deck', 'gapAnalysis'];

/**
 * Normalise for comparison.
 *
 * A figure written "3,483" in the upload and "3,483" on a slide is the same
 * fact; so is "15,970,000" and "15.97M" once the adapter has registered both as
 * variants. Stripping separators means a variant list does not have to guess at
 * every thousands convention.
 */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[\s, ]/g, '');
}

function appearsIn(haystack: string, variants: string[]): string | null {
  const hay = normalise(haystack);
  for (const v of variants) {
    const needle = normalise(v);
    // A bare "52" matches almost anything. Require enough signal to be a match,
    // and let the adapter supply longer variants for short values.
    if (needle.length < 3) continue;
    if (hay.includes(needle)) return v;
  }
  return null;
}

export interface TraceSources {
  /** Governed evidence statements, joined. */
  bundleText: string;
  /** Statements the planner assigned to some section, joined. */
  assignedText: string;
  /** Generated section bodies, joined. */
  citedText: string;
  /** Every text run in the rendered deck, joined. */
  deckText: string;
  /** Text runs from slides identified as the gap / current-state analysis. */
  gapAnalysisText: string;
}

export function traceFacts(facts: InstrumentedFact[], sources: TraceSources): TraceVerdict {
  const traces: FactTrace[] = [];

  for (const fact of facts) {
    // A coverage expectation is about how a gap is DESCRIBED, not about a value
    // appearing, so it is judged elsewhere and excluded from the value funnel.
    if (fact.expectation === 'recharacterised' || fact.expectation === 'still_open') continue;

    const lookups: Record<TraceStage, string> = {
      bundle: sources.bundleText,
      assigned: sources.assignedText,
      cited: sources.citedText,
      deck: sources.deckText,
      gapAnalysis: sources.gapAnalysisText,
    };

    const reached = {} as Record<TraceStage, boolean>;
    let matchedAs: string | null = null;
    for (const stage of STAGES) {
      const hit = appearsIn(lookups[stage], fact.variants);
      reached[stage] = hit !== null;
      if (hit && !matchedAs) matchedAs = hit;
    }

    // The first stage that did not carry it. Stages are ordered, so this names
    // where to look rather than reporting a bare failure.
    const lostAt = STAGES.find((s) => !reached[s]) ?? null;

    traces.push({ factId: fact.factId, label: fact.label, expectation: fact.expectation, reached, lostAt, matchedAs });
  }

  const required = traces.filter((t) => t.expectation === 'represented');
  const stages: StageSummary[] = STAGES.map((stage) => ({
    stage,
    required: required.length,
    reached: required.filter((t) => t.reached[stage]).length,
  }));

  const missingFromDeck = required.filter((t) => !t.reached.deck);
  const missingFromGapAnalysis = required.filter((t) => t.reached.deck && !t.reached.gapAnalysis);

  return {
    ok: missingFromDeck.length === 0,
    facts: traces,
    stages,
    missingFromDeck,
    missingFromGapAnalysis,
  };
}

// ── coverage expectations ────────────────────────────────────────────────────

export interface CoverageCheck {
  gap: string;
  expectation: 'recharacterised' | 'still_open';
  /** Did the deck's description of this gap change against the control? */
  changed: boolean;
  /** Is the gap still described as open? */
  stillDescribedOpen: boolean;
  pass: boolean;
  note: string;
}

const OPEN_LANGUAGE =
  /\b(not loaded|not proven|not certified|unvalidated|unproven|no baseline|absent|missing|outstanding|remains? open|unresolved|evaluation[- ]stage|not certified|still open|required before)\b/i;

/**
 * Judge how a gap is DESCRIBED, against the control run.
 *
 * A gap the upload partially fills must stop being described as absent. A gap it
 * deliberately does not fill must still be described as open — and that negative
 * is the more important half: a pipeline that closes every gap when handed more
 * data is worse than one that ignores the data, because it is confidently wrong.
 */
export function checkCoverage(
  checks: { gap: string; expectation: 'recharacterised' | 'still_open'; terms: string[] }[],
  controlDeckText: string,
  treatmentDeckText: string,
): CoverageCheck[] {
  return checks.map(({ gap, expectation, terms }) => {
    const sentencesFor = (text: string) =>
      text
        .split(/(?<=[.;:])\s+|\s{2,}/)
        .filter((s) => terms.some((t) => s.toLowerCase().includes(t.toLowerCase())));

    const control = sentencesFor(controlDeckText);
    const treatment = sentencesFor(treatmentDeckText);
    const changed = normalise(control.join(' ')) !== normalise(treatment.join(' '));
    const stillDescribedOpen = treatment.some((s) => OPEN_LANGUAGE.test(s));

    if (expectation === 'still_open') {
      return {
        gap,
        expectation,
        changed,
        stillDescribedOpen,
        pass: treatment.length > 0 && stillDescribedOpen,
        note: treatment.length === 0
          ? 'the deck does not mention this gap at all'
          : stillDescribedOpen
            ? 'still described as open, as the package requires'
            : 'MENTIONED BUT NO LONGER DESCRIBED AS OPEN — the upload does not close this gap',
      };
    }

    return {
      gap,
      expectation,
      changed,
      stillDescribedOpen,
      pass: treatment.length > 0 && changed,
      note: treatment.length === 0
        ? 'the deck does not mention this gap at all'
        : changed
          ? 'description changed against the control'
          : 'description unchanged against the control — the upload did not reach it',
    };
  });
}
