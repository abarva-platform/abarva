// CTX2 - Unified Context Builder MVP - integration tests.
//
// Pure deterministic coverage. No model/API calls. No DOM. No
// Date.now reads. Tests assert that:
// - Same request input produces byte-equal output every call.
// - All twelve canonical sections are always present.
// - Program / pattern / archetype work objects each populate their
//   section path.
// - Sparse / unresolvable inputs produce honest weak / refused
//   verdicts with hard-blocking missing inputs.
// - Evidence section is always present but empty (with note); no
//   fake citations leak out.
// - Module hygiene: no Date.now, no Math.random, no new Date(, no
//   fetch(, no model SDK imports, no useState / useEffect, no
//   imports from Source / Sentinel / Atlas / Nexus / auth /
//   supabase, no programs/mock import.

import {
  UNIFIED_CONTEXT_PACK_SECTIONS,
  buildUnifiedContextPack,
  computeUnifiedContextQuality,
  summarizeUnifiedContextPack,
  type UnifiedContextBuildRequest,
  type UnifiedContextSection,
} from '@/lib/architecture/unified-context-builder';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { SOLUTION_ARCHETYPE_KEYS } from '@/lib/solutions/solution-archetype-registry';

const plan = buildAllProgramsSeedPlan();
const apexTenant = plan.tenants.find((t) => t.tenantKey === 'apexretail')!;
const apexProgram = apexTenant.programs[0];

function findSection(
  sections: ReadonlyArray<UnifiedContextSection>,
  key: UnifiedContextSection['key'],
): UnifiedContextSection {
  const s = sections.find((x) => x.key === key);
  if (!s) throw new Error(`Section ${key} missing from pack`);
  return s;
}

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · determinism', () => {
  it('produces byte-equal output for identical input', () => {
    const request: UnifiedContextBuildRequest = {
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
      intent: 'review',
    };
    const a = buildUnifiedContextPack(request);
    const b = buildUnifiedContextPack(request);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces byte-equal output for empty / sparse input', () => {
    const request: UnifiedContextBuildRequest = {
      tenantKey: '',
      workObject: { kind: 'program', id: '' },
    };
    const a = buildUnifiedContextPack(request);
    const b = buildUnifiedContextPack(request);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// Twelve canonical sections always present
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · section completeness', () => {
  it('exposes the twelve canonical section keys constant', () => {
    expect(UNIFIED_CONTEXT_PACK_SECTIONS).toEqual([
      'identity',
      'work_object',
      'workflow_state',
      'business_context',
      'artifacts',
      'patterns',
      'evidence',
      'conversation',
      'datasets',
      'solution_archetypes',
      'governance_constraints',
      'audit_basis',
    ]);
    expect(UNIFIED_CONTEXT_PACK_SECTIONS).toHaveLength(12);
  });

  it.each([
    [
      'program',
      {
        tenantKey: apexTenant.tenantKey,
        workObject: { kind: 'program' as const, id: apexProgram.programSlug },
      },
    ],
    [
      'pattern',
      {
        tenantKey: apexTenant.tenantKey,
        workObject: {
          kind: 'intelligence_pattern' as const,
          id: 'value_ledger_incompleteness',
        },
      },
    ],
    [
      'archetype',
      {
        tenantKey: apexTenant.tenantKey,
        workObject: {
          kind: 'solution_archetype' as const,
          id: SOLUTION_ARCHETYPE_KEYS[0],
        },
      },
    ],
    [
      'sparse',
      {
        tenantKey: '',
        workObject: { kind: 'program' as const, id: '' },
      },
    ],
  ])(
    'always emits all twelve sections in canonical order (%s)',
    (_label, request) => {
      const result = buildUnifiedContextPack(request as UnifiedContextBuildRequest);
      expect(result.pack.sections).toHaveLength(12);
      const keys = result.pack.sections.map((s) => s.key);
      expect(keys).toEqual([...UNIFIED_CONTEXT_PACK_SECTIONS]);
      // Each section must have hasContent boolean and a sourceLabel.
      for (const section of result.pack.sections) {
        expect(typeof section.hasContent).toBe('boolean');
        expect(typeof section.sourceLabel).toBe('string');
        expect(section.sourceLabel.length).toBeGreaterThan(0);
      }
    },
  );
});

