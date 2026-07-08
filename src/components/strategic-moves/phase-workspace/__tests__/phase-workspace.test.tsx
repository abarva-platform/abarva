import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { templatesForPhase } from '../../../../lib/programs/phase-templates/catalog';
import { LAKESHORE_LEGAL_DEMO_FIXTURE } from '../../../../lib/programs/phase-templates/fixtures/lakeshore-legal';
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
} from '../cards';
import { PhaseWorkspaceComposition } from '../PhaseWorkspaceComposition';
import { MovePhaseWorkspacePanel } from '../MovePhaseWorkspacePanel';
import { PhaseTaskChecklist } from '../PhaseTaskChecklist';
import { NextPhaseFeedForwardCard } from '../NextPhaseFeedForwardCard';
import { buildPhaseWorkflow } from '../../../../lib/programs/phase-templates/phase-workflow';
import { buildFeedForwardPack } from '../../../../lib/programs/phase-templates/feed-forward';
import { classifyUpload } from '../../../../lib/programs/phase-templates/classification';
import { WhatChangedCard } from '../WhatChangedCard';
import { ApprovedInputsPackCard } from '../ApprovedInputsPackCard';
import { AssembledPatternCard } from '../AssembledPatternCard';
import { computeWhatChanged } from '../../../../lib/programs/phase-templates/what-changed';
import { buildApprovedInputsPack } from '../../../../lib/programs/phase-templates/approved-inputs-pack';
import { buildFeedForwardPack as buildFF } from '../../../../lib/programs/phase-templates/feed-forward';

const F = LAKESHORE_LEGAL_DEMO_FIXTURE;
const render = (el: React.ReactElement) => renderToStaticMarkup(el);

// Raw block keys and internal/dev terms must NEVER reach the DOM.
const RAW_KEYS =
  /process_redesign|data_readiness|workflow_automation|human_in_loop_agent|controls_governance_risk|value_tracking_operating_cadence|ai_assisted_decision_support|system_platform_implementation/;
// Dev/schema terms must never reach the DOM. (Phase *names* are the labels;
// the "P2 → P3 → P4" lane-spine indicator is intentional approved design copy.)
const INTERNAL_TERMS =
  /(classifyUpload|generated_artifacts|deliverable_versions|sourceArtifactVersionId|materialChangeFlags|PatternAssemblyPacket|enterprisePromotionEligibility|moveScopedOnly|inferredTemplateId)/;

