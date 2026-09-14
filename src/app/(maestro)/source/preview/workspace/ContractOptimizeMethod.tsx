"use client";

import type { SourceWorkspaceVM } from "./buildViewModel";

/**
 * How Source optimizes — the method, and the refusals that gate it.
 *
 * Two surfaces from the same seven-step state machine, split by what they are
 * for:
 *
 *  - `ContractOptimizeMethod` groups the steps into four phases, each with the
 *    question it answers and what it produces. It explains the method, so it
 *    belongs on the playbook tab beside the archetype guide.
 *  - `ContractRefusalChips` shows the three states a case can be refused in,
 *    lit from the opportunities actually in them. It reports live state, so it
 *    belongs on the case below the decision surface rather than above it.
 *
 * The phase names, questions, step copy and outcomes are authored: they
 * describe the method and do not vary by contract. The step *states* and the
 * chips are read from governed rows, so nothing here claims progress a
 * contract has not made.
 */

type StepKey =
  | "select"
  | "lock_baseline"
  | "evidence"
  | "diagnose"
  | "plan"
  | "approve"
  | "prove_value";

interface PhaseCopy {
  readonly index: string;
  readonly name: string;
  readonly question: string;
  readonly steps: readonly {
    readonly key: StepKey;
    readonly title: string;
    readonly detail: string;
    readonly outcome: string;
  }[];
}

const PHASES: readonly PhaseCopy[] = [
  {
    index: "01",
    name: "Establish",
    question: "What does today actually cost?",
    steps: [
      {
        key: "select",
        title: "Select contract",
        detail: "Pick the agreement and confirm its governed header.",
        outcome: "Contract in view",
      },
      {
        key: "lock_baseline",
        title: "Lock baseline",
        detail: "Agree the cost of today before anyone proposes a change.",
        outcome: "An immovable reference point",
      },
    ],
  },
  {
    index: "02",
    name: "Diagnose",
    question: "What is the evidence, and what is missing?",
    steps: [
      {
        key: "evidence",
        title: "Read evidence",
        detail:
          "Spend, usage, invoices, service levels, tickets — and name every gap.",
        outcome: "Evidence set with stated gaps",
      },
      {
        key: "diagnose",
        title: "Classify findings",
        detail:
          "Recoverable, avoidable or negotiable — each with a named owner.",
        outcome: "Sized candidates",
      },
    ],
  },
  {
    index: "03",
    name: "Act",
    question: "What do we ask for, and who signs off?",
    steps: [
      {
        key: "plan",
        title: "Build strategy",
        detail: "Levers, asks, sequencing, and the language for the room.",
        outcome: "A negotiation position",
      },
      {
        key: "approve",
        title: "Approve and execute",
        detail:
          "A named person approves; the play runs to a real deadline.",
        outcome: "Approved action, audit trail",
      },
    ],
  },
  {
    index: "04",
    name: "Prove",
    question: "Did the money actually arrive?",
    steps: [
      {
        key: "prove_value",
        title: "Prove value",
        detail:
          "Finance confirms what landed in the budget. Until then every figure stays a candidate, never a saving.",
        outcome: "Finance-confirmed value",
      },
    ],
  },
];

const STATE_LABEL: Record<string, string> = {
  complete: "Satisfied",
  current: "In progress",
  blocked: "Blocked",
  future: "Not started",
};

