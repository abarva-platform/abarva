"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  acceptCoverage,
  chooseOption,
  confirmWhy,
  COVERAGE_LABELS,
  coverageElements,
  coverageFor,
  coverageOpenCount,
  explainCoverage,
  isCoverageAccepted,
  isWhyConfirmed,
  markCoverage,
  optionComparison,
  optionKey,
  parseArchitectureChoice,
  rationaleArguesFor,
  reopenCoverage,
  reopenWhy,
  serializeArchitectureChoice,
  type ArchitectureChoice,
  type ChoiceEdit,
  type CoverageElement,
  type CoverageMark,
} from "@/lib/programs/architecture-choice";
import { proposeChoiceFromNotes } from "@/lib/programs/architecture-choice-notes";
import {
  emptyDesignTraceability,
  isDesignTraceabilityComplete,
  parseDesignTraceability,
} from "@/lib/programs/design-traceability";
import type { P3OptionSet } from "@/lib/programs/phase-templates/p3-option-assembler";
import { resolveStepNextAction } from "@/lib/programs/step-page-model";
import {
  MovesStepPage,
  SourceLine,
  SourceTag,
  type StepPagePhase,
  type StepPageRow,
  type StepPageStep,
} from "./MovesStepPage";
import type { StepAvaAction } from "./RootCausesStep";
import { useStepEvidence } from "./StepEvidence";
import styles from "./MovesStepPage.module.css";

/**
 * P3 Step 2, "Choose a direction and size it" (template v1.7). The team's
 * options are shown exactly as written: not scored, not ranked, none
 * preselected. Choosing writes the `architecture_choice` step record; the
 * build records it through the gate-authority approval route before any
 * architecture is assembled, so nothing here is bought or built.
 *
 * After a choice, the Coverage instrument asks what the chosen option answers
 * of each Step 1 design element (a hand-off is listed, not asked), and the
 * rationale row confirms why: that text is the P3 `recommendation` answer the
 * approval route records.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

const MARKS: readonly CoverageMark[] = ["covers", "partly", "no"];
const COUNT_WORDS = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
];

export interface ArchitectureOptionsStepProps {
  moveId: string;
  canReviewEvidence: boolean;
  onEvidenceChanged?: () => void;
  moveName: string;
  syntheticNote?: string;
  phases: readonly StepPagePhase[];
  steps: readonly StepPageStep[];
  stepIndex: number;
  tabs?: ReactNode;
  /** The saved `architecture_choice` record. */
  value: string;
  onChange: (value: string) => void;
  /** The P3 `recommendation` answer: why the chosen option. */
  recommendation: string;
  onRecommendationChange: (value: string) => void;
  optionSet: P3OptionSet;
  /**
   * The charter's platform-fit classification, when one is recorded. Shown
   * read-only: the platform-fit gate owns it, so this page never writes it.
   */
  platformFit?: { pattern: string; routing: string } | null;
  /** P2's root causes and Step 1's traceability, for the design elements. */
  p2RootCauses: string;
  designTraceability: string;
  /** Where Step 1 lives, for the blocked state's link. */
  step1Href: string;
  decidedBy: string;
  today: string;
  onBack?: () => void;
  onContinue?: () => void;
  frame?: (
    page: ReactNode,
    dock: { briefing: string; actions: StepAvaAction[]; notesPanel: ReactNode },
  ) => ReactNode;
}

function shortDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
}

