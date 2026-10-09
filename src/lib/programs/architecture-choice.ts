import type {
  P3OptionSet,
  P3SolutionOption,
} from "@/lib/programs/phase-templates/p3-option-assembler";
import { parseRootCauseRegister } from "@/lib/programs/root-cause-register";
import {
  traceRows,
  type DesignTraceability,
} from "@/lib/programs/design-traceability";

/**
 * P3 Step 2, "Choose a direction and size it": the option the team chose
 * from the options it brought, and what that option answers of Step 1's
 * design elements.
 *
 * Stored in the P3 `architecture_choice` step record as JSON with an explicit
 * kind marker. The choice is the team's working decision; the build still
 * records it through the gate-authority approval route before architecture
 * assembly, so nothing here approves, buys or builds anything.
 *
 * Coverage is an instrument, not a score: per design element the team marks
 * Covers / Partly / Doesn't, and Partly or Doesn't needs one line on how the
 * element still gets answered. Elements handed off in Step 1 are listed but
 * not asked. A rule pre-marks "Covers" only where the option's own scope or
 * benefit names the element; those marks are drafts until the team accepts
 * the coverage, and they are labelled by the rule, not credited to aVa. Each entry keeps the element's words, so an element Step 1
 * rewrites is asked again rather than carrying a mark made against other
 * words.
 *
 * The rationale is the P3 `recommendation` answer, the same text the
 * approval route records; this record keeps the words the team confirmed, so
 * an edit made elsewhere asks for confirmation again.
 */

export const ARCHITECTURE_CHOICE_KIND = "architecture_choice";

export type CoverageMark = "covers" | "partly" | "no";

export const COVERAGE_LABELS: Readonly<Record<CoverageMark, string>> = {
  covers: "Covers",
  partly: "Partly",
  no: "Doesn’t",
};

export interface CoverageEntry {
  causeId: string;
  /** The design element's words when it was marked. */
  element: string;
  mark: CoverageMark;
  /** For Partly or Doesn't: how the element still gets answered. */
  how?: string;
  /**
   * "option_text" for a pre-mark the rule made because the option's own text
   * names the element, until the team touches or accepts it.
   */
  source: "team" | "option_text";
}

export interface ArchitectureChoice {
  kind: typeof ARCHITECTURE_CHOICE_KIND;
  version: 1;
  optionId: string;
  optionLabel: string;
  optionSetSource: P3OptionSet["source"];
  sourceTitle?: string;
  chosenBy: string;
  chosenAt: string;
  coverage: CoverageEntry[];
  coverageAcceptedBy?: string;
  coverageAcceptedAt?: string;
  /** The rationale as confirmed: the `recommendation` text at that moment. */
  why?: string;
  whyConfirmedBy?: string;
  whyConfirmedAt?: string;
}

