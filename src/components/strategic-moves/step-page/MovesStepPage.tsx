"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { StepDepth } from "@/lib/programs/phase-workflow-registry";
import {
  groupStepRows,
  type StepNextAction,
  type StepRow,
} from "@/lib/programs/step-page-model";
import styles from "./MovesStepPage.module.css";

/**
 * The Moves step page: the canonical capture shell (Header, PhaseBar,
 * StepBar) around the five fixed Main regions of the step page template —
 * StepHead, NextAction, Context, Work, Footer. aVa is NOT drawn here: the host
 * renders this page as the workspace of the product's existing AgentDock
 * (`MovesCaptureWorkspace`), so aVa keeps its one design — collapse, hide,
 * expand, full screen and the Ask aVa mark — on every surface.
 *
 * Ported from Claude Design's final template (v1.1). A step supplies rows and
 * copy; the page rules (grouping, the next-action sentence, the five states)
 * come from `step-page-model`, so no step page owns layout or state logic.
 */

// A name may carry several classes ("list settled"): each is mapped, so a
// module class is never passed through unhashed.
const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .flatMap((name) => name.split(/\s+/))
    .filter(Boolean)
    .map((name) => styles[name] ?? name)
    .join(" ");

/** The intelligence labels. Only `fact` and `est` may carry a number. */
export type SourceKind =
  | "fact"
  | "est"
  | "pattern"
  | "ava"
  | "hard"
  | "soft"
  | "public"
  | "team";

export interface SourceRef {
  kind: SourceKind;
  text: string;
  /** Where it came from: "P2 discovery report", "Session notes, p.2". */
  cite?: string;
}

const TAG: Record<SourceKind, { label: string; tone: string } | null> = {
  fact: { label: "Fact", tone: "t-fact" },
  est: { label: "Estimate", tone: "t-est" },
  pattern: { label: "Pattern", tone: "t-pattern" },
  ava: { label: "Ava’s reading", tone: "t-ava" },
  hard: { label: "Required", tone: "t-fact" },
  soft: { label: "Advisory", tone: "t-pattern" },
  // Template v1.9: a claim from an APPROVED public source. Muted, never FACT —
  // a public source is not a fact about the client.
  public: { label: "Public source", tone: "t-pattern" },
  team: null,
};

export function SourceTag({ kind }: { kind: SourceKind }) {
  const tag = TAG[kind];
  return tag ? <span className={cx("tag", tag.tone)}>{tag.label}</span> : null;
}

function Cite({ text }: { text?: string }) {
  return text ? <span className={cx("cite")}> · {text}</span> : null;
}

/** One labelled line under a row subject or proposal. */
export function SourceLine({ source }: { source: SourceRef }) {
  if (source.kind === "pattern") {
    return (
      <span className={cx("src")}>
        <SourceTag kind="pattern" />
        <span className={cx("cite")}>
          {source.text}
          {source.cite ? ` · ${source.cite}` : ""}
        </span>
      </span>
    );
  }
  return (
    <span className={cx("src")}>
      <SourceTag kind={source.kind} />
      {source.text}
      <Cite text={source.cite} />
    </span>
  );
}

/** The template's disclosure: a summary that reads "Show" / "Hide". */
export function Disclosure({
  closed,
  opened,
  className,
  defaultOpen = false,
  summaryExtra,
  children,
}: {
  closed: string;
  opened: string;
  className?: string;
  defaultOpen?: boolean;
  summaryExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className={cx("disc", className)} open={defaultOpen || undefined}>
      <summary>
        {summaryExtra}
        <span className={cx("disc-toggle")}>
          <span className={cx("when-closed")}>{closed}</span>
          <span className={cx("when-open")}>{opened}</span>
        </span>
      </summary>
      {children}
    </details>
  );
}

function Basis({ items }: { items: readonly SourceRef[] }) {
  return (
    <Disclosure closed="Show basis" opened="Hide basis" className="basis">
      <div className={cx("basis-body")}>
        {items.map((item, index) => (
          <p key={index}>
            <SourceTag kind={item.kind} />
            {item.cite ? item.text.replace(/\.$/, "") : item.text}
            <Cite text={item.cite} />
          </p>
        ))}
      </div>
    </Disclosure>
  );
}

