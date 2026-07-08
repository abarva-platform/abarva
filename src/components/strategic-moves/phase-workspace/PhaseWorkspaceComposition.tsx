// Moves phase workspace — demo composition.
// Renders the Lakeshore Legal fixture through the nine cards. This is the
// increment-2 preview: a pure function of the typed layer, mountable in the app
// (behind a flag, increment 3) and renderable to static HTML for proof.

import * as React from 'react';
import { templatesForPhase } from '../../../lib/programs/phase-templates/catalog';
import { PHASE_LABELS } from '../../../lib/programs/phase-templates/types';
import { LAKESHORE_LEGAL_DEMO_FIXTURE } from '../../../lib/programs/phase-templates/fixtures/lakeshore-legal';
import {
  BlockToWorkstreamPreview,
  BuildingBlockLaneCanvas,
  ClientFinalReviewCard,
  CurrentStateAssessmentMap,
  NextPhaseReadinessPackCard,
  PhaseCompletionGuideCard,
  PhaseTemplatesAndSessionsCard,
  SolutionOptionsCanvas,
  UploadMappingSummaryCard,
} from './cards';
import { PhaseWorkspaceStyles } from './styles';

const F = LAKESHORE_LEGAL_DEMO_FIXTURE;

const P2_STEPS = [
  'Run the recommended current-state sessions with the business and Legal Operations.',
  'Upload each completed session document — AbarVa maps it to your solution lanes.',
  'Confirm the open questions AbarVa surfaces, then attest at the gate to advance.',
];

export function PhaseWorkspaceComposition(): React.ReactElement {
  const p2Templates = templatesForPhase('P2');
  const pack = F.p4WorkstreamInputsPack;
  return (
    <div className="pw">
      <PhaseWorkspaceStyles />
      <div className="pw-shell">
        <header className="pw-head">
          <span className="pw-eyebrow">AbarVa · Moves · Phase workspace</span>
          <h1 className="pw-h1 serif">{F.move.moveName}</h1>
          <span className="pw-sub">
            Lakeshore Shared Services · {F.move.function} · {PHASE_LABELS.P2}
          </span>
        </header>

        <PhaseCompletionGuideCard phaseLabel={PHASE_LABELS.P2} templates={p2Templates} steps={P2_STEPS} />
        <PhaseTemplatesAndSessionsCard templates={p2Templates} />
        <CurrentStateAssessmentMap rows={F.p2Assessment} />
        <BuildingBlockLaneCanvas
          selected={F.move.selectedBuildingBlocks}
          notRecommendedYet={F.move.notRecommendedYet}
        />
        <SolutionOptionsCanvas
          options={F.p3Options}
          recommendationReason={F.p3Recommendation.reason}
          notRecommendedYet={F.p3Recommendation.notRecommendedYet}
        />
        <UploadMappingSummaryCard classification={F.p3DecisionUpload} />
        <NextPhaseReadinessPackCard
          toPhaseLabel={PHASE_LABELS.P4}
          sections={[
            { label: 'Selected approach', values: [pack.selectedSolutionApproach] },
            { label: 'Deferred options', values: pack.deferredOptions },
            { label: 'Architecture constraints', values: pack.architectureConstraints },
            { label: 'Controls required', values: pack.controlRequirements },
            { label: 'Workstream candidates', values: pack.workstreamCandidates.map((w) => w.workstream) },
            { label: 'Value assumptions to validate', values: pack.valueAssumptionsToValidate },
          ]}
        />
        <BlockToWorkstreamPreview rows={F.p4Workstreams} />
        <ClientFinalReviewCard
          finalLabel="Solution Approach Decision Summary"
          changes={[
            'SME edits from the working session folded in.',
            'One open gap resolved and re-confirmed by the owner.',
            'SME sign-off attached — the version is auditable.',
          ]}
          gateQuestion="A gate is a set of human attestations. Confirm the current-state findings are accurate to advance to Choose the Approach."
        />

        <p className="pw-foot">
          Illustrative — Lakeshore Legal Contract Intake demo fixture. Uploads stay Move-scoped; nothing
          is added to enterprise context automatically.
        </p>
      </div>
    </div>
  );
}