export function ContractOptimizeMethod({ vm }: { vm: SourceWorkspaceVM }) {
  const steps = vm.optWorkflow?.steps ?? [];
  const stateFor = (key: StepKey) =>
    steps.find((step) => step.key === key)?.state ?? null;

  return (
    <section className="sw-c3-card">
      <div className="sw-c3-eyebrow">How Source optimizes</div>
      <p className="sw-c3-display sw-c3-display-sm sw-c3-edu-question">
        Seven steps, four questions, one refusal at every gate.
      </p>
      <p className="sw-c3-note">
        The method does not vary by contract. Where a step carries a state below,
        it is this contract&rsquo;s.
      </p>

      <div className="sw-c3-phases">
        {PHASES.map((phase) => (
          <div className="sw-c3-phase" key={phase.name}>
            <div className="sw-c3-phase-head">
              <span className="sw-c3-phase-index">{phase.index}</span>
              <span className="sw-c3-phase-name">{phase.name}</span>
            </div>
            <p className="sw-c3-phase-question">{phase.question}</p>
            <div className="sw-c3-phase-steps">
              {phase.steps.map((step) => {
                const state = stateFor(step.key);
                return (
                  <div className="sw-c3-phase-step" key={step.key}>
                    <div className="sw-c3-phase-step-head">
                      <span className="sw-c3-phase-step-title">
                        {step.title}
                      </span>
                      {state ? (
                        <span
                          className={
                            state === "complete"
                              ? "sw-c3-badge sw-c3-badge-ready"
                              : state === "blocked" || state === "current"
                                ? "sw-c3-badge sw-c3-badge-pending"
                                : "sw-c3-badge"
                          }
                        >
                          {STATE_LABEL[state] ?? state}
                        </span>
                      ) : null}
                    </div>
                    <p className="sw-c3-phase-step-detail">{step.detail}</p>
                    <p className="sw-c3-phase-step-outcome">
                      → {step.outcome}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Refusals                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The three states a case can be refused in. Inactive states stay out of the
 * visual hierarchy; a clear gate is useful context, not a three-row report.
 *
 * These are not slide copy. `baseline_conflict`, `evidence_required` and
 * `workflow_required` are stages an opportunity is actually in, so a chip
 * lights only when this contract holds one. A refusal the product can show
 * happening is worth more than a paragraph describing that it would.
 */
const REFUSALS: readonly {
  readonly stage: string;
  readonly label: string;
  readonly detail: string;
}[] = [
  {
    stage: "baseline_conflict",
    label: "Baseline conflict",
    detail: "two sources disagree on today's cost",
  },
  {
    stage: "evidence_required",
    label: "Evidence required",
    detail: "the claim outruns what is loaded",
  },
  {
    stage: "workflow_required",
    label: "Workflow required",
    detail: "nobody has been named to own it",
  },
];

export function ContractRefusalChips({ vm }: { vm: SourceWorkspaceVM }) {
  const opportunities = vm.opportunityView?.opportunities ?? [];
  if (opportunities.length === 0) return null;

  const counts = new Map<string, number>();
  for (const row of opportunities) {
    const stage = row.stageRaw;
    if (!stage) continue;
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  const active = REFUSALS.filter((refusal) => (counts.get(refusal.stage) ?? 0) > 0);

  return (
    <section className="sw-c3-card sw-c3-gate-card" aria-label="Gate checks">
      <div className="sw-c3-gate-head">
        <div>
          <div className="sw-c3-eyebrow">Gate checks</div>
          <p className="sw-c3-note">
            {active.length === 0
              ? "No active refusal gate. Each lever is held by its own next step."
              : `${active.length} active refusal ${active.length === 1 ? "state" : "states"} on this contract.`}
          </p>
        </div>
        <span className={active.length === 0 ? "sw-c3-gate-state" : "sw-c3-gate-state sw-c3-gate-state-live"}>
          {active.length === 0 ? "No refusal gate" : `${active.length} active`}
        </span>
      </div>
      {active.length > 0 ? (
        <div className="sw-c3-refusals">
          {active.map((refusal) => {
            const count = counts.get(refusal.stage) ?? 0;
            return (
              <span className="sw-c3-refusal sw-c3-refusal-live" key={refusal.stage}>
                <b>{refusal.label}</b>
                <span> — {refusal.detail}</span>
                <span className="sw-c3-refusal-count">
                  {count} lever{count === 1 ? "" : "s"}
                </span>
              </span>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
