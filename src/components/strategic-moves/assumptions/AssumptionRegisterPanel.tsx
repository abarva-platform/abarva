"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ASSUMPTION_AREAS,
  ASSUMPTION_TRANSITIONS,
  CONFIDENCE_LEVEL_BY_SCORE,
  REGISTER_CONFIDENCE_SCORES,
  type AssumptionArea,
  type AssumptionStatus,
  type RegisterConfidence,
} from "@/lib/programs/assumption-register/model";
import type { AssumptionView } from "@/lib/programs/assumption-register/register-request";

/**
 * The Move's assumptions register (`moves_assumption_register_v1`).
 *
 * Every working figure a Move's documents rest on is a row here, with a stable
 * ID the documents cite as `[A:V3]`. A working figure is always tagged "est" —
 * it is an assumption, never a fact. aVa's proposals sit in their own group,
 * outside the register, until a person accepts or rejects them.
 *
 * The host resolves the flag server-side and passes `register: null` when it
 * is off, so nothing renders and nothing is fetched. Every change goes through
 * the register routes; a refusal is shown as the route's own `detail` sentence,
 * word for word, because that sentence says whether anything was saved.
 *
 * Everything is rendered as plain text.
 */
export interface AssumptionRegisterMount {
  programId: string;
  /** Register rows whose charter answer changed after they were raised (`charter-bridge.ts`). */
  staleAssumptionIds: readonly string[];
  /** The charter's assumptions could not be checked against the register on this load. */
  charterUnavailable: boolean;
  /** Charter assumptions the bridge tried and failed to add on this load. */
  unbridgedCharterCount: number;
}

export interface AssumptionRegisterPanelProps {
  register: AssumptionRegisterMount | null;
}

type Loaded =
  | { state: "loading" }
  | { state: "failed"; detail: string }
  | {
      state: "ready";
      rows: AssumptionView[];
      figuresRedacted: boolean;
      canEdit: boolean;
    };

type OpenForm =
  | { kind: "add" }
  | { kind: "answer"; row: AssumptionView }
  | { kind: "supersede"; row: AssumptionView }
  | null;

const STATUS_LABEL: Readonly<Record<AssumptionStatus, string>> = {
  proposed: "Proposed",
  open: "Open",
  confirmed: "Confirmed",
  corrected: "Corrected",
  superseded: "Superseded",
  rejected: "Rejected",
};

const AREA_LABEL: Readonly<Record<AssumptionArea, string>> = {
  value: "Value",
  data: "Data",
  delivery: "Delivery",
  adoption: "Adoption",
};

