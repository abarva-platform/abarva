// Slice OV2-WIRE-AND-FM-PROMPT — failure-mode prompt block tests.

import {
  composeAttachmentContextBlock,
  composeBriefProgressCadenceDirective,
  composeCrossProgramSignalsBlock,
  composeCrossProgramSignalsBlockForSurface,
  composeFailureModeBlock,
  composeFailureModeDoctrineBlock,
  composeOverlapBlock,
  formatFailureModeCatalogForPrompt,
  formatFailureModeDoctrineForPrompt,
  isProgramsSurface,
} from '../failure-mode-prompt';
import { FAILURE_MODES } from '../failure-modes';
import type { BriefOverlapMatch } from '../origination-overlap';
import type { AttachmentChipRef } from '../attachments/types';
import type { AttachmentTextPreview } from '../attachments/extract-text';
import type { EnterpriseAgentContextItem } from '@/lib/knowledge/agent-context-broker';

describe('formatFailureModeCatalogForPrompt', () => {
  const block = formatFailureModeCatalogForPrompt();

  it('includes the catalog header', () => {
    expect(block).toContain('THE 10 FAILURES YOU EXIST TO PREVENT:');
  });

  it('includes a research provenance line', () => {
    expect(block).toContain('Gartner');
    expect(block).toContain('RAND');
    expect(block).toContain('MIT/BCG');
    expect(block).toContain('McKinsey');
    expect(block).toContain('Forrester');
  });

  it('contains all 10 canonical names sourced from FAILURE_MODES, in id order', () => {
    const namesInOrder = FAILURE_MODES.map((m) => m.name);
    expect(namesInOrder).toHaveLength(10);

    const idxs = namesInOrder.map((name) => block.indexOf(name));
    // Every name appears.
    idxs.forEach((idx, position) => {
      expect(idx).toBeGreaterThan(-1);
      // Each name appears AFTER the previous one (preserves catalog order).
      if (position > 0) {
        expect(idx).toBeGreaterThan(idxs[position - 1]);
      }
    });
  });

  it('numbers entries 1..10', () => {
    for (let i = 1; i <= 10; i += 1) {
      const padded = String(i).padStart(2, ' ');
      expect(block).toContain(`${padded}. `);
    }
  });
});

describe('isProgramsSurface', () => {
  it('matches Programs surfaces', () => {
    expect(isProgramsSurface('/programs')).toBe(true);
    expect(isProgramsSurface('/programs/new')).toBe(true);
    expect(isProgramsSurface('/programs/abc-123')).toBe(true);
    expect(isProgramsSurface('/demo/programs/new')).toBe(true);
    expect(isProgramsSurface('/tower')).toBe(true);
    expect(isProgramsSurface('/tower/portfolio')).toBe(true);
  });

  it('rejects non-Programs surfaces', () => {
    expect(isProgramsSurface('/intelligence')).toBe(false);
    expect(isProgramsSurface('/source')).toBe(false);
    expect(isProgramsSurface('/home')).toBe(false);
    expect(isProgramsSurface('')).toBe(false);
    expect(isProgramsSurface(null)).toBe(false);
    expect(isProgramsSurface(undefined)).toBe(false);
  });
});

describe('composeFailureModeBlock', () => {
  it('returns the catalog block on Programs surfaces', () => {
    const block = composeFailureModeBlock('/programs/new');
    expect(block).toContain('THE 10 FAILURES YOU EXIST TO PREVENT:');
    // First and last canonical names must both be present.
    expect(block).toContain(FAILURE_MODES[0].name);
    expect(block).toContain(FAILURE_MODES[9].name);
  });

  it('returns the catalog block on /tower', () => {
    expect(composeFailureModeBlock('/tower')).toContain(
      'THE 10 FAILURES YOU EXIST TO PREVENT:',
    );
  });

  it('returns empty string off Programs surfaces', () => {
    expect(composeFailureModeBlock('/intelligence')).toBe('');
    expect(composeFailureModeBlock('/source')).toBe('');
    expect(composeFailureModeBlock('/home')).toBe('');
    expect(composeFailureModeBlock(null)).toBe('');
    expect(composeFailureModeBlock(undefined)).toBe('');
  });
});

