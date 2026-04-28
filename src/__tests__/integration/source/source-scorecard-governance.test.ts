import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source/constants';
import { getSourceEventSeed } from '@/lib/source/mock-seed';
import { buildSourceStageGateReadiness } from '@/lib/source/source-stage-gates';
import { ScorecardGovernancePanel } from '@/components/source/ScorecardGovernancePanel';

describe('Source scorecard governance shell', () => {
  it('renders the steward-led governance shell with canonical sections and actions', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026);
    expect(event).not.toBeNull();
    if (!event) return;

    const readiness = buildSourceStageGateReadiness({ event });
    const evaluationToBafoGate = readiness.gates.find((gate) => gate.transitionId === 'gate-evaluation-bafo') ?? readiness.gates[0];

    const html = renderToStaticMarkup(createElement(ScorecardGovernancePanel, {
      scorecard: event.scorecard,
      eventName: event.name,
      currentStageLabel: event.currentStageLabel,
      currentBlocker: event.blocker,
      gateImpact: {
        label: evaluationToBafoGate.transitionLabel,
        state: evaluationToBafoGate.state,
        blocker: evaluationToBafoGate.blocker,
        requiredArtifacts: evaluationToBafoGate.requiredArtifacts,
        requiredApprovals: evaluationToBafoGate.requiredApprovals,
      },
    }));

    expect(html).toContain('Scorecard governance shell');
    expect(html).toContain('Steward governance lead');
    expect(html).toContain('Review blockers');
    expect(html).toContain('Show evidence gaps');
    expect(html).toContain('Explain gate impact');
    expect(html).toContain('Ask custom');
    expect(html).toContain('Context used');
    expect(html).toContain('Audit trail placeholder');
    expect(html).toContain('Deterministic governance shell only');
    expect(html).toContain('Commercial');
    expect(html).toContain('Transition');
    expect(html).toContain('Evidence');
    expect(html).toContain('Automation');
    expect(html).toContain('Risk');
    expect(html).toContain('Governance');
    expect(html).toContain('Proceed to BAFO');
  });

  it('keeps the route and component free of model, upload, parsing, workflow, and approval engine imports', () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx'),
      'utf8',
    );
    const componentSource = fs.readFileSync(
      path.join(process.cwd(), 'src/components/source/ScorecardGovernancePanel.tsx'),
      'utf8',
    );

    expect(routeSource).toContain('AppShell');
    expect(componentSource).toContain('Custom follow-up is deferred');

    for (const source of [routeSource, componentSource]) {
      expect(source).not.toMatch(/from ['"][^'"]*(openai|claude|anthropic|upload|parser|parsing|workflow-engine|approval-engine)[^'"]*['"]/i);
    }
  });
});
