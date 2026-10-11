"use client";

import { useMemo, useState, type ReactNode } from "react";
import { parseDiagnosisFacts } from "@/lib/programs/diagnosis-facts";
import { parseRootCauseRegister } from "@/lib/programs/root-cause-register";
import {
  acceptDesignElement,
  designHere,
  draftDesignElement,
  emptyDesignTraceability,
  handOffDesign,
  parseDesignTraceability,
  reopenDesign,
  serializeDesignTraceability,
  traceRows,
  type DesignTraceability,
  type TraceEdit,
  type TraceRow,
} from "@/lib/programs/design-traceability";
import { proposeDesignFromNotes } from "@/lib/programs/design-traceability-notes";
import {
  buildNextActionSentence,
  resolveStepNextAction,
} from "@/lib/programs/step-page-model";
import {
  MovesStepPage,
  SourceLine,
  type StepPagePhase,
  type StepPageRow,
  type StepPageStep,
} from "./MovesStepPage";
import type { StepAvaAction } from "./RootCausesStep";
import { useStepEvidence } from "./StepEvidence";
import type { PhaseCatchUp } from "@/lib/programs/phase-catch-up";
import styles from "./MovesStepPage.module.css";

/** "A", "A and B", "A, B and C" (inside one clause, so no serial comma). */
function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * P3 Step 1, "Map every root cause to a design element" (template v1.6).
 * Rows are P2's settled root causes in the consultant's rank; each needs one
 * design element that fixes it, or a hand-off to another program with a named
 * owner (an attestation the gate can check). The page writes the
 * `design_traceability` step record through the capture autosave.
 *
 * Filling from notes drafts an element or a hand-off owner for causes that
 * have nothing yet; nothing is accepted for the consultant.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

type Form =
  | { kind: "design"; causeId: string; text: string }
  | {
      kind: "handoff";
      causeId: string;
      program: string;
      owner: string;
      fromAva: boolean;
    };

