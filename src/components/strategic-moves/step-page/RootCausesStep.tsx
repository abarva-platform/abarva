"use client";

import { useMemo, useState, type ReactNode } from "react";
import { parseDiagnosisFacts } from "@/lib/programs/diagnosis-facts";
import {
  rankedRootCauses,
  serializeRootCauseRegister,
  type RootCauseEntry,
  type RootCauseRegister,
} from "@/lib/programs/root-cause-register";
import {
  acceptRootCause,
  addRootCause,
  confirmRootCauseOrder,
  editRootCause,
  markEvidenceInReview,
  moveRootCause,
  promoteSymptom,
  readRootCauseValue,
  registerFromEarlierAnswer,
  reopenRootCause,
  resolveRootCauseStep,
  resolveRootCauseWithOwner,
  setAsideAsSymptom,
  type NewRootCause,
  type RootCauseEdit,
} from "@/lib/programs/root-cause-step";
import { proposeRootCausesFromNotes } from "@/lib/programs/root-cause-notes";
import { useStepEvidence } from "./StepEvidence";
import {
  MovesStepPage,
  SourceLine,
  type StepPagePhase,
  type StepPageRow,
  type StepPageStep,
} from "./MovesStepPage";
import styles from "./MovesStepPage.module.css";

/**
 * P2 Step 3, "Rank what's causing the gap" (template v1.4). The page edits
 * the root-cause register stored in the `gaps_root_causes` answer; the host
 * persists every change through its existing capture autosave.
 *
 * The order is the consultant's. A cause is accepted only on approved
 * evidence, or resolved without it by a named owner. Filling from notes adds
 * drafts — a candidate at the bottom, an owner pre-filled in its form — and
 * never ranks, accepts or overwrites what the consultant typed.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

export interface ApprovedEvidenceOption {
  id: string;
  title: string;
}

/** A dock suggested action the step offers aVa. */
export interface StepAvaAction {
  id: string;
  label: string;
  onClick: () => void;
}

export interface RootCausesStepProps {
  moveId: string;
  /** Whether this viewer may approve or reject an uploaded extraction. */
  canReviewEvidence: boolean;
  /** An approved upload changed what counts as evidence; re-read it. */
  onEvidenceChanged?: () => void;
  moveName: string;
  clientDisplayName: string;
  syntheticNote?: string;
  phases: readonly StepPagePhase[];
  steps: readonly StepPageStep[];
  stepIndex: number;
  tabs?: ReactNode;
  /** The saved `gaps_root_causes` answer. */
  value: string;
  /** Persist a new answer through the host's capture autosave. */
  onChange: (value: string) => void;
  /** The P2 baseline answer, whose facts a cause can drive. */
  baselineValue: string;
  approvedEvidence: readonly ApprovedEvidenceOption[];
  /** Who is deciding, for provenance. */
  decidedBy: string;
  /** Today's date for provenance, e.g. "2026-10-02". */
  today: string;
  /** An outside cause the step waits on (the baseline reopened). */
  blockedBy?: string | null;
  onBack?: () => void;
  onContinue?: () => void;
  /** Wraps the page in the product's aVa dock. */
  frame?: (
    page: ReactNode,
    dock: { briefing: string; actions: StepAvaAction[]; notesPanel: ReactNode },
  ) => ReactNode;
}

type Form =
  | { kind: "add"; draft: NewRootCause }
  | { kind: "edit"; id: string; draft: NewRootCause }
  | { kind: "resolve"; id: string; owner: string; fromAva: boolean };

const SOURCE_BADGE: Record<NonNullable<RootCauseEntry["source"]>, string> = {
  ava: "Ava draft · review",
  team: "Session notes · review",
  legacy: "Earlier answer · review",
};

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