/** A row as a step adapter renders it. */
export interface StepPageRow extends StepRow {
  /** Short name for the settled summary line: "ownership". */
  shortName: string;
  /** The Fact line(s) under the subject. */
  facts?: readonly SourceRef[];
  /** The proposal, decision text or inline editor. */
  middle: ReactNode;
  /** At most one ink button plus one quiet link; a conflict, two outlines. */
  actions?: ReactNode;
  /** The collapsed trail: facts, pattern, quotes, Ava's reading. */
  basis?: readonly SourceRef[];
  /** For an instrument (table, sequence) that needs the full width. */
  wide?: boolean;
  /** Mono eyebrow when it is not the id alone: "RANK 02 · RC-3", "GATE DOCUMENTS". */
  eyebrow?: string;
}

function RowView({ row }: { row: StepPageRow }) {
  const subject = (
    <div>
      <span className={cx("rc-id")}>
        {(row.eyebrow ?? row.id).toUpperCase()}
      </span>
      <span className={cx("rc-cause")}>{row.subject}</span>
      {row.facts?.map((fact, index) => (
        <SourceLine key={index} source={fact} />
      ))}
    </div>
  );
  const actions = <div className={cx("row-actions")}>{row.actions}</div>;
  const basis = row.basis?.length ? <Basis items={row.basis} /> : null;
  if (row.wide) {
    return (
      <div className={cx("row", "wide")} id={`row-${row.id}`}>
        <div className={cx("wide-head")}>{subject}</div>
        <div className={cx("wide-body")}>{row.middle}</div>
        {row.actions ? <div className={cx("wide-foot")}>{actions}</div> : null}
        {basis}
      </div>
    );
  }
  return (
    <div className={cx("row")} id={`row-${row.id}`}>
      {subject}
      {row.middle}
      {actions}
      {basis}
    </div>
  );
}

/**
 * One row as the page renders it, for a step's output block (template v1.9),
 * which sits after the groups as its own section.
 */
export const StepRowView = RowView;

function Group({
  title,
  rows,
  after,
}: {
  title: string;
  rows: readonly StepPageRow[];
  after?: ReactNode;
}) {
  if (rows.length === 0) return null;
  return (
    <section className={cx("group")}>
      <h2 className={cx("eyebrow", "group-title")}>
        {title} · {rows.length}
      </h2>
      <div className={cx("list")}>
        {rows.map((row) => (
          <RowView key={row.id} row={row} />
        ))}
        {after ? <div className={cx("list-foot")}>{after}</div> : null}
      </div>
    </section>
  );
}

function CollapsedGroup({
  title,
  rows,
  defaultOpen,
}: {
  title: string;
  rows: readonly StepPageRow[];
  defaultOpen: boolean;
}) {
  if (rows.length === 0) return null;
  // A row's id reads in the summary only where the row itself shows it: an
  // eyebrow such as "Direction" replaces an internal id like "DIR".
  const summary = rows
    .map((row) =>
      !row.eyebrow || row.eyebrow.includes(row.id)
        ? `${row.id} ${row.shortName}`
        : row.shortName,
    )
    .join(", ");
  return (
    <section className={cx("group")}>
      <h2 className={cx("eyebrow", "group-title")}>
        {title} · {rows.length}
      </h2>
      <Disclosure
        closed="Show"
        opened="Hide"
        className="list settled"
        defaultOpen={defaultOpen}
        summaryExtra={<span className={cx("what")}>{summary}</span>}
      >
        {rows.map((row) => (
          <RowView key={row.id} row={row} />
        ))}
      </Disclosure>
    </section>
  );
}

/** A gate check listed under the next action on steps that feed a gate. */
export interface StepPageCheck {
  met: boolean;
  /** The gate state could not be read: neither met nor unmet. */
  unknown?: boolean;
  level: "hard" | "soft";
  text: string;
  /** The row that settles it, linked while unmet. */
  targetRowId?: string;
  note?: string;
}

const DEPTH_LABEL: Record<StepDepth, string> = {
  full: "Full",
  light: "Light",
  skip: "Skipped",
};

export interface StepPagePhase {
  code: string;
  name: string;
  /** "Done", "Not started", … ; the current phase shows its step instead. */
  status: string;
  current?: boolean;
  href?: string;
}