export interface DesignTraceabilityStepProps {
  moveId: string;
  canReviewEvidence: boolean;
  onEvidenceChanged?: () => void;
  moveName: string;
  clientDisplayName: string;
  syntheticNote?: string;
  phases: readonly StepPagePhase[];
  steps: readonly StepPageStep[];
  stepIndex: number;
  tabs?: ReactNode;
  catchUp?: PhaseCatchUp | null;
  /** The saved `design_traceability` record. */
  value: string;
  onChange: (value: string) => void;
  /** P2's saved root causes and baseline. */
  p2RootCauses: string;
  p2Baseline: string;
  /** Where P2 Step 3 lives, for the blocked state's link. */
  p2StepHref: string;
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

export function DesignTraceabilityStep(props: DesignTraceabilityStepProps) {
  const trace =
    parseDesignTraceability(props.value) ?? emptyDesignTraceability();
  const rows = traceRows(props.p2RootCauses, trace);
  const p2 = parseRootCauseRegister(props.p2RootCauses);
  const shortOf = (causeId: string) =>
    p2?.causes.find((c) => c.id === causeId)?.short;
  const nameOf = (r: TraceRow) => {
    const short = shortOf(r.causeId);
    return short ? `${short} (${r.causeId})` : r.causeId;
  };
  const [form, setForm] = useState<Form | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [fillReply, setFillReply] = useState<string | null>(null);
  const facts = useMemo(
    () =>
      parseDiagnosisFacts(props.p2Baseline).filter((f) => f.metric && f.source),
    [props.p2Baseline],
  );
  const evidence = useStepEvidence({
    uploadLabel: "Add session output",
    moveId: props.moveId,
    phase: 3,
    canReview: props.canReviewEvidence,
    onEvidenceChanged: props.onEvidenceChanged,
  });

  const commit = (edit: TraceEdit) => {
    if (!edit.ok) {
      setRefusal(edit.reason);
      return false;
    }
    setRefusal(null);
    props.onChange(serializeDesignTraceability(edit.value));
    return true;
  };

  const fillFromNotes = () => {
    let next: DesignTraceability = trace;
    const filled: string[] = [];
    for (const p of proposeDesignFromNotes(notes, rows)) {
      const r = rows.find((x) => x.causeId === p.causeId);
      if (!r) continue;
      if (p.kind === "element") {
        // The words are the team's, verbatim from their notes, so the draft
        // is badged as session notes and cites the line (template v1.7).
        const drafted = draftDesignElement(
          next,
          r,
          p.value,
          "team",
          `From your notes, line ${p.sourceLine}`,
        );
        if (drafted.ok) {
          next = drafted.value;
          filled.push(`a design element for ${nameOf(r)}`);
        }
      } else {
        setForm({
          kind: "handoff",
          causeId: r.causeId,
          program: p.program ?? "",
          owner: p.value,
          fromAva: true,
        });
        filled.push(`the hand-off owner for ${nameOf(r)}, in its form`);
      }
    }
    if (next !== trace) props.onChange(serializeDesignTraceability(next));
    setFillReply(
      filled.length
        ? `I filled ${filled.join(", and ")}. ${filled.length > 1 ? "They are drafts" : "It is a draft"}; nothing is accepted.`
        : "Your notes add nothing new for the open causes on this step.",
    );
  };

  const toRow = (r: TraceRow): StepPageRow => {
    const fact = facts.find((f) => f.metric === r.drives);
    const link = r.link;
    const editing = form && form.causeId === r.causeId ? form : null;
    let middle: ReactNode;
    let actions: ReactNode = null;
    let state: StepPageRow["state"];
    if (editing?.kind === "design") {
      state = "decision";
      middle = (
        <div className={cx("field")}>
          <label className={cx("q-label")} htmlFor={`de-${r.causeId}`}>
            Design element
          </label>
          <textarea
            id={`de-${r.causeId}`}
            className={cx("q-input")}
            rows={3}
            value={editing.text}
            placeholder="e.g. Probabilistic member matching across EHR and claims, with a steward queue for low-confidence matches"
            onChange={(e) => setForm({ ...editing, text: e.target.value })}
          />
        </div>
      );
      actions = (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!editing.text.trim()}
            onClick={() => {
              if (
                commit(
                  designHere(
                    trace,
                    r,
                    editing.text,
                    props.decidedBy,
                    props.today,
                  ),
                )
              )
                setForm(null);
            }}
          >
            Accept
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </>
      );
    } else if (editing?.kind === "handoff") {
      state = "decision";
      middle = (
        <div>
          <p className={cx("form-note")}>
            A hand-off is recorded as an attestation with a named owner, so the
            gate can check it.
          </p>
          <div className={cx("field")}>
            <label className={cx("q-label")} htmlFor={`hp-${r.causeId}`}>
              Program
            </label>
            <input
              id={`hp-${r.causeId}`}
              className={cx("q-input")}
              value={editing.program}
              placeholder="e.g. Master-data program"
              onChange={(e) =>
                setForm({ ...editing, program: e.target.value, fromAva: false })
              }
            />
          </div>
          <div className={cx("field")}>
            <label className={cx("q-label")} htmlFor={`ho-${r.causeId}`}>
              Owner{" "}
              {editing.fromAva ? (
                <span className={cx("ava-badge")}>Session notes · review</span>
              ) : null}
            </label>
            <input
              id={`ho-${r.causeId}`}
              className={cx("q-input")}
              value={editing.owner}
              placeholder="e.g. Master-data program lead"
              onChange={(e) =>
                setForm({ ...editing, owner: e.target.value, fromAva: false })
              }
            />
          </div>
        </div>
      );
      actions = (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!editing.owner.trim() || !editing.program.trim()}
            onClick={() => {
              if (
                commit(
                  handOffDesign(
                    trace,
                    r,
                    editing.program,
                    editing.owner,
                    props.decidedBy,
                    props.today,
                  ),
                )
              ) {
                setForm(null);
              }
            }}
          >
            Record hand-off
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </>
      );
    } else if (!link) {
      state = "decision";
      middle = (
        <p className={cx("proposal")}>
          <span className={cx("lead")}>No design element yet.</span> Design it
          here, or hand it to the program that owns it.
        </p>
      );
      actions = (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              setForm({ kind: "design", causeId: r.causeId, text: "" })
            }
          >
            Design it here
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() =>
              // A cause P2 carried as a known gap already has an owner;
              // the hand-off starts from it for the consultant to confirm.
              setForm({
                kind: "handoff",
                causeId: r.causeId,
                program: "",
                owner: r.p2KnownGapOwner ?? "",
                fromAva: false,
              })
            }
          >
            Hand off…
          </button>
        </>
      );
    } else if (link.status === "draft") {
      state = "draft";
      middle = (
        <div>
          <span className={cx("ava-badge")}>
            {link.source === "ava"
              ? "Ava draft · review"
              : "Session notes · review"}
          </span>
          <p className={cx("proposal")}>{link.element}</p>
          {link.citation ? (
            <SourceLine source={{ kind: "team", text: link.citation }} />
          ) : null}
        </div>
      );
      actions = (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              commit(
                acceptDesignElement(
                  trace,
                  r.causeId,
                  props.decidedBy,
                  props.today,
                ),
              )
            }
          >
            Accept
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() =>
              setForm({
                kind: "design",
                causeId: r.causeId,
                text: link.element ?? "",
              })
            }
          >
            Edit
          </button>
        </>
      );
    } else {
      state = "settled";
      middle = (
        <div>
          <p className={cx("proposal")}>
            {link.status === "handed_off"
              ? `Handed to the ${link.program}`
              : link.element}
          </p>
          <span className={cx("when-settled")}>
            {link.status === "handed_off"
              ? `Hand-off attested by ${link.owner}${link.decidedAt ? `, ${shortDate(link.decidedAt)}` : ""}`
              : `Accepted by ${link.decidedBy === props.decidedBy ? "you" : (link.decidedBy ?? "the team")}${link.decidedAt ? `, ${shortDate(link.decidedAt)}` : ""}`}
          </span>
        </div>
      );
      actions = (
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => commit(reopenDesign(trace, r.causeId))}
        >
          Reopen
        </button>
      );
    }
    return {
      id: r.causeId,
      rank: r.rank,
      subject: r.cause,
      shortName: shortOf(r.causeId) ?? r.causeId,
      state,
      clause: `design ${nameOf(r)} here or hand it off`,
      draftName: `the ${nameOf(r)} draft`,
      facts: [
        ...(r.p2KnownGapOwner
          ? [
              {
                kind: "team" as const,
                text: `P2: carried as a known gap · owner ${r.p2KnownGapOwner}`,
              },
            ]
          : []),
        ...(fact
          ? [
              {
                kind: "fact" as const,
                text: `Baseline: ${fact.metric.charAt(0).toLowerCase()}${fact.metric.slice(1)}, ${fact.value}`,
                cite: fact.source,
              },
            ]
          : [
              {
                kind: "team" as const,
                text: "No baseline number in P2",
              },
            ]),
      ],
      middle,
      actions,
    };
  };

  const pageRows: StepPageRow[] = [...evidence.rows, ...rows.map(toRow)];
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
    blockedBy:
      rows.length === 0
        ? props.catchUp?.items.length
          ? `Discover has ${props.catchUp.items.length} item${props.catchUp.items.length === 1 ? "" : "s"} to confirm`
          : "Waiting on P2: no root cause is settled there yet, so there is nothing to design for"
        : null,
    readySentence:
      "Every root cause has a design element or an owned hand-off, and none is orphaned. Continue to Architecture options",
    emptySentence: "Add the design session output",
  });

  // One verb, one clause (template v1.7): every cause still to design reads
  // "design or hand off identity (RC-4) and PHI access (RC-5)", ahead of the
  // drafts, rather than repeating the verb per cause.
  const open = rows.filter(
    (r) => !r.link && !(form && form.causeId === r.causeId),
  );
  const sentence =
    nextAction.state === "in_progress" && open.length > 1
      ? buildNextActionSentence([
          ...pageRows.filter(
            (row) =>
              row.state !== "decision" ||
              !open.some((r) => r.causeId === row.id),
          ),
          {
            id: "OPEN-CAUSES",
            rank: open[0].rank,
            subject: "",
            state: "decision",
            clause: `design or hand off ${listNames(open.map(nameOf))}`,
          },
        ])
      : null;
  const shownAction = sentence ? { ...nextAction, sentence } : nextAction;

  const briefing = [
    "I read P2's settled root causes, in your order.",
    rows.some((r) => !r.link)
      ? `${rows
          .filter((r) => !r.link)
          .map((r) => r.causeId)
          .join(
            ", ",
          )} ${rows.filter((r) => !r.link).length === 1 ? "has" : "have"} no design element yet.`
      : null,
    "Every design element answers a root cause, so none can be orphaned.",
    "Drafts stay drafts until you accept them. I don't write figures.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const notesPanel = notesOpen ? (
    <div className={cx("root")}>
      <div className={cx("warn-inline")}>
        <label className={cx("q-label")} htmlFor="dt-notes">
          Fill this step from your notes
        </label>
        <span className={cx("item-note")}>
          Notes are your account of a session, not approved evidence. aVa drafts
          design elements and hand-off owners for causes that have nothing yet,
          and never accepts them.
        </span>
        <textarea
          id="dt-notes"
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
      catchUp={rows.length === 0 ? props.catchUp : null}
      phaseCode="P3"
      phaseName="Design"
      steps={props.steps}
      stepIndex={props.stepIndex}
      title="Map every root cause to a design element"
      intro="Each P2 root cause needs one design element that fixes it, and each design element needs a root cause that justifies it."
      nextAction={shownAction}
      blockedLink={
        props.catchUp?.items.length
          ? undefined
          : { label: "Open P2 Discover →", href: props.p2StepHref }
      }
      blockedItems={rows.length === 0 ? props.catchUp?.items : undefined}
      blockedWork="The root causes from P2 will appear here once Discover settles them. Your design elements are kept."
      context={{
        items:
          rows.length === 0
            ? [<b key="depth">Full depth</b>]
            : [<b key="depth">Full depth</b>, evidence.summary],
        details: [],
      }}
      contextAction={rows.length === 0 ? undefined : evidence.uploadControl}
      rows={pageRows}
      carry={{
        label: "Carries to Step 2",
        text: " Each design element, in this order, is what the architecture options must cover.",
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
