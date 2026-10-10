"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  acceptOwners,
  addTeamRow,
  CAPTURE_TEXT_ROWS,
  canAcceptOwners,
  chooseOwner,
  commitAnswer,
  DECISION_RIGHTS,
  dismissRouteFlag,
  emptyOperatingAdoption,
  markRight,
  missingOwnerCount,
  nameTeamRow,
  openRouteFlag,
  operatingAdoptionNextAction,
  operatingAdoptionRows,
  ownerGrid,
  ownersSettled,
  parseOperatingAdoption,
  removeTeamRow,
  reopenAnswer,
  reopenBaselineOwner,
  reopenOwners,
  ROW_IDS,
  saveBaselineOwner,
  serializeOperatingAdoption,
  textRowState,
  type CaptureTextRow,
  type GridRow,
  type OperatingAdoption,
  type OperatingEdit,
  type StepWrite,
  type StepWriteResult,
  type WorkProfile,
} from "@/lib/programs/operating-adoption";
import { fillFromNotes } from "@/lib/programs/operating-adoption-notes";
import {
  emptyDesignTraceability,
  parseDesignTraceability,
} from "@/lib/programs/design-traceability";
import {
  resolveChangeProfile,
  type ChangeProfile,
} from "@/lib/programs/phase-workflow-registry";
import { parseRootCauseRegister } from "@/lib/programs/root-cause-register";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";
import {
  relianceLine,
  rowsStepReliesOn,
  type RelianceRow,
} from "@/lib/programs/assumption-register/step-reliance";
import { CONFIDENCE_LEVEL_BY_SCORE } from "@/lib/programs/assumption-register/model";
import {
  Disclosure,
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
 * P3 Step 3, "Name the owners and describe the change" (template v1.10, Claude
 * Design review 6). Depth is never set here: it is read from the change
 * profile of the route confirmed in P2, shown with its source, and the only
 * way to change it is `Re-check the P2 route →`.
 *
 * - technical: Skipped. The business-change boundary attestation stands in,
 *   naming the route's adoption owner; Continue is enabled.
 * - limited / full: the owners grid (Step 1's accepted design elements plus
 *   the team's rows, owners chosen from the Move's people), two capture-text
 *   rows that write the team's words as plain text to their capture answers,
 *   and who receives the baseline. No figure on this page is ours: each is a
 *   FACT with a source or an ESTIMATE citing an Assumptions register row, and
 *   no money appears here.
 *
 * When notes read as a heavier change than the route, an Advisory row says so
 * and offers the route; it never blocks and is never counted.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

const DEPTH_WORD: Readonly<Record<ChangeProfile, string>> = {
  technical: "Skipped",
  limited: "Light",
  full: "Full",
};

/** The register area this step reads (adoption) and its own step id. */
const RELIANCE = { stepId: "P3.3", areas: ["adoption"] as const };

export interface OperatingAdoptionPerson {
  name: string;
  role: string;
}

export interface OperatingAdoptionStepProps {
  moveId: string;
  canReviewEvidence: boolean;
  onEvidenceChanged?: () => void;
  moveName: string;
  syntheticNote?: string;
  phases: readonly StepPagePhase[];
  steps: readonly StepPageStep[];
  stepIndex: number;
  tabs?: ReactNode;
  /** The saved `operating_adoption` record. */
  value: string;
  onChange: (value: string) => void;
  /** This Move's capture answers, by key (the page reads its profile's). */
  answers: Readonly<Record<string, string>>;
  onAnswerChange: (key: string, value: string) => void;
  /** Capture answers that hold an unsaved aVa draft, not the team's words. */
  avaDraftKeys?: readonly string[];
  /** The route confirmed in P2; it alone decides this step's depth. */
  route: ConfirmedSolutionRoute | null;
  /** Where P2's route validation lives: the only way depth changes. */
  p2RouteHref: string;
  /** The Move's people: its sponsor and participants. */
  people: readonly OperatingAdoptionPerson[];
  /** P2's root causes and Step 1's traceability, for the design elements. */
  p2RootCauses: string;
  designTraceability: string;
  /** Step 2 is settled (the host's `recordStepDone["P3.2"]`). */
  step2Done: boolean;
  step2Href: string;
  /**
   * The Move's id for the assumptions register read, when
   * `moves_assumption_register_v1` is on; null when it is off.
   */
  registerProgramId: string | null;
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
  const date = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
}

type Reliance =
  | { state: "off" | "loading" }
  | { state: "failed" }
  | { state: "ready"; rows: RelianceRow[]; moneyLeftOut: number };

/** The register rows this step relies on, read through the register's own GET. */
function useReliance(programId: string | null): Reliance {
  const [state, setState] = useState<Reliance>(
    programId ? { state: "loading" } : { state: "off" },
  );
  useEffect(() => {
    if (!programId) {
      setState({ state: "off" });
      return;
    }
    let live = true;
    setState({ state: "loading" });
    fetch(`/api/v1/programs/${encodeURIComponent(programId)}/assumptions`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as {
          assumptions?: unknown;
        } | null;
        if (!live) return;
        if (!res.ok || !Array.isArray(body?.assumptions)) {
          setState({ state: "failed" });
          return;
        }
        setState({
          state: "ready",
          ...rowsStepReliesOn(body.assumptions as RelianceRow[], RELIANCE),
        });
      })
      .catch(() => {
        if (live) setState({ state: "failed" });
      });
    return () => {
      live = false;
    };
  }, [programId]);
  return state;
}

