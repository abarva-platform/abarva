/**
 * NexusReactivePanel · selectVisibleArtifacts
 *
 * Locks in the dedupe + filter + reverse-order behavior so the panel
 * stays well-defined as Codex / Wave-2 work adds more artifact types.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NexusReactivePanel, selectVisibleArtifacts } from '../NexusReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';

describe('selectVisibleArtifacts', () => {
  it('drops Surface 1 brief-field and classification artifacts', () => {
    const input: Artifact[] = [
      { type: 'brief-field', field: 'sponsor', value: 'Sarah Chen' },
      { type: 'classification', archetype: 'CDP', archetypeLabel: 'CDP', confidence: 'high' },
      {
        type: 'pattern-match',
        patternId: 'PAT-FOO-001',
        name: 'Foo',
        summary: 'bar',
      },
    ];
    const out = selectVisibleArtifacts(input);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('pattern-match');
  });

  it('reverses the stream so most-recent renders first', () => {
    const input: Artifact[] = [
      { type: 'gate-evaluation', gate: 'first', status: 'unmet' },
      { type: 'gate-evaluation', gate: 'second', status: 'met' },
      { type: 'gate-evaluation', gate: 'third', status: 'pending' },
    ];
    const out = selectVisibleArtifacts(input);
    expect(out.map((a) => (a.type === 'gate-evaluation' ? a.gate : ''))).toEqual([
      'third',
      'second',
      'first',
    ]);
  });

  it('dedupes phase-progress by evidenceItemId, keeping the latest', () => {
    const input: Artifact[] = [
      {
        type: 'phase-progress',
        evidenceItemId: 'charter-signed-off',
        label: 'Charter signed off',
        severity: 'hard',
        status: 'unmet',
      },
      {
        type: 'phase-progress',
        evidenceItemId: 'charter-signed-off',
        label: 'Charter signed off',
        severity: 'hard',
        status: 'met',
        detail: 'Sponsor signed today',
      },
      {
        type: 'phase-progress',
        evidenceItemId: 'baseline-kpi-captured',
        label: 'Baseline KPI captured',
        severity: 'soft',
        status: 'unknown',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const progress = out.filter((a) => a.type === 'phase-progress') as Array<
      Extract<Artifact, { type: 'phase-progress' }>
    >;
    expect(progress).toHaveLength(2);
    const charter = progress.find((p) => p.evidenceItemId === 'charter-signed-off');
    expect(charter?.status).toBe('met');
    expect(charter?.detail).toBe('Sponsor signed today');
  });

  it('dedupes anti-pattern-flag by antiPatternId, keeping the latest', () => {
    const input: Artifact[] = [
      {
        type: 'anti-pattern-flag',
        antiPatternId: 'phantom-sponsor',
        label: 'The Phantom Sponsor',
        detectedSignal: 'first signal',
        whatToFlag: 'consequence A',
        mitigation: 'redirect A',
      },
      {
        type: 'anti-pattern-flag',
        antiPatternId: 'phantom-sponsor',
        label: 'The Phantom Sponsor',
        detectedSignal: 'second signal',
        whatToFlag: 'consequence B',
        mitigation: 'redirect B',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const flags = out.filter((a) => a.type === 'anti-pattern-flag') as Array<
      Extract<Artifact, { type: 'anti-pattern-flag' }>
    >;
    expect(flags).toHaveLength(1);
    expect(flags[0].detectedSignal).toBe('second signal');
    expect(flags[0].whatToFlag).toBe('consequence B');
  });

  it('preserves non-deduped artifact insertion order through reversal', () => {
    const input: Artifact[] = [
      { type: 'gate-evaluation', gate: 'A', status: 'unmet' },
      {
        type: 'phase-progress',
        evidenceItemId: 'x',
        label: 'X',
        severity: 'hard',
        status: 'unmet',
      },
      { type: 'gate-evaluation', gate: 'B', status: 'pending' },
    ];
    const out = selectVisibleArtifacts(input);
    // Non-deduped (gate-evaluation) appear in reverse insertion order:
    // B before A. Phase-progress is grouped at the end, then reversed —
    // so the dedupe-tracked types come first in the visible list.
    const gateOrder = out
      .filter((a) => a.type === 'gate-evaluation')
      .map((a) => (a.type === 'gate-evaluation' ? a.gate : ''));
    expect(gateOrder).toEqual(['B', 'A']);
  });

  it('returns empty for an empty stream', () => {
    expect(selectVisibleArtifacts([])).toEqual([]);
  });

  // OV2-FM-PANEL · failure-mode-flagged dedupe + filter + severity sort.
  it('keeps failure-mode-flagged artifacts visible (not filtered out)', () => {
    const input: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 1,
        failureModeName: 'Lack of executive sponsorship and ownership',
        phase: 0,
        detectedSignal: 'Sponsor cannot describe a calendar commitment.',
        consequence: 'Air cover collapses at the first hard tradeoff.',
        redirect: 'Schedule a sponsor 1:1 in the next 5 days.',
        severity: 'soft',
      },
    ];
    const out = selectVisibleArtifacts(input);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('failure-mode-flagged');
  });

  it('dedupes failure-mode-flagged by failureModeId, keeping the latest emission', () => {
    const input: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 4,
        failureModeName: 'Insufficient change-management investment',
        phase: 5,
        detectedSignal: 'first signal',
        consequence: 'first consequence',
        redirect: 'first redirect',
        severity: 'soft',
      },
      {
        type: 'failure-mode-flagged',
        failureModeId: 4,
        failureModeName: 'Insufficient change-management investment',
        phase: 5,
        detectedSignal: 'second signal',
        consequence: 'second consequence',
        redirect: 'second redirect',
        severity: 'hard',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const flags = out.filter((a) => a.type === 'failure-mode-flagged') as Array<
      Extract<Artifact, { type: 'failure-mode-flagged' }>
    >;
    expect(flags).toHaveLength(1);
    expect(flags[0].detectedSignal).toBe('second signal');
    expect(flags[0].consequence).toBe('second consequence');
    expect(flags[0].redirect).toBe('second redirect');
    expect(flags[0].severity).toBe('hard');
  });

  it('keeps two distinct failureModeIds as separate cards', () => {
    const input: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 1,
        failureModeName: 'Lack of executive sponsorship and ownership',
        phase: 0,
        detectedSignal: 'sponsor signal',
        consequence: 'sponsor consequence',
        redirect: 'sponsor redirect',
        severity: 'soft',
      },
      {
        type: 'failure-mode-flagged',
        failureModeId: 9,
        failureModeName: 'Inability to measure outcomes and impact',
        phase: 5,
        detectedSignal: 'baseline signal',
        consequence: 'baseline consequence',
        redirect: 'baseline redirect',
        severity: 'hard',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const flags = out.filter((a) => a.type === 'failure-mode-flagged') as Array<
      Extract<Artifact, { type: 'failure-mode-flagged' }>
    >;
    expect(flags).toHaveLength(2);
    expect(flags.map((f) => f.failureModeId).sort()).toEqual([1, 9]);
  });

  it('orders hard-severity failure-mode-flagged before soft in the rendered output', () => {
    const input: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 2,
        failureModeName: 'Scope creep',
        phase: 1,
        detectedSignal: 'soft signal',
        consequence: 'soft consequence',
        redirect: 'soft redirect',
        severity: 'soft',
      },
      {
        type: 'failure-mode-flagged',
        failureModeId: 6,
        failureModeName: 'Architecture-review gap',
        phase: 3,
        detectedSignal: 'hard signal',
        consequence: 'hard consequence',
        redirect: 'hard redirect',
        severity: 'hard',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const flags = out.filter((a) => a.type === 'failure-mode-flagged') as Array<
      Extract<Artifact, { type: 'failure-mode-flagged' }>
    >;
    // Hard severity renders first (gate-blocking reads loudest).
    expect(flags.map((f) => f.severity)).toEqual(['hard', 'soft']);
  });

  // PR-Q · founder feedback regression. The reactive panel was
  // rendering "3 duplicate generic pattern-match cards" because Nexus
  // re-emits the same pattern across turns. Dedupe by patternId keeps
  // the latest emission as a single card.
  it('dedupes pattern-match by patternId, keeping the latest emission', () => {
    const input: Artifact[] = [
      {
        type: 'pattern-match',
        patternId: 'PAT-PRG-CDP-001',
        name: 'CDP Activation',
        summary: 'first summary',
      },
      {
        type: 'pattern-match',
        patternId: 'PAT-PRG-CDP-001',
        name: 'CDP Activation',
        summary: 'refined summary',
        successRatePct: 78,
      },
      {
        type: 'pattern-match',
        patternId: 'PAT-PRG-AMS-001',
        name: 'AMS Consolidation',
        summary: 'distinct pattern',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const patterns = out.filter((a) => a.type === 'pattern-match') as Array<
      Extract<Artifact, { type: 'pattern-match' }>
    >;
    expect(patterns).toHaveLength(2);
    const cdp = patterns.find((p) => p.patternId === 'PAT-PRG-CDP-001');
    expect(cdp?.summary).toBe('refined summary');
    expect(cdp?.successRatePct).toBe(78);
  });
});

// OV2-FM-PANEL · render-tests for FailureModeFlaggedCard. Asserts the
// severity-driven visual treatment, the catalog-id eyebrow, the body
// fields, and the phase footer all surface in the rendered HTML.
describe('NexusReactivePanel · failure-mode-flagged rendering', () => {
  it('renders FAILURE MODE #N eyebrow, name, signal, consequence, redirect, and phase', () => {
    const artifacts: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 4,
        failureModeName: 'Insufficient change-management investment',
        phase: 5,
        detectedSignal: 'User said "we ran 8 trainings, adoption is high" with no telemetry.',
        consequence: 'Training-equals-adoption fallacy; real adoption may stall.',
        redirect: 'Baseline adoption telemetry against P4 success criteria before close.',
        severity: 'hard',
      },
    ];
    const html = renderToStaticMarkup(
      createElement(NexusReactivePanel, { artifacts }),
    );
    expect(html).toContain('Failure mode #4');
    expect(html).toContain('Insufficient change-management investment');
    expect(html).toContain('Detected signal');
    expect(html).toContain('we ran 8 trainings');
    expect(html).toContain('Consequence');
    expect(html).toContain('Training-equals-adoption fallacy');
    expect(html).toContain('Redirect');
    expect(html).toContain('Baseline adoption telemetry');
    expect(html).toContain('Phase P5');
  });

  it('hard severity uses a distinct visual indicator from soft severity', () => {
    const hardArtifacts: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 1,
        failureModeName: 'Lack of executive sponsorship and ownership',
        phase: 0,
        detectedSignal: 'hard signal',
        consequence: 'hard consequence',
        redirect: 'hard redirect',
        severity: 'hard',
      },
    ];
    const softArtifacts: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 1,
        failureModeName: 'Lack of executive sponsorship and ownership',
        phase: 0,
        detectedSignal: 'soft signal',
        consequence: 'soft consequence',
        redirect: 'soft redirect',
        severity: 'soft',
      },
    ];
    const hardHtml = renderToStaticMarkup(
      createElement(NexusReactivePanel, { artifacts: hardArtifacts }),
    );
    const softHtml = renderToStaticMarkup(
      createElement(NexusReactivePanel, { artifacts: softArtifacts }),
    );
    // Both surface the data-severity hook.
    expect(hardHtml).toContain('data-severity="hard"');
    expect(softHtml).toContain('data-severity="soft"');
    // Hard adds an explicit hard label in the eyebrow; soft does not.
    expect(hardHtml).toMatch(/Failure mode #1[\s\S]{0,80}hard/);
    expect(softHtml).not.toMatch(/Failure mode #1[\s\S]{0,80}\bhard\b/);
    // Hard uses the danger-tone red for the left edge stripe; soft does not.
    const dangerRed = '#b91c1c';
    expect(hardHtml).toContain(dangerRed);
    expect(softHtml).not.toContain(dangerRed);
  });

  // EXPORT-4 · deliverable-ready dedupe + render.
  it('keeps deliverable-ready artifacts visible (not filtered out)', () => {
    const input: Artifact[] = [
      {
        type: 'deliverable-ready',
        kind: 'program-charter',
        format: 'docx',
        title: 'Apex CDP Activation 2026 — Charter v1',
        exportUrl: '/api/programs/APX-CDP-2026/deliverables/program-charter/export',
        programId: 'APX-CDP-2026',
        specId: 'spec-1',
      },
    ];
    const out = selectVisibleArtifacts(input);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('deliverable-ready');
  });

  it('dedupes deliverable-ready by kind+programId, keeping the latest', () => {
    const input: Artifact[] = [
      {
        type: 'deliverable-ready',
        kind: 'program-charter',
        format: 'docx',
        title: 'Charter v1',
        exportUrl: '/api/programs/APX-CDP-2026/deliverables/program-charter/export',
        programId: 'APX-CDP-2026',
        specId: 'spec-old',
      },
      {
        type: 'deliverable-ready',
        kind: 'program-charter',
        format: 'docx',
        title: 'Charter v2',
        exportUrl: '/api/programs/APX-CDP-2026/deliverables/program-charter/export',
        programId: 'APX-CDP-2026',
        specId: 'spec-new',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const chips = out.filter((a) => a.type === 'deliverable-ready') as Array<
      Extract<Artifact, { type: 'deliverable-ready' }>
    >;
    expect(chips).toHaveLength(1);
    expect(chips[0].title).toBe('Charter v2');
    expect(chips[0].specId).toBe('spec-new');
  });

  it('keeps two distinct (kind, programId) pairs as separate chips', () => {
    const input: Artifact[] = [
      {
        type: 'deliverable-ready',
        kind: 'program-charter',
        format: 'docx',
        title: 'Charter A',
        exportUrl: '/api/programs/A/deliverables/program-charter/export',
        programId: 'A',
      },
      {
        type: 'deliverable-ready',
        kind: 'program-charter',
        format: 'docx',
        title: 'Charter B',
        exportUrl: '/api/programs/B/deliverables/program-charter/export',
        programId: 'B',
      },
      {
        type: 'deliverable-ready',
        kind: 'okr-baseline',
        format: 'xlsx',
        title: 'OKR A',
        exportUrl: '/api/programs/A/deliverables/okr-baseline/export',
        programId: 'A',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const chips = out.filter((a) => a.type === 'deliverable-ready') as Array<
      Extract<Artifact, { type: 'deliverable-ready' }>
    >;
    expect(chips).toHaveLength(3);
  });

  it('renders hard severity flags before soft severity flags in the panel', () => {
    const artifacts: Artifact[] = [
      {
        type: 'failure-mode-flagged',
        failureModeId: 2,
        failureModeName: 'Soft-name fixture',
        phase: 1,
        detectedSignal: 's',
        consequence: 's',
        redirect: 's',
        severity: 'soft',
      },
      {
        type: 'failure-mode-flagged',
        failureModeId: 6,
        failureModeName: 'Hard-name fixture',
        phase: 3,
        detectedSignal: 'h',
        consequence: 'h',
        redirect: 'h',
        severity: 'hard',
      },
    ];
    const html = renderToStaticMarkup(
      createElement(NexusReactivePanel, { artifacts }),
    );
    const hardIndex = html.indexOf('Hard-name fixture');
    const softIndex = html.indexOf('Soft-name fixture');
    expect(hardIndex).toBeGreaterThanOrEqual(0);
    expect(softIndex).toBeGreaterThanOrEqual(0);
    expect(hardIndex).toBeLessThan(softIndex);
  });
});

// EXPORT-4 · deliverable-ready chip render.
describe('NexusReactivePanel · deliverable-ready rendering', () => {
  it('renders a download chip with eyebrow, title, and download button', () => {
    const artifacts: Artifact[] = [
      {
        type: 'deliverable-ready',
        kind: 'program-charter',
        format: 'docx',
        title: 'Apex CDP Activation 2026 — Charter v1',
        exportUrl: '/api/programs/APX-CDP-2026/deliverables/program-charter/export',
        programId: 'APX-CDP-2026',
        specId: 'spec-1',
      },
    ];
    const html = renderToStaticMarkup(
      createElement(NexusReactivePanel, { artifacts }),
    );
    expect(html).toContain('Deliverable ready');
    expect(html).toContain('Program Charter');
    expect(html).toContain('DOCX');
    expect(html).toContain('Apex CDP Activation 2026');
    expect(html).toContain('Download');
    // Card surfaces data-* hooks for click-targeting in integration.
    expect(html).toContain('data-testid="deliverable-ready-card"');
    expect(html).toContain('data-testid="deliverable-ready-download"');
    expect(html).toContain('data-kind="program-charter"');
    expect(html).toContain('data-format="docx"');
  });

  it('renders chips for distinct (kind, programId) pairs', () => {
    const artifacts: Artifact[] = [
      {
        type: 'deliverable-ready',
        kind: 'program-charter',
        format: 'docx',
        title: 'Charter A',
        exportUrl: '/api/programs/A/deliverables/program-charter/export',
        programId: 'A',
      },
      {
        type: 'deliverable-ready',
        kind: 'okr-baseline',
        format: 'xlsx',
        title: 'OKR A',
        exportUrl: '/api/programs/A/deliverables/okr-baseline/export',
        programId: 'A',
      },
    ];
    const html = renderToStaticMarkup(
      createElement(NexusReactivePanel, { artifacts }),
    );
    expect(html).toContain('Charter A');
    expect(html).toContain('OKR A');
    expect(html).toContain('XLSX');
  });
});