describe('composeOverlapBlock', () => {
  const fakeMatches: BriefOverlapMatch[] = [
    {
      programId: 'apex-cdp-2026',
      programName: 'Apex Retail CDP Activation',
      programPhase: 'P3 Design',
      overlapKind: 'sponsor',
      overlapDetail: 'Sarah Chen already sponsors apex-cdp-2026.',
      matchScore: 0.5,
    },
    {
      programId: 'apex-ams-2026',
      programName: 'Apex AMS Consolidation',
      overlapKind: 'system',
      overlapDetail: 'SAP footprint overlaps.',
      matchScore: 0.3,
    },
  ];

  it('returns empty string when no matches', () => {
    expect(composeOverlapBlock([])).toBe('');
  });

  it('renders the header on non-empty input', () => {
    const block = composeOverlapBlock(fakeMatches);
    expect(block).toContain('OVERLAP CANDIDATES (existing programs');
  });

  it('renders each match with id, name, phase, kind, and detail', () => {
    const block = composeOverlapBlock(fakeMatches);
    expect(block).toContain('apex-cdp-2026');
    expect(block).toContain('Apex Retail CDP Activation');
    expect(block).toContain('P3 Design');
    expect(block).toContain('Overlap kind: sponsor');
    expect(block).toContain('Sarah Chen already sponsors apex-cdp-2026.');

    expect(block).toContain('apex-ams-2026');
    expect(block).toContain('Apex AMS Consolidation');
    // Missing phase falls back to "unknown".
    expect(block).toContain('current phase: unknown');
    expect(block).toContain('Overlap kind: system');
  });

  it('orders entries as supplied (caller controls top-3 slicing)', () => {
    const block = composeOverlapBlock(fakeMatches);
    const idxFirst = block.indexOf('apex-cdp-2026');
    const idxSecond = block.indexOf('apex-ams-2026');
    expect(idxFirst).toBeGreaterThan(-1);
    expect(idxSecond).toBeGreaterThan(idxFirst);
  });

  it('includes the do-not-invent guidance footer', () => {
    const block = composeOverlapBlock(fakeMatches);
    expect(block).toContain('Do NOT invent overlap');
    expect(block).toContain('overlap-alert');
  });

  it('respects the top-N contract when caller pre-slices', () => {
    const truncated = fakeMatches.slice(0, 1);
    const block = composeOverlapBlock(truncated);
    expect(block).toContain('apex-cdp-2026');
    expect(block).not.toContain('apex-ams-2026');
  });
});