describe('phase-workspace cards render the fixture', () => {
  it('completion guide shows client phase label + session/template counts', () => {
    const html = render(
      <PhaseCompletionGuideCard phaseLabel="Understand Current State" templates={templatesForPhase('P2')} steps={['Do the thing']} />,
    );
    expect(html).toContain('How to complete this phase');
    expect(html).toContain('Understand Current State');
    expect(html).toContain('Templates to use');
  });

  it('templates card lists P2 templates with session + format + a download control', () => {
    const html = render(<PhaseTemplatesAndSessionsCard templates={templatesForPhase('P2')} />);
    expect(html).toContain('Current-State Interview Guide');
    expect(html).toMatch(/Document|Spreadsheet/);
    expect(html).toContain('Template'); // "↓ Template" download button
    expect(html).toContain('pw-dl-btn');
  });

  it('assessment map shows dimensions with status + client-friendly lane labels', () => {
    const html = render(<CurrentStateAssessmentMap rows={F.p2Assessment} />);
    expect(html).toContain('Baseline metrics');
    expect(html).toContain('Evidence-backed');
    expect(html).toContain('Gap'); // "missing" -> Gap
    expect(html).toContain('Process redesign'); // friendly label, not raw key
  });

  it('building-block canvas shows selected blocks + not-recommended-yet guardrail', () => {
    const html = render(
      <BuildingBlockLaneCanvas selected={F.move.selectedBuildingBlocks} notRecommendedYet={F.move.notRecommendedYet} />,
    );
    expect(html).toContain('Recommended solution building blocks');
    expect(html).toContain('not one label');
    expect(html).toContain('Not recommended yet');
    expect(html).toContain('Fully autonomous contract review');
  });

  it('solution options canvas marks the recommended option + defers the rest', () => {
    const html = render(
      <SolutionOptionsCanvas options={F.p3Options} recommendationReason={F.p3Recommendation.reason} notRecommendedYet={F.p3Recommendation.notRecommendedYet} />,
    );
    expect(html).toContain('Recommended');
    expect(html).toContain('CLM-embedded assisted triage');
    expect(html).toContain('Not recommended yet');
  });

  it('workstream preview renders lanes -> owned, measurable workstreams', () => {
    const html = render(<BlockToWorkstreamPreview rows={F.p4Workstreams} />);
    expect(html).toContain('Intake process redesign');
    expect(html).toContain('Legal Operations Lead');
    expect(html).toContain('Realized value');
  });

  it('upload mapping shows plain-English summary + Move-scoped + no auto-promotion note', () => {
    const html = render(<UploadMappingSummaryCard classification={F.p3DecisionUpload} />);
    expect(html).toContain('What AbarVa found');
    expect(html).toContain('Move-scoped only');
    expect(html.toLowerCase()).toContain('not added to enterprise context');
  });

  it('readiness pack presents the feed-forward for the next phase', () => {
    const html = render(
      <NextPhaseReadinessPackCard
        toPhaseLabel="Build the Plan"
        sections={[{ label: 'Selected approach', values: [F.p4WorkstreamInputsPack.selectedSolutionApproach] }]}
      />,
    );
    expect(html).toContain('Ready to start: Build the Plan');
    expect(html).toContain('never starts blank');
    expect(html).toContain('Option B');
  });

  it('client final review shows change log + human-attestation gate', () => {
    const html = render(
      <ClientFinalReviewCard finalLabel="Decision Summary" changes={['SME sign-off attached']} gateQuestion="Confirm findings" />,
    );
    expect(html).toContain('What changed vs. the AbarVa draft');
    expect(html).toContain('on file');
    expect(html).toContain('Approve');
  });
});

describe('live mount panel (increment 3) — catalog-driven, keyed on numeric phase', () => {
  it('renders the guidance + templates for a catalog phase (P2 = numeric 2)', () => {
    const html = render(<MovePhaseWorkspacePanel phaseNum={2} phaseLabel="P2 · Discover" />);
    expect(html).toContain('How to complete this phase');
    expect(html).toContain('Sessions and templates for this phase');
    expect(html).toContain('P2 · Discover'); // the app's own phase label stays authoritative
    expect(html).toContain('Current-State Interview Guide');
    expect(RAW_KEYS.test(html)).toBe(false);
  });

  it('renders nothing for phases with no session catalog (Originate/Charter = 0/1)', () => {
    expect(render(<MovePhaseWorkspacePanel phaseNum={0} phaseLabel="P0 · Originate" />)).toBe('');
    expect(render(<MovePhaseWorkspacePanel phaseNum={1} phaseLabel="P1 · Charter" />)).toBe('');
  });

  it('maps numeric 3/4/5 to the right catalog phases', () => {
    expect(render(<MovePhaseWorkspacePanel phaseNum={3} phaseLabel="P3" />)).toContain('Solution Options Canvas');
    expect(render(<MovePhaseWorkspacePanel phaseNum={4} phaseLabel="P4" />)).toContain('Roadmap');
    expect(render(<MovePhaseWorkspacePanel phaseNum={5} phaseLabel="P5" />)).toContain('RACI');
  });
});