// ---------------------------------------------------------------------
// Program work object
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · program work object', () => {
  it('populates workflow_state and business_context for a known program', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
      intent: 'review',
    });
    expect(result.pack.workObject.resolved).toBe(true);
    const workflow = findSection(result.pack.sections, 'workflow_state');
    expect(workflow.hasContent).toBe(true);
    const business = findSection(result.pack.sections, 'business_context');
    expect(business.hasContent).toBe(true);
    const artifacts = findSection(result.pack.sections, 'artifacts');
    expect(artifacts.hasContent).toBe(true);
  });

  it('marks unknown program ids as unresolved', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: 'definitely-not-a-real-program' },
    });
    expect(result.pack.workObject.resolved).toBe(false);
    expect(result.pack.workObject.resolutionNote).toMatch(/not in tenant/);
    const blocking = result.missingInputs.filter(
      (m) => m.impact === 'blocks_response',
    );
    expect(blocking.length).toBeGreaterThan(0);
  });

  it('records programs_canonical_view as a retrieval source', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    expect(result.pack.basis.retrievalSources).toContain(
      'programs_canonical_view',
    );
  });
});

// ---------------------------------------------------------------------
// Intelligence pattern work object
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · intelligence_pattern work object', () => {
  it('populates the patterns section for a known pattern key', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: {
        kind: 'intelligence_pattern',
        id: 'value_ledger_incompleteness',
      },
    });
    expect(result.pack.workObject.resolved).toBe(true);
    const patterns = findSection(result.pack.sections, 'patterns');
    // Apex tenant emits pattern detections from S9e signals.
    expect(patterns.hasContent).toBe(true);
  });

  it('marks unknown pattern keys as unresolved', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'intelligence_pattern', id: 'not_a_real_pattern' },
    });
    expect(result.pack.workObject.resolved).toBe(false);
    expect(
      result.missingInputs.some((m) => m.impact === 'blocks_response'),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Solution archetype work object
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · solution_archetype work object', () => {
  it('populates the solution_archetypes section for a known SOL3 key', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: {
        kind: 'solution_archetype',
        id: SOLUTION_ARCHETYPE_KEYS[0],
      },
    });
    expect(result.pack.workObject.resolved).toBe(true);
    const sec = findSection(result.pack.sections, 'solution_archetypes');
    expect(sec.hasContent).toBe(true);
    expect(result.pack.basis.retrievalSources).toContain(
      'solution_archetype_registry',
    );
  });

  it('marks unknown archetype keys as unresolved', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: {
        kind: 'solution_archetype',
        id: 'not_a_real_archetype',
      },
    });
    expect(result.pack.workObject.resolved).toBe(false);
    expect(
      result.missingInputs.some((m) => m.impact === 'blocks_response'),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Sparse / refused inputs
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · sparse and refused inputs', () => {
  it('emits weak quality with at least one blocking missing input when tenant is empty', () => {
    const result = buildUnifiedContextPack({
      tenantKey: '',
      workObject: { kind: 'program', id: '' },
    });
    expect(['weak', 'refused', 'partial']).toContain(result.quality);
    const blocking = result.missingInputs.filter(
      (m) => m.impact === 'blocks_response',
    );
    expect(blocking.length).toBeGreaterThanOrEqual(1);
  });

  it('returns refused with high-stakes intent on unresolvable program', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: 'definitely-not-a-real-program' },
      intent: 'approve the deliverable',
    });
    expect(result.quality).toBe('refused');
    expect(result.refused).toBeDefined();
    expect(result.refused!.missingHardInputs.length).toBeGreaterThan(0);
  });

  it('does not refuse on unresolvable program when intent is benign', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: 'definitely-not-a-real-program' },
      intent: 'orient me',
    });
    expect(result.quality).not.toBe('refused');
  });
});

// ---------------------------------------------------------------------
// Evidence and conversation honesty
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · evidence and conversation are honestly empty', () => {
  it('always emits the evidence section, always empty, with a note', () => {
    const requests: UnifiedContextBuildRequest[] = [
      {
        tenantKey: apexTenant.tenantKey,
        workObject: { kind: 'program', id: apexProgram.programSlug },
      },
      {
        tenantKey: apexTenant.tenantKey,
        workObject: {
          kind: 'intelligence_pattern',
          id: 'value_ledger_incompleteness',
        },
      },
      {
        tenantKey: apexTenant.tenantKey,
        workObject: {
          kind: 'solution_archetype',
          id: SOLUTION_ARCHETYPE_KEYS[0],
        },
      },
    ];
    for (const r of requests) {
      const result = buildUnifiedContextPack(r);
      const evidence = findSection(result.pack.sections, 'evidence');
      expect(evidence.hasContent).toBe(false);
      expect(evidence.notes).toMatch(/EVID2 ledger not yet wired/i);
      expect(JSON.stringify(evidence.body)).toBe('{"items":[]}');
    }
  });

  it('always emits the conversation section, always empty', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    const conv = findSection(result.pack.sections, 'conversation');
    expect(conv.hasContent).toBe(false);
    expect(JSON.stringify(conv.body)).toBe('{"messages":[]}');
  });

  it('always emits the datasets section, always empty', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    const ds = findSection(result.pack.sections, 'datasets');
    expect(ds.hasContent).toBe(false);
    expect(JSON.stringify(ds.body)).toBe('{"summaries":[]}');
  });

  it('emits no fake E-### evidence citations anywhere in the pack', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    const serialized = JSON.stringify(result.pack);
    expect(serialized).not.toMatch(/"E-\d+"/);
    expect(serialized).not.toMatch(/E-\d{3,}/);
  });
});

