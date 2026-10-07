/**
 * The OUTCOME findings read model (Increment 2 of the Moves phase-workspace v2
 * redesign). Given a phase's REAL governed content — the archetype-driven
 * current-state readiness report (`ReadinessReport`, one assessed evidence
 * family per instrument) and the latest generated deliverable's extracted
 * content signals (`DeliverableContentSignal`) — this derives the discrete,
 * reviewable findings the v2 OUTCOME step renders.
 *
 * It is PURE and DERIVED. No finding is invented: every finding card maps to a
 * real evidence family the archetype required at this phase (or a real heading
 * the generated deliverable produced). No number is fabricated — a count shown
 * on a finding is a real committed-record count, never a made-up comparable.
 * When a finding's backing evidence is partial (a document family still in
 * review, or a structured family with no committed rows) the finding is marked
 * lower confidence and labelled as a gap rather than presented as fact.
 *
 * When a phase has no readiness report AND no generated content yet, the model
 * reports `pending: true` with no findings, so the OUTCOME step can render a
 * designed empty/pending state instead of guessing.
 *
 * Kept out of the component so the derivation rule is unit-testable on its own
 * and one statement of it serves the findings surface AND the gate summary the
 * surface's review feeds.
 */

import type {
  InstrumentReadiness,
  ReadinessReport,
} from "@/lib/programs/current-state-readiness";
import type { DeliverableContentSignal } from "@/lib/deliverables/deliverable-content-signals";

/** The phases whose OUTCOME step is a findings surface (the intelligence
 *  phases: P2 Discover & Diagnose, P4 Roadmap & Business Case). Every other
 *  phase keeps the hand-off recap/review as its OUTCOME. */
const FINDINGS_PHASES = new Set<number>([2, 4]);

export function isFindingsPhase(phase: number): boolean {
  return FINDINGS_PHASES.has(phase);
}

export type FindingConfidence = "high" | "medium" | "low";

/**
 * How a finding is benchmarked, derived from the evidence family's real `kind`
 * and backing — a classification, never a fabricated figure.
 */
export type BenchmarkSource =
  /** A structural/definitional family (org, qualitative, document) held as a
   *  hard requirement — the "taxonomy trap" shape where the gap is governance
   *  and definitions, not platform capacity. */
  | "taxonomy_trap"
  /** A metric/financial/commercial family — benchmarked against an industry
   *  baseline. */
  | "industry_baseline"
  /** Backed by committed structured records in a canonical store — empirical,
   *  with the real committed-record count. */
  | "empirical"
  /** A governed document family satisfied by the client's own reviewed
   *  evidence. */
  | "client_evidence"
  /** A value lever read from the generated deliverable's own content — a
   *  projection that still needs a Finance baseline before it is a fact. */
  | "generated_projection";

export type FindingReviewState = "accepted" | "challenged" | "awaiting";

export interface PhaseFinding {
  /** Stable id (the evidence-family key, or the generated signal key). */
  id: string;
  /** Short category eyebrow: "Root cause", "Baseline", "Gap", "Value", … */
  kind: string;
  /** The finding statement — the evidence family's label, or the signal heading. */
  statement: string;
  /** Supporting detail — real digest/rationale/snippet, never invented. */
  detail: string;
  /** Short evidence citation shown on the chip. */
  evidenceLabel: string;
  /** True only when this finding rests on committed/approved evidence. */
  evidenceBacked: boolean;
  benchmarkSource: BenchmarkSource;
  /** Display label for the benchmark-source tag. */
  benchmarkLabel: string;
  confidence: FindingConfidence;
}

export type InputGeneratedStatus = "reviewed" | "partial" | "pending";

export interface InputGeneratedRow {
  key: string;
  label: string;
  status: InputGeneratedStatus;
}

export interface PhaseFindingsModel {
  phase: number;
  /** Which intelligence phase this is, for copy. */
  surface: "diagnosis" | "business_case";
  heading: string;
  subhead: string;
  /** Left panel of the input-vs-generated split: client-provided inputs. */
  inputs: InputGeneratedRow[];
  /** Right panel: what aVa produces (read-only), never user-filled. */
  generated: InputGeneratedRow[];
  findings: PhaseFinding[];
  /** The structural headline, or null when there is no structural gap to call. */
  structuralHeadline: string | null;
  /** An honesty note when any finding rests on partial backing, else null. */
  confidenceNote: string | null;
  /** True when there is no governed content to derive findings from yet. */
  pending: boolean;
}

const STRUCTURAL_KINDS = new Set(["org", "qualitative", "document"]);
const BASELINE_KINDS = new Set(["metric_baseline", "financial", "commercial"]);

function kindEyebrow(instrument: InstrumentReadiness, phase: number): string {
  if (phase === 4) {
    // On the business case every assessed family reads as a value lever.
    return "Value";
  }
  if (instrument.status !== "committed") return "Gap";
  if (BASELINE_KINDS.has(instrument.kind)) return "Baseline";
  if (instrument.severity === "hard") return "Root cause";
  return "Finding";
}