describe('phase task checklist (increment 4) — Stripe-style, real-signal', () => {
  const wf = buildPhaseWorkflow({
    phaseLabel: 'P2 · Discover',
    nextPhaseLabel: 'P3 · Design',
    evidence: [{ priority: 'required', status: 'covered' }, { priority: 'required', status: 'missing' }],
    gate: [{ completed: true, severity: 'hard' }, { completed: false, severity: 'hard' }],
  });

  it('renders the ordered tasks with real progress + a progress header', () => {
    const html = render(<PhaseTaskChecklist phaseLabel="P2 · Discover" workflow={wf} />);
    expect(html).toContain('What to do next');
    expect(html).toContain('Provide the evidence this phase needs');
    expect(html).toContain('1 of 2 in'); // real evidence count
    expect(html).toContain('Meet the gate criteria');
    expect(html).toContain('of 2 done'); // progress header
  });

  it('the panel shows the checklist when real signals are present, hides it otherwise', () => {
    const withSignals = render(
      <MovePhaseWorkspacePanel
        phaseNum={2}
        phaseLabel="P2 · Discover"
        nextPhaseLabel="P3 · Design"
        evidence={[{ priority: 'required', status: 'missing' }]}
        gate={[{ completed: false, severity: 'hard' }]}
      />,
    );
    expect(withSignals).toContain('What to do next');

    const noSignals = render(<MovePhaseWorkspacePanel phaseNum={2} phaseLabel="P2 · Discover" />);
    expect(noSignals).not.toContain('What to do next'); // guidance only
    expect(noSignals).toContain('How to complete this phase');
  });

  it('non-wired actions render as status hints, not fake buttons (single write path)', () => {
    const html = render(<PhaseTaskChecklist phaseLabel="P2" workflow={wf} />);
    expect(html).toContain('pw-task-hint');
    expect(html).not.toContain('<button');
  });

  it('with an action handler, non-locked tasks become buttons; locked stays a hint', () => {
    const html = render(<PhaseTaskChecklist phaseLabel="P2" workflow={wf} onAction={() => {}} />);
    // evidence + gate (not done, not locked) → buttons; advance (locked) → hint
    expect((html.match(/<button/g) ?? []).length).toBe(2);
    expect(html).toContain('pw-task-hint'); // the locked advance task
  });
});

describe('feed-forward card (increment 6) — real current-state carried forward', () => {
  const pack = buildFeedForwardPack(2, 'P3 Choose the Approach', {
    whereToStart: 'Start with data governance.',
    gaps: [{ capability: 'Data ownership model', severity: 'foundational' }],
    hardGaps: ['System of record unconfirmed'],
    softGaps: ['Data owner not named'],
    missingEvidence: ['Baseline metrics'],
    coverageScore: 62,
    controlConstraints: ['Attorney approval for non-standard terms'],
  });

  it('renders the "Prepared for" headline, carry-forward bullets, and named sections', () => {
    const html = render(<NextPhaseFeedForwardCard pack={pack} />);
    expect(html).toContain('Prepared for P3 Choose the Approach');
    expect(html).toContain('AbarVa will carry forward');
    expect(html).toContain('Design inputs');
    expect(html).toContain('Data ownership model');
    expect(html).toContain('Evidence gaps');
    expect(html).toContain('Baseline metrics');
    expect(html).toContain('Recommended P3 Choose the Approach focus');
  });

  it('unpopulated sections render "Needs confirmation", never fabricated', () => {
    const sparse = buildFeedForwardPack(3, 'P4 Build the Plan', {}); // no approach/workstreams
    const html = render(<NextPhaseFeedForwardCard pack={sparse} />);
    expect(html).toContain('Selected approach');
    expect(html).toContain('Needs confirmation');
  });

  it('panel shows the feed-forward card when real signals are present', () => {
    const withFF = render(
      <MovePhaseWorkspacePanel
        phaseNum={2}
        phaseLabel="P2 · Discover"
        nextPhaseLabel="P3 Choose the Approach"
        feedForward={{
          gaps: [{ capability: 'Data ownership model', severity: 'foundational' }],
          hardGaps: ['System of record unconfirmed'],
          softGaps: [],
          missingEvidence: [],
          coverageScore: 50,
        }}
      />,
    );
    expect(withFF).toContain('Prepared for P3 Choose the Approach');
  });
});

