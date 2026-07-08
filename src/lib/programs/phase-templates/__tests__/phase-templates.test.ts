import { BUILDING_BLOCK_KEYS, isBuildingBlockKey } from '../building-blocks';
import { PHASE_TEMPLATE_CATALOG, templatesForPhase } from '../catalog';
import { classifyUpload } from '../classification';
import {
  buildPatternAssemblyPacket,
  validateAssembledResponse,
} from '../pattern-assembly';
import { PHASE_LABELS } from '../types';
import { LAKESHORE_LEGAL_DEMO_FIXTURE } from '../fixtures/lakeshore-legal';

const INTERNAL_TERMS =
  /(sourceArtifactVersionId|generated_artifacts|deliverable_versions|materialChangeFlags|V7 nodes|phase pack|schema|api route|table id)/i;

describe('phase-template catalog', () => {
  it('1. has at least 20 templates', () => {
    expect(PHASE_TEMPLATE_CATALOG.length).toBeGreaterThanOrEqual(20);
  });

  it('2. every template has phase, audience, format, blocks, required sections, mappings, parsed outputs, next-phase outputs', () => {
    for (const t of PHASE_TEMPLATE_CATALOG) {
      expect(t.phase).toBeTruthy();
      expect(t.recommendedAudience.length).toBeGreaterThan(0);
      expect(['DOCX', 'XLSX']).toContain(t.fileFormat);
      expect(t.supportedBuildingBlocks.length).toBeGreaterThan(0);
      expect(t.supportedBuildingBlocks.every(isBuildingBlockKey)).toBe(true);
      expect(t.requiredSections.length).toBeGreaterThan(0);
      for (const s of t.requiredSections) {
        expect(s.mappedBlocks.length).toBeGreaterThan(0);
        expect(s.mappedBlocks.every(isBuildingBlockKey)).toBe(true);
        expect(s.parsedOutputs.length).toBeGreaterThan(0);
      }
      expect(t.parsedOutputTypes.length).toBeGreaterThan(0);
      expect(t.nextPhaseInputsCreated.length).toBeGreaterThan(0);
      expect(t.sampleQuestions.length).toBeGreaterThan(0);
      expect(t.examplesByUseCase.lakeshore_legal).toBeTruthy();
    }
  });

  it('3. P2 Legal set includes process, systems/data, pain/root-cause, business appetite, controls, final review', () => {
    const labels = templatesForPhase('P2').map((t) => t.label.toLowerCase());
    expect(labels.some((l) => l.includes('interview') || l.includes('process'))).toBe(true);
    expect(labels.some((l) => l.includes('systems and data'))).toBe(true);
    expect(labels.some((l) => l.includes('root-cause'))).toBe(true);
    expect(labels.some((l) => l.includes('appetite for change'))).toBe(true);
    expect(labels.some((l) => l.includes('final review'))).toBe(true);
    // controls appear as a P2 section / mapped block
    const p2Blocks = templatesForPhase('P2').flatMap((t) => t.supportedBuildingBlocks);
    expect(p2Blocks).toContain('controls_governance_risk');
  });

  it('4. P3 includes solution options, tradeoff matrix, human+AI split, architecture constraints, guardrails, decision summary', () => {
    const labels = templatesForPhase('P3').map((t) => t.label.toLowerCase());
    for (const needle of ['solution options', 'tradeoff', 'human + ai', 'architecture constraints', 'guardrails', 'decision summary']) {
      expect(labels.some((l) => l.includes(needle))).toBe(true);
    }
  });
});