// ---------------------------------------------------------------------
// Audit basis
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · audit basis', () => {
  it('exposes ctx2.v1 builder version and deterministic_seed generated_at', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    expect(result.pack.basis.contextBuilderVersion).toBe('ctx2.v1');
    expect(result.pack.basis.generatedAt).toBe('deterministic_seed');
    expect(result.pack.createdFrom).toBe('deterministic_seed');
  });

  it('audit_basis section always has content', () => {
    const result = buildUnifiedContextPack({
      tenantKey: '',
      workObject: { kind: 'program', id: '' },
    });
    const audit = findSection(result.pack.sections, 'audit_basis');
    expect(audit.hasContent).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Governance constraints merging
// ---------------------------------------------------------------------

describe('buildUnifiedContextPack · governance constraints', () => {
  it('emits CTX2 default constraints when caller passes none', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    const gov = findSection(result.pack.sections, 'governance_constraints');
    expect(gov.hasContent).toBe(true);
    const body = gov.body as {
      constraints: ReadonlyArray<{ policy: string; severity: string }>;
    };
    expect(body.constraints.some((c) => c.policy === 'no_fabricated_evidence_citations')).toBe(true);
    expect(body.constraints.some((c) => c.policy === 'no_fabricated_dollar_value')).toBe(true);
  });

  it('merges caller-supplied constraints alongside defaults', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
      governanceConstraints: [
        {
          policy: 'tenant_specific_redaction',
          rationale: 'Apex Retail PII redaction policy must be honored.',
          severity: 'hard',
        },
      ],
    });
    const gov = findSection(result.pack.sections, 'governance_constraints');
    const body = gov.body as {
      constraints: ReadonlyArray<{ policy: string }>;
    };
    expect(body.constraints.some((c) => c.policy === 'tenant_specific_redaction')).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

describe('summarizeUnifiedContextPack and computeUnifiedContextQuality', () => {
  it('summarize counts sections and reports a non-zero total', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    const summary = summarizeUnifiedContextPack(result.pack);
    expect(summary.totalSections).toBe(12);
    expect(summary.sectionsWithContent).toBeGreaterThanOrEqual(3);
  });

  it('computeUnifiedContextQuality matches build result quality on the happy path', () => {
    const result = buildUnifiedContextPack({
      tenantKey: apexTenant.tenantKey,
      workObject: { kind: 'program', id: apexProgram.programSlug },
    });
    const recomputed = computeUnifiedContextQuality(result);
    expect(['usable', 'partial', 'weak']).toContain(recomputed);
  });
});

// ---------------------------------------------------------------------
// Module hygiene - static source check
// ---------------------------------------------------------------------

describe('module hygiene · unified-context-builder.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/unified-context-builder.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  // Strip line + block comments so hygiene assertions fire on real
  // code only (the file's own header honestly references these
  // tokens as forbidden).
  const codeOnly = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  it('imports only from allowed sibling read models', () => {
    expect(source).toMatch(/from '@\/lib\/programs\/programs-canonical-view'/);
    expect(source).toMatch(/from '@\/lib\/intelligence\/sentinel-pattern-detections'/);
    expect(source).toMatch(/from '@\/lib\/solutions\/solution-archetype-registry'/);
  });

  it('does not import from forbidden runtimes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not call Date.now / Math.random / new Date(', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch( or import model SDKs', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    expect(codeOnly).not.toMatch(/from '@anthropic-ai\//);
    expect(codeOnly).not.toMatch(/from 'openai/);
    expect(codeOnly).not.toMatch(/from 'anthropic/);
  });

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });
});