export interface StepPageStep {
  title: string;
  depth: StepDepth;
  href?: string;
  /**
   * Whether this step is complete. Defaults to "before the current step"; a
   * host that can prove completion per step passes it so an unfinished earlier
   * step is never ticked.
   */
  done?: boolean;
}

export interface MovesStepPageProps {
  moveName: string;
  /** Authenticated Move tenant, visible on every step page. */
  clientDisplayName: string;
  /** Shown beside the theme toggle when the Move's data is synthetic. */
  syntheticNote?: string;
  phases: readonly StepPagePhase[];
  phaseCode: string;
  phaseName: string;
  steps: readonly StepPageStep[];
  stepIndex: number;
  title: string;
  intro: string;
  nextAction: StepNextAction;
  /** Optional link closing a blocked sentence: "Open P2 Discover →". */
  blockedLink?: { label: string; href: string };
  /** An action closing the blocked sentence, e.g. "Try again" (v1.6). */
  blockedAction?: { label: string; onClick: () => void };
  /**
   * An action at the right end of the Context line, e.g. the step's upload
   * control (v1.6). Clicking it never toggles the Details disclosure.
   */
  contextAction?: ReactNode;
  checks?: readonly StepPageCheck[];
  checksLabel?: string;
  /** A gate step keeps its checks visible while blocked, all "not evaluated". */
  checksWhenBlocked?: boolean;
  /** Region 3: the one-line summary items and the expanded details. */
  context: {
    items: readonly ReactNode[];
    details: ReadonlyArray<{ term: string; detail: ReactNode }>;
  };
  /**
   * The skip attestation the gate checks. Required when the depth is skip.
   * Template v1.10: a step skipped by its route names the attestation
   * (`title`), labels its owner (`ownerLabel`), says how it was recorded, and
   * replaces the context line with its route's own (`context`). The only way
   * out of Skipped is `Re-check the P2 route →` (`routeHref`); depth is never
   * changed on a step page.
   */
  skipped?: {
    /** The team's words; null when the attestation is not written yet. */
    statement: string | null;
    owner: string;
    date: string;
    title?: string;
    ownerLabel?: string;
    recorded?: string;
    context?: ReactNode;
    routeHref?: string;
  };
  /**
   * What the Work region shows while blocked: one muted sentence, plus any
   * unsaved input the step must keep (template v1.5: unsaved input survives
   * Blocked).
   */
  blockedWork?: ReactNode;
  /**
   * The decision group's heading. A viewer who cannot act sees "Waiting on
   * <name>" instead of "Needs your decision" (template v1.5).
   */
  decisionGroupTitle?: string;
  /** What this step hands forward, closing the Work region: "Carries to P4". */
  carry?: { label: string; text: ReactNode };
  /** Closes the Work region at a gate step instead of a carry line: the Next card. */
  workEnd?: ReactNode;
  /**
   * Sits after the Settled group, before the carry line: e.g. the collapsed
   * "Assumptions this step relies on" (template v1.10).
   */
  afterGroups?: ReactNode;
  /** The workspace tab strip (Steps · Files · Record), under the header. */
  tabs?: ReactNode;
  /** The ranked list's foot: "Confirm this order". */
  rankingFoot?: ReactNode;
  /** Replaces `N of M settled`, e.g. "5 of 6 required checks met" at a gate. */
  countLabel?: string;
  /** Once the last step is submitted: replaces the forward button. */
  submittedLabel?: string;
  rows: readonly StepPageRow[];
  continueLabel?: string;
  onContinue?: () => void;
  onBack?: () => void;
}

/** The step pages' theme: the saved `mv-theme` toggle, else the system preference. */
export function useStepPageTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("mv-theme");
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      // Storage can be unavailable; the system preference still applies.
    }
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return;
    setSystemDark(query.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  const effective = theme ?? (systemDark ? "dark" : "light");
  const toggle = () => {
    const next = effective === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      window.localStorage.setItem("mv-theme", next);
    } catch {
      // Not persisted; the toggle still applies for this view.
    }
  };
  return { theme, effective, toggle };
}

