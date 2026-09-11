"use client";

import type { ContractEducationView } from "@/lib/source/contract-intelligence/education";
import type { SourceWorkspaceVM } from "./buildViewModel";

/**
 * Contract 360 — the v3 briefing surfaces.
 *
 * Transcribed from the Claude Design contract "Source Contract 360.dc.html".
 * The design's argument, in three rules it applies everywhere:
 *
 *  1. Open with a sentence a reader could repeat out loud, then show what it
 *     rests on. Tiles are evidence *for* the sentence, not a substitute.
 *  2. A count only appears with the denominator it is counted against.
 *  3. A facet the archetype does not require renders as a state — never as a
 *     zero, and never in the same treatment as something that is missing.
 *
 * Figures come from the canonical model. Where the design carried an
 * illustrative number and the model carries nothing, these render the governed
 * refusal rather than the design's placeholder: the design contract wins on
 * form, the canonical model wins on fact.
 */

/* -------------------------------------------------------------------------- */
/* Workflow rail                                                              */
/* -------------------------------------------------------------------------- */

const STEP_TONE: Record<string, string> = {
  complete: "var(--sw-c3-green)",
  current: "var(--sw-c3-red)",
  blocked: "var(--sw-c3-red)",
  future: "var(--sw-c3-rule)",
};

/**
 * The seven-step optimization rail, bound to the governed workflow position.
 *
 * The position comes from `deriveOptimizeWorkflowPosition` — baseline status,
 * required-evidence readiness, amount traceability and opportunity maturity —
 * so the rail cannot show a case as further along than its evidence supports.
 */
export function ContractWorkflowRail({ vm }: { vm: SourceWorkspaceVM }) {
  const workflow = vm.optWorkflow;
  if (!workflow) return null;

  const opportunityCount = vm.opportunityView?.opportunities?.length ?? null;

  return (
    <section className="sw-c3-card">
      <div className="sw-c3-rail-head">
        <span className="sw-c3-display sw-c3-display-sm">
          {workflow.primaryAction}
        </span>
        <span className="sw-c3-note">
          {`Step ${workflow.currentIndex} of ${workflow.steps.length} · ${workflow.currentLabel}`}
          {opportunityCount == null
            ? ""
            : ` · ${opportunityCount} ${
                opportunityCount === 1 ? "opportunity" : "opportunities"
              }`}
        </span>
      </div>

      <div className="sw-c3-rail">
        {workflow.steps.map((step) => (
          <div
            className={
              step.state === "current" || step.state === "blocked"
                ? "sw-c3-step sw-c3-step-current"
                : "sw-c3-step"
            }
            key={step.key}
            style={
              { "--sw-c3-tone": STEP_TONE[step.state] } as React.CSSProperties
            }
          >
            <div className="sw-c3-step-head">
              <span className="sw-c3-step-n">{step.index}</span>
              <span className="sw-c3-step-label">{step.label}</span>
            </div>
            <p className="sw-c3-step-gate">{stepGate(step.state)}</p>
          </div>
        ))}
      </div>

      <div className="sw-c3-rail-foot">
        <div>
          <div
            className={
              workflow.blocker
                ? "sw-c3-eyebrow sw-c3-eyebrow-alert"
                : "sw-c3-eyebrow"
            }
          >
            {workflow.blocker
              ? `Blocked at step ${workflow.currentIndex} · ${workflow.currentLabel}`
              : `Next up · step ${workflow.currentIndex} · ${workflow.currentLabel}`}
          </div>
          <p className="sw-c3-prose sw-c3-rail-claim">
            {workflow.primaryActionDetail}
          </p>
        </div>
        <div className="sw-c3-next-action">
          <div className="sw-c3-tile-label">
            {workflow.blocker ? "What is holding it" : "Gate status"}
          </div>
          <div className="sw-c3-next-action-title">
            {workflow.blocker ?? "Nothing is blocking this step."}
          </div>
          <div className="sw-c3-ledger-state">
            {`Steps 1–${workflow.currentIndex - 1} satisfied · ${
              workflow.steps.length - workflow.currentIndex
            } after this one`}
          </div>
        </div>
      </div>
    </section>
  );
}

function stepGate(state: string): string {
  switch (state) {
    case "complete":
      return "Satisfied";
    case "current":
      return "In progress";
    case "blocked":
      return "Blocked";
    default:
      return "Not started";
  }
}

/* -------------------------------------------------------------------------- */
/* Four ledgers, kept apart                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The value ledgers, rendered side by side and never summed.
 *
 * Each is a different claim about money and they are not interchangeable:
 * recoverable is money already spent that can come back, avoidable is money not
 * yet committed, negotiated is a target position, and realized is the only one
 * Finance has confirmed. The live surface previously rendered several of these
 * as bare figures with no concept attached, which is how the same contract came
 * to show three different unlabelled amounts.
 */
