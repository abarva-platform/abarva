"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AREA_ID_PREFIX,
  ASSUMPTION_AREAS,
  ASSUMPTION_TRANSITIONS,
  CONFIDENCE_LEVEL_BY_SCORE,
  EDITABLE_STATUSES,
  REGISTER_CONFIDENCE_SCORES,
  effectiveFigure,
  isCountedStatus,
  type AssumptionArea,
  type AssumptionOrigin,
  type AssumptionStatus,
  type RegisterConfidence,
} from "@/lib/programs/assumption-register/model";
import type { AssumptionView } from "@/lib/programs/assumption-register/register-request";
import {
  looksLikePersonalName,
  ownerNeedsRole,
} from "@/lib/programs/assumption-register/owner-role";
import {
  SourceLine,
  SourceTag,
  useStepPageTheme,
} from "@/components/strategic-moves/step-page/MovesStepPage";
import styles from "@/components/strategic-moves/step-page/MovesStepPage.module.css";

/**
 * The Move's assumptions register (`moves_assumption_register_v1`), in Claude
 * Design's final register design (step page template v1.9, review 5).
 *
 * Every working figure a Move's documents rest on is a row here, with a stable
 * ID the documents cite as `[A:V3]`. A working figure is always an ESTIMATE
 * with its source. aVa's proposals sit apart until a person accepts or
 * rejects them.
 *
 * Two variants, one row:
 *   - `compact` — the collapsed group a phase page carries: counts by status
 *     and the open questions, with `Answer…` in place and a link to the full
 *     view. It never shows the full register or aVa's proposals (clutter
 *     flags 1 and 8).
 *   - `full` — the register view: by area or by owner, the proposals group,
 *     answer / supersede / set role inline, and the hand-off copy.
 *
 * The host resolves the flag server-side and passes `register: null` when it
 * is off, so nothing renders and nothing is fetched. Every change goes through
 * the register routes; a refusal is shown as the route's own `detail`
 * sentence, word for word, because that sentence says whether anything was
 * saved. A viewer without financial visibility sees every figure withheld and
 * no actions. Everything is rendered as plain text.
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

export type AssumptionRegisterVariant = "compact" | "full";

export interface AssumptionRegisterPanelProps {
  register: AssumptionRegisterMount | null;
  variant: AssumptionRegisterVariant;
  /** Compact only: opens the full register view (the Record entry). */
  onOpenFullView?: () => void;
}

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

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
  | { kind: "answer" | "role" | "supersede"; rowId: string }
  | null;

type CopyState =
  | { state: "idle" }
  | { state: "copied"; count: number }
  | { state: "manual"; text: string };

const STATUS_LABEL: Readonly<Record<AssumptionStatus, string>> = {
  proposed: "Proposed",
  open: "Open",
  confirmed: "Confirmed",
  corrected: "Corrected",
  superseded: "Superseded",
  rejected: "Rejected",
};

/** The order counts by status are listed in. Proposals stay off phase pages. */
const COUNT_ORDER: readonly AssumptionStatus[] = [
  "open",
  "confirmed",
  "corrected",
  "superseded",
];

const AREA_LABEL: Readonly<Record<AssumptionArea, string>> = {
  value: "Value",
  data: "Data",
  delivery: "Delivery",
  adoption: "Adoption",
};

/** Where an accepted row came from, as the row's meta line says it. */
const ORIGIN_LABEL: Readonly<Record<AssumptionOrigin, string>> = {
  team: "added by the team",
  charter_carry_forward: "from the P1 charter",
  ava_proposal: "aVa proposal, accepted",
  evidence_extraction: "from evidence, accepted",
};

/** The badge names who wrote a proposal's words (template v1.5). */
const PROPOSAL_BADGE: Readonly<Record<AssumptionOrigin, string>> = {
  team: "Added by the team · review",
  charter_carry_forward: "From the P1 charter · review",
  ava_proposal: "Ava draft · review",
  evidence_extraction: "From evidence · review",
};

const OWNER_NOT_SET_GROUP = "Owner not set as a role";
const OWNER_NEEDS_ROLE_LABEL =
  "Owner named in the P1 charter, set a role";

const answered = (row: AssumptionView) =>
  row.status === "confirmed" || row.status === "corrected";

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

const present = (value: string) => value.trim().length > 0;

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

/** Rows in register order: area (Value, Data, Delivery, Adoption), then ID. */
function inRegisterOrder(rows: readonly AssumptionView[]): AssumptionView[] {
  return [...rows].sort(
    (a, b) =>
      ASSUMPTION_AREAS.indexOf(a.area) - ASSUMPTION_AREAS.indexOf(b.area) ||
      a.seq - b.seq,
  );
}