/** Confidence 1, 3, 5 as the words the register uses. */
function confidenceWord(score: RegisterConfidence): string {
  const level = CONFIDENCE_LEVEL_BY_SCORE[score];
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** What a person may do to a row, read from the model's own transition table. */
function allows(
  action: keyof typeof ASSUMPTION_TRANSITIONS,
  status: AssumptionStatus,
): boolean {
  return ASSUMPTION_TRANSITIONS[action].from.includes(status);
}

async function readBody(res: Response): Promise<Record<string, unknown>> {
  try {
    const body = await res.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

function detailOf(body: Record<string, unknown>): string | null {
  return typeof body.detail === "string" && body.detail.trim()
    ? body.detail
    : null;
}

const base = (programId: string) =>
  `/api/v1/programs/${encodeURIComponent(programId)}/assumptions`;

export function AssumptionRegisterPanel({
  register,
}: AssumptionRegisterPanelProps) {
  if (!register) return null;
  return <RegisterBody register={register} />;
}

function RegisterBody({ register }: { register: AssumptionRegisterMount }) {
  const { programId } = register;
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<OpenForm>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(base(programId), { cache: "no-store" });
      const body = await readBody(res);
      if (!res.ok || !Array.isArray(body.assumptions)) {
        setLoaded({
          state: "failed",
          detail:
            detailOf(body) ??
            `The assumptions register could not be read (HTTP ${res.status}). Nothing was changed. Reload to try again.`,
        });
        return;
      }
      setLoaded({
        state: "ready",
        rows: body.assumptions as AssumptionView[],
        figuresRedacted: body.figuresRedacted === true,
        canEdit: body.canEdit === true,
      });
    } catch {
      setLoaded({
        state: "failed",
        detail:
          "The assumptions register could not be reached. Nothing was changed. Reload to try again.",
      });
    }
  }, [programId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Send one change. Returns true when it landed. */
  const send = async (
    url: string,
    init: { method: "POST" | "PATCH"; body: unknown },
  ): Promise<boolean> => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method: init.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(init.body),
      });
      const body = await readBody(res);
      if (!res.ok) {
        setNotice(
          detailOf(body) ??
            `The register did not confirm this change (HTTP ${res.status}). It may or may not have been saved. Reload the register to see its current state before trying again.`,
        );
        // A refusal that names a stored replacement changed the register.
        if (body.replacement) await reload();
        return false;
      }
      // Landed, but its history entry did not: the sentence stops a repeat.
      if (body.historyRecorded === false) setNotice(detailOf(body));
      await reload();
      return true;
    } catch {
      setNotice(
        "The register could not be reached, so this change could not be confirmed: it may or may not have been saved. Reload the register to see its current state before trying again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const decide = (row: AssumptionView, body: Record<string, unknown>) =>
    send(`${base(programId)}/${encodeURIComponent(row.id)}/decision`, {
      method: "POST",
      body: { ...body, expectedRevision: row.revision },
    });

  const stale = new Set(register.staleAssumptionIds);

  return (
    <section
      className="arp"
      aria-label="Assumptions register"
      data-testid="assumption-register-panel"
    >
      <style>{ARP_CSS}</style>
      <div className="arp-eyebrow">Assumptions register</div>
      <p className="arp-lede">
        The working figures this Move rests on. Each is an estimate until it is
        answered from a named source; documents cite a row by its ID.
      </p>
      {register.charterUnavailable ? (
        <p className="arp-note" data-testid="arp-charter-unavailable">
          The charter&apos;s assumptions could not be checked against the
          register just now. Reload to try again.
        </p>
      ) : null}
      {register.unbridgedCharterCount > 0 ? (
        <p className="arp-note" data-testid="arp-charter-unbridged">
          {register.unbridgedCharterCount} charter assumption
          {register.unbridgedCharterCount === 1 ? "" : "s"} could not be added
          to the register just now. Reload to try again.
        </p>
      ) : null}
      {notice ? (
        <p className="arp-alert" role="alert" data-testid="arp-notice">
          {notice}
        </p>
      ) : null}

      {loaded.state === "loading" ? (
        <p className="arp-muted">Loading the register…</p>
      ) : loaded.state === "failed" ? (
        <p className="arp-alert" role="alert" data-testid="arp-load-failed">
          {loaded.detail}
        </p>
      ) : (
        <RegisterContent
          rows={loaded.rows}
          figuresRedacted={loaded.figuresRedacted}
          canEdit={loaded.canEdit}
          stale={stale}
          busy={busy}
          form={form}
          setForm={setForm}
          onAccept={(row) => void decide(row, { action: "accept" })}
          onReject={(row) => void decide(row, { action: "reject" })}
          onAnswer={async (row, body) => {
            if (await decide(row, { action: "answer", ...body })) setForm(null);
          }}
          onSupersede={async (row, replacement) => {
            if (await decide(row, { action: "supersede", replacement }))
              setForm(null);
          }}
          onAdd={async (body) => {
            if (await send(base(programId), { method: "POST", body }))
              setForm(null);
          }}
        />
      )}
    </section>
  );
}

function FigureCell({
  figure,
  withheld,
}: {
  figure: string | null;
  withheld: boolean;
}) {
  if (withheld) return <span className="arp-muted">withheld</span>;
  if (!figure) return <span className="arp-muted">—</span>;
  return (
    <>
      {figure} <span className="arp-est">est</span>
    </>
  );
}

function AnswerCell({
  row,
  withheld,
}: {
  row: AssumptionView;
  withheld: boolean;
}) {
  if (row.status !== "confirmed" && row.status !== "corrected") {
    return <span className="arp-muted">—</span>;
  }
  return (
    <>
      <div>
        {row.answer ??
          (row.status === "confirmed" ? "Confirmed as stated" : "")}
      </div>
      {row.answerFigure && !withheld ? (
        <div className="arp-figure">{row.answerFigure}</div>
      ) : null}
      {row.answerSource ? (
        <div className="arp-source">Source: {row.answerSource}</div>
      ) : null}
    </>
  );
}

interface ContentProps {
  rows: AssumptionView[];
  figuresRedacted: boolean;
  canEdit: boolean;
  stale: ReadonlySet<string>;
  busy: boolean;
  form: OpenForm;
  setForm: (form: OpenForm) => void;
  onAccept: (row: AssumptionView) => void;
  onReject: (row: AssumptionView) => void;
  onAnswer: (row: AssumptionView, body: Record<string, unknown>) => void;
  onSupersede: (row: AssumptionView, body: Record<string, unknown>) => void;
  onAdd: (body: Record<string, unknown>) => void;
}

function RegisterContent(props: ContentProps) {
  const { rows, figuresRedacted, canEdit, stale, busy, form, setForm } = props;
  const proposals = rows.filter((row) => row.status === "proposed");
  // A rejected proposal never joined the register.
  const registerRows = rows.filter(
    (row) => row.status !== "proposed" && row.status !== "rejected",
  );
  const registerIdOf = new Map(rows.map((row) => [row.id, row.registerId]));
  const withheld = (row: AssumptionView) =>
    figuresRedacted || row.figuresRedacted;

  return (
    <>
      {proposals.length > 0 ? (
        <div className="arp-group" data-testid="arp-proposals">
          <h3 className="arp-group-head">
            aVa proposals — not yet in the register
          </h3>
          <ul className="arp-proposals">
            {proposals.map((row) => (
              <li
                key={row.id}
                className="arp-proposal"
                data-testid={`arp-proposal-${row.registerId}`}
              >
                <div className="arp-proposal-head">
                  <span className="arp-id">{row.registerId}</span>
                  <span className="arp-muted">{AREA_LABEL[row.area]}</span>
                  <span className="arp-muted">
                    Confidence {confidenceWord(row.confidence)}
                  </span>
                </div>
                <p className="arp-statement">{row.statement}</p>
                <div className="arp-meta">
                  <span>
                    Figure:{" "}
                    <FigureCell
                      figure={row.workingFigure}
                      withheld={withheld(row)}
                    />
                  </span>
                  <span>Owner: {row.ownerRole}</span>
                  <span>Source: {row.source}</span>
                </div>
                {canEdit &&
                (allows("accept", row.status) ||
                  allows("reject", row.status)) ? (
                  <div className="arp-actions">
                    <button
                      type="button"
                      className="arp-primary"
                      disabled={busy}
                      onClick={() => props.onAccept(row)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="arp-quiet"
                      disabled={busy}
                      onClick={() => props.onReject(row)}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {registerRows.length === 0 ? (
        <p className="arp-muted" data-testid="arp-empty">
          No assumptions on this Move&apos;s register yet.
        </p>
      ) : (
        <div className="arp-scroll">
          <table className="arp-table" data-testid="arp-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Area</th>
                <th scope="col">Assumption</th>
                <th scope="col">Working figure</th>
                <th scope="col">Owner</th>
                <th scope="col">Confidence</th>
                <th scope="col">Status</th>
                <th scope="col">Answer</th>
                {canEdit ? (
                  <th scope="col">
                    <span className="arp-sr">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {registerRows.map((row) => (
                <tr key={row.id} data-testid={`arp-row-${row.registerId}`}>
                  <td className="arp-id">{row.registerId}</td>
                  <td>{AREA_LABEL[row.area]}</td>
                  <td>
                    {row.statement}
                    {stale.has(row.id) ? (
                      <div className="arp-stale" data-testid="arp-stale">
                        The charter answer this row was raised from has changed
                        since. Answer or supersede it against the current
                        wording.
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <FigureCell
                      figure={row.workingFigure}
                      withheld={withheld(row)}
                    />
                  </td>
                  <td>{row.ownerRole}</td>
                  <td>{confidenceWord(row.confidence)}</td>
                  <td data-testid="arp-status">
                    {row.status === "superseded" && row.supersededBy
                      ? `Superseded by ${registerIdOf.get(row.supersededBy) ?? "another row"}`
                      : STATUS_LABEL[row.status]}
                  </td>
                  <td>
                    <AnswerCell row={row} withheld={withheld(row)} />
                  </td>
                  {canEdit ? (
                    <td className="arp-row-actions">
                      {allows("correct", row.status) ? (
                        <button
                          type="button"
                          className="arp-quiet"
                          disabled={busy}
                          onClick={() => setForm({ kind: "answer", row })}
                        >
                          Answer
                        </button>
                      ) : null}
                      {allows("supersede", row.status) ? (
                        <button
                          type="button"
                          className="arp-quiet"
                          disabled={busy}
                          onClick={() => setForm({ kind: "supersede", row })}
                        >
                          Supersede
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && form?.kind === "answer" ? (
        <AnswerForm
          key={form.row.id}
          row={form.row}
          busy={busy}
          onCancel={() => setForm(null)}
          onSubmit={(body) => props.onAnswer(form.row, body)}
        />
      ) : null}
      {canEdit && form?.kind === "supersede" ? (
        <RowForm
          key={form.row.id}
          title={`Supersede ${form.row.registerId} with a new row`}
          submitLabel="Supersede"
          initial={form.row}
          busy={busy}
          onCancel={() => setForm(null)}
          onSubmit={(body) => props.onSupersede(form.row, body)}
        />
      ) : null}
      {canEdit && form?.kind === "add" ? (
        <RowForm
          title="Add an assumption"
          submitLabel="Add to the register"
          busy={busy}
          withArea
          onCancel={() => setForm(null)}
          onSubmit={props.onAdd}
        />
      ) : null}
      {canEdit && form === null ? (
        <button
          type="button"
          className="arp-add"
          disabled={busy}
          onClick={() => setForm({ kind: "add" })}
        >
          Add an assumption
        </button>
      ) : null}
    </>
  );
}

const present = (value: string) => value.trim().length > 0;

function AnswerForm({
  row,
  busy,
  onCancel,
  onSubmit,
}: {
  row: AssumptionView;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const canConfirm = allows("confirm", row.status);
  const [outcome, setOutcome] = useState<"confirmed" | "corrected">(
    canConfirm ? "confirmed" : "corrected",
  );
  const [answer, setAnswer] = useState("");
  const [answerFigure, setAnswerFigure] = useState("");
  const [answerSource, setAnswerSource] = useState("");
  const ready =
    present(answerSource) && (outcome === "confirmed" || present(answer));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    onSubmit({
      outcome,
      answerSource,
      answer: present(answer) ? answer : null,
      answerFigure: present(answerFigure) ? answerFigure : null,
    });
  };

  return (
    <form
      className="arp-form"
      onSubmit={submit}
      aria-label={`Answer ${row.registerId}`}
    >
      <div className="arp-form-title">
        Answer {row.registerId}: {row.statement}
      </div>
      <fieldset className="arp-outcomes">
        <legend className="arp-sr">Outcome</legend>
        {canConfirm ? (
          <label>
            <input
              type="radio"
              name="arp-outcome"
              checked={outcome === "confirmed"}
              onChange={() => setOutcome("confirmed")}
            />{" "}
            Confirmed
          </label>
        ) : null}
        <label>
          <input
            type="radio"
            name="arp-outcome"
            checked={outcome === "corrected"}
            onChange={() => setOutcome("corrected")}
          />{" "}
          Corrected
        </label>
      </fieldset>
      <label className="arp-field">
        {outcome === "corrected" ? "Corrected answer" : "Note (optional)"}
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </label>
      <label className="arp-field">
        Answer figure (optional)
        <input
          value={answerFigure}
          onChange={(e) => setAnswerFigure(e.target.value)}
        />
      </label>
      <label className="arp-field">
        Source of the answer
        <input
          value={answerSource}
          onChange={(e) => setAnswerSource(e.target.value)}
        />
      </label>
      <div className="arp-actions">
        <button type="submit" className="arp-primary" disabled={busy || !ready}>
          Save answer
        </button>
        <button type="button" className="arp-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RowForm({
  title,
  submitLabel,
  initial,
  withArea = false,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initial?: AssumptionView;
  withArea?: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [area, setArea] = useState<AssumptionArea>(ASSUMPTION_AREAS[0]);
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [workingFigure, setWorkingFigure] = useState(
    initial?.workingFigure ?? "",
  );
  const [source, setSource] = useState("");
  const [ownerRole, setOwnerRole] = useState(initial?.ownerRole ?? "");
  const [confidence, setConfidence] = useState<RegisterConfidence>(
    initial?.confidence ?? REGISTER_CONFIDENCE_SCORES[0],
  );
  const ready = present(statement) && present(source) && present(ownerRole);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    onSubmit({
      ...(withArea ? { area } : {}),
      statement,
      workingFigure: present(workingFigure) ? workingFigure : null,
      source,
      ownerRole,
      confidence,
    });
  };

  return (
    <form className="arp-form" onSubmit={submit} aria-label={title}>
      <div className="arp-form-title">{title}</div>
      {withArea ? (
        <label className="arp-field">
          Area
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as AssumptionArea)}
          >
            {ASSUMPTION_AREAS.map((option) => (
              <option key={option} value={option}>
                {AREA_LABEL[option]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="arp-field">
        Assumption
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
        />
      </label>
      <label className="arp-field">
        Working figure (optional)
        <input
          value={workingFigure}
          onChange={(e) => setWorkingFigure(e.target.value)}
        />
      </label>
      <label className="arp-field">
        Source of the figure
        <input value={source} onChange={(e) => setSource(e.target.value)} />
      </label>
      <label className="arp-field">
        Owner role
        <input
          value={ownerRole}
          onChange={(e) => setOwnerRole(e.target.value)}
        />
      </label>
      <label className="arp-field">
        Confidence
        <select
          value={confidence}
          onChange={(e) =>
            setConfidence(Number(e.target.value) as RegisterConfidence)
          }
        >
          {REGISTER_CONFIDENCE_SCORES.map((score) => (
            <option key={score} value={score}>
              {confidenceWord(score)}
            </option>
          ))}
        </select>
      </label>
      <div className="arp-actions">
        <button type="submit" className="arp-primary" disabled={busy || !ready}>
          {submitLabel}
        </button>
        <button type="button" className="arp-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// Disabled styling reads the `:disabled` attribute itself, so the look and the
// behaviour of a held button cannot disagree.
const ARP_CSS = `
.arp{--arp-ink:#2c2c2a;--arp-teal:#1d9e75;--arp-amber:#ba7517;--arp-red:#a33a28;--arp-faint:#6f6e68;--arp-line:rgba(10,10,11,.12);--arp-mono:'JetBrains Mono',ui-monospace,monospace;font-family:Inter,system-ui,sans-serif;color:var(--arp-ink);background:#fff;border:1px solid var(--arp-line);border-radius:12px;padding:18px 20px;margin-bottom:24px}
.arp-eyebrow{font-family:var(--arp-mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--arp-faint)}
.arp-lede{font-size:13px;line-height:1.55;color:var(--arp-faint);margin:8px 0 14px;max-width:62ch}
.arp-muted{color:var(--arp-faint);font-size:12.5px}
.arp-note{font-size:12.5px;line-height:1.5;color:#8a560f;margin:0 0 10px}
.arp-alert{font-size:12.5px;line-height:1.5;color:var(--arp-red);background:#faecea;border:1px solid rgba(163,58,40,.26);border-radius:8px;padding:8px 11px;margin:0 0 12px}
.arp-group{margin:0 0 16px}
.arp-group-head{font-size:12.5px;font-weight:600;margin:0 0 8px}
.arp-proposals{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.arp-proposal{border:1px solid var(--arp-line);border-left:2px solid var(--arp-amber);border-radius:10px;padding:11px 13px;background:#fdf6ec}
.arp-proposal-head{display:flex;gap:10px;align-items:baseline}
.arp-statement{font-size:13px;line-height:1.5;margin:6px 0}
.arp-meta{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--arp-faint)}
.arp-id{font-family:var(--arp-mono);font-size:11.5px;font-weight:600;white-space:nowrap}
.arp-est{font-family:var(--arp-mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--arp-amber);border:1px solid rgba(186,117,23,.4);border-radius:3px;padding:0 4px}
.arp-scroll{overflow-x:auto}
.arp-table{width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.45}
.arp-table th{font-family:var(--arp-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--arp-faint);font-weight:500;text-align:left;padding:6px 8px;border-bottom:1px solid var(--arp-line)}
.arp-table td{padding:8px;border-bottom:1px solid var(--arp-line);vertical-align:top}
.arp-figure{font-weight:600}
.arp-source{color:var(--arp-faint);font-size:12px}
.arp-stale{margin-top:4px;font-size:12px;color:#8a560f}
.arp-row-actions{white-space:nowrap}
.arp-actions{display:flex;gap:8px;margin-top:8px}
.arp-primary{border:0;background:var(--arp-teal);color:#fff;font-size:12.5px;font-weight:600;padding:7px 14px;border-radius:8px;cursor:pointer}
.arp-quiet{border:0;background:none;color:var(--arp-ink);font-size:12.5px;font-weight:500;padding:6px 8px;cursor:pointer}
.arp-add{margin-top:12px;border:1px dashed var(--arp-line);background:#fff;border-radius:10px;padding:9px 14px;font-size:12.5px;font-weight:600;color:var(--arp-ink);cursor:pointer}
.arp-primary:disabled,.arp-quiet:disabled,.arp-add:disabled{background:rgba(44,44,42,.12);color:var(--arp-faint);cursor:not-allowed}
.arp-form{margin-top:14px;border:1px solid var(--arp-line);border-radius:10px;background:#f5f1eb;padding:12px 14px;display:grid;gap:8px}
.arp-form-title{font-size:13px;font-weight:600}
.arp-outcomes{border:0;margin:0;padding:0;display:flex;gap:16px;font-size:12.5px}
.arp-field{display:grid;gap:3px;font-size:12px;color:var(--arp-faint)}
.arp-field input,.arp-field textarea,.arp-field select{font:inherit;font-size:13px;color:var(--arp-ink);border:1px solid var(--arp-line);border-radius:7px;padding:6px 8px;background:#fff}
.arp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
`;