export function ContractValueLedgers({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  if (!view) return null;

  const ledgers = [
    {
      key: "recoverable",
      name: "Recoverable opportunity",
      amount: view.potential.recoverable,
      note: "Money already spent that evidence says can be recovered.",
      tone: "var(--sw-c3-stone)",
    },
    {
      key: "avoidable",
      name: "Avoidable opportunity",
      amount: view.potential.avoidable,
      note: "Committed spend that has not yet been forfeited, if the decision is made in time.",
      tone: "var(--sw-c3-green)",
    },
    {
      key: "negotiated",
      name: "Negotiated improvement",
      amount: view.potential.negotiable,
      note: "A target position on future terms. It is an ask, not a balance.",
      tone: "var(--sw-c3-amber)",
    },
    {
      key: "realized",
      name: "Realized value",
      amount: view.financeConfirmed,
      note: "Nothing on this contract counts as saved until Finance confirms it.",
      tone: "var(--sw-c3-stone)",
    },
  ];

  return (
    <section className="sw-c3-card">
      <div className="sw-c3-rail-head">
        <span className="sw-c3-display sw-c3-display-sm">
          Four ledgers, kept apart
        </span>
        <span className="sw-c3-note">
          Nothing here sums into a single savings number
        </span>
      </div>
      <div className="sw-c3-ledgers">
        {ledgers.map((ledger) => (
          <div
            className="sw-c3-ledger"
            key={ledger.key}
            style={{ "--sw-c3-tone": ledger.tone } as React.CSSProperties}
          >
            <div className="sw-c3-ledger-name">{ledger.name}</div>
            <div
              className={
                isEstablishedAmount(ledger.amount)
                  ? "sw-c3-ledger-amount"
                  : "sw-c3-ledger-amount sw-c3-ledger-amount-quiet"
              }
            >
              {ledger.amount}
            </div>
            <div className="sw-c3-ledger-note">{ledger.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * `Not sized` and `Not established` are governed states, not amounts. They are
 * rendered quietly so a reader never mistakes a refusal for a figure.
 */
function isEstablishedAmount(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    normalized !== "not sized" &&
    normalized !== "not established" &&
    normalized !== "not quantified" &&
    normalized !== "—"
  );
}

/* -------------------------------------------------------------------------- */
/* Education — four states, never collapsed                                    */
/* -------------------------------------------------------------------------- */

const EDU_STATE_INK: Record<string, string> = {
  loaded: "var(--sw-c3-green-deep)",
  next: "var(--sw-c3-amber-deep)",
  not_required: "var(--sw-c3-muted)",
};

const EDU_STATE_LABEL: Record<string, string> = {
  loaded: "Loaded",
  next: "Not loaded",
  not_required: "Not applicable",
};

/**
 * The archetype playbook, with each step carrying its own state.
 *
 * `not_required` is rendered as a pill rather than as a state word, because it
 * is not a point on the loaded/not-loaded scale — it is a statement that the
 * question does not apply to this contract type. A readiness summary that says
 * "partial" now says which of the two reasons it is partial for, so the banner
 * cannot contradict steps that all read as loaded.
 */
export function ContractEducationBriefing({
  education,
}: {
  education: ContractEducationView;
}) {
  const notRequired = education.steps.filter(
    (step) => step.state === "not_required",
  );

  return (
    <div className="sw-c3-stack">
      <section className="sw-c3-card sw-c3-card-lead sw-c3-card-rule">
        <div className="sw-c3-eyebrow">
          {education.archetypeLabel} · archetype playbook
        </div>
        <p className="sw-c3-display sw-c3-display-lg">{education.headline}</p>
        <p className="sw-c3-prose">{education.body}</p>
        <p className="sw-c3-note">
          {readinessSentence(education, notRequired.length)}
        </p>
      </section>

      <div className="sw-c3-split-even">
        {education.steps.map((step) => (
          <section className="sw-c3-card" key={step.key}>
            <div className="sw-c3-eyebrow">{step.title}</div>
            <p className="sw-c3-display sw-c3-display-sm sw-c3-edu-question">
              {step.question}
            </p>
            <p className="sw-c3-prose">{step.guidance}</p>
            <div className="sw-c3-edu-foot">
              {step.state === "not_required" ? (
                <span className="sw-c3-na">Not applicable</span>
              ) : (
                <span
                  className="sw-c3-edu-state"
                  style={
                    {
                      "--sw-c3-tone": EDU_STATE_INK[step.state],
                    } as React.CSSProperties
                  }
                >
                  {EDU_STATE_LABEL[step.state]}
                </span>
              )}
              <span className="sw-c3-ledger-state">{step.evidence}</span>
            </div>
          </section>
        ))}
      </div>

      {notRequired.length > 0 ? (
        <section className="sw-c3-card-flag">
          <div className="sw-c3-eyebrow">Not applicable is a state</div>
          <p className="sw-c3-prose">
            {notRequired.length === 1
              ? `${notRequired[0].title} does not apply to a ${education.archetypeLabel.toLowerCase()}. Its absence blocks nothing, and it is not counted against readiness.`
              : `${notRequired.length} steps do not apply to a ${education.archetypeLabel.toLowerCase()}. Their absence blocks nothing, and they are not counted against readiness.`}
          </p>
        </section>
      ) : null}

      <section className="sw-c3-card">
        <div className="sw-c3-eyebrow">Data basis</div>
        <ul className="sw-c3-basis">
          {education.basis.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * Say what "partial" is partial *for*.
 *
 * The readiness word and the step states are computed from different
 * populations — evidence requirements on one side, step gates on the other —
 * so a summary that counted steps could contradict the label above it. This
 * reads the reason straight off the view rather than re-deriving it.
 */
function readinessSentence(
  education: ContractEducationView,
  notRequired: number,
): string {
  const scope =
    notRequired === 0
      ? ""
      : ` ${notRequired} ${
          notRequired === 1 ? "step does" : "steps do"
        } not apply to this contract type and ${
          notRequired === 1 ? "is" : "are"
        } not counted against it.`;

  if (education.missingEvidence.length === 0) {
    return `${education.stateLabel}. Nothing required by this contract type is outstanding.${scope}`;
  }

  return `${education.stateLabel}. Outstanding: ${listSentence(
    education.missingEvidence,
  )}.${scope}`;
}

function listSentence(items: readonly string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