export function ArchitectureOptionsStep(props: ArchitectureOptionsStepProps) {
  const trace =
    parseDesignTraceability(props.designTraceability) ??
    emptyDesignTraceability();
  const step1Done = isDesignTraceabilityComplete(props.p2RootCauses, trace);
  const elements = useMemo(
    () => coverageElements(props.p2RootCauses, trace),
    // `trace` is re-parsed each render; its source string is the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.p2RootCauses, props.designTraceability],
  );
  const saved = parseArchitectureChoice(props.value);
  const set = props.optionSet;
  const option = saved
    ? set.options.find((o) => o.id === saved.optionId)
    : undefined;
  // A choice whose option left the set is not a choice: ask again, and say so.
  const choice: ArchitectureChoice | null = option ? saved : null;
  const staleChoice = saved && !option ? saved : null;
  const comparison = useMemo(() => optionComparison(set), [set]);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [confirmChange, setConfirmChange] = useState(false);
  const [whyEdit, setWhyEdit] = useState<string | null>(null);
  const [whyFromNotes, setWhyFromNotes] = useState<number[] | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [fillReply, setFillReply] = useState<string | null>(null);
  const evidence = useStepEvidence({
    uploadLabel: "Add session output",
    moveId: props.moveId,
    phase: 3,
    canReview: props.canReviewEvidence,
    onEvidenceChanged: props.onEvidenceChanged,
  });

  const commit = (edit: ChoiceEdit) => {
    if (!edit.ok) {
      setRefusal(edit.reason);
      return false;
    }
    setRefusal(null);
    props.onChange(serializeArchitectureChoice(edit.value));
    return true;
  };

  const key = choice ? optionKey(choice.optionId) : "";
  const asked = elements.filter((e) => e.element);
  const covOpen = choice ? coverageOpenCount(choice, elements) : asked.length;
  const covAccepted = choice ? isCoverageAccepted(choice, elements) : false;
  const whyConfirmed = choice
    ? isWhyConfirmed(choice, props.recommendation)
    : false;
  const fromLine =
    set.source === "move_uploaded_options"
      ? `As written in ${set.sourceTitle ?? "the team’s options"} · not scored or ranked`
      : "Template options: the Move declared none · not scored or ranked";

  // ── Direction ─────────────────────────────────────────────────────────────
  const chooseButton = (id: string) => (
    <button
      type="button"
      className={cx("btn-line")}
      onClick={() => {
        setWhyEdit(null);
        setWhyFromNotes(null);
        commit(chooseOption(set, id, elements, props.decidedBy, props.today));
      }}
    >
      Choose {optionKey(id)}
    </button>
  );
  const fieldLabel = (f: (typeof comparison.fields)[number]) => (
    <>
      {f.label}
      {f.estimateSource ? <SourceTag kind="est" /> : null}
    </>
  );
  const table = (
    <table className={cx("tbl")}>
      <thead>
        <tr>
          <th scope="col">
            <span className={cx("sr-only")}>Attribute</span>
          </th>
          {comparison.options.map((o) => (
            <th scope="col" key={o.id}>
              <span className={cx("eyebrow")}>Option {optionKey(o.id)}</span>
              {o.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {comparison.fields.map((f) => (
          <tr key={f.label}>
            <th scope="row">{fieldLabel(f)}</th>
            {f.values.map((v, i) => (
              <td key={comparison.options[i].id}>
                {v || <span className={cx("no")}>Not stated</span>}
                {v && f.estimateSource ? (
                  <span className={cx("item-note")}>{f.estimateSource}</span>
                ) : null}
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <th scope="row" />
          {comparison.options.map((o) => (
            <td className={cx("act-cell")} key={o.id}>
              {chooseButton(o.id)}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
  const cards = (
    <div className={cx("cards")}>
      {comparison.options.map((o, i) => (
        <div className={cx("card")} key={o.id}>
          <span className={cx("card-title")}>
            <span className={cx("eyebrow")}>Option {optionKey(o.id)}</span>
            <br />
            {o.label}
          </span>
          <dl>
            {comparison.fields.map((f) => (
              <div key={f.label}>
                <dt>{fieldLabel(f)}</dt>
                <dd>{f.values[i] || "Not stated"}</dd>
              </div>
            ))}
          </dl>
          <div>{chooseButton(o.id)}</div>
        </div>
      ))}
    </div>
  );

  const hasWorkToLose = Boolean(
    choice &&
    (choice.coverage.some((c) => c.source === "team") || choice.whyConfirmedAt),
  );
  const directionRow: StepPageRow = choice
    ? {
        id: "DIR",
        rank: 1,
        eyebrow: "Direction",
        shortName: `Option ${key} · ${choice.optionLabel}`,
        subject: `Option ${key} · ${choice.optionLabel}`,
        state: "settled",
        facts: [{ kind: "team", text: fromLine }],
        middle: (
          <div>
            <p className={cx("proposal")}>
              {option?.clientSupplied?.scope || option?.summary}
            </p>
            {option?.clientSupplied?.condition ? (
              <SourceLine
                source={{
                  kind: "team",
                  text: `Condition: ${option.clientSupplied.condition}`,
                }}
              />
            ) : null}
            {props.platformFit ? (
              <SourceLine
                source={{
                  kind: "team",
                  text: `Platform fit (from the charter): ${props.platformFit.pattern} · ${props.platformFit.routing}`,
                }}
              />
            ) : null}
            {confirmChange ? (
              <p className={cx("warn-inline")} role="alert">
                Changing the option clears its coverage marks and the
                confirmation of why. The options stay as written.
              </p>
            ) : null}
            <span className={cx("when-settled")}>
              Chosen by{" "}
              {choice.chosenBy === props.decidedBy ? "you" : choice.chosenBy},{" "}
              {shortDate(choice.chosenAt)}
            </span>
          </div>
        ),
        actions: confirmChange ? (
          <>
            <button
              type="button"
              className={cx("btn-line")}
              onClick={() => {
                setConfirmChange(false);
                setWhyEdit(null);
                props.onChange("");
              }}
            >
              Change anyway
            </button>
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() => setConfirmChange(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => {
              // Marks or a confirmed reason would be lost: say so first.
              if (hasWorkToLose) {
                setConfirmChange(true);
                return;
              }
              setWhyEdit(null);
              props.onChange("");
            }}
          >
            Change
          </button>
        ),
      }
    : {
        id: "DIR",
        rank: 1,
        eyebrow: "Direction",
        shortName: "direction",
        subject: `Choose one of ${COUNT_WORDS[comparison.options.length] ?? "the"} options`,
        state: "decision",
        clause: "choose a direction",
        wide: true,
        facts: [
          { kind: "team", text: fromLine },
          ...(staleChoice
            ? [
                {
                  kind: "team" as const,
                  text: `The option chosen earlier (${staleChoice.optionLabel}) is no longer in the option set`,
                },
              ]
            : []),
        ],
        middle: (
          <>
            {table}
            {cards}
          </>
        ),
      };

  // ── Coverage ──────────────────────────────────────────────────────────────
  const coverageItem = (e: CoverageElement) => {
    const name = `${e.causeId} · ${e.short ?? e.causeId}`;
    if (!e.element) {
      return (
        <li key={e.causeId}>
          <span>
            <span className={cx("item-name")}>{name}</span>
            <span className={cx("item-note")}>
              Handed to the {e.handedTo} in Step 1
            </span>
          </span>
          <span className={cx("item-actions")}>
            <span className={cx("item-state")}>
              Not this option’s to answer
            </span>
          </span>
        </li>
      );
    }
    const entry = choice ? coverageFor(choice, e) : undefined;
    const how =
      entry && entry.mark !== "covers" ? (
        covAccepted ? (
          <span className={cx("item-note")}>
            How it gets answered: {entry.how}
          </span>
        ) : (
          <>
            <label className={cx("sr-only")} htmlFor={`how-${e.causeId}`}>
              How {e.short ?? e.causeId} gets answered
            </label>
            <input
              id={`how-${e.causeId}`}
              className={cx("cell-input", "cov-how")}
              value={entry.how ?? ""}
              placeholder="How it gets answered, e.g. add to a Step 4 package, or name the gap owner"
              onChange={(ev) =>
                choice && commit(explainCoverage(choice, e, ev.target.value))
              }
            />
          </>
        )
      ) : null;
    return (
      <li key={e.causeId}>
        <span>
          <span className={cx("item-name")}>{name}</span>
          <span className={cx("item-note")}>{e.element}</span>
          {entry?.source === "option_text" && !covAccepted ? (
            <span className={cx("ava-badge")}>
              Named in the option · review
            </span>
          ) : null}
          {how}
        </span>
        <span className={cx("item-actions")}>
          {covAccepted ? (
            <span className={cx("item-state")}>
              {entry ? COVERAGE_LABELS[entry.mark] : ""}
            </span>
          ) : (
            <div
              className={cx("seg", "seg-sm")}
              role="radiogroup"
              aria-label={`Does option ${key} answer ${e.short ?? e.causeId}?`}
            >
              {MARKS.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={entry?.mark === m}
                  onClick={() => choice && commit(markCoverage(choice, e, m))}
                >
                  {COVERAGE_LABELS[m]}
                </button>
              ))}
            </div>
          )}
        </span>
      </li>
    );
  };
  const coverageRow: StepPageRow | null = choice
    ? {
        id: "COV",
        rank: 2,
        eyebrow: "Coverage",
        shortName: "coverage",
        subject: `What option ${key} answers`,
        state: covAccepted ? "settled" : "decision",
        clause: `mark what option ${key} answers`,
        wide: true,
        facts: [
          {
            kind: "team",
            text: "Each design element from Step 1 · feeds the gate’s requirements → design → outcome trace",
          },
        ],
        middle: (
          <>
            <ul className={cx("items")}>{elements.map(coverageItem)}</ul>
            {covAccepted ? (
              <span className={cx("when-settled")}>
                Marked by{" "}
                {choice.coverageAcceptedBy === props.decidedBy
                  ? "you"
                  : choice.coverageAcceptedBy}
                , {shortDate(choice.coverageAcceptedAt ?? "")}
              </span>
            ) : null}
          </>
        ),
        actions: covAccepted ? (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => commit({ ok: true, value: reopenCoverage(choice) })}
          >
            Reopen
          </button>
        ) : (
          <>
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={covOpen > 0}
              onClick={() =>
                commit(
                  acceptCoverage(
                    choice,
                    elements,
                    props.decidedBy,
                    props.today,
                  ),
                )
              }
            >
              Accept coverage
            </button>
            {covOpen > 0 ? (
              <span className={cx("item-state")}>{covOpen} still to mark</span>
            ) : null}
          </>
        ),
        basis: [
          {
            kind: "team",
            text: "Covers is pre-marked only where the option’s own scope or benefit names the element. Everything else is your judgement; options are not scored or ranked.",
            cite: "Coverage rule",
          },
          {
            kind: "team",
            text: "Partly or Doesn’t needs a line on how the element still gets answered: a Step 4 package or a named gap owner.",
            cite: "Coverage rule",
          },
        ],
      }
    : null;

  // ── Why ───────────────────────────────────────────────────────────────────
  const why = props.recommendation.trim();
  let whyRow: StepPageRow | null = null;
  const arguesFor = choice
    ? rationaleArguesFor(why, set, choice.optionId)
    : null;
  if (choice) {
    const editing = whyEdit !== null || !why;
    const text = whyEdit ?? props.recommendation;
    const save = () => {
      const next = text.trim();
      if (!next) return;
      props.onRecommendationChange(next);
      if (commit(confirmWhy(choice, next, props.decidedBy, props.today))) {
        setWhyEdit(null);
        setWhyFromNotes(null);
      }
    };
    whyRow = {
      id: "WHY",
      rank: 3,
      eyebrow: "Rationale",
      shortName: "why this option",
      subject: `Why option ${key}`,
      state:
        whyConfirmed && !editing ? "settled" : editing ? "decision" : "draft",
      clause: `say why option ${key}`,
      draftName: `why option ${key}`,
      facts: [{ kind: "team", text: "Carries to P4 with the choice" }],
      middle: editing ? (
        <div className={cx("field")}>
          <label className={cx("q-label")} htmlFor="why-text">
            Why this option
          </label>
          <textarea
            id="why-text"
            className={cx("q-input")}
            rows={3}
            value={text}
            onChange={(e) => setWhyEdit(e.target.value)}
          />
        </div>
      ) : whyConfirmed ? (
        <div>
          <p className={cx("proposal")}>{why}</p>
          <span className={cx("when-settled")}>
            Confirmed by{" "}
            {choice.whyConfirmedBy === props.decidedBy
              ? "you"
              : choice.whyConfirmedBy}
            , {shortDate(choice.whyConfirmedAt ?? "")}
          </span>
        </div>
      ) : (
        <div>
          <span className={cx("ava-badge")}>
            {whyFromNotes
              ? "Session notes · review"
              : "Your capture answer · review"}
          </span>
          <p className={cx("proposal")}>{why}</p>
          {whyFromNotes ? (
            <SourceLine
              source={{
                kind: "team",
                text: `From your notes, line${whyFromNotes.length > 1 ? "s" : ""} ${whyFromNotes.join(" and ")}`,
              }}
            />
          ) : null}
          {arguesFor ? (
            <p className={cx("warn-inline")} role="alert">
              Your capture answer argues for option {optionKey(arguesFor.id)};
              you chose {key}.
            </p>
          ) : null}
        </div>
      ),
      actions: editing ? (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!text.trim()}
            onClick={save}
          >
            Save
          </button>
          {whyEdit !== null ? (
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() => setWhyEdit(null)}
            >
              Cancel
            </button>
          ) : null}
        </>
      ) : whyConfirmed ? (
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => commit({ ok: true, value: reopenWhy(choice) })}
        >
          Reopen
        </button>
      ) : arguesFor ? (
        <button
          type="button"
          className={cx("btn-ink")}
          onClick={() => setWhyEdit(props.recommendation)}
        >
          Edit
        </button>
      ) : (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              commit(confirmWhy(choice, why, props.decidedBy, props.today)) &&
              setWhyFromNotes(null)
            }
          >
            Accept
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setWhyEdit(props.recommendation)}
          >
            Edit
          </button>
        </>
      ),
    };
  }

  const pageRows: StepPageRow[] = [
    ...evidence.rows,
    directionRow,
    ...(coverageRow ? [coverageRow] : []),
    ...(whyRow ? [whyRow] : []),
  ];
  if (refusal) {
    pageRows.unshift({
      id: "REFUSED",
      rank: -100,
      shortName: "refusal",
      eyebrow: "Not saved",
      subject: "That change was not made",
      state: "decision",
      clause: "dismiss the refused change",
      middle: (
        <p className={cx("proposal")} role="alert">
          {refusal}
        </p>
      ),
      actions: (
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => setRefusal(null)}
        >
          Dismiss
        </button>
      ),
    });
  }

  const nextAction = resolveStepNextAction({
    depth: "full",
    rows: pageRows,
    blockedBy: step1Done
      ? null
      : "Waiting on Step 1: not every root cause has a design element or an owned hand-off yet, so no option’s coverage can be judged",
    readySentence:
      "Direction chosen, every design element accounted for, and its reason confirmed. Continue to Operating & adoption",
    emptySentence: "Add the options the team brought",
  });

  const premarked =
    choice?.coverage.filter((c) => c.source === "option_text") ?? [];
  const briefing = [
    set.source === "move_uploaded_options"
      ? `I read the options as written in ${set.sourceTitle ?? "the team’s options"}.`
      : "The Move declared no options, so these are the template set.",
    choice
      ? premarked.length
        ? `Option ${key}’s own scope or benefit names ${premarked.map((c) => c.causeId).join(", ")}, so ${premarked.length === 1 ? "that is" : "those are"} pre-marked Covers for you to review. The rest are yours to judge; options are not scored.`
        : `Option ${key}’s own scope and benefit name none of the design elements, so nothing is pre-marked. Each one is yours to judge.`
      : "They are shown as the team wrote them: not scored, not ranked, none preselected. You choose.",
    "A choice here is the team’s working decision; the gate approver records it before any architecture is built.",
  ].join("\n\n");

  const fillFromNotes = () => {
    if (!choice) {
      setFillReply(
        "Choose a direction first. Notes never choose an option; they can supply why, and how an element still gets answered.",
      );
      return;
    }
    let next: ArchitectureChoice = choice;
    const filled: string[] = [];
    for (const p of proposeChoiceFromNotes(notes, {
      choice,
      recommendation: props.recommendation,
      elements,
    })) {
      if (p.kind === "why") {
        props.onRecommendationChange(p.value);
        setWhyFromNotes(p.sourceLines);
        setWhyEdit(null);
        filled.push(`why option ${key}`);
      } else {
        const element = elements.find((e) => e.causeId === p.causeId);
        if (!element) continue;
        const edit = explainCoverage(next, element, p.value);
        if (edit.ok) {
          next = edit.value;
          filled.push(`how ${element.short ?? element.causeId} gets answered`);
        }
      }
    }
    if (next !== choice) props.onChange(serializeArchitectureChoice(next));
    setFillReply(
      filled.length
        ? `I filled ${filled.join(", and ")} from your notes. ${filled.length > 1 ? "They are drafts" : "It is a draft"}; nothing is accepted.`
        : "Your notes add nothing for the empty fields on this step.",
    );
  };

  const notesPanel = notesOpen ? (
    <div className={cx("root")}>
      <div className={cx("warn-inline")}>
        <label className={cx("q-label")} htmlFor="ao-notes">
          Fill this step from your notes
        </label>
        <span className={cx("item-note")}>
          Notes are your account of a session, not approved evidence. aVa fills
          only empty fields: why the chosen option, and how a Partly or Doesn’t
          still gets answered. It never chooses an option or marks coverage.
        </span>
        <textarea
          id="ao-notes"
          className={cx("q-input")}
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <span className={cx("item-actions")}>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!notes.trim()}
            onClick={fillFromNotes}
          >
            Fill with aVa
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setNotesOpen(false)}
          >
            Close
          </button>
        </span>
        {fillReply ? <span role="status">{fillReply}</span> : null}
      </div>
    </div>
  ) : null;

  const page = (
    <MovesStepPage
      moveName={props.moveName}
      syntheticNote={props.syntheticNote}
      tabs={props.tabs}
      phases={props.phases}
      phaseCode="P3"
      phaseName="Design"
      steps={props.steps}
      stepIndex={props.stepIndex}
      title="Choose a direction"
      intro="Pick one of the options the team brought, as written, and say why. Step 4 and P4 size the choice; nothing here is bought or built."
      nextAction={nextAction}
      // A stable total: the direction, its coverage and its reason, counted
      // before the choice exists too (template v1.7).
      countLabel={`${[directionRow, coverageRow, whyRow].filter((r) => r?.state === "settled").length} of 3 settled`}
      blockedLink={{ label: "Open Step 1 →", href: props.step1Href }}
      blockedWork="The options will appear here once every root cause in Step 1 is settled. Your choice is kept."
      context={{
        items: step1Done
          ? [
              <b key="depth">Full depth</b>,
              set.source === "move_uploaded_options"
                ? (set.sourceTitle ?? "The team’s options")
                : "Template options",
              evidence.summary,
            ]
          : [<b key="depth">Full depth</b>],
        details: [],
      }}
      contextAction={step1Done ? evidence.uploadControl : undefined}
      rows={pageRows}
      carry={{
        label: "Carries to P4",
        text: choice
          ? ` Option ${key}, its coverage of each design element, and why.`
          : " The chosen option, as written, and why.",
      }}
      onBack={props.onBack}
      onContinue={props.onContinue}
    />
  );

  return props.frame
    ? props.frame(page, {
        briefing,
        actions: [
          {
            id: "fill-notes",
            label: "Fill this step from my notes",
            onClick: () => setNotesOpen(true),
          },
        ],
        notesPanel,
      })
    : page;
}