/** The by-owner heading a row to answer sits under. */
const ownerGroupOf = (row: AssumptionView) =>
  ownerNeedsRole(row) ? OWNER_NOT_SET_GROUP : row.ownerRole;

/** Rows grouped by owner role, the "not set" group last. */
function byOwner(rows: readonly AssumptionView[]) {
  const groups = new Map<string, AssumptionView[]>();
  for (const row of rows) {
    const key = ownerGroupOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()].sort(
    ([a], [b]) =>
      Number(a === OWNER_NOT_SET_GROUP) - Number(b === OWNER_NOT_SET_GROUP),
  );
}

/**
 * The client hand-off: every open question, grouped by the role that holds
 * the answer. A withheld figure is never written into it.
 */
export function openQuestionsText(
  rows: readonly AssumptionView[],
  withheld: boolean,
): string {
  const lines = [`Open questions for the client · ${rows.length} to answer`];
  for (const [owner, group] of byOwner(rows)) {
    lines.push("", `${owner} · ${group.length} to answer`);
    for (const row of group) {
      const figure = withheld || row.figuresRedacted ? null : row.workingFigure;
      lines.push(
        `- ${row.registerId} · ${row.statement}` +
          (figure ? ` (working figure ${figure}, ${row.source})` : ""),
      );
    }
  }
  return lines.join("\n");
}

export function AssumptionRegisterPanel({
  register,
  variant,
  onOpenFullView,
}: AssumptionRegisterPanelProps) {
  if (!register) return null;
  return (
    <RegisterBody
      register={register}
      variant={variant}
      onOpenFullView={onOpenFullView}
    />
  );
}