describe('upload classification', () => {
  it('5. maps a P3 decision summary to selected approach, deferred options, controls lane, human-in-loop lane, and P4 inputs', () => {
    const c = LAKESHORE_LEGAL_DEMO_FIXTURE.p3DecisionUpload;
    const types = c.parsedOutputs.map((p) => p.type);
    expect(types).toContain('selected_approach');
    expect(types).toContain('solution_option'); // deferred options
    expect(c.supportedBuildingBlocks).toContain('controls_governance_risk');
    expect(c.supportedBuildingBlocks).toContain('human_in_loop_agent');
    // P4 inputs prepared
    expect(c.nextPhaseInputsUpdated.join(' ').toLowerCase()).toContain('selected solution approach');
    expect(c.nextPhaseInputsUpdated.join(' ').toLowerCase()).toContain('workstream');
    expect(c.clientFacingSummary.usedFor).toBe(PHASE_LABELS.P4);
  });

  it('6. uploads are Move-scoped by default', () => {
    const c = classifyUpload({
      uploadId: 'u1',
      moveId: 'm1',
      phase: 'P2',
      uploadCategory: 'workshop_output',
      inferredTemplateId: 'p2_process_walkthrough',
    });
    expect(c.moveScopedOnly).toBe(true);
  });

  it('7. enterprise promotion is not automatic', () => {
    const c = LAKESHORE_LEGAL_DEMO_FIXTURE.p3DecisionUpload;
    expect(c.enterprisePromotionEligibility).toBe('not_eligible');
    expect(c.clientFacingSummary.enterpriseContextNote).toMatch(/not added to enterprise context/i);
  });
});

describe('feed-forward inputs packs', () => {
  it('8. P2 produces a P3 Design Inputs Pack', () => {
    const pack = LAKESHORE_LEGAL_DEMO_FIXTURE.p3DesignInputsPack;
    expect(pack.requiredFieldContract.length).toBeGreaterThan(0);
    expect(pack.humanApprovalCheckpoints.length).toBeGreaterThan(0);
    expect(pack.towerMetricCandidates.length).toBeGreaterThan(0);
  });

  it('9. P3 produces a P4 Workstream Inputs Pack', () => {
    const pack = LAKESHORE_LEGAL_DEMO_FIXTURE.p4WorkstreamInputsPack;
    expect(pack.selectedSolutionApproach.toLowerCase()).toContain('option b');
    expect(pack.deferredOptions.length).toBeGreaterThan(0);
    expect(pack.workstreamCandidates.length).toBeGreaterThan(0);
    expect(pack.workstreamCandidates.every((w) => BUILDING_BLOCK_KEYS.includes(w.block))).toBe(true);
  });
});

describe('client-friendly + governed', () => {
  it('10. catalog + fixture never expose internal schema/dev terms', () => {
    const blob = JSON.stringify([PHASE_TEMPLATE_CATALOG, LAKESHORE_LEGAL_DEMO_FIXTURE]);
    expect(INTERNAL_TERMS.test(blob)).toBe(false);
  });

  it('phase labels are client-friendly (no P-codes as labels)', () => {
    expect(PHASE_LABELS.P2).toBe('Understand Current State');
    expect(PHASE_LABELS.P3).toBe('Choose the Approach');
  });
});

describe('dynamic pattern assembly (governed)', () => {
  it('flags overreach against low control readiness as not_allowed; passes evidence-backed items', () => {
    const packet = buildPatternAssemblyPacket(LAKESHORE_LEGAL_DEMO_FIXTURE.p2PatternAssemblyPacket);
    const validated = validateAssembledResponse(packet, [
      { statement: 'Move to fully autonomous contract review and auto-approval.' },
      { statement: 'Average cycle time is 31.6 days.', evidenceBacked: true, assertsNumber: true },
      { statement: 'AI suggests risk tier; attorney approves.', evidenceBacked: true },
      { statement: 'Cycle time will drop 40%.', assertsNumber: true },
    ]);
    expect(validated[0].label).toBe('not_allowed');
    expect(validated[1].label).toBe('evidence_backed');
    expect(validated[2].label).toBe('evidence_backed');
    expect(validated[3].label).toBe('needs_confirmation'); // unbacked number
  });
});
