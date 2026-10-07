"use client";

import { useMemo, useState, type ReactNode } from "react";
import { type PhaseStepGroup } from "@/lib/programs/moves-phase-step-groups";
import { captureStepResumeIndex } from "@/lib/programs/capture-step-resume";
import { resolvePhaseStepGroups } from "@/lib/programs/moves-phase-step-plan";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";
import {
  captureHandoffAccess,
  captureHandoffHeading,
} from "@/lib/programs/capture-handoff-reachability";
import {
  movesWorkspaceV2Spine,
  type MovesV2SpineStage,
} from "@/lib/programs/moves-workspace-v2-spine";

/**
 * The redesigned Moves phase capture: one repeatable 3-step flow for every
 * phase. This component owns ONLY the capture shell — the step bar, the phase
 * strip, the per-step question panel, the footer, and the hand-off screen. It
 * is deliberately decoupled from the data plane:
 *
 * - `renderSectionInput` is a slot: the host passes the real input for a
 *   section key (a plain textarea, or a structured editor like the facts table,
 *   business-change form, or estimate model). No input logic is reimplemented
 *   here, so structured fields keep working unchanged.
 * - `ava` is a slot for the agent panel (the Source New `AgentDock`), so aVa's
 *   look, feel, and fill-from-notes logic match Source exactly.
 *
 * Navigation is local (which step you're viewing); persistence, gates, and the
 * agent all live in the host via the callbacks below.
 */
export interface MovesCaptureFlowPhase {
  phase: number;
  code: string;
  name: string;
  /**
   * Answered count for the phase, or `null` when this screen cannot measure it.
   * Only the phase on screen has live capture values; every other row is
   * unmeasured and must not claim a count. See `capturePhaseAnsweredCount`.
   */
  answered: number | null;
  /**
   * For an UNMEASURED row only: how many of the phase's questions hold a saved
   * answer, or `null` when nothing says. Strictly weaker than `answered` — a
   * saved answer need not be complete — so it renders under its own noun and
   * never earns the completion tick. See `capturePhaseSavedAnswers`.
   */
  savedAnswers?: number | null;
  total: number;
  /** Whether this phase can be navigated to (<= the Move's current phase). */
  reachable: boolean;
}