function RegisterBody({
  register,
  variant,
  onOpenFullView,
}: {
  register: AssumptionRegisterMount;
  variant: AssumptionRegisterVariant;
  onOpenFullView?: () => void;
}) {
  const { programId } = register;
  const { theme } = useStepPageTheme();
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

  const closeOnLanding = async (landed: Promise<boolean>) => {
    if (await landed) setForm(null);
  };
  const decide = (row: AssumptionView, body: Record<string, unknown>) =>
    send(`${base(programId)}/${encodeURIComponent(row.id)}/decision`, {
      method: "POST",
      body: { ...body, expectedRevision: row.revision },
    });

  const handlers: RowHandlers = {
    onDecide: (row, action) => void decide(row, { action }),
    onAnswer: (row, body) =>
      void closeOnLanding(decide(row, { action: "answer", ...body })),
    onSupersede: (row, body) =>
      void closeOnLanding(decide(row, { action: "supersede", ...body })),
    onSetRole: (row, ownerRole) =>
      void closeOnLanding(
        send(`${base(programId)}/${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          body: { expectedRevision: row.revision, ownerRole },
        }),
      ),
  };

  const notes: ReactNode[] = [];
  if (register.charterUnavailable) {
    notes.push(
      <p
        key="unavailable"
        className={cx("reg-meta")}
        data-testid="arp-charter-unavailable"
      >
        The charter&apos;s assumptions could not be checked against the register
        just now. Reload to try again.
      </p>,
    );
  }
  if (register.unbridgedCharterCount > 0) {
    notes.push(
      <p
        key="unbridged"
        className={cx("reg-meta")}
        data-testid="arp-charter-unbridged"
      >
        {register.unbridgedCharterCount} charter assumption
        {register.unbridgedCharterCount === 1 ? "" : "s"} could not be added to
        the register just now. Reload to try again.
      </p>,
    );
  }
  if (notice) {
    notes.push(
      <p
        key="notice"
        className={cx("warn-inline")}
        role="alert"
        data-testid="arp-notice"
      >
        {notice}
      </p>,
    );
  }
  if (loaded.state === "failed") {
    notes.push(
      <p
        key="failed"
        className={cx("warn-inline")}
        role="alert"
        data-testid="arp-load-failed"
      >
        {loaded.detail}
      </p>,
    );
  }

  const ctx: RowContext | null =
    loaded.state === "ready"
      ? {
          stale: new Set(register.staleAssumptionIds),
          // Design v1.9: a viewer without financial visibility gets no actions.
          actionable: loaded.canEdit && !loaded.figuresRedacted,
          figuresRedacted: loaded.figuresRedacted,
          registerIdOf: new Map(
            loaded.rows.map((row) => [row.id, row.registerId]),
          ),
          liveRows: inRegisterOrder(
            loaded.rows.filter((row) => isCountedStatus(row.status)),
          ),
          busy,
          form,
          setForm,
          handlers,
        }
      : null;

  if (variant === "compact") {
    if (!ctx && notes.length === 0) return null;
    return (
      <CompactGroup
        rows={loaded.state === "ready" ? loaded.rows : []}
        ctx={ctx}
        notes={notes}
        theme={theme}
        onOpenFullView={onOpenFullView}
      />
    );
  }

  return (
    <div className={cx("root", "reg-root")} data-theme={theme ?? undefined}>
      <section
        className={cx("tab-main")}
        aria-labelledby="assumption-register-title"
        data-testid="assumption-register-panel"
      >
        <header className={cx("panel-head")}>
          <span className={cx("eyebrow")}>Record · all phases</span>
          <h2 id="assumption-register-title" className={cx("panel-title")}>
            Assumptions register
          </h2>
          <p className={cx("panel-intro")}>
            Every working figure the case rests on, who holds the answer and
            what it was confirmed as. Each is an estimate until it is answered
            from a named source; documents cite rows as [A:V3].
          </p>
        </header>
        {notes}
        {loaded.state === "loading" ? (
          <p className={cx("reg-meta")}>Loading the register…</p>
        ) : null}
        {loaded.state === "ready" && ctx ? (
          <FullRegister
            rows={loaded.rows}
            ctx={ctx}
            onAdd={(body) =>
              void closeOnLanding(
                send(base(programId), { method: "POST", body }),
              )
            }
          />
        ) : null}
      </section>
    </div>
  );
}

interface RowHandlers {
  onDecide: (row: AssumptionView, action: "accept" | "reject") => void;
  onAnswer: (row: AssumptionView, body: Record<string, unknown>) => void;
  onSupersede: (row: AssumptionView, body: Record<string, unknown>) => void;
  onSetRole: (row: AssumptionView, ownerRole: string) => void;
}

interface RowContext {
  stale: ReadonlySet<string>;
  /** May this viewer act at all: can edit AND sees figures. */
  actionable: boolean;
  figuresRedacted: boolean;
  registerIdOf: ReadonlyMap<string, string>;
  /** Rows a supersede may point at. */
  liveRows: readonly AssumptionView[];
  busy: boolean;
  form: OpenForm;
  setForm: (form: OpenForm) => void;
  handlers: RowHandlers;
}

/**
 * Of the rows in use (callers pass only those), one the team still has to
 * answer: open, stale since it was answered, or with no owner role.
 */
const toAnswer = (row: AssumptionView, ctx: RowContext) =>
  row.status === "open" ||
  (ctx.stale.has(row.id) && answered(row)) ||
  ownerNeedsRole(row);

function Disclosure({
  className,
  defaultOpen = false,
  summary,
  testId,
  children,
}: {
  className: string;
  defaultOpen?: boolean;
  summary: ReactNode;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <details
      className={cx("disc", "list", className)}
      open={defaultOpen || undefined}
      data-testid={testId}
    >
      <summary>
        {summary}
        <span className={cx("disc-toggle")}>
          <span className={cx("when-closed")}>Show</span>
          <span className={cx("when-open")}>Hide</span>
        </span>
      </summary>
      {children}
    </details>
  );
}

// ── Compact group (phase pages) ─────────────────────────────────────────────

function CompactGroup({
  rows,
  ctx,
  notes,
  theme,
  onOpenFullView,
}: {
  rows: readonly AssumptionView[];
  ctx: RowContext | null;
  notes: ReactNode[];
  theme: "light" | "dark" | null;
  onOpenFullView?: () => void;
}) {
  const counted = rows.filter((row) => COUNT_ORDER.includes(row.status));
  const inUse = counted.filter((row) => isCountedStatus(row.status));
  const open = ctx
    ? inRegisterOrder(inUse.filter((r) => toAnswer(r, ctx)))
    : [];
  const counts = COUNT_ORDER.map(
    (status) =>
      [status, counted.filter((row) => row.status === status).length] as const,
  ).filter(([, n]) => n > 0);
  if (ctx && counted.length === 0 && notes.length === 0) return null;
  return (
    <div className={cx("root", "reg-root")} data-theme={theme ?? undefined}>
      <section
        className={cx("group")}
        aria-label="Assumptions register"
        data-testid="assumption-register-compact"
      >
        <h2
          className={cx("eyebrow", "group-title")}
          data-testid="arp-compact-title"
        >
          Assumptions register
          {ctx ? ` · ${inUse.length} in use` : ""}
          {open.length ? ` · ${open.length} to answer` : ""}
        </h2>
        {notes}
        {ctx && counted.length > 0 ? (
          <Disclosure
            className="settled"
            summary={
              <span className={cx("what")} data-testid="arp-compact-counts">
                {counts
                  .map(
                    ([status, n]) =>
                      `${n} ${STATUS_LABEL[status].toLowerCase()}`,
                  )
                  .join(" · ")}
              </span>
            }
          >
            {open.length ? (
              <ul className={cx("items")} data-testid="arp-compact-open">
                {open.map((row) => (
                  <RegisterRow key={row.id} row={row} ctx={ctx} compact />
                ))}
              </ul>
            ) : (
              <p className={cx("reg-empty")}>
                Nothing open: every assumption in use is answered.
              </p>
            )}
            {onOpenFullView ? (
              <p className={cx("reg-foot")}>
                <button
                  type="button"
                  className={cx("link-btn", "inline")}
                  onClick={onOpenFullView}
                  data-testid="arp-open-full"
                >
                  Open the full register →
                </button>
              </p>
            ) : null}
          </Disclosure>
        ) : null}
      </section>
    </div>
  );
}

// ── Full register view (the Record entry) ──────────────────────────────────

function FullRegister({
  rows,
  ctx,
  onAdd,
}: {
  rows: readonly AssumptionView[];
  ctx: RowContext;
  onAdd: (body: Record<string, unknown>) => void;
}) {
  const [view, setView] = useState<"area" | "owner">("area");
  const [copy, setCopy] = useState<CopyState>({ state: "idle" });
  const proposals = inRegisterOrder(
    rows.filter((row) => row.status === "proposed"),
  );
  const live = ctx.liveRows;
  const gone = inRegisterOrder(
    rows.filter(
      (row) => row.status === "superseded" || row.status === "rejected",
    ),
  );
  const open = live.filter((row) => toAnswer(row, ctx));

  const copyOpenQuestions = async () => {
    const text = openQuestionsText(open, ctx.figuresRedacted);
    try {
      // No clipboard (or a refused one) throws, and lands in the fallback.
      await navigator.clipboard.writeText(text);
      setCopy({ state: "copied", count: open.length });
    } catch {
      setCopy({ state: "manual", text });
    }
  };

  return (
    <>
      <div className={cx("toolbar")}>
        <div className={cx("seg")} role="radiogroup" aria-label="View">
          {(
            [
              ["area", "By area"],
              ["owner", "By owner"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={view === key}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={cx("item-state")} data-testid="arp-totals">
          {live.length} in use · {open.length} to answer
        </span>
        {ctx.actionable && ctx.form?.kind !== "add" ? (
          <button
            type="button"
            className={cx("link-btn")}
            disabled={ctx.busy}
            onClick={() => ctx.setForm({ kind: "add" })}
          >
            Add an assumption
          </button>
        ) : null}
      </div>
      {ctx.actionable && ctx.form?.kind === "add" ? (
        <NewRowForm
          mode="add"
          busy={ctx.busy}
          onCancel={() => ctx.setForm(null)}
          onSubmit={onAdd}
        />
      ) : null}
      <div className={cx("work")}>
        {proposals.length ? (
          <section className={cx("group")} data-testid="arp-proposals">
            <h3 className={cx("eyebrow", "group-title")}>
              aVa proposals · not yet in the register · {proposals.length}
            </h3>
            <div className={cx("list", "reg-list")}>
              <ul className={cx("items")}>
                {proposals.map((row) => (
                  <ProposalRow key={row.id} row={row} ctx={ctx} />
                ))}
              </ul>
            </div>
          </section>
        ) : null}
        {live.length === 0 && proposals.length === 0 && gone.length === 0 ? (
          <p className={cx("reg-meta")} data-testid="arp-empty">
            No assumptions on this Move&apos;s register yet.
          </p>
        ) : null}
        {view === "area" ? (
          ASSUMPTION_AREAS.map((area) => {
            const inArea = live.filter((row) => row.area === area);
            if (!inArea.length) return null;
            const openInArea = inArea.filter((r) => r.status === "open").length;
            return (
              <Disclosure
                key={area}
                className="phase-group"
                defaultOpen
                testId={`arp-area-${area}`}
                summary={
                  <span className={cx("eyebrow")}>
                    {AREA_LABEL[area]} · {inArea.length}
                    {openInArea ? ` · ${openInArea} open` : ""}
                  </span>
                }
              >
                <ul className={cx("items")}>
                  {inArea.map((row) => (
                    <RegisterRow key={row.id} row={row} ctx={ctx} />
                  ))}
                </ul>
              </Disclosure>
            );
          })
        ) : (
          <>
            {byOwner(open).map(([owner, group]) => (
              <Disclosure
                key={owner}
                className="phase-group"
                defaultOpen
                testId={`arp-owner-${owner}`}
                summary={
                  <span className={cx("eyebrow")}>
                    {owner} · {group.length} to answer
                  </span>
                }
              >
                <ul className={cx("items")}>
                  {group.map((row) => (
                    <RegisterRow key={row.id} row={row} ctx={ctx} />
                  ))}
                </ul>
              </Disclosure>
            ))}
            <div className={cx("carry")}>
              {ctx.actionable && open.length ? (
                <button
                  type="button"
                  className={cx("link-btn", "inline")}
                  onClick={() => void copyOpenQuestions()}
                >
                  Copy the open questions for the client
                </button>
              ) : null}{" "}
              <span>
                {open.length
                  ? "Grouped by who holds each answer, the way the hand-off back to the client reads."
                  : "Nothing to answer: every assumption in use is answered."}
              </span>
              {copy.state === "copied" ? (
                <span role="status" data-testid="arp-copied">
                  Copied {copy.count} open question
                  {copy.count === 1 ? "" : "s"}.
                </span>
              ) : null}
              {copy.state === "manual" ? <ManualCopy text={copy.text} /> : null}
            </div>
          </>
        )}
        {gone.length ? (
          <Disclosure
            className="phase-group"
            testId="arp-gone"
            summary={
              <span className={cx("eyebrow")}>
                Superseded and rejected · {gone.length}
              </span>
            }
          >
            <ul className={cx("items")}>
              {gone.map((row) => (
                <RegisterRow key={row.id} row={row} ctx={ctx} />
              ))}
            </ul>
          </Disclosure>
        ) : null}
      </div>
    </>
  );
}

/** The clipboard was not available: the text is selected for the person to copy. */
function ManualCopy({ text }: { text: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, [text]);
  return (
    <label className={cx("form-grid")}>
      <span role="status">
        The clipboard is not available here. The text is selected: copy it with
        your keyboard.
      </span>
      <textarea
        ref={ref}
        readOnly
        className={cx("cell-input", "reg-copy")}
        aria-label="Open questions for the client"
        value={text}
      />
    </label>
  );
}

// ── Rows ────────────────────────────────────────────────────────────────────

const WITHHELD_FIGURE = "Figure withheld · no financial visibility";

/** The figure line: an ESTIMATE with its source, or withheld. */
function FigureLine({
  row,
  withheld,
}: {
  row: AssumptionView;
  withheld: boolean;
}) {
  if (withheld) {
    return (
      <span className={cx("src")}>
        <span className={cx("withheld")}>{WITHHELD_FIGURE}</span>
      </span>
    );
  }
  // A corrected row stands only on its answer (`effectiveFigure`).
  const fromAnswer = answered(row) && row.answerFigure !== null;
  const figure = isCountedStatus(row.status)
    ? effectiveFigure(row)
    : row.workingFigure;
  const cite = (fromAnswer ? row.answerSource : row.source) ?? undefined;
  return figure ? (
    <SourceLine source={{ kind: "est", text: figure, cite }} />
  ) : (
    <SourceLine
      source={{ kind: "team", text: "No working figure stated", cite }}
    />
  );
}

function RegisterRow({
  row,
  ctx,
  compact = false,
}: {
  row: AssumptionView;
  ctx: RowContext;
  compact?: boolean;
}) {
  const withheld = ctx.figuresRedacted || row.figuresRedacted;
  const isStale = ctx.stale.has(row.id) && isCountedStatus(row.status);
  const needsRole = ownerNeedsRole(row);
  const form =
    ctx.form && ctx.form.kind !== "add" && ctx.form.rowId === row.id
      ? ctx.form.kind
      : null;
  const can = ctx.actionable && !withheld && form === null;
  const canAnswer = row.status === "open" || (isStale && answered(row));
  const canSetRole = needsRole && EDITABLE_STATUSES.includes(row.status);
  const canSupersede = !compact && allows("supersede", row.status);

  const meta = [
    needsRole ? (
      <b key="owner" data-testid="arp-needs-role">
        {OWNER_NEEDS_ROLE_LABEL}
      </b>
    ) : (
      row.ownerRole
    ),
    `${confidenceWord(row.confidence)} confidence`,
    ORIGIN_LABEL[row.origin],
  ];

  return (
    <li data-testid={`arp-row-${row.registerId}`}>
      <span>
        <span className={cx("item-name")}>
          {row.registerId} · {row.statement}
        </span>
        {row.whyItMatters ? (
          <span className={cx("item-note")}>{row.whyItMatters}</span>
        ) : null}
        <FigureLine row={row} withheld={withheld} />
        <span className={cx("reg-meta")} data-testid="arp-meta">
          {meta.map((part, index) => (
            <span key={index}>
              {index ? " · " : ""}
              {part}
            </span>
          ))}
        </span>
        {answered(row) ? (
          <span className={cx("reg-meta")} data-testid="arp-answer">
            {withheld ? (
              <span className={cx("withheld")}>Answer withheld</span>
            ) : (
              (row.answer ??
              (row.status === "confirmed"
                ? "Confirmed as stated"
                : "Corrected"))
            )}
            {row.answerSource ? ` · ${row.answerSource}` : ""}
          </span>
        ) : null}
        {row.status === "superseded" ? (
          <span className={cx("reg-meta")}>
            Replaced by{" "}
            {(row.supersededBy && ctx.registerIdOf.get(row.supersededBy)) ??
              "another row"}
            . Documents citing [A:{row.registerId}] show it as superseded.
          </span>
        ) : null}
        {row.status === "rejected" ? (
          <span className={cx("reg-meta")}>
            Rejected as a proposal; it never joined the register.
          </span>
        ) : null}
        {isStale ? (
          <span className={cx("reg-meta")} data-testid="arp-stale">
            <span className={cx("lead")}>Re-check.</span>{" "}
            {answered(row)
              ? "The charter answer this row was raised from changed after it was answered."
              : "The charter answer this row was raised from has changed since it was raised."}
          </span>
        ) : null}
        {form === "answer" ? (
          <AnswerForm
            row={row}
            busy={ctx.busy}
            onCancel={() => ctx.setForm(null)}
            onSubmit={(body) => ctx.handlers.onAnswer(row, body)}
          />
        ) : null}
        {form === "role" ? (
          <RoleForm
            busy={ctx.busy}
            onCancel={() => ctx.setForm(null)}
            onSubmit={(role) => ctx.handlers.onSetRole(row, role)}
          />
        ) : null}
        {form === "supersede" ? (
          <SupersedeForm
            row={row}
            targets={ctx.liveRows.filter((other) => other.id !== row.id)}
            busy={ctx.busy}
            onCancel={() => ctx.setForm(null)}
            onSubmit={(body) => ctx.handlers.onSupersede(row, body)}
          />
        ) : null}
      </span>
      <span className={cx("item-actions")}>
        <span className={cx("item-state")} data-testid="arp-status">
          {STATUS_LABEL[row.status]}
        </span>
        {can && canAnswer ? (
          <button
            type="button"
            className={cx(isStale ? "btn-line" : "link-btn")}
            disabled={ctx.busy}
            onClick={() => ctx.setForm({ kind: "answer", rowId: row.id })}
          >
            {isStale && answered(row) ? "Re-answer…" : "Answer…"}
          </button>
        ) : null}
        {can && canSetRole ? (
          <button
            type="button"
            className={cx("link-btn")}
            disabled={ctx.busy}
            onClick={() => ctx.setForm({ kind: "role", rowId: row.id })}
          >
            Set role…
          </button>
        ) : null}
        {can && canSupersede ? (
          <button
            type="button"
            className={cx("link-btn")}
            disabled={ctx.busy}
            onClick={() => ctx.setForm({ kind: "supersede", rowId: row.id })}
          >
            Supersede…
          </button>
        ) : null}
      </span>
    </li>
  );
}

function ProposalRow({ row, ctx }: { row: AssumptionView; ctx: RowContext }) {
  const withheld = ctx.figuresRedacted || row.figuresRedacted;
  const can =
    ctx.actionable &&
    !withheld &&
    (allows("accept", row.status) || allows("reject", row.status));
  const decide = (action: "accept" | "reject") =>
    ctx.handlers.onDecide(row, action);
  return (
    <li data-testid={`arp-proposal-${row.registerId}`}>
      <span>
        <span className={cx("ava-badge")}>{PROPOSAL_BADGE[row.origin]}</span>
        <span className={cx("item-name")}>{row.statement}</span>
        <span className={cx("item-note")}>
          {[row.whyItMatters, AREA_LABEL[row.area], row.ownerRole]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {withheld ? (
          <FigureLine row={row} withheld />
        ) : row.workingFigure ? (
          <SourceLine
            source={{ kind: "est", text: row.workingFigure, cite: row.source }}
          />
        ) : (
          <span className={cx("src")}>
            <span className={cx("cite")}>
              Working figure to be set: the source states none
            </span>
            <span className={cx("cite")}> · {row.source}</span>
          </span>
        )}
      </span>
      <span className={cx("item-actions")}>
        {can ? (
          <>
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={ctx.busy}
              onClick={() => decide("accept")}
            >
              Accept
            </button>
            <button
              type="button"
              className={cx("link-btn")}
              disabled={ctx.busy}
              onClick={() => decide("reject")}
            >
              Reject
            </button>
          </>
        ) : null}
      </span>
    </li>
  );
}

// ── Forms (inline, canonical inputs) ───────────────────────────────────────

function FormActions({
  submitLabel,
  submitClass = "btn-ink",
  ready,
  busy,
  onCancel,
}: {
  submitLabel: string;
  submitClass?: string;
  ready: boolean;
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <span className={cx("item-actions")}>
      <button
        type="submit"
        className={cx(submitClass)}
        disabled={busy || !ready}
      >
        {submitLabel}
      </button>
      <button type="button" className={cx("link-btn")} onClick={onCancel}>
        Cancel
      </button>
    </span>
  );
}

function Seg<K extends string | number>({
  label,
  options,
  value,
  onChange,
  small = false,
}: {
  label: string;
  options: ReadonlyArray<readonly [K, string]>;
  value: K | null;
  onChange: (value: K) => void;
  small?: boolean;
}) {
  return (
    <div
      className={cx("seg", small && "seg-sm")}
      role="radiogroup"
      aria-label={label}
    >
      {options.map(([key, text]) => (
        <button
          key={String(key)}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

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
  const outcomes = (
    [
      ["confirmed", "Confirmed"],
      ["corrected", "Corrected"],
    ] as const
  ).filter(([key]) =>
    allows(key === "confirmed" ? "confirm" : "correct", row.status),
  );
  // Nothing is preselected unless only one outcome is allowed.
  const [outcome, setOutcome] = useState<"confirmed" | "corrected" | null>(
    outcomes.length === 1 ? outcomes[0][0] : null,
  );
  const [figure, setFigure] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const ready =
    outcome !== null &&
    present(source) &&
    (outcome === "confirmed" || present(figure));

  return (
    <form
      className={cx("warn-inline")}
      aria-label={`Answer ${row.registerId}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        onSubmit(
          outcome === "confirmed"
            ? {
                outcome,
                answerSource: source,
                answer: present(note) ? note : null,
                answerFigure: null,
              }
            : {
                outcome,
                answerSource: source,
                answerFigure: figure,
                answer: present(note) ? note : `Corrected to ${figure}`,
              },
        );
      }}
    >
      <span>
        <span className={cx("lead")}>Answer {row.registerId}.</span> A source is
        required.
      </span>
      <Seg
        label="Answer"
        options={outcomes}
        value={outcome}
        onChange={setOutcome}
        small
      />
      <div className={cx("form-grid")}>
        {outcome === "corrected" ? (
          <label>
            Corrected figure
            <input
              className={cx("cell-input")}
              value={figure}
              onChange={(e) => setFigure(e.target.value)}
              placeholder="e.g. 24 h per view"
            />
          </label>
        ) : null}
        <label>
          Source
          <input
            className={cx("cell-input")}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. BI lead, Oct 16"
          />
        </label>
        <label className={cx("span2")}>
          Note (optional)
          <input
            className={cx("cell-input")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>
      <FormActions
        submitLabel="Save answer"
        ready={ready}
        busy={busy}
        onCancel={onCancel}
      />
    </form>
  );
}

function RoleForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (ownerRole: string) => void;
}) {
  const [role, setRole] = useState("");
  const readsLikeName = present(role) && looksLikePersonalName(role);
  const ready = present(role) && !readsLikeName;
  return (
    <form
      className={cx("warn-inline")}
      aria-label="Set the owner role"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onSubmit(role);
      }}
    >
      <span>
        The charter named a person. The register holds roles, so the answer can
        move with the job.
      </span>
      <div className={cx("form-grid")}>
        <label>
          Owner role
          <input
            className={cx("cell-input")}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Finance lead"
          />
        </label>
      </div>
      {readsLikeName ? (
        <span className={cx("reg-meta")} data-testid="arp-role-is-name">
          That reads like a person&apos;s name. Enter the role they hold.
        </span>
      ) : null}
      <FormActions
        submitLabel="Set role"
        ready={ready}
        busy={busy}
        onCancel={onCancel}
      />
    </form>
  );
}