describe('formatFailureModeDoctrineForPrompt (OV2-FM-DOCTRINE)', () => {
  const block = formatFailureModeDoctrineForPrompt();

  it('returns a non-empty string with the doctrine title', () => {
    expect(block.length).toBeGreaterThan(0);
    expect(block).toContain('FAILURE-MODE DOCTRINE:');
  });

  it('names both artifact types and explains the relationship', () => {
    expect(block).toContain('failure-mode-flagged');
    expect(block).toContain('anti-pattern-flag');
    // Relationship language: pack-local vs cross-phase platform catalog.
    expect(block).toMatch(/cross-phase|platform-level|platform catalog/i);
    expect(block).toMatch(/phase-local|active pack|active phase pack/i);
  });

  it('contains the cadence rule', () => {
    expect(block).toContain('at most one');
    expect(block).toContain('per turn');
    expect(block).toContain('failureModeId');
  });

  it('contains soft and hard severity guidance', () => {
    expect(block).toContain("'soft'");
    expect(block).toContain("'hard'");
    // Soft = note-and-redirect; hard = blocks advance.
    expect(block).toMatch(/note-and-redirect|continue with awareness/i);
    expect(block).toMatch(/block(s)?\s+(phase\s+)?advance|refuse advance/i);
  });

  it('teaches signal grounding (paraphrase user words, ≤ 20 words)', () => {
    expect(block).toContain('detectedSignal');
    expect(block).toContain('20 words');
  });

  it('does NOT restate the 10 catalog names (the catalog block already does)', () => {
    // Spot-check: the canonical names should not appear in the doctrine
    // block — they live in the catalog block above it. Doctrine references
    // the catalog by id, not by name.
    expect(block).not.toContain(
      'Lack of executive sponsorship and ownership',
    );
  });

  it('is tight relative to the catalog block (doctrine is rules-only)', () => {
    const catalog = formatFailureModeCatalogForPrompt();
    // Snapshot-style: the doctrine should not balloon. The catalog block
    // today is just title + 10 numbered names + provenance line, so it is
    // very compact; the doctrine is rules-only and must stay within a
    // small multiple. Tighter doctrine helps the model reach the rules
    // before token budget squeezes them. If the catalog grows (e.g. when
    // E.5 telemetry rollup adds more provenance), this multiple gives
    // headroom. The hard ceiling is what matters.
    expect(block.length).toBeLessThan(catalog.length * 4);
    // Absolute ceiling: the doctrine block must remain a tight
    // senior-practitioner paragraph, not a corporate guidelines doc.
    expect(block.length).toBeLessThan(3000);
  });
});

describe('composeFailureModeDoctrineBlock (OV2-FM-DOCTRINE)', () => {
  it('returns the doctrine block on Programs surfaces', () => {
    expect(composeFailureModeDoctrineBlock('/programs/new')).toContain(
      'FAILURE-MODE DOCTRINE:',
    );
    expect(composeFailureModeDoctrineBlock('/programs/abc-123')).toContain(
      'FAILURE-MODE DOCTRINE:',
    );
    expect(composeFailureModeDoctrineBlock('/tower')).toContain(
      'FAILURE-MODE DOCTRINE:',
    );
    expect(composeFailureModeDoctrineBlock('/demo/programs/new')).toContain(
      'FAILURE-MODE DOCTRINE:',
    );
  });

  it('returns empty string off Programs surfaces (intelligence is out of scope)', () => {
    expect(composeFailureModeDoctrineBlock('/intelligence')).toBe('');
    expect(composeFailureModeDoctrineBlock('/source')).toBe('');
    expect(composeFailureModeDoctrineBlock('/home')).toBe('');
    expect(composeFailureModeDoctrineBlock(null)).toBe('');
    expect(composeFailureModeDoctrineBlock(undefined)).toBe('');
  });

  it('parallels composeFailureModeBlock — doctrine present iff catalog is', () => {
    const surfaces = [
      '/programs',
      '/programs/new',
      '/programs/abc-123',
      '/demo/programs/new',
      '/tower',
      '/intelligence',
      '/source',
      '/home',
      null,
      undefined,
    ] as const;
    for (const s of surfaces) {
      const catalog = composeFailureModeBlock(s);
      const doctrine = composeFailureModeDoctrineBlock(s);
      // Both empty or both non-empty — they must be paired.
      expect(catalog === '').toBe(doctrine === '');
    }
  });

  it('when both blocks are present, doctrine logically follows the catalog', () => {
    // Simulate the route's join: catalog first, then doctrine. Confirms
    // the doctrine references the catalog and reads as a follow-on.
    const catalog = composeFailureModeBlock('/programs/new');
    const doctrine = composeFailureModeDoctrineBlock('/programs/new');
    const composed = [catalog, '', doctrine].filter(Boolean).join('\n');
    expect(composed.indexOf('THE 10 FAILURES YOU EXIST TO PREVENT:')).toBeLessThan(
      composed.indexOf('FAILURE-MODE DOCTRINE:'),
    );
    // Doctrine references the catalog above ("see catalog above").
    expect(doctrine).toMatch(/see catalog above|catalog above/i);
  });
});