describe('completed-template upload → mapping (increment 8)', () => {
  const decision = templatesForPhase('P3').find((x) => x.label.toLowerCase().includes('decision'))!;
  const classification = classifyUpload({
    uploadId: 'decision.md',
    moveId: 'm1',
    phase: 'P3',
    uploadCategory: 'review_summary',
    inferredTemplateId: decision.templateId,
    confidence: 'high',
  });

  it('panel shows an upload control when the host provides the handler', () => {
    const html = render(
      <MovePhaseWorkspacePanel
        phaseNum={3}
        phaseLabel="P3 · Design"
        onUploadCompletedTemplate={() => {}}
      />,
    );
    expect(html).toContain('Upload a completed template');
  });

  it('panel renders the mapping summary once a classification exists — Move-scoped, no promotion', () => {
    const html = render(
      <MovePhaseWorkspacePanel
        phaseNum={3}
        phaseLabel="P3 · Design"
        onUploadCompletedTemplate={() => {}}
        uploadClassification={classification}
      />,
    );
    expect(html).toContain('What AbarVa found');
    expect(html).toContain('Move-scoped only');
    expect(html.toLowerCase()).toContain('not added to enterprise context');
  });
});

describe('client-final → What Changed (increment 9)', () => {
  const result = computeWhatChanged(
    '## Selected approach\nOrchestration layer.\n## Scope\nAll.',
    '## Selected approach\nCLM-embedded triage.\n## Scope\nNDAs and SOWs.\n## Risks\nNew.',
    ['P4 workstream inputs'],
  );

  it('shows changed/added sections, impacted next phase, and a confirm control', () => {
    const html = render(<WhatChangedCard result={result} onConfirm={() => {}} />);
    expect(html).toContain('What changed vs. the draft');
    expect(html).toContain('Selected approach'); // changed
    expect(html).toContain('Risks'); // added
    expect(html).toContain('Next phase to review');
    expect(html).toContain('P4 workstream inputs');
    expect(html).toContain('Confirm changes');
  });

  it('reflects the confirmed state (no re-confirm button)', () => {
    const html = render(<WhatChangedCard result={result} confirmed />);
    expect(html).toContain('Final version confirmed');
    expect(html).toContain('✓ Confirmed');
    expect(html).not.toContain('<button');
  });

  it('reports no differences cleanly when draft === final', () => {
    const same = computeWhatChanged('## A\nx', '## A\nx');
    const html = render(<WhatChangedCard result={same} />);
    expect(html).toContain('No differences found');
  });

  it('panel shows the final-upload control only after a completed template exists', () => {
    const decision = templatesForPhase('P3').find((x) => x.label.toLowerCase().includes('decision'))!;
    const classification = classifyUpload({
      uploadId: 'd.md',
      moveId: 'm1',
      phase: 'P3',
      uploadCategory: 'review_summary',
      inferredTemplateId: decision.templateId,
      confidence: 'high',
    });
    const withDraft = render(
      <MovePhaseWorkspacePanel
        phaseNum={3}
        phaseLabel="P3"
        uploadClassification={classification}
        onUploadCompletedTemplate={() => {}}
        onUploadFinalVersion={() => {}}
      />,
    );
    expect(withDraft).toContain('Upload final reviewed version');

    const noDraft = render(
      <MovePhaseWorkspacePanel phaseNum={3} phaseLabel="P3" onUploadFinalVersion={() => {}} />,
    );
    expect(noDraft).not.toContain('Upload final reviewed version');
  });
});