export function RootCausesStep(props: RootCausesStepProps) {
  const { kind, register } = readRootCauseValue(props.value);
  const [form, setForm] = useState<Form | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [fillReply, setFillReply] = useState<string | null>(null);

  const facts = useMemo(
    () =>
      parseDiagnosisFacts(props.baselineValue).filter(
        (f) => f.metric && f.source,
      ),
    [props.baselineValue],
  );
  const factFor = (metric?: string) => facts.find((f) => f.metric === metric);

  const commit = (edit: RootCauseEdit) => {
    if (!edit.ok) {
      setRefusal(edit.reason);
      return false;
    }
    setRefusal(null);
    props.onChange(serializeRootCauseRegister(edit.register));
    return true;
  };

  const evidence = useStepEvidence({
    moveId: props.moveId,
    phase: 2,
    canReview: props.canReviewEvidence,
    onEvidenceChanged: props.onEvidenceChanged,
  });
  const model = resolveRootCauseStep(props.value, {
    blockedBy: props.blockedBy,
    leadingClauses: evidence.clauses,
    evidenceInReview: evidence.pendingLabels,
  });
  const ranked = rankedRootCauses(register);
  const setAside = register.causes.filter(
    (c) => c.status === "symptom" || c.status === "out_of_scope",
  );

  const fillFromNotes = () => {
    const proposals = proposeRootCausesFromNotes(notes, register);
    let next: RootCauseRegister = register;
    const filled: string[] = [];
    const left: string[] = [];
    for (const p of proposals) {
      if (p.kind === "cause") {
        const added = addRootCause(
          next,
          { cause: p.value },
          props.decidedBy,
          props.today,
        );
        if (added.ok) {
          const entry = added.register.causes[added.register.causes.length - 1];
          next = {
            ...added.register,
            causes: added.register.causes.map((c) =>
              c.id === entry.id ? { ...c, source: "team" as const } : c,
            ),
          };
          filled.push(
            `a new candidate cause (${entry.id}) at the bottom of your ranking`,
          );
        }
      } else if (p.causeId) {
        const typed =
          form?.kind === "resolve" &&
          form.id === p.causeId &&
          !form.fromAva &&
          form.owner.trim();
        if (typed) {
          left.push(
            `the owner for ${p.causeId} alone because you had typed one`,
          );
        } else {
          setForm({
            kind: "resolve",
            id: p.causeId,
            owner: p.value,
            fromAva: true,
          });
          filled.push(`the owner for ${p.causeId}, in its resolve form`);
        }
      }
    }
    if (next !== register) props.onChange(serializeRootCauseRegister(next));
    setFillReply(
      [
        filled.length
          ? `I filled ${filled.join(", and ")}. ${filled.length > 1 ? "They are drafts" : "It is a draft"}; nothing is accepted, and I don't rank.`
          : "Your notes add nothing new for the open fields on this step.",
        left.length ? `I left ${left.join(" and ")}.` : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  };

  const evidenceLines = (c: RootCauseEntry) => (
    <>
      {c.evidence?.length ? (
        <SourceLine
          source={{
            kind: "team",
            text: `Approved evidence: ${c.evidence.join("; ")}`,
          }}
        />
      ) : null}
      {c.confidence ? (
        <SourceLine
          source={{ kind: "team", text: `Confidence: ${c.confidence}` }}
        />
      ) : null}
    </>
  );

  const causeForm = (
    draft: NewRootCause,
    onSave: (d: NewRootCause) => void,
    label: string,
    /** For an existing cause: offer uploading a new file for it. */
    causeId?: string,
  ) => (
    <div>
      <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor="rc-cause">
          Cause
        </label>
        <textarea
          id="rc-cause"
          className={cx("q-input")}
          rows={2}
          value={draft.cause}
          placeholder="e.g. Metric definitions conflict across source systems"
          onChange={(e) =>
            setForm((f) =>
              f && f.kind !== "resolve"
                ? { ...f, draft: { ...f.draft, cause: e.target.value } }
                : f,
            )
          }
        />
      </div>
      <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor="rc-short">
          Short name
        </label>
        <input
          id="rc-short"
          className={cx("q-input")}
          value={draft.short ?? ""}
          placeholder="e.g. identity"
          onChange={(e) =>
            setForm((f) =>
              f && f.kind !== "resolve"
                ? { ...f, draft: { ...f.draft, short: e.target.value } }
                : f,
            )
          }
        />
      </div>
      <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor="rc-drives">
          Baseline number it drives
        </label>
        <select
          id="rc-drives"
          className={cx("q-input")}
          value={draft.drives ?? ""}
          onChange={(e) =>
            setForm((f) =>
              f && f.kind !== "resolve"
                ? {
                    ...f,
                    draft: { ...f.draft, drives: e.target.value || undefined },
                  }
                : f,
            )
          }
        >
          <option value="">Not linked yet</option>
          {facts.map((f) => (
            <option key={f.metric} value={f.metric}>
              {f.metric}
            </option>
          ))}
        </select>
      </div>
      <fieldset className={cx("field")}>
        <legend className={cx("q-label")}>Approved evidence it rests on</legend>
        {causeId ? (
          <button
            type="button"
            className={cx("link-btn", "inline")}
            onClick={() =>
              evidence.pickFor((label) => {
                commit(markEvidenceInReview(register, causeId, label));
                setForm(null);
              })
            }
          >
            Or upload a new file for this cause…
          </button>
        ) : null}
        {props.approvedEvidence.length === 0 ? (
          <span className={cx("item-note")}>
            No approved evidence yet. Without it, the cause is resolved by a
            named owner instead.
          </span>
        ) : (
          props.approvedEvidence.map((ev) => (
            <label key={ev.id} className={cx("item-note")}>
              <input
                type="checkbox"
                checked={draft.evidence?.includes(ev.title) ?? false}
                onChange={(e) =>
                  setForm((f) => {
                    if (!f || f.kind === "resolve") return f;
                    const current = f.draft.evidence ?? [];
                    const evidence = e.target.checked
                      ? [...current, ev.title]
                      : current.filter((t) => t !== ev.title);
                    return { ...f, draft: { ...f.draft, evidence } };
                  })
                }
              />{" "}
              {ev.title}
            </label>
          ))
        )}
      </fieldset>
      <span className={cx("item-actions")}>
        <button
          type="button"
          className={cx("btn-ink")}
          disabled={!draft.cause.trim()}
          onClick={() => onSave(draft)}
        >
          {label}
        </button>
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => setForm(null)}
        >
          Cancel
        </button>
      </span>
    </div>
  );

  const rankRow = (c: RootCauseEntry, index: number): StepPageRow => {
    const fact = factFor(c.drives);
    // A file uploaded for this cause that is still awaiting review.
    const reviewRowId = c.evidenceInReview
      ? evidence.rowIdFor(c.evidenceInReview)
      : null;
    const resolving =
      form?.kind === "resolve" && form.id === c.id ? form : null;
    const editing = form?.kind === "edit" && form.id === c.id ? form : null;
    const moves = (
      <span className={cx("rank-ctl")}>
        <button
          type="button"
          className={cx("link-btn")}
          disabled={index === 0}
          onClick={() => commit(moveRootCause(register, c.id, "up"))}
        >
          Move up
        </button>
        <button
          type="button"
          className={cx("link-btn")}
          disabled={index === ranked.length - 1}
          onClick={() => commit(moveRootCause(register, c.id, "down"))}
        >
          Move down
        </button>
      </span>
    );
    let middle: ReactNode;
    let actions: ReactNode;
    if (resolving) {
      middle = (
        <div>
          <p className={cx("form-note")}>
            Resolving without evidence needs a named owner, so the gate can
            check it.
          </p>
          <div className={cx("field")}>
            <label className={cx("q-label")} htmlFor={`own-${c.id}`}>
              Owner{" "}
              {resolving.fromAva ? (
                <span className={cx("ava-badge")}>Ava draft · review</span>
              ) : null}
            </label>
            <input
              id={`own-${c.id}`}
              className={cx("q-input")}
              value={resolving.owner}
              placeholder="e.g. Master-data program lead"
              onChange={(e) =>
                setForm({
                  kind: "resolve",
                  id: c.id,
                  owner: e.target.value,
                  fromAva: false,
                })
              }
            />
          </div>
        </div>
      );
      actions = (
        <>
          {(["known_gap", "out_of_scope"] as const).map((resolution) => (
            <button
              key={resolution}
              type="button"
              className={cx("btn-line")}
              disabled={!resolving.owner.trim()}
              onClick={() => {
                if (
                  commit(
                    resolveRootCauseWithOwner(
                      register,
                      c.id,
                      resolution,
                      resolving.owner,
                      props.decidedBy,
                      props.today,
                    ),
                  )
                )
                  setForm(null);
              }}
            >
              {resolution === "known_gap"
                ? "Carry as a known gap"
                : "Rule out of scope"}
            </button>
          ))}
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </>
      );
    } else if (editing) {
      middle = causeForm(
        editing.draft,
        (d) => {
          if (commit(editRootCause(register, c.id, d))) setForm(null);
        },
        "Save",
        c.id,
      );
      actions = null;
    } else if (c.status === "no_evidence") {
      middle = reviewRowId ? (
        <p className={cx("proposal")}>
          <span className={cx("lead")}>
            Evidence in review: {c.evidenceInReview}.
          </span>{" "}
          <a href={`#row-${reviewRowId}`}>Review the file</a>
        </p>
      ) : (
        <p className={cx("proposal")}>
          <span className={cx("lead")}>No approved evidence.</span> Add the
          evidence it rests on, or resolve it with a named owner.
        </p>
      );
      actions = (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              setForm({
                kind: "edit",
                id: c.id,
                draft: {
                  cause: c.cause,
                  short: c.short,
                  drives: c.drives,
                  evidence: c.evidence,
                  confidence: c.confidence,
                },
              })
            }
          >
            Add evidence…
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() =>
              setForm({ kind: "resolve", id: c.id, owner: "", fromAva: false })
            }
          >
            Resolve with an owner…
          </button>
          {moves}
        </>
      );
    } else if (c.status === "draft") {
      middle = (
        <div>
          <span className={cx("ava-badge")}>
            {SOURCE_BADGE[c.source ?? "ava"]}
          </span>
          {evidenceLines(c)}
        </div>
      );
      actions = (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              commit(
                acceptRootCause(register, c.id, props.decidedBy, props.today),
              )
            }
          >
            Accept
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => commit(setAsideAsSymptom(register, c.id))}
          >
            Set aside
          </button>
          {moves}
        </>
      );
    } else {
      middle = (
        <div>
          {evidenceLines(c)}
          <span className={cx("when-settled")}>
            {c.status === "known_gap"
              ? `Carried as a known gap; owner ${c.owner}`
              : `Accepted by ${c.decidedBy === props.decidedBy ? "you" : (c.decidedBy ?? "the team")}${c.decidedAt ? `, ${shortDate(c.decidedAt)}` : ""}`}
          </span>
        </div>
      );
      actions = (
        <>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => commit(reopenRootCause(register, c.id))}
          >
            Reopen
          </button>
          {moves}
        </>
      );
    }
    return {
      id: c.id,
      rank: index,
      eyebrow: `Rank ${String(index + 1).padStart(2, "0")} · ${c.id}`,
      subject: c.cause,
      shortName: c.cause,
      state: "ranked",
      facts: fact
        ? [
            {
              kind: "fact",
              text: `Baseline: ${fact.metric.charAt(0).toLowerCase()}${fact.metric.slice(1)}, ${fact.value}`,
              cite: fact.source,
            },
          ]
        : [{ kind: "team", text: "Not linked to a baseline number yet" }],
      middle,
      actions,
    };
  };

  const rows: StepPageRow[] = [...evidence.rows];
  if (refusal) {
    rows.push({
      id: "REFUSED",
      rank: -1,
      shortName: "refusal",
      eyebrow: "Not saved",
      subject: "That change was not made",
      state: "decision",
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
  if (kind === "earlier_answer") {
    rows.push({
      id: "EARLIER",
      rank: 0,
      shortName: "earlier answer",
      eyebrow: "Earlier answer",
      subject: "Your earlier answer is free text",
      state: "decision",
      facts: [
        {
          kind: "team",
          text: "Each line becomes a draft cause; nothing is lost or accepted",
        },
      ],
      middle: <p className={cx("proposal")}>{props.value}</p>,
      actions: (
        <button
          type="button"
          className={cx("btn-ink")}
          onClick={() =>
            props.onChange(
              serializeRootCauseRegister(
                registerFromEarlierAnswer(props.value),
              ),
            )
          }
        >
          Turn into ranked causes
        </button>
      ),
    });
  }
  if (kind === "empty" && form?.kind !== "add") {
    rows.push({
      id: "FIRST",
      rank: 0,
      shortName: "first cause",
      eyebrow: "Root causes",
      subject: "No causes yet",
      state: "decision",
      facts: [
        {
          kind: "team",
          text: "Add them yourself, or fill this step from your notes",
        },
      ],
      middle: (
        <p className={cx("proposal")}>
          Each cause should drive a baseline number and rest on approved
          evidence.
        </p>
      ),
      actions: (
        <button
          type="button"
          className={cx("btn-ink")}
          onClick={() => setForm({ kind: "add", draft: { cause: "" } })}
        >
          Add a cause
        </button>
      ),
    });
  }
  if (form?.kind === "add") {
    rows.push({
      id: "ADD",
      rank: 1,
      shortName: "new cause",
      eyebrow: "New cause",
      subject: "Add a cause",
      state: "decision",
      wide: true,
      middle: causeForm(
        form.draft,
        (d) => {
          if (commit(addRootCause(register, d, props.decidedBy, props.today)))
            setForm(null);
        },
        "Add to the ranking",
      ),
    });
  }
  rows.push(...ranked.map(rankRow));
  rows.push(
    ...setAside.map(
      (c, index): StepPageRow => ({
        id: c.id,
        rank: 100 + index,
        shortName: c.cause,
        eyebrow: c.status === "symptom" ? "Symptom" : c.id,
        subject: c.cause,
        state: "set_aside",
        facts: [
          {
            kind: "team",
            text:
              c.status === "symptom"
                ? c.symptomOf
                  ? `Symptom of ${c.symptomOf}`
                  : "Set aside as a symptom"
                : `Ruled out of scope; owner ${c.owner}`,
          },
        ],
        middle: (
          <p className={cx("proposal")}>
            Set aside: it describes an effect, not a cause.
          </p>
        ),
        actions:
          c.status === "symptom" ? (
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() => commit(promoteSymptom(register, c.id))}
            >
              Promote to a cause
            </button>
          ) : (
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() => commit(reopenRootCause(register, c.id))}
            >
              Reopen
            </button>
          ),
      }),
    ),
  );

  const rankingFoot = (
    <>
      <span>
        {register.orderConfirmedAt
          ? `Order confirmed by ${register.orderConfirmedBy === props.decidedBy ? "you" : register.orderConfirmedBy}, ${shortDate(register.orderConfirmedAt)}`
          : "The order is yours. aVa has not ranked these."}
      </span>
      <span className={cx("item-actions")}>
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => setForm({ kind: "add", draft: { cause: "" } })}
        >
          Add a cause
        </button>
        {register.orderConfirmedAt || ranked.length === 0 ? null : (
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              commit(
                confirmRootCauseOrder(register, props.decidedBy, props.today),
              )
            }
          >
            Confirm this order
          </button>
        )}
      </span>
    </>
  );

  const briefing = [
    `I read the baseline and ${props.approvedEvidence.length === 0 ? "found no approved evidence yet" : "the approved evidence for this phase"}.`,
    ranked.some((c) => c.status === "no_evidence")
      ? `I couldn't find approved evidence for ${ranked
          .filter((c) => c.status === "no_evidence")
          .map((c) => c.id)
          .join(", ")}. Add it, or resolve each with a named owner.`
      : null,
    "I haven't ranked anything. The order is yours.",
    "Drafts stay drafts until you accept them. I don't write figures.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const notesPanel = notesOpen ? (
    <div className={cx("root")}>
      <div className={cx("warn-inline")}>
        <label className={cx("q-label")} htmlFor="rc-notes">
          Fill this step from your notes
        </label>
        <span className={cx("item-note")}>
          Notes are your account of a conversation, not approved evidence. aVa
          adds drafts, never accepts them, and leaves what you typed alone.
        </span>
        <textarea
          id="rc-notes"
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
      clientDisplayName={props.clientDisplayName}
      syntheticNote={props.syntheticNote}
      tabs={props.tabs}
      phases={props.phases}
      phaseCode="P2"
      phaseName="Discover"
      steps={props.steps}
      stepIndex={props.stepIndex}
      title="Rank what’s causing the gap"
      intro="Each cause must drive a baseline number and rest on approved evidence. The order is yours: accepted causes, in this order, become Design’s starting rows."
      nextAction={model.nextAction}
      checks={model.checks.map((check) => ({
        met: check.met,
        level: check.level,
        text: check.text,
        note: check.note,
        targetRowId: check.targetRowId,
      }))}
      checksLabel="Show checks"
      contextAction={evidence.uploadControl}
      countLabel={model.countLabel}
      context={{
        items: [<b key="depth">Full depth</b>, evidence.summary],
        details: [
          {
            term: "Depth",
            detail: (
              <span>
                <b>Full.</b> Every candidate cause is tied to a baseline number
                and approved evidence.
              </span>
            ),
          },
        ],
      }}
      blockedWork="Candidate causes will appear here once the baseline is approved again. Your order and accepted causes are kept."
      rows={rows}
      rankingFoot={rankingFoot}
      carry={{
        label: "Carries to P3",
        text: " Accepted causes, in this order, become Design Step 1’s rows.",
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