export function OperatingAdoptionStep(props: OperatingAdoptionStepProps) {
  const profile = resolveChangeProfile(props.route);
  const record =
    parseOperatingAdoption(props.value) ?? emptyOperatingAdoption();
  const trace =
    parseDesignTraceability(props.designTraceability) ??
    emptyDesignTraceability();
  const grid = ownerGrid(props.p2RootCauses, trace, record);
  const shorts = useMemo(() => {
    const out: Record<string, string> = {};
    for (const c of parseRootCauseRegister(props.p2RootCauses)?.causes ?? []) {
      if (c.short) out[c.id] = c.short;
    }
    return out;
  }, [props.p2RootCauses]);
  const reliance = useReliance(
    profile === "technical" ? null : props.registerProgramId,
  );
  const [refusal, setRefusal] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [baselineDraft, setBaselineDraft] = useState("");
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

  const who = (by: string | undefined) =>
    !by || by === props.decidedBy ? "you" : by;
  const write = (step: StepWrite) => {
    setRefusal(null);
    props.onChange(serializeOperatingAdoption(step.record));
    for (const [key, value] of Object.entries(step.answers)) {
      props.onAnswerChange(key, value);
    }
  };
  const commit = (edit: OperatingEdit | StepWriteResult) => {
    if (!edit.ok) {
      setRefusal(edit.reason);
      return false;
    }
    write("record" in edit ? edit : { record: edit.value, answers: {} });
    return true;
  };
  const save = (next: OperatingAdoption) =>
    write({ record: next, answers: {} });

  const people = useMemo(() => {
    const seen = new Set<string>();
    return props.people.filter((p) => {
      const key = p.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [props.people]);
  const personOptions = (selected: string | undefined) => (
    <>
      <option value="">Choose an owner…</option>
      {people.map((p) => (
        <option key={p.name} value={p.name}>
          {p.name} · {p.role}
        </option>
      ))}
      {selected && !people.some((p) => p.name === selected) ? (
        <option value={selected}>{selected}</option>
      ) : null}
    </>
  );

  const validatedBy = props.route?.validatedBy?.trim() || "the route reviewer";
  const routeLine = props.route
    ? `from the P2 route, confirmed by ${validatedBy}`
    : "no P2 route is confirmed yet, so this step runs in full";
  const recheck = (
    <a className={cx("link-btn", "inline")} href={props.p2RouteHref}>
      Re-check the P2 route →
    </a>
  );
  const flag = openRouteFlag(record, profile);

  // ── Advisory: the route flag ──────────────────────────────────────────────
  const flagRow: StepPageRow | null = flag
    ? {
        id: ROW_IDS.flag,
        rank: 5,
        eyebrow: "Route · advisory",
        shortName: "route flag",
        subject: "Your notes suggest a heavier change than the route",
        state: "advisory",
        clause: "decide whether to re-check the P2 route",
        facts: [
          {
            kind: "team",
            text: `P2 route: ${profile}, confirmed by ${validatedBy}`,
          },
        ],
        middle: (
          <div>
            <p className={cx("proposal")}>
              <span className={cx("lead")}>“{flag.quote}”</span>{" "}
              {profile === "technical"
                ? "That changes how people work, but the P2 route says technical: no business change. If the notes are right, re-check the route in P2; this page can’t change depth."
                : "That reads as more than a limited change. If so, re-check the route in P2; this page can’t change depth."}
            </p>
            <SourceLine
              source={{
                kind: "team",
                text: `From your notes, line ${flag.line}`,
              }}
            />
          </div>
        ),
        actions: (
          <>
            <a className={cx("btn-ink")} href={props.p2RouteHref}>
              Re-check the P2 route →
            </a>
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() =>
                save(dismissRouteFlag(record, props.decidedBy, props.today))
              }
            >
              Dismiss
            </button>
          </>
        ),
        basis: [
          {
            kind: "team",
            text: "Depth comes from the P2 solution route. It is evidence-backed and a P3 gate check, and it decides this step’s capture answers and the gate document set.",
            cite: "Governance rule",
          },
        ],
      }
    : null;

  // ── Notes panel (aVa's suggested action) ──────────────────────────────────
  const workProfile: WorkProfile | null =
    profile === "technical" ? null : profile;
  const runNotes = () => {
    const result = fillFromNotes(notes, {
      profile,
      record,
      rows: grid.rows,
      shorts,
      people: people.map((p) => p.name),
      values: props.answers,
    });
    if (result.record !== record) save(result.record);
    if (!workProfile) {
      setFillReply(
        result.flagged
          ? "Your notes suggest a heavier change than the technical route. I added an advisory; only the P2 route can change depth."
          : "Your notes don’t read as a heavier change than the technical route.",
      );
      return;
    }
    const parts = [
      result.filled.length
        ? `From your notes I filled ${result.filled.join(", ")}. They are the team’s words, marked for review; nothing is accepted.`
        : "Your notes add nothing new for the open fields on this step.",
    ];
    if (result.left.length) {
      parts.push(
        `I left ${result.left.join(" and ")} alone because you had chosen an owner there.`,
      );
    }
    if (result.flagged) {
      parts.push(
        "They also suggest a heavier change than the route; that is for the P2 route to decide.",
      );
    }
    setFillReply(parts.join(" "));
  };
  const notesPanel = notesOpen ? (
    <div className={cx("root")}>
      <div className={cx("warn-inline")}>
        <label className={cx("q-label")} htmlFor="oa-notes">
          {workProfile
            ? "Fill this step from your notes"
            : "Check your notes against the P2 route"}
        </label>
        <span className={cx("item-note")}>
          {workProfile
            ? "Notes are your account of a session, not approved evidence. aVa fills only empty cells, word for word: owners named in your notes, decision rights, and the change in the team’s words. It never overwrites a choice and never changes depth."
            : "Notes are your account of a session, not approved evidence. aVa only checks whether they describe a heavier change than the technical route. It never changes depth."}
        </span>
        <textarea
          id="oa-notes"
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
            onClick={runNotes}
          >
            {workProfile ? "Fill with aVa" : "Check with aVa"}
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

  // ── Technical: Skipped, by the business-change boundary attestation ──────
  if (!workProfile) {
    const advisory = flagRow ? [flagRow] : [];
    const nextAction = operatingAdoptionNextAction({
      input: { profile, record, grid, values: props.answers },
      step2Done: props.step2Done,
    });
    const owner = props.route?.adoptionOwner?.trim() || "the adoption owner";
    const briefing = [
      `This step is skipped: the P2 route says technical, and the business-change boundary attestation names ${owner} as adoption owner.`,
      flag
        ? `Your notes describe a change to how people work: “${flag.quote}” If it is real, re-check the route in P2; I can’t change depth here.`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
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
        title="Name the owners and describe the change"
        intro="Each design element needs an accountable owner, and the change to people’s work is written in the team’s own words. How deep this step goes is set by the P2 route, not here."
        nextAction={nextAction}
        context={{ items: [], details: [] }}
        skipped={{
          statement: props.answers.business_change_boundary ?? null,
          owner,
          date: "",
          title: "Business-change boundary",
          ownerLabel: "Adoption owner",
          recorded: `With the P2 route (technical), confirmed by ${validatedBy}`,
          context: `Technical route from P2, confirmed by ${validatedBy}`,
          routeHref: props.p2RouteHref,
        }}
        rows={advisory}
        onBack={props.onBack}
        onContinue={props.onContinue}
      />
    );
    return props.frame
      ? props.frame(page, {
          briefing,
          // No fill on a skipped step (v1.10): aVa only reads notes against
          // the route, which is how a route flag can arise here.
          actions: [
            {
              id: "check-route",
              label: "Check my notes against the P2 route",
              onClick: () => setNotesOpen(true),
            },
          ],
          notesPanel,
        })
      : page;
  }

  // ── Owners and decision rights ────────────────────────────────────────────
  const accepted = ownersSettled(record, grid);
  const missing = missingOwnerCount(grid);
  const acceptable = canAcceptOwners(grid);
  const notesRights = grid.rows
    .flatMap((r) => DECISION_RIGHTS.map((d) => r.rights[d.id]))
    .filter((m) => m?.writtenBy === "notes");
  const notesRightLines = [
    ...new Set(
      notesRights
        .map((m) => /line (\d+)/.exec(m?.citation ?? "")?.[1])
        .filter((n): n is string => Boolean(n)),
    ),
  ];
  const nameCell = (row: GridRow, prefix: string) =>
    row.source === "team" && !accepted ? (
      <>
        <label className={cx("sr-only")} htmlFor={`${prefix}-${row.rowId}`}>
          Row name
        </label>
        <input
          id={`${prefix}-${row.rowId}`}
          className={cx("cell-input")}
          value={row.name}
          placeholder="e.g. Access review board"
          onChange={(e) =>
            commit(nameTeamRow(record, row.rowId, e.target.value))
          }
        />
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => commit(removeTeamRow(record, row.rowId))}
        >
          Remove
        </button>
      </>
    ) : (
      <>
        <span className={cx("item-name")}>{row.name}</span>
        <span className={cx("item-note")}>
          {row.source === "team" ? "Added by you" : row.rowId}
        </span>
      </>
    );
  const ownerCell = (row: GridRow, prefix: string) =>
    accepted ? (
      row.owner?.name
    ) : (
      <>
        <label className={cx("sr-only")} htmlFor={`${prefix}-${row.rowId}`}>
          Owner for {row.name || "the new row"}
        </label>
        <select
          id={`${prefix}-${row.rowId}`}
          className={cx("cell-input")}
          value={row.owner?.name ?? ""}
          onChange={(e) => save(chooseOwner(record, row, e.target.value))}
        >
          {personOptions(row.owner?.name)}
        </select>
        {row.owner?.writtenBy === "notes" ? (
          <span className={cx("ava-badge")}>Session notes · review</span>
        ) : null}
      </>
    );
  const rightCell = (row: GridRow, right: (typeof DECISION_RIGHTS)[number]) => {
    const on = Boolean(row.rights[right.id]?.value);
    if (accepted) return on ? "Yes" : <span className={cx("no")}>No</span>;
    return (
      <button
        type="button"
        className={cx("cell-toggle", !on && "no")}
        aria-pressed={on}
        aria-label={`${right.label}: ${row.name || "the new row"}`}
        onClick={() => save(markRight(record, row, right.id, !on))}
      >
        {on ? "Yes" : "No"}
      </button>
    );
  };
  const table = (
    <table className={cx("tbl")}>
      <thead>
        <tr>
          <th scope="col" style={{ width: "26%" }}>
            Design element
          </th>
          <th scope="col" style={{ width: "28%" }}>
            Owner
          </th>
          {DECISION_RIGHTS.map((r) => (
            <th scope="col" key={r.id}>
              {r.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grid.rows.map((row) => (
          <tr key={row.rowId}>
            <th scope="row">{nameCell(row, "nm")}</th>
            <td>{ownerCell(row, "own")}</td>
            {DECISION_RIGHTS.map((r) => (
              <td key={r.id}>{rightCell(row, r)}</td>
            ))}
          </tr>
        ))}
        {grid.handedOff.map((h) => (
          <tr key={h.causeId}>
            <th scope="row">
              <span className={cx("item-name")}>{h.cause}</span>
              <span className={cx("item-note")}>
                {h.causeId} · handed off in Step 1
              </span>
            </th>
            <td>
              {h.owner} · {h.program}
            </td>
            <td colSpan={DECISION_RIGHTS.length}>
              <span className={cx("no")}>Not this Move’s to staff</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const cards = (
    <div className={cx("cards")}>
      {grid.rows.map((row) => (
        <div className={cx("card")} key={row.rowId}>
          <span className={cx("card-title")}>{nameCell(row, "nmc")}</span>
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>{ownerCell(row, "ownc")}</dd>
            </div>
            <div>
              <dt>Decision rights</dt>
              <dd>
                {accepted ? (
                  DECISION_RIGHTS.filter((r) => row.rights[r.id]?.value)
                    .map((r) => r.label)
                    .join(" · ") || <span className={cx("no")}>None</span>
                ) : (
                  <span className={cx("card-rights")}>
                    {DECISION_RIGHTS.map((r) => (
                      <span key={r.id}>
                        {r.label} {rightCell(row, r)}
                      </span>
                    ))}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      ))}
      {grid.handedOff.map((h) => (
        <div className={cx("card")} key={h.causeId}>
          <span className={cx("card-title")}>
            <span className={cx("item-name")}>{h.cause}</span>
            <span className={cx("item-note")}>
              {h.causeId} · handed off in Step 1
            </span>
          </span>
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>
                {h.owner} · {h.program}
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
  const fromNotes = grid.rows.filter((r) => r.owner?.writtenBy === "notes");
  const ownersRow: StepPageRow = {
    id: ROW_IDS.owners,
    rank: 1,
    eyebrow: "Owners",
    shortName: "owners",
    subject: accepted
      ? "Owners and decision rights"
      : "Name an owner for each design element",
    state: accepted ? "settled" : "decision",
    clause:
      missing > 0
        ? `name ${missing} owner${missing === 1 ? "" : "s"} and accept the decision rights`
        : "accept the owners and decision rights",
    wide: true,
    facts: [
      {
        kind: "team",
        text: "Rows are Step 1’s accepted design elements, plus any you add · owners from the Move’s people",
      },
    ],
    middle: (
      <>
        {!accepted && notesRights.length ? (
          <p className={cx("lead-line")}>
            <span className={cx("ava-badge")}>Session notes · review</span>
            <br />
            Decision rights marked from your notes, line
            {notesRightLines.length > 1 ? "s" : ""} {notesRightLines.join(", ")}
            , are the team’s words.
          </p>
        ) : null}
        {table}
        {cards}
        {accepted ? (
          <span className={cx("when-settled")}>
            Owners and decision rights accepted by{" "}
            {who(record.ownersAcceptedBy)},{" "}
            {shortDate(record.ownersAcceptedAt ?? "")}
            {fromNotes.length
              ? ` · ${fromNotes.length} owner${fromNotes.length === 1 ? "" : "s"} from session notes`
              : ""}
          </span>
        ) : null}
      </>
    ),
    actions: accepted ? (
      <button
        type="button"
        className={cx("link-btn")}
        onClick={() => write(reopenOwners({ record, values: props.answers }))}
      >
        Reopen
      </button>
    ) : (
      <>
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => save(addTeamRow(record))}
        >
          Add a row
        </button>
        <button
          type="button"
          className={cx("btn-ink")}
          disabled={!acceptable}
          onClick={() =>
            commit(
              acceptOwners({
                record,
                grid,
                profile: workProfile,
                values: props.answers,
                by: props.decidedBy,
                at: props.today,
              }),
            )
          }
        >
          Accept owners and rights
        </button>
        {missing > 0 ? (
          <span className={cx("item-state")}>
            {missing} owner{missing === 1 ? "" : "s"} to name
          </span>
        ) : !acceptable ? (
          <span className={cx("item-state")}>Name the rows you added</span>
        ) : null}
      </>
    ),
    basis: [
      {
        kind: "team",
        text: "There is no canonical domain list, so rows come from Step 1’s design elements; add a row for anything else that needs an owner.",
        cite: "Rows rule",
      },
      {
        kind: "team",
        text: "Owners are chosen from the Move’s sponsor and participants, or named in pasted notes. Accepting writes each owner as a plain line into the Move’s answer, after the team’s own words.",
        cite: "Owners rule",
      },
    ],
  };

  // ── Change size: FACT or a register-cited ESTIMATE, never money ──────────
  const sizeLines = (
    <>
      <span className={cx("sub-eyebrow", "eyebrow")}>Size of the change</span>
      <SourceLine
        source={{
          kind: "fact",
          text: "Each design element gets one named owner",
          cite: "Step 1 · accepted design elements",
        }}
      />
      {reliance.state === "ready"
        ? reliance.rows.map((row) => {
            const line = relianceLine(row);
            return (
              <SourceLine
                key={row.registerId}
                source={{ kind: "est", text: line.text, cite: line.cite }}
              />
            );
          })
        : null}
      {reliance.state === "failed" ? (
        <SourceLine
          source={{
            kind: "team",
            text: "The assumptions register could not be read, so no estimate is shown here",
          }}
        />
      ) : null}
      <span className={cx("src")}>
        <span className={cx("cite")}>
          Its cost is sized in Step 4’s estimate, not here.
        </span>
      </span>
    </>
  );

  // ── Capture-text rows: the team's words, as plain text ───────────────────
  const textRow = (row: CaptureTextRow, index: number): StepPageRow => {
    const value = props.answers[row.key] ?? "";
    const state = textRowState(
      record,
      row.key,
      value,
      Boolean(props.avaDraftKeys?.includes(row.key)),
    );
    const typing = editing[row.key];
    const isEditing = typing !== undefined || state.state === "empty";
    const words = typing ?? "";
    const base = {
      id: row.key,
      rank: 2 + index,
      eyebrow: row.short.charAt(0).toUpperCase() + row.short.slice(1),
      shortName: row.short,
      subject: row.label,
      clause: `write the ${row.short}`,
      draftClause: `confirm the ${row.short}`,
      facts: [
        {
          kind: "team" as const,
          text: `Written to the Move’s ${row.short} answer`,
        },
      ],
    };
    const size = row.size ? sizeLines : null;
    if (isEditing) {
      return {
        ...base,
        state:
          state.state === "settled"
            ? "decision"
            : state.state === "empty"
              ? "decision"
              : "draft",
        middle: (
          <div className={cx("field")}>
            <label className={cx("q-label")} htmlFor={`tx-${row.key}`}>
              {row.label}
            </label>
            <textarea
              id={`tx-${row.key}`}
              className={cx("q-input")}
              rows={4}
              value={words}
              placeholder={
                row.key === "process_design"
                  ? "e.g. A steward reviews the exception queue each morning, releases or rejects each record and logs the reason."
                  : undefined
              }
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, [row.key]: e.target.value }))
              }
            />
            <SourceLine
              source={{
                kind: "team",
                text: "Saved as plain text: your words only",
              }}
            />
            {size}
          </div>
        ),
        actions: (
          <>
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={!words.trim()}
              onClick={() => {
                if (
                  commit(
                    commitAnswer({
                      record,
                      key: row.key,
                      text: words,
                      writtenBy: "you",
                      action: "saved",
                      by: props.decidedBy,
                      at: props.today,
                    }),
                  )
                ) {
                  setEditing((prev) => {
                    const next = { ...prev };
                    delete next[row.key];
                    return next;
                  });
                }
              }}
            >
              Save
            </button>
            {typing !== undefined && state.state !== "empty" ? (
              <button
                type="button"
                className={cx("link-btn")}
                onClick={() =>
                  setEditing((prev) => {
                    const next = { ...prev };
                    delete next[row.key];
                    return next;
                  })
                }
              >
                Cancel
              </button>
            ) : null}
          </>
        ),
      };
    }
    if (state.state === "settled") {
      const a = state.accepted;
      return {
        ...base,
        state: "settled",
        middle: (
          <div>
            <p className={cx("proposal")}>{state.text}</p>
            <span className={cx("when-settled")}>
              {a.action === "accepted" ? "Accepted" : "Saved"} by {who(a.by)},{" "}
              {shortDate(a.at)} · saved as the Move’s {row.short} answer
            </span>
            {size}
          </div>
        ),
        actions: (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => {
              save(reopenAnswer(record, row.key));
              setEditing((prev) => ({ ...prev, [row.key]: state.text }));
            }}
          >
            Reopen
          </button>
        ),
      };
    }
    // A draft: the capture answer's own words, or a draft on the record.
    const badge =
      state.state === "draft"
        ? state.writtenBy === "ava"
          ? "Ava draft · review"
          : "Your capture answer · review"
        : state.writtenBy === "ava"
          ? "Ava draft · review"
          : "Session notes · review";
    const writtenBy =
      state.state === "draft"
        ? state.writtenBy === "ava"
          ? "ava"
          : "you"
        : state.writtenBy;
    const citation =
      state.state === "record_draft" ? state.citation : undefined;
    return {
      ...base,
      state: "draft",
      middle: (
        <div>
          <span className={cx("ava-badge")}>{badge}</span>
          <p className={cx("proposal")}>{state.text}</p>
          {citation ? (
            <SourceLine source={{ kind: "team", text: citation }} />
          ) : null}
          {size}
        </div>
      ),
      actions: (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              commit(
                commitAnswer({
                  record,
                  key: row.key,
                  text: state.text,
                  writtenBy,
                  citation,
                  action: "accepted",
                  by: props.decidedBy,
                  at: props.today,
                }),
              )
            }
          >
            Accept
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() =>
              setEditing((prev) => ({ ...prev, [row.key]: state.text }))
            }
          >
            Edit
          </button>
        </>
      ),
    };
  };
  const textRows = CAPTURE_TEXT_ROWS[workProfile].map(textRow);

  // ── Baseline owner: truthful wording, no gate implied ────────────────────
  const baselineRow: StepPageRow = record.baseline
    ? {
        id: ROW_IDS.baseline,
        rank: 4,
        eyebrow: "Baseline owner",
        shortName: "baseline owner",
        subject: `Baseline owner: ${record.baseline.name}`,
        state: "settled",
        facts: [
          {
            kind: "team",
            text: "Tower tracks the baseline from go-live; P5 hands it to this owner",
          },
        ],
        middle: (
          <div>
            <p className={cx("proposal")}>
              Receives the baseline from P5 and owns it in Tower.
            </p>
            <span className={cx("when-settled")}>
              Named by {who(record.baseline.savedBy)},{" "}
              {shortDate(record.baseline.savedAt)}
            </span>
          </div>
        ),
        actions: (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => {
              setBaselineDraft(record.baseline?.name ?? "");
              save(reopenBaselineOwner(record));
            }}
          >
            Reopen
          </button>
        ),
      }
    : {
        id: ROW_IDS.baseline,
        rank: 4,
        eyebrow: "Baseline owner",
        shortName: "baseline owner",
        subject: "Name who receives the baseline",
        state: "decision",
        clause: "name who receives the baseline",
        facts: [
          {
            kind: "team",
            text: "Tower tracks the baseline from go-live; P5 hands it to this owner",
          },
        ],
        middle: (
          <div className={cx("field")}>
            <label className={cx("q-label")} htmlFor="oa-baseline">
              Owner
            </label>
            <select
              id="oa-baseline"
              className={cx("cell-input")}
              value={baselineDraft}
              onChange={(e) => setBaselineDraft(e.target.value)}
            >
              {personOptions(baselineDraft)}
            </select>
          </div>
        ),
        actions: (
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!baselineDraft}
            onClick={() =>
              commit(
                saveBaselineOwner(
                  record,
                  baselineDraft,
                  props.decidedBy,
                  props.today,
                ),
              )
            }
          >
            Save
          </button>
        ),
      };

  const pageRows: StepPageRow[] = [
    ...evidence.rows,
    ownersRow,
    ...textRows,
    baselineRow,
    ...(flagRow ? [flagRow] : []),
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

  // The NextAction reads the same rows the step bar does (`recordStepDone`):
  // the model's own rows decide; the page adds only its evidence rows and
  // any refusal, and a row being edited stays open.
  const modelRows = operatingAdoptionRows({
    profile,
    record,
    grid,
    values: props.answers,
    avaDraftKeys: props.avaDraftKeys,
  });
  const extraRows = pageRows
    .filter((r) => !modelRows.some((m) => m.id === r.id))
    .map((r) => ({
      id: r.id,
      rank: r.rank,
      subject: r.subject,
      state: r.state,
      clause: r.clause,
    }));
  const nextAction = operatingAdoptionNextAction({
    input: {
      profile,
      record,
      grid,
      values: props.answers,
      avaDraftKeys: props.avaDraftKeys,
    },
    step2Done: props.step2Done,
    extraRows,
  });

  // ── Assumptions this step relies on (compact, collapsed) ──────────────────
  const relied = reliance.state === "ready" ? reliance.rows : [];
  const openRelied = relied.filter((r) => r.status === "open").length;
  const compact =
    relied.length > 0 ? (
      <section className={cx("group")}>
        <h2 className={cx("eyebrow", "group-title")}>
          Assumptions this step relies on · {relied.length}
          {openRelied ? ` · ${openRelied} open` : ""}
        </h2>
        <Disclosure
          closed="Show"
          opened="Hide"
          className="list settled"
          summaryExtra={
            <span className={cx("what")}>
              {relied.map((r) => r.registerId).join(", ")}
            </span>
          }
        >
          <ul className={cx("items", "relied")}>
            {relied.map((r) => {
              const line = relianceLine(r);
              return (
                <li key={r.registerId}>
                  <span>
                    <span className={cx("item-name")}>
                      {r.registerId} · {r.statement}
                    </span>
                    <span className={cx("src")}>
                      <SourceTag kind="est" />
                      {line.text}
                      <span className={cx("cite")}> · {r.source}</span>
                    </span>
                    <span className={cx("reg-meta")}>
                      {r.ownerRole} ·{" "}
                      {CONFIDENCE_LEVEL_BY_SCORE[r.confidence]
                        .charAt(0)
                        .toUpperCase() +
                        CONFIDENCE_LEVEL_BY_SCORE[r.confidence].slice(1)}{" "}
                      confidence
                      {r.origin === "charter_carry_forward"
                        ? " · from the P1 charter"
                        : ""}
                    </span>
                  </span>
                  <span className={cx("item-actions")}>
                    <span className={cx("item-state")}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Disclosure>
      </section>
    ) : null;

  // ── aVa's opening turn ────────────────────────────────────────────────────
  const blocked = nextAction.state === "blocked";
  const depthWord = DEPTH_WORD[profile];
  const avaWritten = CAPTURE_TEXT_ROWS[workProfile].filter(
    (r) =>
      textRowState(
        record,
        r.key,
        props.answers[r.key] ?? "",
        Boolean(props.avaDraftKeys?.includes(r.key)),
      ).state !== "settled" &&
      (props.avaDraftKeys?.includes(r.key) ||
        record.answers.find((a) => a.key === r.key)?.draft?.writtenBy ===
          "ava"),
  );
  const briefing = blocked
    ? "I’ll pick up again when Step 2 is settled."
    : [
        props.route
          ? `This step is ${depthWord} because the P2 route says ${profile}. I can’t change that here.`
          : "This step runs in full because no P2 route is confirmed yet. I can’t change that here.",
        !accepted && (fromNotes.length || missing)
          ? [
              fromNotes.length
                ? `Owners for ${fromNotes.map((r) => r.rowId).join(", ")} come from your session notes, word for word.`
                : "",
              missing
                ? `${grid.rows
                    .filter((r) => !r.owner)
                    .map((r) => r.rowId)
                    .join(" and ")} still need${missing === 1 ? "s" : ""} one.`
                : "",
            ]
              .filter(Boolean)
              .join(" ")
          : "",
        avaWritten.length
          ? `I drafted the ${avaWritten.map((r) => r.short).join(" and ")}. Those are my words; the team’s words are the ones that count.`
          : "",
        flag
          ? "I noticed your notes suggest a heavier change than the route. That is for the P2 route to decide."
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

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
      title="Name the owners and describe the change"
      intro="Each design element needs an accountable owner, and the change to people’s work is written in the team’s own words. How deep this step goes is set by the P2 route, not here."
      nextAction={nextAction}
      blockedLink={{ label: "Open Step 2 →", href: props.step2Href }}
      blockedWork="Owners and the change description will appear here once Step 2 has a direction. Your entries are kept."
      context={{
        items: [
          <span key="depth">
            <b>{depthWord} depth</b> · {routeLine}
          </span>,
          ...(blocked ? [] : [evidence.summary]),
        ],
        details: [
          {
            term: "Depth",
            detail: (
              <>
                <span>
                  <b>{depthWord}.</b>{" "}
                  {props.route
                    ? `Set by the P2 solution route (${profile} change), which is evidence-backed and a P3 gate check. It decides what this step captures and the gate document set. It changes only by re-checking the route in P2.`
                    : "No P2 route is confirmed yet, so this step asks for everything a full change needs. Confirming the route in P2 decides what this step captures and the gate document set."}
                </span>
                <span>{recheck}</span>
              </>
            ),
          },
        ],
      }}
      contextAction={blocked ? undefined : evidence.uploadControl}
      rows={pageRows}
      afterGroups={compact}
      carry={{
        label: "Carries to Step 4",
        text: " The owners staff the pod; the change described here is sized in the estimate.",
      }}
      onBack={props.onBack}
      onContinue={props.onContinue}
    />
  );

  return props.frame
    ? props.frame(page, {
        briefing,
        // aVa's fill is hidden while blocked (v1.10).
        actions: blocked
          ? []
          : [
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
