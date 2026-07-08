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

  it('templates card lists P2 templates with session + format', () => {
    const html = render(<PhaseTemplatesAndSessionsCard templates={templatesForPhase('P2')} />);
    expect(html).toContain('Current-State Interview Guide');
    expect(html).toMatch(/Document|Spreadsheet/);
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