describe('approved Inputs Pack (increment 10) — inherited, Move-scoped, not promoted', () => {
  const approvedPack = buildApprovedInputsPack({
    moveId: 'm1',
    sourcePhase: 2,
    targetPhase: 3,
    targetPhaseLabel: 'P3 Choose the Approach',
    approvedBy: 'person-1',
    approvedAt: '2026-07-08T00:00:00.000Z',
    sourceUploadId: 'decision.md',
    feedForward: buildFF(2, 'P3 Choose the Approach', {
      gaps: [{ capability: 'Data ownership model', severity: 'foundational' }],
      hardGaps: ['System of record unconfirmed'],
      softGaps: [],
      missingEvidence: [],
    }),
    whatChanged: computeWhatChanged('## A\nx', '## A\ny\n## B\nnew'),
  });

  it('card shows the approved status and states enterprise context is NOT added', () => {
    const html = render(<ApprovedInputsPackCard pack={approvedPack} approvedOnLabel="Jul 8, 2026" />);
    expect(html).toContain('Approved for next phase');
    expect(html.toLowerCase()).toContain('enterprise context: not added yet');
  });

  it('panel renders the inherited approved pack when present', () => {
    const html = render(
      <MovePhaseWorkspacePanel phaseNum={3} phaseLabel="P3 · Design" approvedPack={approvedPack} />,
    );
    expect(html).toContain('approved Inputs Pack');
    expect(html).toContain('Approved for next phase');
  });

  it('FALLBACK: no approved pack → panel does not show the approved card (deterministic feed-forward stands)', () => {
    const html = render(
      <MovePhaseWorkspacePanel
        phaseNum={3}
        phaseLabel="P3 · Design"
        nextPhaseLabel="P4"
        feedForward={{ gaps: [{ capability: 'X', severity: 'high' }], hardGaps: [], softGaps: [], missingEvidence: [] }}
      />,
    );
    expect(html).not.toContain('Approved for next phase');
    expect(html).toContain('Prepared for P4'); // feed-forward fallback intact
  });

  it('no internal schema labels leak (type discriminator, column names)', () => {
    const html = render(<ApprovedInputsPackCard pack={approvedPack} />);
    expect(html).not.toMatch(/approved_inputs_pack|deliverable_versions|generated_artifacts|targetPhase|moveScopedOnly/);
  });
});

describe('assembled pattern card (increment 12) — Claude assembled, AbarVa labeled', () => {
  it('renders each item with a client-friendly label and the no-invention note', () => {
    const html = render(
      <AssembledPatternCard
        items={[
          { statement: 'Average cycle time is 31.6 days.', label: 'evidence_backed' },
          { statement: 'Cycle time will drop 40%.', label: 'needs_confirmation', reason: 'Numeric claim not backed by evidence.' },
          { statement: 'Move to fully autonomous contract review.', label: 'not_allowed', reason: 'Exceeds control readiness.' },
        ]}
      />,
    );
    expect(html).toContain('Evidence-backed');
    expect(html).toContain('Needs confirmation');
    expect(html).toContain('Not recommended');
    expect(html.toLowerCase()).toContain('never invented');
    // raw enum labels must NOT leak
    expect(html).not.toMatch(/evidence_backed|needs_confirmation|not_allowed/);
  });

  it('renders nothing when there are no assembled items', () => {
    expect(render(<AssembledPatternCard items={[]} />)).toBe('');
  });

  it('panel shows the assemble control only when the feature handler is provided', () => {
    const on = render(<MovePhaseWorkspacePanel phaseNum={3} phaseLabel="P3" onAssemble={() => {}} />);
    expect(on).toContain('Assemble options');
    const off = render(<MovePhaseWorkspacePanel phaseNum={3} phaseLabel="P3" />);
    expect(off).not.toContain('Assemble options');
  });

  it('panel renders the validated assembly output when present', () => {
    const html = render(
      <MovePhaseWorkspacePanel
        phaseNum={3}
        phaseLabel="P3"
        onAssemble={() => {}}
        assembledItems={[{ statement: 'Attorney approves risk tier.', label: 'evidence_backed' }]}
      />,
    );
    expect(html).toContain('AbarVa assembled these');
    expect(html).toContain('Evidence-backed');
  });
});

describe('governance: no internal jargon or raw keys leak to the DOM', () => {
  it('full composition renders without raw block keys', () => {
    const html = render(<PhaseWorkspaceComposition />);
    expect(RAW_KEYS.test(html)).toBe(false);
  });

  it('full composition renders without internal/dev/schema terms', () => {
    const html = render(<PhaseWorkspaceComposition />);
    expect(INTERNAL_TERMS.test(html)).toBe(false);
  });

  it('full composition renders the move + every phase card', () => {
    const html = render(<PhaseWorkspaceComposition />);
    for (const needle of [
      'Legal Contract Intake and Obligation Control',
      'How to complete this phase',
      'Current-state assessment',
      'Recommended solution building blocks',
      'Solution options',
      'What AbarVa found',
      'Ready to start: Build the Plan',
      'Each block becomes a workstream',
      'What changed vs. the AbarVa draft',
    ]) {
      expect(html).toContain(needle);
    }
  });
});