export function MovesStepPage(props: MovesStepPageProps) {
  const { theme, effective, toggle } = useStepPageTheme();
  const { nextAction, stepIndex, steps } = props;
  const state = nextAction.state;
  const groups = groupStepRows(props.rows);
  const openCount = nextAction.total - nextAction.settled;
  const footerNote =
    state === "in_progress"
      ? ` · ${openCount} still open`
      : state === "blocked"
        ? " · blocked"
        : "";
  const showChecks =
    (state !== "blocked" && state !== "skipped") ||
    (state === "blocked" && props.checksWhenBlocked);
  const countCopy =
    props.countLabel ??
    (nextAction.total === 0
      ? state === "skipped"
        ? "0 actions required"
        : "0 actions ready"
      : `${nextAction.settled} of ${nextAction.total} settled`);
  const doneEyebrow = state === "ready" || state === "done";
  const contextItems = (
    <span className={cx("ctx-items")}>
      {props.context.items.map((item, index) => (
        <span key={index} style={{ display: "contents" }}>
          {index > 0 ? <span className={cx("sep")}>·</span> : null}
          <span>{item}</span>
        </span>
      ))}
    </span>
  );
  const contextAction = props.contextAction ? (
    <span className={cx("ctx-action")}>{props.contextAction}</span>
  ) : null;

  return (
    <div className={cx("root")} data-theme={theme ?? undefined}>
      <div className={cx("shell")}>
        <div className={cx("topline")}>
          <div className={cx("topline-identity")}>
            <span className={cx("eyebrow")}>{props.moveName}</span>
            <span className={cx("tenant-identity")}>
              {props.clientDisplayName}
            </span>
          </div>
          <div className={cx("topline-right")}>
            {props.syntheticNote ? (
              <span className={cx("demo-note")}>{props.syntheticNote}</span>
            ) : null}
            <button type="button" className={cx("link-btn")} onClick={toggle}>
              {effective === "dark" ? "Light" : "Dark"} mode
            </button>
          </div>
        </div>

        {props.tabs}

        <nav className={cx("phase-bar")} aria-label="Phases">
          <ol>
            {props.phases.map((phase) => {
              const body = (
                <>
                  <span className={cx("code")}>
                    {phase.code}
                    {phase.status === "Done" ? (
                      <span
                        className={cx("tick")}
                        role="img"
                        aria-label="complete"
                      >
                        ✓
                      </span>
                    ) : null}
                  </span>
                  <span className={cx("name")}>{phase.name}</span>
                  <span className={cx("count")}>
                    {phase.current
                      ? `Step ${stepIndex + 1} of ${steps.length}`
                      : phase.status}
                  </span>
                </>
              );
              return (
                <li key={phase.code}>
                  {phase.href && !phase.current ? (
                    <a className={cx("phase-tab")} href={phase.href}>
                      {body}
                    </a>
                  ) : (
                    <span
                      className={cx("phase-tab")}
                      aria-current={phase.current ? "page" : undefined}
                    >
                      {body}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <nav className={cx("step-bar")} aria-label={`${props.phaseName} steps`}>
          <ol style={{ ["--steps" as string]: steps.length }}>
            {steps.map((step, index) => {
              const current = index === stepIndex;
              const done = current
                ? state === "done"
                : (step.done ?? index < stepIndex);
              // An earlier step that is not finished is "open": reachable,
              // numbered, never ticked (template v1.5).
              const open = !current && !done && index < stepIndex;
              const depth =
                current && state === "skipped" ? "skip" : step.depth;
              const label = DEPTH_LABEL[depth];
              const inner = (
                <>
                  <span className={cx("step-dot")}>
                    {done ? "✓" : String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={cx("step-title")}>{step.title}</span>
                  {open ? (
                    <span className={cx("step-depth")}>· open</span>
                  ) : label !== "Full" ? (
                    <span className={cx("step-depth")}>· {label}</span>
                  ) : null}
                </>
              );
              return (
                <li
                  key={step.title}
                  className={cx(
                    current
                      ? "is-current"
                      : open
                        ? "is-open"
                        : !done && "is-upcoming",
                    done && "is-done",
                  )}
                >
                  <span className={cx("step-rule")} />
                  {(done || open) && !current && step.href ? (
                    <a className={cx("step-btn")} href={step.href}>
                      {inner}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={cx("step-btn")}
                      aria-current={current ? "step" : undefined}
                      disabled={!current && !done && !open}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className={cx("body")}>
          <main className={cx("main-col")} aria-labelledby="step-panel-title">
            <header className={cx("panel-head")}>
              <span className={cx("eyebrow")}>
                {props.phaseCode} {props.phaseName} · Step {stepIndex + 1} of{" "}
                {steps.length}
              </span>
              <h1 id="step-panel-title" className={cx("panel-title")}>
                {props.title}
              </h1>
              <p className={cx("panel-intro")}>{props.intro}</p>
            </header>

            <section
              className={cx("next")}
              role="status"
              aria-live="polite"
              aria-label="What to do next"
            >
              <div className={cx("next-main")}>
                {doneEyebrow ? (
                  <span className={cx("eyebrow", "done-eyebrow")}>
                    <span className={cx("tick")}>✓</span>
                    {nextAction.eyebrow.replace(/^✓\s*/, "")}
                  </span>
                ) : (
                  <span className={cx("eyebrow")}>{nextAction.eyebrow}</span>
                )}
                <p className={cx("next-do")}>
                  {state === "blocked" &&
                  (props.blockedLink || props.blockedAction)
                    ? nextAction.sentence.replace(/\.$/, ";")
                    : nextAction.sentence}
                  {state === "blocked" && props.blockedLink ? (
                    <>
                      {" "}
                      <a href={props.blockedLink.href}>
                        {props.blockedLink.label}
                      </a>
                    </>
                  ) : null}
                  {state === "blocked" && props.blockedAction ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        className={cx("link-btn", "inline")}
                        onClick={props.blockedAction.onClick}
                      >
                        {props.blockedAction.label}
                      </button>
                    </>
                  ) : null}
                </p>
                {showChecks && props.checks?.length ? (
                  <Disclosure
                    closed={props.checksLabel ?? "Show checks"}
                    opened="Hide checks"
                    className="checks"
                  >
                    <ul>
                      {props.checks.map((check, index) => (
                        <li key={index}>
                          <span>
                            {check.unknown ? (
                              <span
                                className={cx("chk-unknown")}
                                role="img"
                                aria-label="not evaluated"
                              />
                            ) : check.met ? (
                              <span
                                className={cx("tick")}
                                role="img"
                                aria-label="met"
                              >
                                ✓
                              </span>
                            ) : (
                              <span
                                className={cx("chk-open")}
                                role="img"
                                aria-label="not met"
                              />
                            )}
                          </span>
                          <span>
                            <SourceTag kind={check.level} />
                            {check.targetRowId &&
                            !check.met &&
                            !check.unknown ? (
                              <a href={`#row-${check.targetRowId}`}>
                                {check.text}
                              </a>
                            ) : (
                              check.text
                            )}
                            <Cite text={check.note} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Disclosure>
                ) : null}
              </div>
              <span className={cx("next-count")}>{countCopy}</span>
            </section>

            {state === "skipped" && props.skipped ? (
              // v1.10: a plain line, no Details; the only action is the route.
              <div className={cx("context-line")} data-step-context>
                <span className={cx("ctx-items")}>
                  <span>
                    <b>Skipped</b>
                  </span>
                  <span className={cx("sep")}>·</span>
                  <span>
                    {props.skipped.context ??
                      `Attested by ${props.skipped.owner}, ${props.skipped.date}`}
                  </span>
                </span>
                {props.skipped.routeHref ? (
                  <span className={cx("ctx-actions")}>
                    <a
                      className={cx("link-btn", "inline")}
                      href={props.skipped.routeHref}
                    >
                      Re-check the P2 route →
                    </a>
                  </span>
                ) : null}
              </div>
            ) : props.context.details.length === 0 ? (
              // Nothing to expand: the line stands alone, with no Details
              // toggle that would only repeat it (v1.6).
              <div className={cx("context-line")} data-step-context>
                {contextItems}
                {contextAction}
              </div>
            ) : (
              <div className={cx("context-disclosure-row")} data-step-context>
                <Disclosure
                  closed="Details"
                  opened="Hide details"
                  className="context"
                  summaryExtra={contextItems}
                >
                  <div className={cx("ctx-body")}>
                    <dl className={cx("ctx-dl")}>
                      {props.context.details.map(({ term, detail }) => (
                        <div key={term}>
                          <dt className={cx("eyebrow")}>{term}</dt>
                          <dd>{detail}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </Disclosure>
                {contextAction}
              </div>
            )}

            <div className={cx("work")}>
              {state === "blocked" ? (
                <div className={cx("list")}>
                  {typeof props.blockedWork === "string" ||
                  props.blockedWork === undefined ? (
                    <p className={cx("empty-note")}>
                      {props.blockedWork ??
                        "Accepted rows are kept while this step waits."}
                    </p>
                  ) : (
                    props.blockedWork
                  )}
                </div>
              ) : state === "skipped" && props.skipped ? (
                <>
                  <section className={cx("group")}>
                    <h2 className={cx("eyebrow", "group-title")}>
                      {props.skipped.title ?? "Attestation"}
                    </h2>
                    <div className={cx("list")}>
                      <dl className={cx("attest")}>
                        <div>
                          <dt>Statement</dt>
                          <dd>
                            {props.skipped.statement?.trim() ? (
                              `“${props.skipped.statement.trim()}”`
                            ) : (
                              <span className={cx("no")}>
                                Not written yet. Write it as the Move’s
                                business-change boundary answer.
                              </span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>{props.skipped.ownerLabel ?? "Owner"}</dt>
                          <dd>{props.skipped.owner}</dd>
                        </div>
                        <div>
                          <dt>Recorded</dt>
                          <dd>
                            {props.skipped.recorded ??
                              `${props.skipped.date}, with the use-case profile in P2`}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </section>
                  <Group title="Advisory" rows={groups.advisory} />
                </>
              ) : (
                <>
                  <Group
                    title={props.decisionGroupTitle ?? "Needs your decision"}
                    rows={groups.decision}
                  />
                  <Group
                    title="Your ranking"
                    rows={groups.ranked}
                    after={props.rankingFoot}
                  />
                  <Group title="Drafts to review" rows={groups.draft} />
                  {/* v1.10: flags this page cannot settle; never counted. */}
                  <Group title="Advisory" rows={groups.advisory} />
                  <CollapsedGroup
                    title="Set aside"
                    rows={groups.setAside}
                    defaultOpen={false}
                  />
                  <CollapsedGroup
                    title="Settled"
                    rows={groups.settled}
                    defaultOpen={state === "done"}
                  />
                  {props.afterGroups}
                  {props.workEnd}
                  {props.carry ? (
                    <p className={cx("carry")}>
                      <span className={cx("eyebrow")}>{props.carry.label}</span>
                      {props.carry.text}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <footer className={cx("footer")}>
              <span className={cx("footer-count")}>
                Step {stepIndex + 1} of {steps.length}
                {footerNote}
              </span>
              <div className={cx("footer-actions")}>
                {stepIndex > 0 && props.onBack ? (
                  <button
                    type="button"
                    className={cx("btn-quiet")}
                    onClick={props.onBack}
                  >
                    Back
                  </button>
                ) : null}
                {props.submittedLabel ? (
                  <span className={cx("footer-count")}>
                    {props.submittedLabel}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={cx("btn-primary")}
                    disabled={!nextAction.continueEnabled}
                    onClick={props.onContinue}
                  >
                    {props.continueLabel ?? "Continue"}
                  </button>
                )}
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * The workspace tab strip (template v1.2): Steps · Files · Record. Files is
 * the evidence library and Record the read-only decision record; neither
 * carries an action that a step owns.
 */
export function StepPageTabs({
  current,
  hrefs,
}: {
  current: "steps" | "files" | "record";
  hrefs: Record<"steps" | "files" | "record", string>;
}) {
  const tabs = [
    ["steps", "Steps"],
    ["files", "Files"],
    ["record", "Record"],
  ] as const;
  return (
    <nav className={cx("tabs")} aria-label="Workspace">
      <div className={cx("tab-list")}>
        {tabs.map(([key, label]) => (
          <a
            key={key}
            className={cx("tab")}
            href={hrefs[key]}
            aria-current={key === current ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
