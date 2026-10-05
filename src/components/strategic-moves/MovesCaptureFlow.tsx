"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  getPhaseStepGroups,
  type PhaseStepGroup,
} from "@/lib/programs/moves-phase-step-groups";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

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
  /** Answered/total for the phase, for the "N of M answered" strip. */
  answered: number;
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
  onSelectPhase,
  onSubmitPhase,
  onAdvanceToNextPhase,
  nextPhase = null,
  ava,
  requireAnswers = false,
  initialStep = 0,
  approveSlot,
}: MovesCaptureFlowProps) {
  const groups = getPhaseStepGroups(phase);
  // view: 0..2 = steps, 3 = hand-off.
  const [view, setView] = useState<number>(initialStep);

  const sectionByKey = useMemo(() => {
    const map = new Map<string, PhaseCaptureSection>();
    for (const section of sections) map.set(section.key, section);
    return map;
  }, [sections]);

  const groupSections = (group: PhaseStepGroup): PhaseCaptureSection[] =>
    group.sectionKeys
      .map((key) => sectionByKey.get(key))
      .filter((s): s is PhaseCaptureSection => Boolean(s));

  const stepComplete = (stepIndex: number): boolean => {
    const group = groups[stepIndex];
    if (!group) return false;
    return groupSections(group).every((s) => isSectionComplete(s.key));
  };

  const phaseName =
    phases.find((p) => p.phase === phase)?.name ?? groups[0]?.title ?? "";

  const go = (next: number) => {
    setView(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  return (
    <div className="mcf" data-testid="moves-capture-flow">
      <style>{MCF_CSS}</style>

      {/* LEVEL 1 — journey: the six phases */}
      <nav className="mcf-phasebar" aria-label="Phases">
        <ol>
          {phases.map((p) => {
            const complete = p.total > 0 && p.answered === p.total;
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
                    {p.answered} of {p.total} answered
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* LEVEL 2 — the three steps of this phase */}
      {view < 3 ? (
        <nav className="mcf-stepbar" aria-label="Steps">
          <ol>
            {groups.map((group, i) => {
              const state =
                i < view ? "is-done" : i === view ? "is-current" : "is-upcoming";
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
                    <div className="mcf-approve-slot">{approveSlot}</div>
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
                <span className="mcf-eyebrow mcf-done-eyebrow">
                  <span className="mcf-tick">✓</span> {phaseName} submitted
                </span>
                <h1 className="mcf-panel-title">
                  {nextPhase
                    ? `${phaseName} is complete. Here's what you captured.`
                    : `${phaseName} is complete. This Move is ready for delivery.`}
                </h1>
              </div>
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
                            <dt>{section.label}</dt>
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
                  <h2>What {nextPhase ? nextPhase.name : "delivery"} will need</h2>
                </div>
                <div className="mcf-next-actions">
                  <button
                    type="button"
                    className="mcf-btn-quiet"
                    onClick={() => go(0)}
                  >
                    Review answers
                  </button>
                  <button
                    type="button"
                    className="mcf-btn-primary"
                    onClick={onAdvanceToNextPhase}
                  >
                    {nextPhase ? `Begin ${nextPhase.name} →` : "Hand off to delivery →"}
                  </button>
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
.mcf-recap dt{font-size:14px;font-weight:600}
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
`;