describe('composeBriefProgressCadenceDirective', () => {
  it('returns the cadence line on program origination canvases', () => {
    expect(composeBriefProgressCadenceDirective('/programs')).toContain(
      'brief-progress',
    );
    expect(composeBriefProgressCadenceDirective('/programs/new')).toContain(
      'brief-progress',
    );
    expect(
      composeBriefProgressCadenceDirective('/demo/programs/new'),
    ).toContain('brief-progress');
  });

  it('returns empty string on every other surface', () => {
    expect(composeBriefProgressCadenceDirective('/programs/abc-123')).toBe('');
    expect(composeBriefProgressCadenceDirective('/intelligence')).toBe('');
    expect(composeBriefProgressCadenceDirective(null)).toBe('');
    expect(composeBriefProgressCadenceDirective(undefined)).toBe('');
  });
});

// ── OV2-4c · attachment context block ───────────────────────────────────────

describe('composeAttachmentContextBlock', () => {
  const docxChip: AttachmentChipRef = {
    id: 'att-docx',
    programId: 'prog-1',
    originalName: 'meeting-notes.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 24_576,
  };
  const pdfChip: AttachmentChipRef = {
    id: 'att-pdf',
    programId: 'prog-1',
    originalName: 'evidence.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 102_400,
  };

  const docxPreview: AttachmentTextPreview = {
    attachmentId: 'att-docx',
    originalName: 'meeting-notes.docx',
    mimeType: docxChip.mimeType,
    parsedTextSnippet: 'P1 stakeholder workshop notes — action items follow.',
    truncated: false,
    parsingMethod: 'docx-mammoth',
    warnings: [],
  };

  it('returns empty string when no attachments', () => {
    expect(composeAttachmentContextBlock('/programs/abc', [], [])).toBe('');
  });

  it('returns empty string off Programs surfaces', () => {
    expect(
      composeAttachmentContextBlock('/intelligence', [docxChip], [docxPreview]),
    ).toBe('');
    expect(
      composeAttachmentContextBlock('/source', [docxChip], [docxPreview]),
    ).toBe('');
  });

  it('renders the header and a chip line per attachment with name + mime + size', () => {
    const block = composeAttachmentContextBlock(
      '/programs/prog-1',
      [docxChip, pdfChip],
      [docxPreview],
    );
    expect(block).toContain('ATTACHMENTS THE USER HAS UPLOADED');
    expect(block).toContain(`meeting-notes.docx (${docxChip.mimeType}, 24576 bytes)`);
    expect(block).toContain(
      `evidence.pdf (application/pdf, 102400 bytes)`,
    );
  });

  it('renders the parsed snippet when available', () => {
    const block = composeAttachmentContextBlock(
      '/programs/prog-1',
      [docxChip],
      [docxPreview],
    );
    expect(block).toContain(docxPreview.parsedTextSnippet);
  });

  it('renders the binary-format hint when no preview is available', () => {
    const block = composeAttachmentContextBlock(
      '/programs/prog-1',
      [pdfChip],
      [],
    );
    expect(block).toContain('content not parsed');
  });

  it('marks truncated previews with a [truncated] tag', () => {
    const truncated: AttachmentTextPreview = {
      ...docxPreview,
      truncated: true,
      parsedTextSnippet: 'first chunk of a long doc',
    };
    const block = composeAttachmentContextBlock(
      '/programs/prog-1',
      [docxChip],
      [truncated],
    );
    expect(block).toContain('[truncated]');
  });

  it('works on /tower and /demo/programs surfaces', () => {
    expect(
      composeAttachmentContextBlock('/tower', [docxChip], [docxPreview]),
    ).toContain('meeting-notes.docx');
    expect(
      composeAttachmentContextBlock(
        '/demo/programs/new',
        [docxChip],
        [docxPreview],
      ),
    ).toContain('meeting-notes.docx');
  });
});