function benchmarkFor(instrument: InstrumentReadiness): {
  source: BenchmarkSource;
  label: string;
} {
  // Empirical first: a structured family with committed records carries a real
  // count. committedRows is this Move's committed evidence, stated as such.
  if (instrument.backingTable && instrument.committedRows > 0) {
    return {
      source: "empirical",
      label: `Empirical · ${instrument.committedRows} committed record${
        instrument.committedRows === 1 ? "" : "s"
      }`,
    };
  }
  if (BASELINE_KINDS.has(instrument.kind)) {
    return { source: "industry_baseline", label: "Industry baseline" };
  }
  if (instrument.severity === "hard" && STRUCTURAL_KINDS.has(instrument.kind)) {
    return { source: "taxonomy_trap", label: "Taxonomy trap" };
  }
  if (instrument.documentFamily) {
    return { source: "client_evidence", label: "Client evidence" };
  }
  return { source: "industry_baseline", label: "Industry baseline" };
}

function confidenceFor(instrument: InstrumentReadiness): FindingConfidence {
  if (instrument.status === "committed") {
    // Committed with real carried content reads high; committed with only a
    // status line is solid but not citation-rich, so it stays medium.
    return instrument.evidenceDigest.length > 0 ? "high" : "medium";
  }
  if (instrument.status === "missing") return "low";
  // review_required / staged / parsing — partial backing.
  return "medium";
}

function evidenceLabelFor(instrument: InstrumentReadiness): {
  label: string;
  backed: boolean;
} {
  if (instrument.status === "committed") {
    const hint = instrument.sourceDocHint?.trim();
    return {
      label: hint ? `Evidence · ${hint}` : `Evidence · ${instrument.label}`,
      backed: true,
    };
  }
  if (instrument.status === "missing") {
    return { label: "Gap · not yet provided", backed: false };
  }
  return { label: "Partial · in review", backed: false };
}

function detailFor(instrument: InstrumentReadiness): string {
  const digest = instrument.evidenceDigest.find((d) => d.trim().length > 0);
  if (digest) return digest.trim();
  const rationale = instrument.rationale?.trim();
  if (rationale) return rationale;
  return instrument.whyNeeded?.trim() ?? "";
}

function instrumentToFinding(
  instrument: InstrumentReadiness,
  phase: number,
): PhaseFinding {
  const benchmark = benchmarkFor(instrument);
  const evidence = evidenceLabelFor(instrument);
  return {
    id: instrument.key,
    kind: kindEyebrow(instrument, phase),
    statement: instrument.label,
    detail: detailFor(instrument),
    evidenceLabel: evidence.label,
    evidenceBacked: evidence.backed,
    benchmarkSource: benchmark.source,
    benchmarkLabel: benchmark.label,
    confidence: confidenceFor(instrument),
  };
}

const inputStatusFor = (
  instrument: InstrumentReadiness,
): InputGeneratedStatus => {
  if (instrument.status === "committed") return "reviewed";
  if (instrument.status === "missing") return "pending";
  return "partial";
};

/** The generated-deliverable keys that read as value levers on the P4 case —
 *  surfaced from the generated content's REAL headings, labelled as projections
 *  that need a Finance baseline, never as confirmed savings. */
const P4_VALUE_LEVER_KEYS = new Set(["cost", "metrics", "decisions"]);

function signalValueLevers(
  signals: readonly DeliverableContentSignal[],
  alreadySeen: ReadonlySet<string>,
): PhaseFinding[] {
  const out: PhaseFinding[] = [];
  for (const signal of signals) {
    if (!P4_VALUE_LEVER_KEYS.has(signal.key)) continue;
    const id = `signal_${signal.key}`;
    if (alreadySeen.has(id)) continue;
    const snippet = signal.snippet?.trim();
    if (!snippet) continue;
    out.push({
      id,
      kind: "Value",
      statement: signal.heading?.trim() || signal.key,
      detail: snippet,
      evidenceLabel: "Generated · from the modelled case",
      evidenceBacked: false,
      benchmarkSource: "generated_projection",
      benchmarkLabel: "Quantify with Finance",
      confidence: "medium",
    });
  }
  return out;
}

function structuralHeadline(
  report: ReadinessReport,
  phase: number,
): string | null {
  const hardGaps = report.hardGaps.length;
  if (hardGaps === 0) return null;
  const structuralHardGaps = report.instruments.filter(
    (i) =>
      i.severity === "hard" &&
      i.status !== "committed" &&
      STRUCTURAL_KINDS.has(i.kind),
  ).length;
  if (phase === 4) {
    return `${hardGaps} required input${
      hardGaps === 1 ? "" : "s"
    } for the business case ${
      hardGaps === 1 ? "is" : "are"
    } still open — value stays illustrative until ${
      hardGaps === 1 ? "it lands" : "they land"
    }.`;
  }
  if (structuralHardGaps > 0) {
    return `The gap is structural — ${structuralHardGaps} of ${hardGaps} hard gap${
      hardGaps === 1 ? "" : "s"
    } ${
      structuralHardGaps === 1 ? "is" : "are"
    } governance and definitions, not tooling or platform capacity.`;
  }
  return `${hardGaps} hard gap${
    hardGaps === 1 ? "" : "s"
  } remain${hardGaps === 1 ? "s" : ""} before the current state is agreed.`;
}