/**
 * Supersede. The register keeps the row in its history and points it at what
 * replaces it, so the form requires that replacement — an existing row, or a
 * new assumption — and it is the reason the history shows.
 */
function SupersedeForm({
  row,
  targets,
  busy,
  onCancel,
  onSubmit,
}: {
  row: AssumptionView;
  targets: readonly AssumptionView[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [by, setBy] = useState<"existing" | "new" | null>(
    targets.length ? null : "new",
  );
  const [target, setTarget] = useState("");
  return (
    <div className={cx("warn-inline")} data-testid="arp-supersede-form">
      <span>
        Superseding keeps {row.registerId} in the history; documents citing [A:
        {row.registerId}] show it as superseded. Say what replaces it.
      </span>
      {targets.length ? (
        <Seg
          label="Replaced by"
          options={[
            ["existing", "A row already in the register"],
            ["new", "A new assumption"],
          ]}
          value={by}
          onChange={setBy}
        />
      ) : null}
      {by === "existing" ? (
        <form
          aria-label={`Supersede ${row.registerId}`}
          className={cx("reg-subform")}
          onSubmit={(event) => {
            event.preventDefault();
            if (target) onSubmit({ supersededBy: target });
          }}
        >
          <div className={cx("form-grid")}>
            <label className={cx("span2")}>
              Replaced by
              <select
                className={cx("cell-input")}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Choose a row…</option>
                {targets.map((other) => (
                  <option key={other.id} value={other.id}>
                    {other.registerId} · {other.statement}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <FormActions
            submitLabel="Supersede"
            submitClass="btn-line"
            ready={target !== ""}
            busy={busy}
            onCancel={onCancel}
          />
        </form>
      ) : null}
      {by === "new" ? (
        <NewRowForm
          mode="supersede"
          initial={row}
          busy={busy}
          onCancel={onCancel}
          onSubmit={(replacement) => onSubmit({ replacement })}
        />
      ) : null}
      {by === null ? (
        <span className={cx("item-actions")}>
          <button type="button" className={cx("link-btn")} onClick={onCancel}>
            Cancel
          </button>
        </span>
      ) : null}
    </div>
  );
}

/** A new row: added to the register, or replacing a superseded one (same area). */
function NewRowForm({
  mode,
  initial,
  busy,
  onCancel,
  onSubmit,
}: {
  mode: "add" | "supersede";
  initial?: AssumptionView;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [area, setArea] = useState<AssumptionArea | "">("");
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [why, setWhy] = useState(initial?.whyItMatters ?? "");
  const [figure, setFigure] = useState(initial?.workingFigure ?? "");
  const [source, setSource] = useState("");
  const [ownerRole, setOwnerRole] = useState(
    initial && !ownerNeedsRole(initial) ? initial.ownerRole : "",
  );
  const [confidence, setConfidence] = useState<RegisterConfidence>(
    initial?.confidence ?? 3,
  );
  const readsLikeName = present(ownerRole) && looksLikePersonalName(ownerRole);
  const ready =
    (mode === "supersede" || area !== "") &&
    present(statement) &&
    present(figure) &&
    present(source) &&
    present(ownerRole) &&
    !readsLikeName;
  const title =
    mode === "add" ? "Add an assumption" : `Replace ${initial?.registerId}`;

  return (
    <form
      className={cx(mode === "add" ? "ctx-body" : "reg-subform")}
      aria-label={title}
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        onSubmit({
          ...(mode === "add" ? { area } : {}),
          statement,
          whyItMatters: present(why) ? why : null,
          workingFigure: figure,
          source,
          ownerRole,
          confidence,
        });
      }}
    >
      <div className={cx("form-grid")}>
        {mode === "add" ? (
          <label>
            Area
            <select
              className={cx("cell-input")}
              value={area}
              onChange={(e) => setArea(e.target.value as AssumptionArea)}
            >
              <option value="">Choose…</option>
              {ASSUMPTION_AREAS.map((option) => (
                <option key={option} value={option}>
                  {AREA_LABEL[option]} ({AREA_ID_PREFIX[option]})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Owner role
          <input
            className={cx("cell-input")}
            value={ownerRole}
            onChange={(e) => setOwnerRole(e.target.value)}
            placeholder="e.g. Delivery lead"
          />
        </label>
        <label className={cx("span2")}>
          Assumption
          <input
            className={cx("cell-input")}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
        </label>
        <label className={cx("span2")}>
          Why it matters (optional)
          <input
            className={cx("cell-input")}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />
        </label>
        <label>
          <span>
            <SourceTag kind="est" />
            Working figure
          </span>
          <input
            className={cx("cell-input")}
            value={figure}
            onChange={(e) => setFigure(e.target.value)}
            placeholder="e.g. ~24 h per source"
          />
        </label>
        <label>
          Source
          <input
            className={cx("cell-input")}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Delivery notes, Oct 16, p.2"
          />
        </label>
        <div className={cx("span2")}>
          <span className={cx("reg-meta")}>Confidence</span>
          <Seg
            label="Confidence"
            options={REGISTER_CONFIDENCE_SCORES.map(
              (score) => [score, confidenceWord(score)] as const,
            )}
            value={confidence}
            onChange={setConfidence}
            small
          />
        </div>
      </div>
      {readsLikeName ? (
        <span className={cx("reg-meta")} data-testid="arp-role-is-name">
          That reads like a person&apos;s name. Enter the role they hold.
        </span>
      ) : null}
      <span className={cx("ava-actions")}>
        <FormActions
          submitLabel={mode === "add" ? "Add to the register" : "Supersede"}
          submitClass={mode === "add" ? "btn-ink" : "btn-line"}
          ready={ready}
          busy={busy}
          onCancel={onCancel}
        />
      </span>
    </form>
  );
}