// ── TD-7 · cross-program-signal system-prompt block ─────────────────────────

describe('composeCrossProgramSignalsBlock (TD-7)', () => {
  // Build a broker context item that mirrors the mapper's output shape
  // for cross_program_signal records. The mapper composes the summary
  // as `Programs: a, b; severity X; recommendation` — the helper parses
  // that back into structured fields without reaching into the broker.
  function makeSignal(args: {
    recordId: string;
    title: string;
    programs: string[];
    severity: string;
    recommendation: string;
  }): EnterpriseAgentContextItem {
    const segments: string[] = [];
    if (args.programs.length > 0) segments.push(`Programs: ${args.programs.join(', ')}`);
    if (args.severity) segments.push(`severity ${args.severity}`);
    if (args.recommendation) segments.push(args.recommendation);
    return {
      id: `tenant-data:${args.recordId}`,
      kind: 'cross_program_signal',
      title: args.title,
      summary: segments.join('; '),
      tenantKey: 'apex-retail',
      sourceBasis: 'tenant_admin_upload',
      dataClassification: 'internal',
      sensitivity: 'summary',
      provenanceIds: [args.recordId, ...args.programs],
      linkedEvidence: [],
    };
  }

  it('returns empty string when no cross-program signals are present', () => {
    expect(composeCrossProgramSignalsBlock([])).toBe('');
  });

  it('returns empty string when items have other kinds only', () => {
    const items: EnterpriseAgentContextItem[] = [
      {
        id: 'person:apex:diana-lopez',
        kind: 'person',
        title: 'Diana Lopez',
        summary: 'CIO',
        tenantKey: 'apex-retail',
        sourceBasis: 'tenant_admin_upload',
        dataClassification: 'internal',
        sensitivity: 'summary',
        provenanceIds: ['person:apex:diana-lopez'],
        linkedEvidence: [],
      },
    ];
    expect(composeCrossProgramSignalsBlock(items)).toBe('');
  });

  it('renders three signals with the canonical signal-id, title, programs, severity, and recommendation', () => {
    const signals: EnterpriseAgentContextItem[] = [
      makeSignal({
        recordId: 'cross_program_signals:xprog:apex:001',
        title: 'Priya Iyer leads two critical-path programs simultaneously',
        programs: ['apex-cdp-2026', 'apex-cc-ai-2026'],
        severity: 'medium',
        recommendation:
          'Identify second program lead for one of the two programs by end of Q2 FY2026.',
      }),
      makeSignal({
        recordId: 'cross_program_signals:xprog:apex:002',
        title: 'CDP and Forecasting share the same data engineering team',
        programs: ['apex-cdp-2026', 'apex-forecast-2026'],
        severity: 'high',
        recommendation: 'Sequence the two programs; do not parallelize.',
      }),
      makeSignal({
        recordId: 'cross_program_signals:xprog:apex:003',
        title: 'Vendor X concentration risk across three programs',
        programs: ['apex-cdp-2026', 'apex-cc-ai-2026', 'apex-forecast-2026'],
        severity: 'critical',
        recommendation: 'Pause renewal pending vendor diversification review.',
      }),
    ];

    const block = composeCrossProgramSignalsBlock(signals);

    // Header.
    expect(block).toContain('CROSS-PROGRAM SIGNALS');

    // Each signal-id (recordId) is surfaced — without the tenant-data: prefix.
    expect(block).toContain('signal-id: cross_program_signals:xprog:apex:001');
    expect(block).toContain('signal-id: cross_program_signals:xprog:apex:002');
    expect(block).toContain('signal-id: cross_program_signals:xprog:apex:003');
    // The tenant-data: namespace prefix should NOT leak into the prompt.
    expect(block).not.toContain('tenant-data:cross_program_signals');

    // Each title.
    expect(block).toContain('Priya Iyer leads two critical-path programs simultaneously');
    expect(block).toContain('CDP and Forecasting share the same data engineering team');
    expect(block).toContain('Vendor X concentration risk across three programs');

    // Programs list rendered as comma-separated ids.
    expect(block).toContain('programs: apex-cdp-2026, apex-cc-ai-2026');
    expect(block).toContain('programs: apex-cdp-2026, apex-forecast-2026');
    expect(block).toContain(
      'programs: apex-cdp-2026, apex-cc-ai-2026, apex-forecast-2026',
    );

    // Severity rendered lowercase per artifact contract.
    expect(block).toContain('severity: medium');
    expect(block).toContain('severity: high');
    expect(block).toContain('severity: critical');

    // Each recommendation surfaces verbatim.
    expect(block).toContain(
      'Identify second program lead for one of the two programs by end of Q2 FY2026.',
    );
    expect(block).toContain('Sequence the two programs');
    expect(block).toContain('Pause renewal pending vendor diversification review.');

    // Footer guidance is present so the agent knows not to invent.
    expect(block).toContain('Do NOT invent signals');
  });

  it('skips items whose summary cannot yield a programs list (mapper drift / malformed)', () => {
    const malformed: EnterpriseAgentContextItem = {
      id: 'tenant-data:cross_program_signals:xprog:apex:bad',
      kind: 'cross_program_signal',
      title: 'Malformed signal',
      summary: 'severity high; some recommendation', // no Programs: segment
      tenantKey: 'apex-retail',
      sourceBasis: 'tenant_admin_upload',
      dataClassification: 'internal',
      sensitivity: 'summary',
      provenanceIds: [],
      linkedEvidence: [],
    };
    expect(composeCrossProgramSignalsBlock([malformed])).toBe('');
  });

  it('lowercases mixed-case severity (mapper passes through verbatim from records)', () => {
    const signal = makeSignal({
      recordId: 'cps:001',
      title: 'Mixed-case severity case',
      programs: ['p1', 'p2'],
      severity: 'Medium', // record-side capitalization
      recommendation: 'Confirm and reduce.',
    });
    const block = composeCrossProgramSignalsBlock([signal]);
    expect(block).toContain('severity: medium');
  });
});

