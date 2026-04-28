// maestro-next-action-view.ts — PROG24
//
// Deterministic view model for the Client Maestro next action composer.
//
// Answers: "What should the Client Maestro do next?"
//
// Provides 3 contextual choices + a custom option derived from program
// phase state and gate readiness. Framed from the client's perspective,
// distinct from the Nexus workbench (which is agent-to-client guidance).
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.
// Submit action is ALWAYS disabled — live Maestro session dispatch is deferred.

import type { ProgramDetailView } from './programs-types';
import { PHASE_LABEL_MAP } from './programs-fixture';
import type { ProgramPhaseId } from './programs-types';

// ─── Output types ─────────────────────────────────────────────────────────────

export type MaestroChoiceKey = 'A' | 'B' | 'C';

export interface MaestroNextActionChoice {
  key: MaestroChoiceKey;
  /** Short imperative label shown on the choice button. */
  label: string;
  /** One-line detail explaining what this moves forward. */
  detail: string;
  /** Which workflow concern this choice addresses. */
  workflowFocus: 'gate' | 'evidence' | 'stakeholder' | 'execution' | 'phase';
}

export interface MaestroNextActionView {
  /** Section headline. */
  headline: string;
  /** Context line shown below the headline. */
  contextLine: string;
  /** Always exactly 3 choices. */
  choices: [MaestroNextActionChoice, MaestroNextActionChoice, MaestroNextActionChoice];
  /** Placeholder for the custom free-text option. */
  customPlaceholder: string;
  /** Label on the submit button. */
  submitLabel: string;
  /**
   * Why submit is disabled.
   * Live Maestro session dispatch is deferred; submit always shows this reason.
   */
  submitDisabledReason: string;
  /** Honest disclaimer. */
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Choice banks ─────────────────────────────────────────────────────────────

const GATE_PENDING_CHOICES: [MaestroNextActionChoice, MaestroNextActionChoice, MaestroNextActionChoice] = [
  {
    key: 'A',
    label: 'Escalate gate blockers',
    detail: 'Work with Steward to resolve unmet criteria before the next review cycle',
    workflowFocus: 'gate',
  },
  {
    key: 'B',
    label: 'Brief sponsor on status',
    detail: 'Bring sponsor up to speed on current gate hold and timeline impact',
    workflowFocus: 'stakeholder',
  },
  {
    key: 'C',
    label: 'Prioritise missing evidence',
    detail: 'Identify which evidence gaps are closest to resolution and tackle those first',
    workflowFocus: 'evidence',
  },
];

const ACTIVE_NO_GATE_CHOICES: [MaestroNextActionChoice, MaestroNextActionChoice, MaestroNextActionChoice] = [
  {
    key: 'A',
    label: 'Review deliverable progress',
    detail: 'Confirm which deliverables are on track and which need attention this week',
    workflowFocus: 'execution',
  },
  {
    key: 'B',
    label: 'Align team on phase goals',
    detail: 'Run a short alignment session to re-anchor on the phase exit criteria',
    workflowFocus: 'stakeholder',
  },
  {
    key: 'C',
    label: 'Log a workshop outcome',
    detail: 'Capture workshop decisions and link them to evidence before they go stale',
    workflowFocus: 'evidence',
  },
];

const PHASE_DONE_CHOICES: [MaestroNextActionChoice, MaestroNextActionChoice, MaestroNextActionChoice] = [
  {
    key: 'A',
    label: 'Confirm handoff to next phase',
    detail: 'Verify all phase outputs are logged and the next phase brief is ready',
    workflowFocus: 'phase',
  },
  {
    key: 'B',
    label: 'Document lessons learned',
    detail: 'Capture what worked and what to change — feed into the next phase brief',
    workflowFocus: 'execution',
  },
  {
    key: 'C',
    label: 'Brief sponsor on phase outcome',
    detail: 'Close the loop with your sponsor before the next phase kicks off',
    workflowFocus: 'stakeholder',
  },
];

const IDLE_CHOICES: [MaestroNextActionChoice, MaestroNextActionChoice, MaestroNextActionChoice] = [
  {
    key: 'A',
    label: 'Reactivate this program',
    detail: 'Set a clear re-entry point and assign an owner before re-starting the phase',
    workflowFocus: 'phase',
  },
  {
    key: 'B',
    label: 'Review idle reason with Steward',
    detail: 'Understand why the program stalled and whether the blocker can be resolved',
    workflowFocus: 'gate',
  },
  {
    key: 'C',
    label: 'Archive or defer',
    detail: 'If capacity or priority has changed, formally defer to avoid false pipeline signals',
    workflowFocus: 'stakeholder',
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the Maestro next action composer view model from a ProgramDetailView.
 *
 * Always returns a view (never null) — every program state has a valid
 * set of client-oriented next actions.
 */
export function buildMaestroNextActionView(
  view: ProgramDetailView,
): MaestroNextActionView {
  const phaseLabel =
    PHASE_LABEL_MAP[view.viewingPhase as ProgramPhaseId] ?? `Phase ${view.viewingPhase}`;

  let choices: [MaestroNextActionChoice, MaestroNextActionChoice, MaestroNextActionChoice];
  let contextLine: string;

  if (view.gateStatus === 'pending') {
    choices = GATE_PENDING_CHOICES;
    contextLine = `P${view.viewingPhase} ${phaseLabel} gate is pending — focus on blockers and evidence`;
  } else if (view.gateStatus === 'idle' || view.gateStatus === 'na') {
    choices = IDLE_CHOICES;
    contextLine = `${view.name} is currently idle — decide whether to reactivate, defer, or archive`;
  } else {
    // Check if the viewing phase is done
    const viewingSlot = view.phases.find((p) => p.id === view.viewingPhase);
    if (viewingSlot?.state === 'done') {
      choices = PHASE_DONE_CHOICES;
      contextLine = `P${view.viewingPhase} ${phaseLabel} is complete — set up the next phase`;
    } else {
      choices = ACTIVE_NO_GATE_CHOICES;
      contextLine = `P${view.viewingPhase} ${phaseLabel} is active — keep the phase moving forward`;
    }
  }

  const headline = 'What should you do next?';

  const customPlaceholder =
    `Describe a custom next action for ${view.name} P${view.viewingPhase} ${phaseLabel}…`;

  const submitLabel = 'Send to Maestro';

  const submitDisabledReason =
    'Live Maestro session dispatch is deferred to a later slice. ' +
    'Select your intended action to record your intent — submission will be wired when the Maestro session seam is available.';

  const honestDisclaimer =
    `Deterministic seed · ${view.displayId} P${view.viewingPhase} ${phaseLabel} ` +
    `choices reflect fixture context only. Maestro session dispatch, intent logging, ` +
    `and workflow automation are deferred.`;

  return {
    headline,
    contextLine,
    choices,
    customPlaceholder,
    submitLabel,
    submitDisabledReason,
    honestDisclaimer,
    deterministicSeed: true,
  };
}