const MARKS = new Set<CoverageMark>(["covers", "partly", "no"]);
const SOURCES = new Set<P3OptionSet["source"]>([
  "move_uploaded_options",
  "p3_design_inputs_pack",
]);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function parseArchitectureChoice(
  raw: string | null | undefined,
): ArchitectureChoice | null {
  const value = (raw ?? "").trim();
  if (!value.startsWith("{")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const o = parsed as Record<string, unknown>;
  const optionId = text(o.optionId);
  const optionLabel = text(o.optionLabel);
  const chosenBy = text(o.chosenBy);
  const chosenAt = text(o.chosenAt);
  const optionSetSource = o.optionSetSource as P3OptionSet["source"];
  if (
    o.kind !== ARCHITECTURE_CHOICE_KIND ||
    o.version !== 1 ||
    !optionId ||
    !optionLabel ||
    !chosenBy ||
    !chosenAt ||
    !SOURCES.has(optionSetSource)
  ) {
    return null;
  }
  const seen = new Set<string>();
  const coverage: CoverageEntry[] = [];
  for (const item of Array.isArray(o.coverage) ? o.coverage : []) {
    if (typeof item !== "object" || item === null) continue;
    const c = item as Record<string, unknown>;
    const causeId = text(c.causeId);
    const element = text(c.element);
    const mark = c.mark as CoverageMark;
    if (!causeId || !element || !MARKS.has(mark) || seen.has(causeId)) {
      continue;
    }
    seen.add(causeId);
    coverage.push({
      causeId,
      element,
      mark,
      ...(text(c.how) ? { how: text(c.how) } : {}),
      source: c.source === "option_text" ? "option_text" : "team",
    });
  }
  const optional = (key: keyof ArchitectureChoice) =>
    text(o[key]) ? { [key]: text(o[key]) } : {};
  return {
    kind: ARCHITECTURE_CHOICE_KIND,
    version: 1,
    optionId,
    optionLabel,
    optionSetSource,
    ...optional("sourceTitle"),
    chosenBy,
    chosenAt,
    coverage,
    ...optional("coverageAcceptedBy"),
    ...optional("coverageAcceptedAt"),
    ...optional("why"),
    ...optional("whyConfirmedBy"),
    ...optional("whyConfirmedAt"),
  };
}

export function serializeArchitectureChoice(value: ArchitectureChoice): string {
  return JSON.stringify(value);
}

// ── Step 1's design elements, as Step 2 asks about them ─────────────────────

export interface CoverageElement {
  causeId: string;
  rank: number;
  /** P2's short name for the cause: "identity". */
  short?: string;
  /** The accepted design element; absent for a hand-off. */
  element?: string;
  /** For a hand-off: the program that owns it. Not asked. */
  handedTo?: string;
}

/** Step 1's settled rows, in rank. Drafts and open causes are not elements. */
export function coverageElements(
  p2RootCauses: string,
  traceability: DesignTraceability,
): CoverageElement[] {
  const register = parseRootCauseRegister(p2RootCauses);
  const shortOf = (id: string) =>
    register?.causes.find((c) => c.id === id)?.short;
  return traceRows(p2RootCauses, traceability).flatMap(
    (r): CoverageElement[] => {
      const link = r.link;
      const short = shortOf(r.causeId);
      const base = {
        causeId: r.causeId,
        rank: r.rank,
        ...(short ? { short } : {}),
      };
      if (link?.status === "accepted" && link.element) {
        return [{ ...base, element: link.element }];
      }
      if (link?.status === "handed_off" && link.program) {
        return [{ ...base, handedTo: link.program }];
      }
      return [];
    },
  );
}

/** The entry for an element, only if it was marked against these words. */
export function coverageFor(
  choice: ArchitectureChoice,
  element: CoverageElement,
): CoverageEntry | undefined {
  if (!element.element) return undefined;
  return choice.coverage.find(
    (c) => c.causeId === element.causeId && c.element === element.element,
  );
}

function isEntryComplete(entry: CoverageEntry | undefined): boolean {
  if (!entry) return false;
  return entry.mark === "covers" || Boolean(entry.how?.trim());
}

/** Asked elements still to mark (or to explain, for Partly / Doesn't). */
export function coverageOpenCount(
  choice: ArchitectureChoice,
  elements: readonly CoverageElement[],
): number {
  return elements.filter(
    (e) => e.element && !isEntryComplete(coverageFor(choice, e)),
  ).length;
}

export function isCoverageAccepted(
  choice: ArchitectureChoice,
  elements: readonly CoverageElement[],
): boolean {
  return (
    Boolean(choice.coverageAcceptedAt) &&
    coverageOpenCount(choice, elements) === 0
  );
}

export function isWhyConfirmed(
  choice: ArchitectureChoice,
  recommendation: string,
): boolean {
  const why = recommendation.trim();
  return Boolean(why) && choice.why === why && Boolean(choice.whyConfirmedAt);
}

/** Step 2 is done: a current choice, its coverage accepted, its why confirmed. */
export function isArchitectureChoiceComplete(
  choice: ArchitectureChoice | null,
  set: P3OptionSet,
  elements: readonly CoverageElement[],
  recommendation: string,
): boolean {
  return (
    Boolean(choice) &&
    set.options.some((o) => o.id === choice!.optionId) &&
    isCoverageAccepted(choice!, elements) &&
    isWhyConfirmed(choice!, recommendation)
  );
}

/** "OPT-B" reads as "B"; any other id reads as written. */
export function optionKey(id: string): string {
  return id.replace(/^opt[-_ ]?/i, "");
}

/** Does the text name this option: its id, its label, or "option B"? */
export function textNamesOption(
  text: string,
  option: { id: string; label: string },
): boolean {
  return [option.id, option.label, `option ${optionKey(option.id)}`].some(
    (name) =>
      name.trim().length > 1 &&
      new RegExp(`\\b${escapeRegExp(name.trim())}\\b`, "i").test(text),
  );
}

/**
 * When the rationale argues for a different option than the one chosen: it
 * names another option of the set and not the chosen one. Null otherwise.
 */
export function rationaleArguesFor(
  text: string,
  set: P3OptionSet,
  chosenId: string,
): { id: string; label: string } | null {
  const chosen = set.options.find((o) => o.id === chosenId);
  if (!text.trim() || !chosen || textNamesOption(text, chosen)) return null;
  const other = set.options.find(
    (o) => o.id !== chosenId && textNamesOption(text, o),
  );
  return other ? { id: other.id, label: other.label } : null;
}

// ── The options as the team wrote them ──────────────────────────────────────

export interface OptionField {
  label: string;
  /** An estimate carries its source; it is never a figure we computed. */
  estimateSource?: string;
  values: string[];
}

export interface OptionComparison {
  options: Array<{ id: string; label: string }>;
  fields: OptionField[];
}

function optionFieldValues(
  option: P3SolutionOption,
): Array<[string, string, string | undefined]> {
  const c = option.clientSupplied;
  if (c) {
    return [
      ["Scope", c.scope, undefined],
      ["Benefit", c.benefit, undefined],
      ["Tradeoff", c.tradeoff, undefined],
      ["Condition", c.condition, undefined],
    ];
  }
  return [
    ["Scope", option.summary, undefined],
    ["Benefit", option.businessImpact, undefined],
    ["Effort", option.effort, "template estimate"],
    ["Time to value", option.timeToValue, "template estimate"],
    ["Condition", option.readinessConditions.join(" "), undefined],
    ["Risks", option.risks.join(" "), undefined],
  ];
}

/**
 * The comparison as written: each option's own fields, no scores, no rank, no
 * recommendation, and no computed row. A field no option fills is left out.
 */
export function optionComparison(set: P3OptionSet): OptionComparison {
  const perOption = set.options.map(optionFieldValues);
  const labels = perOption[0]?.map(([label]) => label) ?? [];
  const fields: OptionField[] = [];
  labels.forEach((label, index) => {
    const values = perOption.map((fields) => fields[index]?.[1]?.trim() ?? "");
    if (values.every((v) => !v)) return;
    const estimateSource = perOption[0][index][2];
    fields.push({
      label,
      values,
      ...(estimateSource ? { estimateSource } : {}),
    });
  });
  return {
    options: set.options.map((o) => ({ id: o.id, label: o.label })),
    fields,
  };
}

/** The option's own positive claims: its scope and benefit, never its tradeoff. */
function claimsOf(option: P3SolutionOption): string {
  const c = option.clientSupplied;
  return (c ? [c.scope, c.benefit] : [option.summary, option.businessImpact])
    .join(" ")
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function names(claims: string, phrase: string | undefined): boolean {
  const p = phrase?.trim().toLowerCase();
  if (!p || p.length < 4) return false;
  return new RegExp(`\\b${escapeRegExp(p)}\\b`).test(claims);
}

/** "Certified semantic layer: a governed …" → "certified semantic layer". */
function elementHead(element: string): string | undefined {
  const head = element.split(/[:;,(]|\s[—–-]\s|\swith\s/)[0]?.trim();
  return head && head.split(/\s+/).length >= 2 ? head : undefined;
}

/**
 * The pre-marks: "Covers", as a draft, only where the option's scope or
 * benefit names the element (its short name or the element's own head
 * phrase). Never a Partly or a Doesn't: absence of a word is not evidence.
 */
export function premarkCoverage(
  option: P3SolutionOption,
  elements: readonly CoverageElement[],
): CoverageEntry[] {
  const claims = claimsOf(option);
  return elements.flatMap((e) =>
    e.element &&
    (names(claims, e.short) || names(claims, elementHead(e.element)))
      ? [
          {
            causeId: e.causeId,
            element: e.element,
            mark: "covers" as const,
            source: "option_text" as const,
          },
        ]
      : [],
  );
}

// ── Edits ───────────────────────────────────────────────────────────────────

export type ChoiceEdit =
  | { ok: true; value: ArchitectureChoice }
  | { ok: false; reason: string };

export function chooseOption(
  set: P3OptionSet,
  optionId: string,
  elements: readonly CoverageElement[],
  by: string,
  at: string,
): ChoiceEdit {
  const option = set.options.find((o) => o.id === optionId);
  if (!option) {
    return {
      ok: false,
      reason: "That option is not in this Move's option set.",
    };
  }
  return {
    ok: true,
    value: {
      kind: ARCHITECTURE_CHOICE_KIND,
      version: 1,
      optionId: option.id,
      optionLabel: option.label,
      optionSetSource: set.source,
      ...(set.sourceTitle ? { sourceTitle: set.sourceTitle } : {}),
      chosenBy: by,
      chosenAt: at,
      coverage: premarkCoverage(option, elements),
    },
  };
}

export function markCoverage(
  choice: ArchitectureChoice,
  element: CoverageElement,
  mark: CoverageMark,
): ChoiceEdit {
  if (!element.element) {
    return {
      ok: false,
      reason:
        "A design element handed off in Step 1 is not this option's to answer.",
    };
  }
  const prior = coverageFor(choice, element);
  const entry: CoverageEntry = {
    causeId: element.causeId,
    element: element.element,
    mark,
    ...(mark !== "covers" && prior?.how ? { how: prior.how } : {}),
    source: "team",
  };
  return { ok: true, value: withEntry(choice, entry) };
}

export function explainCoverage(
  choice: ArchitectureChoice,
  element: CoverageElement,
  how: string,
): ChoiceEdit {
  const prior = coverageFor(choice, element);
  if (!prior || prior.mark === "covers") {
    return {
      ok: false,
      reason: "Only a Partly or Doesn’t needs a line on how it gets answered.",
    };
  }
  return {
    ok: true,
    value: withEntry(choice, {
      causeId: prior.causeId,
      element: prior.element,
      mark: prior.mark,
      ...(how.trim() ? { how } : {}),
      source: "team",
    }),
  };
}

function withEntry(
  choice: ArchitectureChoice,
  entry: CoverageEntry,
): ArchitectureChoice {
  const { coverageAcceptedAt, coverageAcceptedBy, ...rest } = choice;
  void coverageAcceptedAt;
  void coverageAcceptedBy;
  const coverage = [
    ...choice.coverage.filter((c) => c.causeId !== entry.causeId),
    entry,
  ];
  return { ...rest, coverage };
}

export function acceptCoverage(
  choice: ArchitectureChoice,
  elements: readonly CoverageElement[],
  by: string,
  at: string,
): ChoiceEdit {
  const open = coverageOpenCount(choice, elements);
  if (open > 0) {
    return {
      ok: false,
      reason: `${open} design element${open === 1 ? " is" : "s are"} still to mark, or to explain.`,
    };
  }
  return {
    ok: true,
    value: {
      ...choice,
      coverage: choice.coverage.map((c) => ({ ...c, source: "team" as const })),
      coverageAcceptedBy: by,
      coverageAcceptedAt: at,
    },
  };
}

export function reopenCoverage(choice: ArchitectureChoice): ArchitectureChoice {
  const { coverageAcceptedAt, coverageAcceptedBy, ...rest } = choice;
  void coverageAcceptedAt;
  void coverageAcceptedBy;
  return rest;
}

export function confirmWhy(
  choice: ArchitectureChoice,
  recommendation: string,
  by: string,
  at: string,
): ChoiceEdit {
  const why = recommendation.trim();
  if (!why) {
    return { ok: false, reason: "Write why this option before confirming it." };
  }
  return {
    ok: true,
    value: { ...choice, why, whyConfirmedBy: by, whyConfirmedAt: at },
  };
}

export function reopenWhy(choice: ArchitectureChoice): ArchitectureChoice {
  const { why, whyConfirmedAt, whyConfirmedBy, ...rest } = choice;
  void why;
  void whyConfirmedAt;
  void whyConfirmedBy;
  return rest;
}

// ── Text readers ────────────────────────────────────────────────────────────

/** For the build's decision context, the next phase and cited evidence. */
export function architectureChoiceText(choice: ArchitectureChoice): string {
  const from =
    choice.optionSetSource === "move_uploaded_options"
      ? `as written in ${choice.sourceTitle ?? "the team's options"}`
      : "from the template option set; the Move declared none";
  return [
    `Chosen option: ${choice.optionId} · ${choice.optionLabel} (${from}), chosen by ${choice.chosenBy} on ${choice.chosenAt}.`,
    choice.coverage.length
      ? `What it answers of each design element${choice.coverageAcceptedAt ? "" : " (not yet accepted)"}:`
      : null,
    ...choice.coverage.map(
      (c) =>
        `${c.causeId} ${c.element} → ${COVERAGE_LABELS[c.mark]}${c.how ? `: ${c.how}` : ""}`,
    ),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Only the team's words, for the gate's phrase checks. */
export function architectureChoiceGateText(choice: ArchitectureChoice): string {
  return choice.coverage
    .filter((c) => c.how)
    .map((c) => c.how as string)
    .join("\n");
}