describe('composeCrossProgramSignalsBlockForSurface (TD-7)', () => {
  const items: EnterpriseAgentContextItem[] = [
    {
      id: 'tenant-data:cross_program_signals:xprog:apex:001',
      kind: 'cross_program_signal',
      title: 'A signal',
      summary: 'Programs: a, b; severity medium; do something',
      tenantKey: 'apex-retail',
      sourceBasis: 'tenant_admin_upload',
      dataClassification: 'internal',
      sensitivity: 'summary',
      provenanceIds: ['cross_program_signals:xprog:apex:001'],
      linkedEvidence: [],
    },
  ];

  it('returns the block on Programs surfaces', () => {
    const block = composeCrossProgramSignalsBlockForSurface('/programs', items);
    expect(block).toContain('CROSS-PROGRAM SIGNALS');
  });

  it('returns the block on /programs/<id>', () => {
    const block = composeCrossProgramSignalsBlockForSurface(
      '/programs/apex-cdp-2026',
      items,
    );
    expect(block).toContain('CROSS-PROGRAM SIGNALS');
  });

  it('returns empty string off Programs surfaces', () => {
    expect(composeCrossProgramSignalsBlockForSurface('/intelligence', items)).toBe('');
    expect(composeCrossProgramSignalsBlockForSurface('/source', items)).toBe('');
    expect(composeCrossProgramSignalsBlockForSurface('/home', items)).toBe('');
    expect(composeCrossProgramSignalsBlockForSurface(null, items)).toBe('');
    expect(composeCrossProgramSignalsBlockForSurface(undefined, items)).toBe('');
  });
});