export interface BuildPhaseFindingsInput {
  phase: number;
  readiness: ReadinessReport | null;
  contentSignals: readonly DeliverableContentSignal[];
}

/**
 * Build the OUTCOME findings model for an intelligence phase, or null when the
 * phase is not a findings phase (its OUTCOME keeps the hand-off recap).
 */
export function buildPhaseFindings({
  phase,
  readiness,
  contentSignals,
}: BuildPhaseFindingsInput): PhaseFindingsModel | null {
  if (!isFindingsPhase(phase)) return null;

  const surface: PhaseFindingsModel["surface"] =
    phase === 4 ? "business_case" : "diagnosis";
  const heading =
    surface === "business_case"
      ? "The case, as reviewable value levers"
      : "What we found this phase";
  const subhead =
    surface === "business_case"
      ? "Each value lever is benchmarked for this shape and stays illustrative until Finance supplies a baseline. Accept or challenge each; your reviews are what the gate attests to."
      : "The diagnosis, as discrete reviewable findings — each benchmarked against how moves of this shape typically look. Accept or challenge each; your reviews are what the gate attests to.";

  const instruments = readiness?.instruments ?? [];
  const findings: PhaseFinding[] = instruments.map((instrument) =>
    instrumentToFinding(instrument, phase),
  );

  // P4 only: surface generated value levers that the readiness families don't
  // already cover. (On P2 the diagnosis findings ARE the families.)
  if (phase === 4) {
    const seen = new Set(findings.map((f) => f.id));
    findings.push(...signalValueLevers(contentSignals, seen));
  }

  // The input-vs-generated split. Client-provided inputs are the document
  // families (the client supplies them); the generated side is what aVa
  // produces from them, read-only — the real generated headings plus the
  // deliverable itself, which lands on attest.
  const inputs: InputGeneratedRow[] = instruments
    .filter((i) => i.documentFamily)
    .map((i) => ({ key: i.key, label: i.label, status: inputStatusFor(i) }));
  const structuredInputs: InputGeneratedRow[] = instruments
    .filter((i) => !i.documentFamily)
    .map((i) => ({ key: i.key, label: i.label, status: inputStatusFor(i) }));

  const generated: InputGeneratedRow[] = contentSignals
    .filter((s) => (s.heading ?? "").trim().length > 0)
    .map((s) => ({
      key: `gen_${s.key}`,
      label: s.heading.trim(),
      status: "reviewed" as const,
    }));
  generated.push({
    key: "deliverable",
    label:
      surface === "business_case"
        ? "Business case deliverable"
        : "Phase deliverable",
    status: "pending",
  });

  const pending = findings.length === 0 && generated.length <= 1;

  const headline = readiness ? structuralHeadline(readiness, phase) : null;
  const hasPartial = findings.some((f) => f.confidence !== "high");
  const confidenceNote =
    !pending && hasPartial
      ? "Findings backed by partial or in-review evidence are marked lower confidence and held as gaps until their source is complete. No figure is presented as a confirmed measurement."
      : null;

  return {
    phase,
    surface,
    heading,
    subhead,
    // Structured inputs (committed stores) read on the input side too — they're
    // the client's estate, surfaced after the document families.
    inputs: [...inputs, ...structuredInputs],
    generated,
    findings,
    structuralHeadline: pending ? null : headline,
    confidenceNote,
    pending,
  };
}

export interface FindingsReviewSummary {
  total: number;
  accepted: number;
  challenged: number;
  awaiting: number;
  /** True when every finding has a decided (accepted/challenged) review. */
  allReviewed: boolean;
  /** The first finding still awaiting review, for the gate to name, or null. */
  openFinding: PhaseFinding | null;
  /** The first challenged finding, which the gate must see resolved, or null. */
  challengedFinding: PhaseFinding | null;
}

/**
 * Summarise a findings review for the GATE step: the accepted/challenged/
 * awaiting counts and the specific open or challenged finding the gate must
 * name. Pure, so the gate's honesty is testable against the same model the
 * surface renders. A finding with no recorded review counts as awaiting.
 */
export function summarizePhaseFindingsReview(
  model: PhaseFindingsModel,
  review: Readonly<Record<string, FindingReviewState>>,
): FindingsReviewSummary {
  let accepted = 0;
  let challenged = 0;
  let awaiting = 0;
  let openFinding: PhaseFinding | null = null;
  let challengedFinding: PhaseFinding | null = null;
  for (const finding of model.findings) {
    const state = review[finding.id] ?? "awaiting";
    if (state === "accepted") {
      accepted += 1;
    } else if (state === "challenged") {
      challenged += 1;
      if (!challengedFinding) challengedFinding = finding;
    } else {
      awaiting += 1;
      if (!openFinding) openFinding = finding;
    }
  }
  const total = model.findings.length;
  return {
    total,
    accepted,
    challenged,
    awaiting,
    allReviewed: total > 0 && awaiting === 0,
    openFinding,
    challengedFinding,
  };
}