export interface MovesCaptureFlowProps {
  /** All phases, for the top journey strip. */
  phases: readonly MovesCaptureFlowPhase[];
  /** The phase being captured. */
  phase: number;
  /** This phase's capture sections (canonical), keyed by `section.key`. */
  sections: readonly PhaseCaptureSection[];
  /** True when a section's value is captured + saved. */
  isSectionComplete: (sectionKey: string) => boolean;
  /** The real input for a section (textarea or structured editor). */
  renderSectionInput: (section: PhaseCaptureSection) => ReactNode;
  /**
   * Optional per-field affordance rendered directly BELOW the input — today the
   * P1 Charter "How do you know this?" basis control. Returning null (the
   * default, and whenever `moves_charter_basis_v1` is off) leaves the question
   * exactly as it renders without it.
   */
  renderSectionBasis?: (section: PhaseCaptureSection) => ReactNode;
  /**
   * Optional badge rendered beside a question's label — today the amber
   * "Assumption · validate in Discover" marker, so an unsupported answer is
   * visibly classified at the question and never reads as evidence.
   */
  renderSectionBadge?: (section: PhaseCaptureSection) => ReactNode;
  /** Short recap value shown on the hand-off screen for a section. */
  sectionRecap: (section: PhaseCaptureSection) => string;
  /**
   * Optional mark rendered beside a question's label IN THE HAND-OFF RECAP —
   * today the P1 Charter basis mark. Distinct from `renderSectionBadge`, which
   * marks only the amber assumption case at the live question: in a read-back
   * list an unmarked row is indistinguishable from a backed one, so the recap
   * marks every declared basis. Null (the default) leaves the recap unchanged.
   */
  renderSectionRecapMark?: (section: PhaseCaptureSection) => ReactNode;
  /**
   * Optional band rendered at the top of the hand-off screen, above the recap —
   * today the charter-level basis rollup. Null (the default, and whenever
   * `moves_charter_basis_v1` is off) leaves the hand-off exactly as it reads
   * without it.
   */
  handoffSummary?: ReactNode;
  /**
   * Optional band rendered at the top of every CAPTURE step (not the hand-off,
   * which has `handoffSummary`) — today the P2 list of charter answers still
   * standing on an assumption. Null (the default, and whenever
   * `moves_charter_assumptions_discover_v1` is off) leaves the step exactly as
   * it reads without it.
   */
  openingBand?: ReactNode;
  /** Navigate to another (reachable) phase; opens it at step 1. */
  onSelectPhase: (phase: number) => void;
  /** Governed submit of this phase (maps to the gate/approval flow). */
  onSubmitPhase: () => void;
  /** Advance into the next phase from the hand-off screen. */
  onAdvanceToNextPhase: () => void;
  /** The next phase (for the hand-off "what's next" card), or null if terminal. */
  nextPhase?: { code: string; name: string } | null;
  /** aVa panel slot (Source New AgentDock). */
  ava?: ReactNode;
  /** When true, Continue is disabled until every question in the step is answered. */
  requireAnswers?: boolean;
  /** Start on this step (0..2). Defaults to 0. */
  initialStep?: 0 | 1 | 2;
  /**
   * Governed submit control for the final step. When provided, it replaces the
   * built-in "Submit" button on step 3 — the host passes the real approve/build
   * control (PhaseApproveAndBuild) so generation + the gate run through the
   * existing pipeline, not a reimplementation.
   */
  approveSlot?: ReactNode;
  /**
   * `moves_capture_handoff_recap_v1`. When true AND the host supplied an
   * `approveSlot`, the last step offers a control that opens the hand-off recap
   * WITHOUT submitting, and the governed approve slot travels onto the recap so
   * the decision still runs through the gate pipeline. Default false, which
   * leaves the flow byte-for-byte as it reads today — including the fact that
   * with an `approveSlot` present the recap is then unreachable (U-564).
   */
  allowReviewBeforeSubmit?: boolean;
  /**
   * `moves_workspace_v2` (Increment 1 of the phase-workspace redesign). When
   * true the two navigators are re-presented in the v2 shell: the phase journey
   * becomes a single slim rail (P0-P5 + a non-interactive hand-off marker) and
   * the step bar becomes the four-stage sub-step SPINE (CAPTURE steps · GENERATE
   * · OUTCOME · GATE) in the v3 locked-light palette. Presentation only — the
   * view-state machine, Continue-gating, resume, recap reachability, the
   * approveSlot and every handler are byte-for-byte unchanged, so with this
   * false (the default) the flow renders exactly as it does today.
   */
  workspaceV2?: boolean;
  /**
   * `moves_workspace_v2` only: host-supplied controls rendered on the GATE
   * step, beside the governed approve control — today the readiness-workbook
   * download / upload / preview actions, which the host used to render on the
   * stage head above every capture step ("across all steps"). Null (the
   * default) leaves the flow unchanged. Ignored unless `workspaceV2` is true.
   */
  gateExtras?: ReactNode;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function MovesCaptureFlow({
  phases,
  phase,
  sections,
  isSectionComplete,
  renderSectionInput,
  renderSectionBasis,
  renderSectionBadge,
  sectionRecap,
  renderSectionRecapMark,
  handoffSummary = null,
  openingBand = null,
  onSelectPhase,
  onSubmitPhase,
  onAdvanceToNextPhase,
  nextPhase = null,
  ava,
  requireAnswers = false,
  initialStep,
  approveSlot,
  allowReviewBeforeSubmit = false,
  workspaceV2 = false,
  gateExtras = null,
}: MovesCaptureFlowProps) {
  // Resolved from the sections this phase DECLARES, not from the phase number:
  // P3 Design re-shapes its question set once P2 confirms a solution route, and
  // a route-blind grouping leaves that route's required questions mounted
  // nowhere. See `moves-phase-step-plan.ts`.
  const groups = useMemo(
    () => resolvePhaseStepGroups(phase, sections),
    [phase, sections],
  );
  const sectionByKey = useMemo(() => {
    const map = new Map<string, PhaseCaptureSection>();
    for (const section of sections) map.set(section.key, section);
    return map;
  }, [sections]);

  const groupSections = (group: PhaseStepGroup): PhaseCaptureSection[] =>
    group.sectionKeys
      .map((key) => sectionByKey.get(key))
      .filter((s): s is PhaseCaptureSection => Boolean(s));

  // view: 0..2 = steps, 3 = hand-off. A reload resumes at the first step whose
  // server-backed answers are not complete. When all capture steps are done,
  // stop at the final step so its governed approval action remains explicit.
  //
  // A step a `repaired` grouping left with no questions is vacuously done, not
  // forever undone — see `capture-step-resume.ts` for why this rule lives
  // outside the component and what it used to get wrong.
  const resumeStep = captureStepResumeIndex(
    groups.map((group) => {
      const resolvedSections = groupSections(group);
      return {
        mounted: resolvedSections.length,
        unmounted: group.sectionKeys.length - resolvedSections.length,
        allComplete: resolvedSections.every((section) =>
          isSectionComplete(section.key),
        ),
      };
    }),
  );
  const [view, setView] = useState<number>(initialStep ?? resumeStep);
  // Whether this phase was submitted FROM this flow. The recap may be opened as
  // a review before that happens, and must not claim a submission that has not.
  const [submitted, setSubmitted] = useState(false);
  const handoffAccess = captureHandoffAccess({
    reviewEnabled: allowReviewBeforeSubmit,
    hasApproveSlot: Boolean(approveSlot),
  });

  const stepComplete = (stepIndex: number): boolean => {
    const group = groups[stepIndex];
    if (!group) return false;
    return groupSections(group).every((s) => isSectionComplete(s.key));
  };

  const phaseName =
    phases.find((p) => p.phase === phase)?.name ?? groups[0]?.title ?? "";

  const handoffHeading = captureHandoffHeading({
    phaseName,
    nextPhaseName: nextPhase ? nextPhase.name : null,
    submitted,
  });

  const go = (next: number) => {
    setView(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  // v2 shell: the four-stage sub-step spine, derived from the real step groups
  // and the current view. Presentation only — see `moves-workspace-v2-spine`.
  const v2Spine: MovesV2SpineStage[] = workspaceV2
    ? movesWorkspaceV2Spine({
        captureTitles: groups.map((group) => group.title),
        view,
        handoffReachable: handoffAccess.reachable,
      })
    : [];

  return (
    <div
      className={workspaceV2 ? "mcf mcf-v2" : "mcf"}
      data-testid="moves-capture-flow"
    >
      <style>{MCF_CSS}</style>

      {/* LEVEL 1 — journey: the six phases. v2 renders ONE slim rail (pips +
          a non-interactive hand-off marker); the legacy build renders the
          journey tab strip. Same navigation, reachability and completion
          rules either way. */}
      {workspaceV2 ? (
        <nav className="mcf-v2-rail" aria-label="Phases">
          {phases.map((p, idx) => {
            const measured = p.answered !== null;
            const complete =
              measured && p.total > 0 && p.answered === p.total;
            const saved =
              !measured && typeof p.savedAnswers === "number"
                ? p.savedAnswers
                : null;
            const current = p.phase === phase;
            const count = measured
              ? `${p.answered} of ${p.total} answered`
              : saved !== null
                ? `${saved} of ${p.total} saved`
                : `${p.total} question${p.total === 1 ? "" : "s"}`;
            return (
              <span className="mcf-v2-rail-item" key={p.code}>
                {idx > 0 ? (
                  <span className="mcf-v2-rail-sep" aria-hidden />
                ) : null}
                <button
                  type="button"
                  className={`mcf-v2-rail-btn${complete ? " is-done" : ""}${
                    current ? " is-current" : ""
                  }`}
                  aria-current={current ? "page" : undefined}
                  disabled={!p.reachable}
                  title={`${p.name} · ${count}`}
                  onClick={() => p.reachable && onSelectPhase(p.phase)}
                >
                  <span className="mcf-v2-pip">
                    {complete ? (
                      <span aria-label="complete">✓</span>
                    ) : (
                      p.code
                    )}
                  </span>
                  <span className="mcf-v2-rail-copy">
                    <span className="mcf-v2-rail-name">{p.name}</span>
                    <span className="mcf-v2-rail-count">{count}</span>
                  </span>
                </button>
              </span>
            );
          })}
          <span className="mcf-v2-rail-sep" aria-hidden />
          <span className="mcf-v2-rail-tower" aria-hidden>
            → Tower
          </span>
        </nav>
      ) : (
      <nav className="mcf-phasebar" aria-label="Phases">
        <ol>
          {phases.map((p) => {
            // An unmeasured row (`answered === null`) is neither complete nor
            // zero — this screen simply cannot see that phase's answers, so it
            // states the question count and claims nothing about coverage.
            //
            // The `measured` conjunct below is redundant and kept for
            // legibility only: `null === p.total` is already false for every
            // total, so no test can distinguish its removal. The guard that
            // actually earns the tick is the equality.
            const measured = p.answered !== null;
            const complete = measured && p.total > 0 && p.answered === p.total;
            // A row this screen cannot measure may still say how much of the
            // phase has been SAVED, when the host supplies that rollup. It is
            // a weaker fact than `answered` and says so in its own words:
            // never "answered", and never a tick, because a saved answer can
            // still be incomplete. `complete` above is deliberately not
            // widened to consider it.
            //
            // The `!measured` conjunct is redundant, like `measured &&` above:
            // the count below reads this branch only when `measured` is false,
            // so removing it changes nothing a test can see (mutation-checked).
            // Kept because it states the rule the field encodes at the field.
            const saved =
              !measured && typeof p.savedAnswers === "number"
                ? p.savedAnswers
                : null;
            return (
              <li key={p.code}>
                <button
                  type="button"
                  className="mcf-phase-tab"
                  aria-current={p.phase === phase ? "page" : undefined}
                  disabled={!p.reachable}
                  onClick={() => p.reachable && onSelectPhase(p.phase)}
                >
                  <span className="mcf-phase-code">
                    {p.code}
                    {complete ? (
                      <span className="mcf-tick" aria-label="complete">
                        ✓
                      </span>
                    ) : null}
                  </span>
                  <span className="mcf-phase-name">{p.name}</span>
                  <span className="mcf-phase-count">
                    {measured
                      ? `${p.answered} of ${p.total} answered`
                      : saved !== null
                        ? `${saved} of ${p.total} saved`
                        : `${p.total} question${p.total === 1 ? "" : "s"}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      )}

      {/* LEVEL 2 — this phase's workflow. v2 renders the four-stage sub-step
          spine (CAPTURE → GENERATE → OUTCOME → GATE) at every view, including
          the recap, so the spine stays on screen as a map of the phase. The
          legacy build renders the three-step bar and only below the recap. */}
      {workspaceV2 ? (
        <nav className="mcf-v2-flow" aria-label="Steps">
          <div className="mcf-v2-stages">
            {v2Spine.map((stage, i) => {
              const interactive = stage.targetView !== null;
              return (
                <span className="mcf-v2-stage" key={`${stage.kind}-${i}`}>
                  {i > 0 ? (
                    <span className="mcf-v2-stage-sep" aria-hidden />
                  ) : null}
                  <button
                    type="button"
                    className={`mcf-v2-sstep is-${stage.state} kind-${stage.kind}`}
                    disabled={!interactive}
                    aria-current={
                      stage.state === "current" ? "step" : undefined
                    }
                    onClick={() => {
                      if (stage.targetView !== null) go(stage.targetView);
                    }}
                  >
                    <span className="mcf-v2-kind">{stage.kind}</span>
                    <span className="mcf-v2-lab">
                      <span className="mcf-v2-dot">
                        {stage.state === "done"
                          ? "✓"
                          : pad(stage.position)}
                      </span>
                      {stage.label}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
        </nav>
      ) : view < 3 ? (
        <nav className="mcf-stepbar" aria-label="Steps">
          <ol>
            {groups.map((group, i) => {
              const state =
                i < view
                  ? "is-done"
                  : i === view
                    ? "is-current"
                    : "is-upcoming";
              return (
                <li className={`mcf-step ${state}`} key={group.title}>
                  <span className="mcf-step-rule" />
                  <button
                    type="button"
                    className="mcf-step-btn"
                    disabled={state === "is-upcoming"}
                    aria-current={state === "is-current" ? "step" : undefined}
                    onClick={() => {
                      if (i < view) go(i);
                    }}
                  >
                    <span className="mcf-step-dot">
                      {state === "is-done" ? "✓" : pad(i + 1)}
                    </span>
                    <span className="mcf-step-title">{group.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="mcf-body">
        {ava ? <div className="mcf-ava-col">{ava}</div> : null}
        <main className="mcf-main">
          {view < 3 ? (
            <>
              {openingBand}
              <section className="mcf-panel" aria-labelledby="mcf-panel-title">
                <div className="mcf-panel-head">
                  <h1 id="mcf-panel-title" className="mcf-panel-title">
                    {groups[view]?.title}
                  </h1>
                  <p className="mcf-panel-intro">{groups[view]?.intro}</p>
                </div>
                <div className="mcf-questions">
                  {groups[view]
                    ? groupSections(groups[view]).map((section) => (
                        <div className="mcf-question" key={section.key}>
                          <div className="mcf-q-labelrow">
                            <label className="mcf-q-label">
                              {section.label}
                            </label>
                            {renderSectionBadge?.(section) ?? null}
                          </div>
                          {section.description ? (
                            <p className="mcf-q-help">{section.description}</p>
                          ) : null}
                          {renderSectionInput(section)}
                          {renderSectionBasis?.(section) ?? null}
                        </div>
                      ))
                    : null}
                </div>
              </section>
              <footer className="mcf-footer">
                <span className="mcf-footer-count">Step {view + 1} of 3</span>
                <div className="mcf-footer-actions">
                  {view > 0 ? (
                    <button
                      type="button"
                      className="mcf-btn-quiet"
                      onClick={() => go(view - 1)}
                    >
                      Back
                    </button>
                  ) : null}
                  {view === 2 && approveSlot ? (
                    <>
                      {workspaceV2 && gateExtras ? (
                        <div className="mcf-v2-gate-extras">{gateExtras}</div>
                      ) : null}
                      {handoffAccess.offerReviewBeforeSubmit ? (
                        <button
                          type="button"
                          className="mcf-btn-quiet"
                          onClick={() => go(3)}
                        >
                          Review what you captured
                        </button>
                      ) : null}
                      <div className="mcf-approve-slot">{approveSlot}</div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="mcf-btn-primary"
                      disabled={requireAnswers && !stepComplete(view)}
                      onClick={() => {
                        if (view < 2) {
                          go(view + 1);
                        } else {
                          onSubmitPhase();
                          setSubmitted(true);
                          go(3);
                        }
                      }}
                    >
                      {view === 2 ? `Submit ${phaseName}` : "Continue"}
                    </button>
                  )}
                </div>
              </footer>
            </>
          ) : (
            <section className="mcf-handoff" data-testid="mcf-handoff">
              <div className="mcf-panel-head">
                <span
                  className={
                    handoffHeading.showTick
                      ? "mcf-eyebrow mcf-done-eyebrow"
                      : "mcf-eyebrow"
                  }
                >
                  {handoffHeading.showTick ? (
                    <span className="mcf-tick">✓</span>
                  ) : null}{" "}
                  {handoffHeading.eyebrow}
                </span>
                <h1 className="mcf-panel-title">{handoffHeading.title}</h1>
              </div>
              {handoffSummary}
              <div className="mcf-recap" aria-label="What you captured">
                {groups.map((group, gi) => (
                  <div key={group.title}>
                    <h3 className="mcf-eyebrow">
                      {pad(gi + 1)} · {group.title}
                    </h3>
                    <dl>
                      {groupSections(group).map((section) => {
                        const recap = sectionRecap(section).trim();
                        return (
                          <div key={section.key}>
                            <dt>
                              {section.label}
                              {renderSectionRecapMark?.(section) ?? null}
                            </dt>
                            <dd className={recap ? "" : "mcf-empty"}>
                              {recap || "Not answered"}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                ))}
              </div>
              <div className="mcf-next">
                <div>
                  <span className="mcf-eyebrow">
                    Next · {nextPhase ? nextPhase.code : "Delivery"}
                  </span>
                  <h2>
                    What {nextPhase ? nextPhase.name : "delivery"} will need
                  </h2>
                </div>
                <div className="mcf-next-actions">
                  <button
                    type="button"
                    className="mcf-btn-quiet"
                    onClick={() => (submitted ? go(0) : go(2))}
                  >
                    {submitted ? "Review answers" : "Back to the last step"}
                  </button>
                  {submitted || !approveSlot ? (
                    <button
                      type="button"
                      className="mcf-btn-primary"
                      onClick={onAdvanceToNextPhase}
                    >
                      {nextPhase
                        ? `Begin ${nextPhase.name} →`
                        : "Hand off to delivery →"}
                    </button>
                  ) : (
                    /* Opened as a review: nothing is submitted yet, so the next
                       phase cannot be begun from here. The host's governed
                       approve control travels onto the recap instead, so the
                       person decides with the basis rollup in front of them and
                       the decision still runs through the gate pipeline. */
                    <div className="mcf-approve-slot">
                      {workspaceV2 && gateExtras ? (
                        <div className="mcf-v2-gate-extras">{gateExtras}</div>
                      ) : null}
                      {approveSlot}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

/* Tokens mirror AbarVa canon (cream ground, canon-teal accent, Georgia/Inter/
 * mono). Kept inline so the component is self-contained; folds into the shared
 * sheet at shell integration. */
const MCF_CSS = `
.mcf{--mcf-bg:#f5f1eb;--mcf-surface:#fff;--mcf-ink:#2c2c2a;--mcf-muted:#5f5e5a;--mcf-faint:#888780;--mcf-line:rgba(10,10,11,.12);--mcf-line-strong:rgba(10,10,11,.24);--mcf-accent:#1d9e75;--mcf-accent-hover:#0f6e56;--mcf-accent-ink:#fff;--mcf-current-bg:#2c2c2a;--mcf-current-ink:#fff;--mcf-disabled-bg:#e7e3db;--mcf-serif:Georgia,'Times New Roman',serif;--mcf-sans:Inter,system-ui,sans-serif;--mcf-mono:'JetBrains Mono',ui-monospace,monospace;color:var(--mcf-ink);font-family:var(--mcf-sans);display:flex;flex-direction:column;gap:28px}
.mcf-eyebrow{font-family:var(--mcf-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mcf-faint)}
.mcf-phasebar{overflow-x:auto}
.mcf-phasebar ol{list-style:none;margin:0;display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:4px;min-width:760px;background:var(--mcf-surface);border:1px solid var(--mcf-line);border-radius:12px;padding:4px}
.mcf-phase-tab{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;border:0;border-radius:9px;padding:10px 14px;cursor:pointer;background:transparent;color:var(--mcf-ink)}
.mcf-phase-tab:hover:not(:disabled){background:var(--mcf-bg)}
.mcf-phase-tab:disabled{cursor:not-allowed;opacity:.55}
.mcf-phase-tab[aria-current=page]{background:var(--mcf-current-bg);color:var(--mcf-current-ink)}
.mcf-phase-code{display:flex;align-items:center;gap:6px;font-family:var(--mcf-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
.mcf-phase-name{font-size:14px;font-weight:600}
.mcf-phase-count{font-size:12px;opacity:.7}
.mcf-tick{color:var(--mcf-accent)}
.mcf-stepbar ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.mcf-step{display:flex;flex-direction:column;gap:12px;min-width:0}
.mcf-step-rule{height:2px;border-radius:2px;background:var(--mcf-line)}
.mcf-step-btn{display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;text-align:left;min-width:0;cursor:default}
.mcf-step-dot{width:24px;height:24px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--mcf-mono);font-size:10px;font-weight:600;border:1px solid var(--mcf-line-strong);color:var(--mcf-faint)}
.mcf-step-title{font-size:14px;font-weight:500;color:var(--mcf-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.is-done .mcf-step-rule,.is-done .mcf-step-dot{background:var(--mcf-accent);border-color:var(--mcf-accent)}
.is-done .mcf-step-dot{color:var(--mcf-accent-ink)}
.is-done .mcf-step-title{color:var(--mcf-muted)}
.is-done .mcf-step-btn{cursor:pointer}
.is-current .mcf-step-rule,.is-current .mcf-step-dot{background:var(--mcf-current-bg);border-color:var(--mcf-current-bg)}
.is-current .mcf-step-dot{color:var(--mcf-current-ink)}
.is-current .mcf-step-title{color:var(--mcf-ink);font-weight:600}
.mcf-body{display:flex;flex-wrap:wrap;gap:40px}
.mcf-ava-col{flex:1 1 320px;min-width:0}
.mcf-main{flex:3 1 420px;min-width:0}
.mcf-panel-title{font-family:var(--mcf-serif);font-weight:400;font-size:clamp(28px,4vw,38px);line-height:1.15;letter-spacing:-.01em;margin:0 0 10px}
.mcf-panel-intro{font-size:17px;color:var(--mcf-muted);margin:0 0 40px}
.mcf-questions{display:flex;flex-direction:column;gap:36px}
.mcf-q-labelrow{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:6px}
.mcf-q-label{display:block;font-size:16px;font-weight:600}
.mcf-q-help{font-size:14px;line-height:1.5;color:var(--mcf-muted);margin:0 0 6px}
.mcf-question{min-width:0}
.mcf-question>*{max-width:100%}
.mcf-input{display:block;width:100%;box-sizing:border-box;font-family:var(--mcf-sans);font-size:15px;line-height:1.55;color:var(--mcf-ink);background:var(--mcf-surface);border:1px solid var(--mcf-line-strong);border-radius:10px;padding:12px 14px;resize:vertical;min-height:96px}
.mcf-input:focus{outline:none;border-color:var(--mcf-accent);box-shadow:0 0 0 3px rgba(29,158,117,.12)}
.mcf-input::placeholder{color:var(--mcf-faint)}
.mcf-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:40px;padding-top:24px;border-top:1px solid var(--mcf-line)}
.mcf-footer-count{font-size:14px;color:var(--mcf-faint)}
.mcf-footer-actions{display:flex;align-items:center;gap:8px}
.mcf-btn-quiet{background:none;border:0;color:var(--mcf-muted);font:inherit;font-size:14px;font-weight:500;padding:11px 10px;cursor:pointer}
.mcf-btn-quiet:hover{color:var(--mcf-ink)}
.mcf-btn-primary{border:0;cursor:pointer;background:var(--mcf-accent);color:var(--mcf-accent-ink);font:inherit;font-size:14.5px;font-weight:600;padding:12px 22px;border-radius:10px}
.mcf-btn-primary:hover:not(:disabled){background:var(--mcf-accent-hover)}
.mcf-btn-primary:disabled{background:var(--mcf-disabled-bg);color:var(--mcf-faint);cursor:not-allowed}
.mcf-done-eyebrow{display:inline-flex;align-items:center;gap:6px;color:var(--mcf-accent)}
.mcf-recap{display:flex;flex-direction:column;gap:22px;margin:24px 0 34px}
.mcf-recap dl{margin:8px 0 0;display:flex;flex-direction:column;gap:10px}
.mcf-recap dt{font-size:14px;font-weight:600;display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.mcf-recap dd{margin:0;font-size:14px;color:var(--mcf-muted);line-height:1.5}
.mcf-empty{font-style:italic;color:var(--mcf-faint)}
.mcf-next{background:var(--mcf-surface);border:1px solid var(--mcf-line);border-radius:14px;padding:32px}
.mcf-next h2{font-family:var(--mcf-serif);font-weight:400;font-size:26px;margin:6px 0 0}
.mcf-next-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:22px}
.mcf-ava-draft{border:1px solid rgba(29,158,117,.3);background:#f0fbf7;border-radius:12px;padding:12px 14px;margin:0 0 10px;display:flex;flex-direction:column;gap:8px}
.mcf-ava-draft-head{display:flex;align-items:center;gap:10px}
.mcf-ava-badge{font-family:var(--mcf-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#147c5b;border:1px solid rgba(29,158,117,.4);border-radius:4px;padding:2px 6px}
.mcf-ava-conf{font-size:11px;color:var(--mcf-muted);text-transform:capitalize}
.mcf-ava-proposed{margin:0;font-size:14px;color:var(--mcf-ink);border-left:2px solid var(--mcf-accent);padding-left:11px;line-height:1.5}
.mcf-ava-rationale{margin:0;font-size:12.5px;color:var(--mcf-muted);line-height:1.5}
.mcf-ava-draft-actions{display:flex;gap:8px}
.mcf-ava-insert{border:0;background:var(--mcf-accent);color:#fff;font-size:12.5px;font-weight:600;padding:7px 14px;border-radius:8px;cursor:pointer}
.mcf-ava-insert:hover{background:var(--mcf-accent-hover)}
.mcf-ava-dismiss{border:0;background:none;color:var(--mcf-muted);font-size:12.5px;font-weight:500;padding:7px 8px;cursor:pointer}
@media (max-width:640px){.mcf-panel-intro{font-size:16px}}

/* ─── moves_workspace_v2: v3 locked-light palette + the single slim phase
   rail and the four-stage sub-step spine. Scoped to .mcf-v2, so the legacy
   build is untouched. ─── */
.mcf-v2{--mcf-bg:#FFFFFF;--mcf-surface:#FBFAF7;--mcf-ink:#1A1A18;--mcf-muted:#525866;--mcf-faint:#9AA3B2;--mcf-line:#E7E3DB;--mcf-line-strong:#D8D3C8;--mcf-accent:#1B2B5C;--mcf-accent-hover:#162449;--mcf-accent-ink:#fff;--mcf-current-bg:#1B2B5C;--mcf-current-ink:#fff;--mcf-serif:'Fraunces',Georgia,serif;--mcf-teal:#1d9e75}
.mcf-v2 .mcf-tick,.mcf-v2 .mcf-done-eyebrow{color:var(--mcf-teal)}
/* slim phase rail */
.mcf-v2-rail{display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin:0}
.mcf-v2-rail-item{display:inline-flex;align-items:center;gap:3px}
.mcf-v2-rail-sep{width:18px;height:1.5px;background:var(--mcf-line-strong);flex:0 0 auto}
.mcf-v2-rail-btn{display:inline-flex;align-items:center;gap:8px;background:none;border:0;cursor:pointer;font-family:var(--mcf-mono);font-size:11px;letter-spacing:.03em;color:var(--mcf-faint);padding:5px 4px}
.mcf-v2-rail-btn:disabled{cursor:not-allowed;opacity:.65}
.mcf-v2-pip{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--mcf-line-strong);display:grid;place-items:center;font-size:10px;color:var(--mcf-faint);flex:0 0 auto}
.mcf-v2-rail-btn.is-done .mcf-v2-pip{background:var(--mcf-teal);border-color:var(--mcf-teal);color:#fff}
.mcf-v2-rail-btn.is-current{color:var(--mcf-ink)}
.mcf-v2-rail-btn.is-current .mcf-v2-pip{background:var(--mcf-accent);border-color:var(--mcf-accent);color:#fff}
.mcf-v2-rail-copy{display:flex;flex-direction:column;align-items:flex-start;line-height:1.25;text-align:left}
.mcf-v2-rail-name{font-family:var(--mcf-sans);font-size:13px;font-weight:600;color:inherit}
.mcf-v2-rail-count{font-size:10.5px;color:var(--mcf-faint);letter-spacing:0}
.mcf-v2-rail-tower{font-family:var(--mcf-mono);font-size:10px;letter-spacing:.06em;color:var(--mcf-faint)}
/* four-stage sub-step spine */
.mcf-v2-flow{border-top:1px solid var(--mcf-line);border-bottom:1px solid var(--mcf-line);padding:14px 0}
.mcf-v2-stages{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
.mcf-v2-stage{display:inline-flex;align-items:center;gap:6px}
.mcf-v2-stage-sep{width:22px;height:1.5px;background:var(--mcf-line-strong);flex:0 0 auto}
.mcf-v2-sstep{display:inline-flex;flex-direction:column;gap:5px;background:none;border:0;padding:3px 4px;text-align:left;cursor:pointer}
.mcf-v2-sstep:disabled{cursor:default}
.mcf-v2-kind{font-family:var(--mcf-mono);font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:var(--mcf-faint)}
.mcf-v2-lab{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;color:var(--mcf-muted);white-space:nowrap}
.mcf-v2-dot{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--mcf-line-strong);display:grid;place-items:center;font-family:var(--mcf-mono);font-size:10px;color:var(--mcf-faint);flex:0 0 auto}
.mcf-v2-sstep.is-done .mcf-v2-dot{background:var(--mcf-teal);border-color:var(--mcf-teal);color:#fff}
.mcf-v2-sstep.is-done .mcf-v2-lab{color:var(--mcf-muted)}
.mcf-v2-sstep.is-current .mcf-v2-lab{color:var(--mcf-ink);font-weight:600}
.mcf-v2-sstep.is-current .mcf-v2-dot{background:var(--mcf-accent);border-color:var(--mcf-accent);color:#fff}
.mcf-v2-sstep.is-current .mcf-v2-kind{color:var(--mcf-accent)}
.mcf-v2-gate-extras{display:flex;flex-direction:column;gap:10px;flex-basis:100%;margin-bottom:4px}
`;
