import * as fs from 'fs';
import * as path from 'path';
import { buildNexusProgramWorkbenchView } from '../../../lib/programs/nexus-program-workbench-view';
import { NexusProgramWorkbench } from '../../../components/programs/NexusProgramWorkbench';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/NexusProgramWorkbench.tsx'),
  'utf8',
);
const viewSource = fs.readFileSync(
  path.join(repoRoot, 'src/lib/programs/nexus-program-workbench-view.ts'),
  'utf8',
);
const canonicalDetailSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/ProgramCanonicalDetail.tsx'),
  'utf8',
);
const flagshipSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/ProgramFlagshipPage.tsx'),
  'utf8',
);

describe('NexusProgramWorkbench · view model', () => {
  // The reference fixture is the canon-spec example: APX-CDP-2026 in
  // Synthesis with the Design gate pending. currentPhaseSpec = 2 maps
  // to the Synthesis workbench phase.
  const view = buildNexusProgramWorkbenchView({
    programCode: 'APX-CDP-2026',
    programName: 'Customer Data Platform Activation',
    tenantLabel: 'Apex Retail',
    currentPhaseSpec: 2,
    deliverableCount: 14,
    evidenceBackedDeliverables: 5,
  });

  it('exposes the program identity used in the page header', () => {
    expect(view.programIdentity).toBe('APX-CDP-2026 · Customer Data Platform Activation');
    expect(view.headerSubtitle).toContain('Active Program workspace');
    expect(view.headerSubtitle).toContain('Phase journey appears first');
  });

  it('renders the canonical six-phase journey with correct states', () => {
    expect(view.phaseJourney.map((phase) => phase.key)).toEqual([
      'discovery',
      'synthesis',
      'design',
      'build',
      'activate',
      'operate',
    ]);
    expect(view.phaseJourney.map((phase) => phase.state)).toEqual([
      'done',
      'current',
      'gate-pending',
      'locked',
      'locked',
      'locked',
    ]);
    expect(view.phaseJourney.map((phase) => phase.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(view.defaultPhaseKey).toBe('synthesis');
  });

  it('exposes a journey subtitle that names the current and gated phases', () => {
    expect(view.journeySubtitle).toContain('P2 Synthesis is current');
    expect(view.journeySubtitle).toContain('P3 Design');
  });

  it('default focus is the Synthesis brief and chips from the mockup', () => {
    expect(view.brief).toContain('Phase 2 · Synthesis');
    expect(view.cta).toBe('Prepare workshop');
    expect(view.contextUsed).toEqual([
      'Program state',
      'Workshop 5',
      'Deliverables',
      'Evidence gaps',
      'Source AMS event',
    ]);
    expect(view.confidenceLabel).toBe('Confidence: partial evidence');
    expect(view.blockerLabel).toBe('Blocker: value hypothesis evidence');
  });

  it('synthesis suggested actions match the canonical three labels', () => {
    expect(view.suggestedActions.map((action) => action.label)).toEqual([
      'Review Design gate blockers',
      'Open Workshop 5 outcomes',
      'Inspect deliverable evidence',
    ]);
  });

  it('agent handoffs always carry the canonical four agents in order', () => {
    expect(view.agentHandoffs.map((handoff) => handoff.agent)).toEqual([
      'nexus',
      'steward',
      'sentinel',
      'atlas',
    ]);
    const nexus = view.agentHandoffs.find((h) => h.agent === 'nexus')!;
    expect(nexus.state).toBe('active');
    expect(nexus.stateLabel).toBe('ACTIVE');
    expect(nexus.role).toBe('Orchestration lead');
  });

  it('current gate card describes the Steward block', () => {
    expect(view.currentGateLabel).toBe('Synthesis → Design · Pending');
    expect(view.currentGateDescription).toContain('Steward blocks approval');
    expect(view.currentGateDescription).toContain('Workshop 5 outcomes');
  });

  it('evidence coverage has six slices, sums to 100, and highlights Discovery as strongest', () => {
    expect(view.evidenceCoverage).toHaveLength(6);
    const total = view.evidenceCoverage.reduce((sum, slice) => sum + slice.percentage, 0);
    expect(total).toBe(100);
    const strongest = [...view.evidenceCoverage].sort((a, b) => b.percentage - a.percentage)[0]!;
    expect(strongest.phaseKey).toBe('discovery');
    expect(strongest.tone).toBe('strong');
    expect(view.evidenceCoverageNote).toContain('Discovery evidence is strongest');
  });

  it('exposes the deterministic + three-choices rule callouts', () => {
    expect(view.deterministicCaveat).toContain('Deterministic route shell');
    expect(view.deterministicCaveat).toContain('No fake approvals');
    expect(view.deterministicCaveat).toContain('No live chat');
    expect(view.threeChoicesRule).toContain('Only shown when it moves work forward');
  });

  it('exposes a context strip (B-1) with tenant, program, phase, gate, caveat, source event', () => {
    expect(view.contextStrip.tenantBadgeLabel).toContain('Apex Retail');
    expect(view.contextStrip.programCode).toBe('APX-CDP-2026');
    expect(view.contextStrip.phaseLabel).toContain('P2');
    expect(view.contextStrip.gateLabel).toContain('Pending');
    expect(view.contextStrip.caveat.toLowerCase()).toContain('seed');
    expect(view.contextStrip.sourceEventLabel).toContain('apex-retail-ams-outsourcing-2026');
    expect(view.contextStrip.sourceEventHref).toContain('/source/events/');
  });

  it('exposes the canonical six-tab subnav (C-6)', () => {
    expect(view.subnavTabs.map((tab) => tab.key)).toEqual([
      'overview',
      'workshop',
      'deliverables',
      'evidence',
      'actions',
      'gate',
    ]);
  });

  it('synthesis workshop (C-5) carries title + agenda + questions + evidence + attendees', () => {
    const workshop = view.phaseFocusByKey['synthesis']!.workshop;
    expect(workshop.title).toContain('Workshop 5');
    expect(workshop.agenda.length).toBeGreaterThanOrEqual(3);
    expect(workshop.questions.length).toBeGreaterThanOrEqual(2);
    expect(workshop.evidenceToCapture.length).toBeGreaterThanOrEqual(2);
    expect(workshop.attendees.length).toBeGreaterThanOrEqual(3);
    expect(view.workshop.title).toBe(workshop.title);
  });

  it('synthesis missing inputs (C-8) carry state + source label per item', () => {
    const inputs = view.phaseFocusByKey['synthesis']!.missingInputs;
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    for (const input of inputs) {
      expect(['open', 'in-progress', 'satisfied']).toContain(input.state);
      expect(input.label.length).toBeGreaterThan(0);
      expect(input.sourceLabel.length).toBeGreaterThan(0);
    }
    expect(inputs.some((i) => i.state === 'open')).toBe(true);
  });

  it('every phase carries a workshop and missing-inputs payload', () => {
    for (const phase of view.phaseJourney) {
      const focus = view.phaseFocusByKey[phase.key]!;
      expect(focus.workshop.title.length).toBeGreaterThan(0);
      expect(focus.workshop.agenda.length).toBeGreaterThanOrEqual(2);
      expect(focus.missingInputs.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('exposes a per-phase focus map with cta + brief + 3 actions + 4 agents', () => {
    for (const phase of view.phaseJourney) {
      const focus = view.phaseFocusByKey[phase.key];
      expect(focus).toBeTruthy();
      expect(focus!.brief.length).toBeGreaterThan(0);
      expect(focus!.cta.length).toBeGreaterThan(0);
      expect(focus!.contextUsed.length).toBeGreaterThan(0);
      expect(focus!.confidenceLabel.length).toBeGreaterThan(0);
      expect(focus!.blockerLabel.length).toBeGreaterThan(0);
      expect(focus!.suggestedActions).toHaveLength(3);
      expect(focus!.agentHandoffs.map((h) => h.agent)).toEqual([
        'nexus',
        'steward',
        'sentinel',
        'atlas',
      ]);
    }
  });

  it('non-current phases carry distinct briefs from synthesis', () => {
    const synthesis = view.phaseFocusByKey['synthesis']!;
    for (const key of ['discovery', 'design', 'build', 'activate', 'operate']) {
      expect(view.phaseFocusByKey[key]!.brief).not.toBe(synthesis.brief);
    }
  });
});

describe('NexusProgramWorkbench · component contract', () => {
  it('exports a function component', () => {
    expect(typeof NexusProgramWorkbench).toBe('function');
  });

  it('keeps the required visual contract text', () => {
    // Section labels visible in the DOM
    expect(componentSource).toContain('Nexus Program Workbench');
    expect(componentSource).toContain('Program journey');
    expect(componentSource).toContain('Context used');
    expect(componentSource).toContain('Suggested Nexus actions');
    expect(componentSource).toContain('Ask Nexus');
    expect(componentSource).toContain('Agent handoff rail');
    expect(componentSource).toContain('Current gate');
    expect(componentSource).toContain('Evidence coverage');
    // Legacy "Phase Journey" marker is preserved (hidden span) for the
    // route-shell contract; the visible heading is "Program journey".
    expect(componentSource).toContain('Phase Journey');
  });

  it('uses the locked AbarVa palette and avoids banned tokens', () => {
    expect(componentSource).toContain('#132B4F');
    expect(componentSource).toContain('#0B4A91');
    expect(componentSource).not.toContain('#14B8A6');
    expect(componentSource).not.toContain('#0E9F8C');
    expect(componentSource.toLowerCase()).not.toContain('cyber');
    expect(componentSource.toLowerCase()).not.toContain('neon');
  });

  it('does not include generic chatbot/avatar copy', () => {
    const combined = `${componentSource}\n${viewSource}`.toLowerCase();
    expect(combined).not.toContain('chatbot');
    expect(combined).not.toContain('avatar');
  });

  it('does not import model/runtime/upload/persistence APIs', () => {
    const combined = `${componentSource}\n${viewSource}`;
    expect(combined).not.toContain('openai');
    expect(combined).not.toContain('anthropic');
    expect(combined).not.toContain('claude');
    expect(combined).not.toContain('@/lib/models');
    expect(combined).not.toContain('@/lib/ai');
    expect(combined).not.toContain('@/lib/upload');
    expect(combined).not.toContain('@/lib/parsing');
    expect(combined).not.toContain('supabase');
    expect(combined).not.toContain('fetch(');
  });

  it('is mounted on the canonical Program detail route', () => {
    expect(canonicalDetailSource).toContain('NexusProgramWorkbench');
  });

  it('is also available in the ProgramFlagshipPage reference shell', () => {
    expect(flagshipSource).toContain('NexusProgramWorkbench');
  });

  it('renders each phase as a clickable button driving selected-phase state', () => {
    expect(componentSource).toContain("import { useState } from 'react'");
    expect(componentSource).toContain('useState<string>(view.defaultPhaseKey)');
    expect(componentSource).toContain('selectedFocus');
    expect(componentSource).toContain('aria-pressed={isSelected}');
    expect(componentSource).toContain('data-phase-selected');
    expect(componentSource).toContain('data-region="journey-hero"');
  });

  it('renders the slim journey strip + horizontal agent strip (agents lead)', () => {
    // Slim journey: a compact stepper with phase markers, not the
    // earlier 6-tile card. The marker symbol uses dots/checks instead
    // of a translateY-raised tile.
    expect(componentSource).toContain('SlimJourneyStrip');
    expect(componentSource).toContain('SlimPhaseMarker');
    expect(componentSource).not.toContain("transform: 'translateY");
    // No floating "Maestro is here" tag — selection is the only emphasis.
    expect(componentSource).not.toContain('Maestro is here');
    // Agents lead — a full-width horizontal AgentStrip is mounted
    // immediately after the journey, with one card per agent.
    expect(componentSource).toContain('AgentStrip');
    expect(componentSource).toContain('AgentStripCard');
    // The right-side AgentRail is gone; the strip carries the agents
    // across the full width instead.
    expect(componentSource).not.toContain('function AgentRail');
  });

  it('renders a single dark-navy Nexus brief panel', () => {
    expect(componentSource).toContain('NexusBriefCard');
    // The brief paragraph + context chips + cream/rose pills + white pill
    // CTA all live inside this one dark card per the mockup.
    expect(componentSource).toContain('CreamPill');
    expect(componentSource).toContain('DarkChip');
  });

  it('removes the competing Nexus surfaces from above the fold', () => {
    expect(canonicalDetailSource).not.toContain('<NexusProgramRail');
    expect(canonicalDetailSource).not.toContain('<PhaseTimeline');
    expect(canonicalDetailSource).not.toContain('Nexus · program editorial · deterministic');
  });

  it('keeps the AG12 AgentMissionPanel mounted but positioned after the workbench', () => {
    const workbenchIndex = canonicalDetailSource.indexOf('<NexusProgramWorkbench');
    const missionPanelIndex = canonicalDetailSource.indexOf('<AgentMissionPanel');
    expect(workbenchIndex).toBeGreaterThan(-1);
    expect(missionPanelIndex).toBeGreaterThan(workbenchIndex);
  });

  it('renders the canon-spec C-6 subnav and per-tab panels', () => {
    expect(componentSource).toContain('SubnavTabsBar');
    expect(componentSource).toContain('aria-label="Program subnav"');
    expect(componentSource).toContain("useState<NexusWorkbenchSubnavTab['key']>('overview')");
    expect(componentSource).toContain("activeTab === 'workshop'");
    expect(componentSource).toContain("activeTab === 'evidence'");
    expect(componentSource).toContain("activeTab === 'gate'");
    expect(componentSource).toContain("activeTab === 'actions'");
    expect(componentSource).toContain("activeTab === 'deliverables'");
  });

  it('renders the canon-spec C-5 Workshop Canvas with agenda / questions / evidence / attendees', () => {
    expect(componentSource).toContain('WorkshopCanvas');
    expect(componentSource).toContain('Agenda');
    expect(componentSource).toContain('Questions to capture');
    expect(componentSource).toContain('Evidence to capture');
    expect(componentSource).toContain('Attendees');
  });

  it('renders the canon-spec C-8 Missing Inputs panel', () => {
    expect(componentSource).toContain('MissingInputsPanel');
    expect(componentSource).toContain('Evidence · missing inputs');
  });

  it('renders the canon-spec B-1 sticky context strip on the page', () => {
    expect(canonicalDetailSource).toContain('Program context strip');
    expect(canonicalDetailSource).toContain("position: 'sticky'");
    expect(canonicalDetailSource).toContain('Linked Source event');
    // Per-program data wiring: phase + gate labels read from the
    // workbench view, not from hardcoded literals.
    expect(canonicalDetailSource).toContain('buildNexusProgramWorkbenchView');
    expect(canonicalDetailSource).toContain('strip.phaseLabel');
    expect(canonicalDetailSource).toContain('strip.gateLabel');
    expect(canonicalDetailSource).not.toContain("'P2 · Synthesis'");
    expect(canonicalDetailSource).not.toContain("'Gate: Pending'");
  });
});

describe('NexusProgramWorkbench · per-program journey wiring', () => {
  // Bug fix: the workbench used to ignore currentPhaseSpec and always
  // render P2 Synthesis as current for every program. Each program in
  // the seed has its own phase, so the journey + context strip + gate
  // card now reflect that.

  function viewFor(spec: 1 | 2 | 3 | 4 | 5, code = 'TEST-01', name = 'Test Program') {
    return buildNexusProgramWorkbenchView({
      programCode: code,
      programName: name,
      tenantLabel: 'Test Tenant',
      currentPhaseSpec: spec,
    });
  }

  it('spec 1 (Intake & Framing) maps to Discovery as current', () => {
    const v = viewFor(1);
    expect(v.defaultPhaseKey).toBe('discovery');
    expect(v.phaseJourney.find((p) => p.state === 'current')!.key).toBe('discovery');
    expect(v.phaseJourney.find((p) => p.state === 'gate-pending')!.key).toBe('synthesis');
    expect(v.contextStrip.phaseLabel).toBe('P1 · Discovery');
  });

  it('spec 3 (Design & Decision) maps MRD-01 to Design as current', () => {
    const v = viewFor(3, 'MRD-01', 'Ambient Clinical Value Chain Activation');
    expect(v.defaultPhaseKey).toBe('design');
    expect(v.contextStrip.phaseLabel).toBe('P3 · Design');
    expect(v.contextStrip.programCode).toBe('MRD-01');
    expect(v.programIdentity).toBe('MRD-01 · Ambient Clinical Value Chain Activation');
    expect(v.phaseJourney.map((p) => p.state)).toEqual([
      'done', 'done', 'current', 'gate-pending', 'locked', 'locked',
    ]);
  });

  it('spec 4 (Build & Deliver) maps to Build as current', () => {
    const v = viewFor(4, 'MRD-02', 'Prior Authorization Automation');
    expect(v.defaultPhaseKey).toBe('build');
    expect(v.contextStrip.phaseLabel).toBe('P4 · Build');
    expect(v.phaseJourney.map((p) => p.state)).toEqual([
      'done', 'done', 'done', 'current', 'gate-pending', 'locked',
    ]);
  });

  it('spec 5 (Outcome) maps MRD-05 to Operate as current with no further gate', () => {
    const v = viewFor(5, 'MRD-05', 'Readmission Risk Model Refresh');
    expect(v.defaultPhaseKey).toBe('operate');
    expect(v.contextStrip.phaseLabel).toBe('P6 · Operate');
    expect(v.phaseJourney.map((p) => p.state)).toEqual([
      'done', 'done', 'done', 'done', 'done', 'current',
    ]);
    expect(v.currentGateLabel).toContain('Operate');
  });

  it('two programs at different phases produce distinct journeys + briefs + gates', () => {
    const a = viewFor(2, 'MRD-04', 'Revenue Cycle AI Tool Rationalization');
    const b = viewFor(5, 'MRD-05', 'Readmission Risk Model Refresh');
    expect(a.defaultPhaseKey).toBe('synthesis');
    expect(b.defaultPhaseKey).toBe('operate');
    expect(a.brief).not.toBe(b.brief);
    expect(a.contextStrip.phaseLabel).not.toBe(b.contextStrip.phaseLabel);
    expect(a.currentGateLabel).not.toBe(b.currentGateLabel);
  });

  it('journey subtitle mentions the current and next phase', () => {
    const v = viewFor(3);
    expect(v.journeySubtitle).toContain('P3 Design is current');
    expect(v.journeySubtitle).toContain('P4 Build is the next gate');
  });
});
