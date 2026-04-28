/**
 * SRC-S4 · ScorecardGovernancePanel — lifecycle state snapshot tests.
 *
 * Verifies:
 *   - Renders with legacy 3-state approvalState (not_started, in_review, approved)
 *   - Renders with full 7-state ScorecardLifecycleState
 *   - lifecycle-strip data-testid is present
 *   - Sentinel voice format per spec
 *   - No forbidden imports
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ScorecardGovernancePanel } from '@/components/source/ScorecardGovernancePanel';
import { SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source/constants';
import { getSourceEventSeed } from '@/lib/source/mock-seed';
import { buildSourceStageGateReadiness } from '@/lib/source/source-stage-gates';
import type { ScorecardGovernance, ScorecardLifecycleState } from '@/lib/source/types';

const FULL_LIFECYCLE: ScorecardLifecycleState[] = [
  'default_generated',
  'client_edited',
  'rationale_added',
  'reviewed',
  'approved',
  'locked',
  'used_for_vendor_evaluation',
];

function makeProps(overrides: Partial<ScorecardGovernance> = {}) {
  const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026)!;
  const readiness = buildSourceStageGateReadiness({ event });
  const gate = readiness.gates.find((g) => g.transitionId === 'gate-evaluation-bafo') ?? readiness.gates[0];
  return {
    scorecard: { ...event.scorecard, ...overrides },
    eventName: event.name,
    currentStageLabel: event.currentStageLabel,
    currentBlocker: event.blocker,
    gateImpact: {
      label: gate.transitionLabel,
      state: gate.state,
      blocker: gate.blocker,
      requiredArtifacts: gate.requiredArtifacts,
      requiredApprovals: gate.requiredApprovals,
    },
  };
}

// ---------------------------------------------------------------------------
// Legacy 3-state arc
// ---------------------------------------------------------------------------

describe('ScorecardGovernancePanel · legacy lifecycle', () => {
  it('renders with not_started state', () => {
    const html = renderToStaticMarkup(createElement(ScorecardGovernancePanel, makeProps({ approvalState: 'not_started' })));
    expect(html).toContain('data-testid="scorecard-governance-panel"');
    expect(html).toContain('data-testid="lifecycle-strip"');
    expect(html).toContain('not started');
  });

  it('renders with in_review state', () => {
    const html = renderToStaticMarkup(createElement(ScorecardGovernancePanel, makeProps({ approvalState: 'in_review' })));
    expect(html).toContain('in review');
  });

  it('renders with approved state', () => {
    const html = renderToStaticMarkup(createElement(ScorecardGovernancePanel, makeProps({ approvalState: 'approved' })));
    expect(html).toContain('approved');
  });
});

// ---------------------------------------------------------------------------
// Full 7-state lifecycle (Wave S4)
// ---------------------------------------------------------------------------

describe('ScorecardGovernancePanel · 7-state lifecycle', () => {
  for (const state of FULL_LIFECYCLE) {
    it(`renders with lifecycle state: ${state}`, () => {
      const html = renderToStaticMarkup(createElement(ScorecardGovernancePanel, makeProps({ approvalState: state })));
      expect(html).toContain('data-testid="lifecycle-strip"');
      // all 7 states should appear in the strip
      expect(html).toContain(state.replace(/_/g, ' '));
    });
  }

  it('shows all 7 lifecycle states in the strip when using full lifecycle', () => {
    const html = renderToStaticMarkup(createElement(ScorecardGovernancePanel, makeProps({ approvalState: 'reviewed' })));
    for (const state of FULL_LIFECYCLE) {
      expect(html).toContain(state.replace(/_/g, ' '));
    }
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('ScorecardGovernancePanel · hygiene', () => {
  it('does not import from model/approval/workflow packages', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/source/ScorecardGovernancePanel.tsx'), 'utf8');
    expect(src).not.toMatch(/from ['"][^'"]*(openai|anthropic|@ai-sdk)['"]/);
    expect(src).not.toMatch(/from ['"][^'"]*(upload|parser|approval-engine|workflow-engine)['"]/);
  });

  it('scorecard route has updated Sentinel voice format', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx'), 'utf8');
    expect(src).toContain('Scorecard at');
    expect(src).toContain('pending review');
    expect(src).toContain("Locks when all criteria reach");
  });
});
