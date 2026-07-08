// Moves phase workspace — the live mount panel (increments 3-4).
// Presentational: maps the app's numeric phase (0-5) to the governed phase-
// template catalog and renders (1) a Stripe-style task checklist built from REAL
// move state and (2) the catalog-driven guidance cards. Everything here comes
// from real data keyed on the phase — no fabricated numbers, no fixture.

import * as React from 'react';
import { templatesForPhase } from '../../../lib/programs/phase-templates/catalog';
import type {
  MovePhaseCode,
  MoveTemplateUploadClassification,
} from '../../../lib/programs/phase-templates/types';
import {
  buildPhaseWorkflow,
  type PhaseEvidenceSignal,
  type PhaseGateSignal,
  type PhaseTask,
} from '../../../lib/programs/phase-templates/phase-workflow';
import {
  buildFeedForwardPack,
  type FeedForwardSignals,
} from '../../../lib/programs/phase-templates/feed-forward';
import type { WhatChangedResult } from '../../../lib/programs/phase-templates/what-changed';
import type { ApprovedInputsPack } from '../../../lib/programs/phase-templates/approved-inputs-pack';
import {
  PhaseCompletionGuideCard,
  PhaseTemplatesAndSessionsCard,
  UploadMappingSummaryCard,
} from './cards';
import { PhaseTaskChecklist } from './PhaseTaskChecklist';
import { NextPhaseFeedForwardCard } from './NextPhaseFeedForwardCard';
import { WhatChangedCard } from './WhatChangedCard';
import { ApprovedInputsPackCard } from './ApprovedInputsPackCard';
import { PhaseWorkspaceStyles } from './styles';

/** App numeric phase → governed catalog phase code. Only P2-P5 have templates. */
const PHASE_NUM_TO_CODE: Record<number, MovePhaseCode> = {
  2: 'P2',
  3: 'P3',
  4: 'P4',
  5: 'P5',
};

const PHASE_STEPS = [
  'Run the recommended sessions for this phase with the right people.',
  'Upload each completed session document — AbarVa maps what it finds to your solution lanes.',
  'Confirm the open questions AbarVa surfaces, then attest at the gate to advance.',
];

export function MovePhaseWorkspacePanel({
  phaseNum,
  phaseLabel,
  nextPhaseLabel = null,
  evidence = [],
  gate = [],
  feedForward,
  onTaskAction,
  uploadClassification,
  onUploadCompletedTemplate,
  onUploadFinalVersion,
  whatChanged,
  onConfirmChanges,
  changesConfirmed,
  approvedPack,
  approvedPackOnLabel,
}: {
  phaseNum: number;
  /** The app's own phase label (e.g. "P2 · Discover"), kept authoritative. */
  phaseLabel: string;
  /** The app's label for the next phase, for the advance task. */
  nextPhaseLabel?: string | null;
  /** REAL evidence-need signals (structural subset of MoveEvidenceNeedPacket). */
  evidence?: PhaseEvidenceSignal[];
  /** REAL gate criteria (structural subset of move.gateCriteria). */
  gate?: PhaseGateSignal[];
  /** REAL current-state intelligence to feed forward (maturity/gaps/readiness/evidence/gate). */
  feedForward?: FeedForwardSignals;
  /**
   * Wire a checklist task's action to the host. The checklist NEVER commits —
   * this only navigates the user to the host's own controls (single write path).
   */
  onTaskAction?: (taskId: PhaseTask['id']) => void;
  /** The most recent completed-template upload classification, if any. */
  uploadClassification?: MoveTemplateUploadClassification | null;
  /** Trigger the host's completed-template file picker (host runs classifyUpload). */
  onUploadCompletedTemplate?: () => void;
  /** Trigger the host's final-reviewed-version file picker (host computes the diff). */
  onUploadFinalVersion?: () => void;
  /** Deterministic draft→final comparison, once a final version is uploaded. */
  whatChanged?: WhatChangedResult | null;
  /** Client confirmation of the final version. */
  onConfirmChanges?: () => void;
  /** True once the client has confirmed the final version. */
  changesConfirmed?: boolean;
  /** An approved Inputs Pack this phase inherited from the prior phase, if any. */
  approvedPack?: ApprovedInputsPack | null;
  /** Human-formatted approval date for the inherited pack. */
  approvedPackOnLabel?: string;
}): React.ReactElement | null {
  const code = PHASE_NUM_TO_CODE[phaseNum];
  if (!code) return null; // Originate/Charter (0/1) have no session catalog yet.
  const templates = templatesForPhase(code);
  if (templates.length === 0) return null;

  const hasWorkflowSignal = evidence.length > 0 || gate.length > 0;
  const workflow = hasWorkflowSignal
    ? buildPhaseWorkflow({ phaseLabel, nextPhaseLabel, evidence, gate })
    : null;

  const feedForwardPack = feedForward
    ? buildFeedForwardPack(phaseNum, nextPhaseLabel ?? 'the next phase', feedForward)
    : null;

  return (
    <div className="pw" id="move-phase-workspace-v2" data-testid="move-phase-workspace-v2">
      <PhaseWorkspaceStyles />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0 8px' }}>
        {workflow ? (
          <PhaseTaskChecklist phaseLabel={phaseLabel} workflow={workflow} onAction={onTaskAction} />
        ) : null}
        {approvedPack ? (
          <ApprovedInputsPackCard pack={approvedPack} approvedOnLabel={approvedPackOnLabel} />
        ) : null}
        <PhaseCompletionGuideCard phaseLabel={phaseLabel} templates={templates} steps={PHASE_STEPS} />
        {feedForwardPack && !feedForwardPack.isBlank ? (
          <NextPhaseFeedForwardCard pack={feedForwardPack} />
        ) : null}
        <PhaseTemplatesAndSessionsCard templates={templates} />
        {onUploadCompletedTemplate ? (
          <div className="pw-card" style={{ gap: 10 }}>
            <div className="pw-card-head">
              <span className="pw-kicker">Upload</span>
              <h3 className="pw-title serif">Upload a completed template</h3>
              <span className="pw-note">
                AbarVa reads it, maps what it finds to your solution lanes, and prepares the next
                phase. It stays in this Move.
              </span>
            </div>
            <div>
              <button type="button" className="pw-dl-btn" onClick={onUploadCompletedTemplate}>
                ↑ Upload completed template
              </button>
            </div>
          </div>
        ) : null}
        {uploadClassification ? (
          <UploadMappingSummaryCard classification={uploadClassification} />
        ) : null}
        {uploadClassification && onUploadFinalVersion ? (
          <div className="pw-card" style={{ gap: 10 }}>
            <div className="pw-card-head">
              <span className="pw-kicker">Client final review</span>
              <h3 className="pw-title serif">Uploaded the final reviewed version?</h3>
              <span className="pw-note">
                If the client edited it offline, upload the final — AbarVa shows what changed before
                carrying it forward.
              </span>
            </div>
            <div>
              <button type="button" className="pw-dl-btn" onClick={onUploadFinalVersion}>
                ↑ Upload final reviewed version
              </button>
            </div>
          </div>
        ) : null}
        {whatChanged ? (
          <WhatChangedCard
            result={whatChanged}
            onConfirm={onConfirmChanges}
            confirmed={changesConfirmed}
          />
        ) : null}
      </div>
    </div>
  );
}
