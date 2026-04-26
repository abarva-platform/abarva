// SOL12 · Architecture Draft Read Model tests.

import {
  ARCHITECTURE_DRAFT_SECTION_KEYS,
  buildArchitectureDraft,
  getArchitectureBlockers,
  summarizeArchitectureDraft,
  type ArchitectureAssumption,
  type ArchitectureComponent,
  type ArchitectureDraft,
  type ArchitectureDraftSectionKey,
  type ArchitectureDraftStatus,
  type ArchitectureEvidenceGap,
  type ArchitectureRisk,
} from '@/lib/solutions/architecture-draft-read-model';

const DOLLAR_PATTERN = /\$\s?\d/;

const CANONICAL_SECTION_KEYS: ArchitectureDraftSectionKey[] = [
  'context',
  'capabilities',
  'data_model',
  'integration',
  'security',
  'governance',
  'observability',
  'rollout',
];

const CANONICAL_STATUSES: ArchitectureDraftStatus[] = [
  'draft',
  'reviewed',
  'approved',
  'requires_workshop',
  'blocked',
];

// ---------------------------------------------------------------------
// Section coverage
// ---------------------------------------------------------------------

describe('ARCHITECTURE_DRAFT_SECTION_KEYS', () => {
  it('exposes exactly the eight canonical section keys in canonical order', () => {
    expect(ARCHITECTURE_DRAFT_SECTION_KEYS.length).toBe(8);
    expect(ARCHITECTURE_DRAFT_SECTION_KEYS).toEqual(CANONICAL_SECTION_KEYS);
  });
});

describe('buildArchitectureDraft default seed', () => {
  it('returns the eight canonical sections in canonical order', () => {
    const draft = buildArchitectureDraft();
    expect(draft.sections.length).toBe(8);
    expect(draft.sections.map((s) => s.key)).toEqual(CANONICAL_SECTION_KEYS);
  });

  it('every canonical section type is present exactly once', () => {
    const draft = buildArchitectureDraft();
    const counts = new Map<ArchitectureDraftSectionKey, number>();
    for (const section of draft.sections) {
      counts.set(section.key, (counts.get(section.key) ?? 0) + 1);
    }
    for (const k of CANONICAL_SECTION_KEYS) {
      expect(counts.get(k)).toBe(1);
    }
  });

  it('every section carries non-empty title, narrative, and body', () => {
    const draft = buildArchitectureDraft();
    for (const section of draft.sections) {
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.narrative.trim().length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThanOrEqual(2);
      for (const item of section.body) {
        expect(item.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('createdFrom is deterministic_architecture_draft_seed', () => {
    const draft = buildArchitectureDraft();
    expect(draft.createdFrom).toBe('deterministic_architecture_draft_seed');
    expect(draft.basis.source).toBe('deterministic_architecture_draft_seed');
    expect(draft.basis.draftBuilderVersion).toBe('sol12.v1');
  });
});

// ---------------------------------------------------------------------
// Status coverage (5 values)
// ---------------------------------------------------------------------

describe('ArchitectureDraftStatus accepts all five canonical values', () => {
  it.each(CANONICAL_STATUSES.map((s) => [s]))('builds a draft with status %s', (status) => {
    const draft = buildArchitectureDraft({ status: status as ArchitectureDraftStatus });
    expect(draft.status).toBe(status);
    expect(CANONICAL_STATUSES).toContain(draft.status);
  });

  it('summarised draft preserves the status across all five values', () => {
    for (const s of CANONICAL_STATUSES) {
      const draft = buildArchitectureDraft({ status: s });
      const summary = summarizeArchitectureDraft(draft);
      expect(summary.status).toBe(s);
    }
  });

  it('default status is draft', () => {
    const draft = buildArchitectureDraft();
    expect(draft.status).toBe('draft');
  });
});

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildArchitectureDraft determinism', () => {
  it('returns deeply equal output across repeated calls with no input', () => {
    const a = buildArchitectureDraft();
    const b = buildArchitectureDraft();
    expect(a).toEqual(b);
  });

  it('serialises byte-equal across repeated calls with no input', () => {
    const a = JSON.stringify(buildArchitectureDraft());
    const b = JSON.stringify(buildArchitectureDraft());
    expect(a).toBe(b);
  });

  it('serialises byte-equal across repeated calls with the same populated input', () => {
    const input = {
      archetypeKey: 'analytics_modernization',
      draftKey: 'tenant_acme_v3',
      status: 'reviewed' as ArchitectureDraftStatus,
    };
    const a = JSON.stringify(buildArchitectureDraft(input));
    const b = JSON.stringify(buildArchitectureDraft(input));
    expect(a).toBe(b);
  });

  it('summarizeArchitectureDraft is deterministic across repeated calls', () => {
    const draft = buildArchitectureDraft();
    const a = JSON.stringify(summarizeArchitectureDraft(draft));
    const b = JSON.stringify(summarizeArchitectureDraft(draft));
    expect(a).toBe(b);
  });

  it('getArchitectureBlockers is deterministic across repeated calls', () => {
    const draft = buildArchitectureDraft();
    const a = JSON.stringify(getArchitectureBlockers(draft));
    const b = JSON.stringify(getArchitectureBlockers(draft));
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------
// Assumptions / Components / Risks / Evidence gaps explicit
// ---------------------------------------------------------------------

describe('assumptions are explicit', () => {
  it('default seed surfaces at least one assumption per canonical section', () => {
    const draft = buildArchitectureDraft();
    expect(draft.assumptions.length).toBeGreaterThanOrEqual(8);
    const sectionsCovered = new Set(draft.assumptions.map((a) => a.sectionKey));
    for (const k of CANONICAL_SECTION_KEYS) {
      expect(sectionsCovered.has(k)).toBe(true);
    }
  });

  it('every assumption carries id, statement, confidence, and section anchor', () => {
    const draft = buildArchitectureDraft();
    for (const a of draft.assumptions) {
      expect(a.id.trim().length).toBeGreaterThan(0);
      expect(a.statement.trim().length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(a.confidence);
      expect(CANONICAL_SECTION_KEYS).toContain(a.sectionKey);
      expect(typeof a.requiresWorkshopValidation).toBe('boolean');
    }
  });

  it('every assumption id is unique', () => {
    const draft = buildArchitectureDraft();
    const ids = draft.assumptions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('components are explicit', () => {
  it('default seed surfaces at least one component per canonical section', () => {
    const draft = buildArchitectureDraft();
    expect(draft.components.length).toBeGreaterThanOrEqual(8);
    const sectionsCovered = new Set(draft.components.map((c) => c.sectionKey));
    for (const k of CANONICAL_SECTION_KEYS) {
      expect(sectionsCovered.has(k)).toBe(true);
    }
  });

  it('every component carries id, name, responsibility, and section anchor', () => {
    const draft = buildArchitectureDraft();
    for (const c of draft.components) {
      expect(c.id.trim().length).toBeGreaterThan(0);
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect(c.responsibility.trim().length).toBeGreaterThan(0);
      expect(['build', 'buy', 'partner', 'undecided']).toContain(c.buildBuyPartner);
      expect(['draft', 'reviewed', 'approved']).toContain(c.maturity);
      expect(CANONICAL_SECTION_KEYS).toContain(c.sectionKey);
    }
  });

  it('every component id is unique', () => {
    const draft = buildArchitectureDraft();
    const ids = draft.components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('risks are explicit', () => {
  it('default seed surfaces at least one risk per canonical section', () => {
    const draft = buildArchitectureDraft();
    expect(draft.risks.length).toBeGreaterThanOrEqual(8);
    const sectionsCovered = new Set(draft.risks.map((r) => r.sectionKey));
    for (const k of CANONICAL_SECTION_KEYS) {
      expect(sectionsCovered.has(k)).toBe(true);
    }
  });

  it('every risk carries id, description, severity, mitigation, section anchor, and blocksApproval flag', () => {
    const draft = buildArchitectureDraft();
    for (const r of draft.risks) {
      expect(r.id.trim().length).toBeGreaterThan(0);
      expect(r.description.trim().length).toBeGreaterThan(0);
      expect(r.mitigation.trim().length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(r.severity);
      expect(CANONICAL_SECTION_KEYS).toContain(r.sectionKey);
      expect(typeof r.blocksApproval).toBe('boolean');
    }
  });

  it('default seed includes at least one approval-blocking risk', () => {
    const draft = buildArchitectureDraft();
    const blocking = draft.risks.filter((r) => r.blocksApproval);
    expect(blocking.length).toBeGreaterThan(0);
  });
});

describe('evidence gaps are explicit', () => {
  it('default seed surfaces at least one evidence gap per canonical section', () => {
    const draft = buildArchitectureDraft();
    expect(draft.evidenceGaps.length).toBeGreaterThanOrEqual(8);
    const sectionsCovered = new Set(draft.evidenceGaps.map((g) => g.sectionKey));
    for (const k of CANONICAL_SECTION_KEYS) {
      expect(sectionsCovered.has(k)).toBe(true);
    }
  });

  it('every evidence gap carries id, description, inputRequired, impact band, and section anchor', () => {
    const draft = buildArchitectureDraft();
    for (const g of draft.evidenceGaps) {
      expect(g.id.trim().length).toBeGreaterThan(0);
      expect(g.description.trim().length).toBeGreaterThan(0);
      expect(g.inputRequired.trim().length).toBeGreaterThan(0);
      expect(['informational', 'requires_workshop', 'blocks_approval']).toContain(g.impact);
      expect(CANONICAL_SECTION_KEYS).toContain(g.sectionKey);
    }
  });

  it('default seed includes at least one approval-blocking evidence gap', () => {
    const draft = buildArchitectureDraft();
    const blocking = draft.evidenceGaps.filter((g) => g.impact === 'blocks_approval');
    expect(blocking.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Section anchoring: id references resolve
// ---------------------------------------------------------------------

describe('section anchors resolve to first-class records', () => {
  it('every section assumption / component / risk / evidence-gap id resolves', () => {
    const draft = buildArchitectureDraft();
    const aIds = new Set(draft.assumptions.map((a) => a.id));
    const cIds = new Set(draft.components.map((c) => c.id));
    const rIds = new Set(draft.risks.map((r) => r.id));
    const gIds = new Set(draft.evidenceGaps.map((g) => g.id));

    for (const section of draft.sections) {
      for (const id of section.assumptionIds) expect(aIds.has(id)).toBe(true);
      for (const id of section.componentIds) expect(cIds.has(id)).toBe(true);
      for (const id of section.riskIds) expect(rIds.has(id)).toBe(true);
      for (const id of section.evidenceGapIds) expect(gIds.has(id)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Caller-supplied input override
// ---------------------------------------------------------------------

describe('buildArchitectureDraft accepts caller-supplied collections', () => {
  it('uses caller-supplied assumptions verbatim', () => {
    const custom: ArchitectureAssumption[] = [
      {
        id: 'custom_assumption',
        statement: 'A bespoke assumption captured by the architect.',
        confidence: 'high',
        sectionKey: 'context',
        requiresWorkshopValidation: false,
      },
    ];
    const draft = buildArchitectureDraft({ assumptions: custom });
    expect(draft.assumptions).toEqual(custom);
  });

  it('uses caller-supplied components verbatim', () => {
    const custom: ArchitectureComponent[] = [
      {
        id: 'custom_component',
        name: 'Bespoke component',
        responsibility: 'Anchors a tenant-specific architecture node.',
        sectionKey: 'capabilities',
        buildBuyPartner: 'partner',
        maturity: 'reviewed',
      },
    ];
    const draft = buildArchitectureDraft({ components: custom });
    expect(draft.components).toEqual(custom);
  });

  it('uses caller-supplied risks verbatim', () => {
    const custom: ArchitectureRisk[] = [
      {
        id: 'custom_risk',
        description: 'A bespoke risk captured by the architect.',
        sectionKey: 'security',
        severity: 'high',
        mitigation: 'Bespoke mitigation language.',
        blocksApproval: true,
      },
    ];
    const draft = buildArchitectureDraft({ risks: custom });
    expect(draft.risks).toEqual(custom);
  });

  it('uses caller-supplied evidence gaps verbatim', () => {
    const custom: ArchitectureEvidenceGap[] = [
      {
        id: 'custom_gap',
        description: 'A bespoke evidence gap captured by the architect.',
        sectionKey: 'governance',
        inputRequired: 'Capture the bespoke input.',
        impact: 'blocks_approval',
      },
    ];
    const draft = buildArchitectureDraft({ evidenceGaps: custom });
    expect(draft.evidenceGaps).toEqual(custom);
  });

  it('uses caller-supplied archetypeKey and draftKey when present', () => {
    const draft = buildArchitectureDraft({
      archetypeKey: 'analytics_modernization',
      draftKey: 'tenant_acme_v9',
    });
    expect(draft.archetypeKey).toBe('analytics_modernization');
    expect(draft.draftKey).toBe('tenant_acme_v9');
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeArchitectureDraft', () => {
  it('reconciles totals against the draft', () => {
    const draft = buildArchitectureDraft();
    const summary = summarizeArchitectureDraft(draft);
    expect(summary.totalSections).toBe(draft.sections.length);
    expect(summary.totalAssumptions).toBe(draft.assumptions.length);
    expect(summary.totalComponents).toBe(draft.components.length);
    expect(summary.totalRisks).toBe(draft.risks.length);
    expect(summary.totalEvidenceGaps).toBe(draft.evidenceGaps.length);
    expect(summary.blockingRiskCount).toBe(
      draft.risks.filter((r) => r.blocksApproval).length,
    );
    expect(summary.blockingEvidenceGapCount).toBe(
      draft.evidenceGaps.filter((g) => g.impact === 'blocks_approval').length,
    );
    expect(summary.workshopGatedAssumptionCount).toBe(
      draft.assumptions.filter((a) => a.requiresWorkshopValidation).length,
    );
  });

  it('preserves draftKey, archetypeKey, status, and recommendedNextAction', () => {
    const draft = buildArchitectureDraft({ status: 'reviewed' });
    const summary = summarizeArchitectureDraft(draft);
    expect(summary.draftKey).toBe(draft.draftKey);
    expect(summary.archetypeKey).toBe(draft.archetypeKey);
    expect(summary.status).toBe('reviewed');
    expect(summary.recommendedNextAction).toBe(draft.recommendedNextAction);
  });
});

// ---------------------------------------------------------------------
// Blockers
// ---------------------------------------------------------------------

describe('getArchitectureBlockers', () => {
  it('returns approval-blocking risks and approval-blocking evidence gaps', () => {
    const draft = buildArchitectureDraft();
    const blockers = getArchitectureBlockers(draft);

    const expectedRisks = draft.risks.filter((r) => r.blocksApproval).map((r) => r.id);
    const expectedGaps = draft.evidenceGaps
      .filter((g) => g.impact === 'blocks_approval')
      .map((g) => g.id);
    const observedRisks = blockers.filter((b) => b.kind === 'risk').map((b) => b.id);
    const observedGaps = blockers.filter((b) => b.kind === 'evidence_gap').map((b) => b.id);

    expect(observedRisks.sort()).toEqual(expectedRisks.sort());
    expect(observedGaps.sort()).toEqual(expectedGaps.sort());
  });

  it('returns an empty list when caller supplies no blocking content', () => {
    const draft = buildArchitectureDraft({ risks: [], evidenceGaps: [] });
    expect(getArchitectureBlockers(draft)).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// recommendedNextAction transitions
// ---------------------------------------------------------------------

describe('recommendedNextAction transitions deterministically with status', () => {
  it.each(CANONICAL_STATUSES.map((s) => [s]))(
    'returns a non-empty next action for status %s',
    (status) => {
      const draft = buildArchitectureDraft({ status: status as ArchitectureDraftStatus });
      expect(draft.recommendedNextAction.trim().length).toBeGreaterThan(0);
    },
  );

  it('approved status produces an approval-track next action when no blockers remain', () => {
    const draft = buildArchitectureDraft({
      status: 'approved',
      risks: [],
      evidenceGaps: [],
    });
    expect(draft.recommendedNextAction.toLowerCase()).toContain('approved');
  });
});

// ---------------------------------------------------------------------
// No fabrication / no fake citations
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('serialised default draft contains no `https://` (no fake citations)', () => {
    const draft = buildArchitectureDraft();
    const serialized = JSON.stringify(draft);
    expect(serialized).not.toMatch(/https:\/\//);
    expect(serialized).not.toMatch(/http:\/\//);
  });

  it('serialised default draft contains no fabricated dollar amounts', () => {
    const draft = buildArchitectureDraft();
    const serialized = JSON.stringify(draft);
    expect(serialized).not.toMatch(DOLLAR_PATTERN);
  });

  it('serialised default draft contains no banned placeholder phrases', () => {
    const draft = buildArchitectureDraft();
    const serialized = JSON.stringify(draft).toLowerCase();
    expect(serialized).not.toMatch(/coming soon/);
    expect(serialized).not.toMatch(/\btbd\b/);
    expect(serialized).not.toMatch(/lorem ipsum/);
  });

  it('all sections are tagged createdFrom: deterministic_architecture_draft_seed', () => {
    const draft = buildArchitectureDraft();
    expect(draft.createdFrom).toBe('deterministic_architecture_draft_seed');
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · architecture-draft-read-model.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/architecture-draft-read-model.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / auth runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/fetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime or React state hooks', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/useState/);
    expect(codeOnly).not.toMatch(/useEffect/);
  });

  it('does not contain raw URLs (no fake citations)', () => {
    expect(codeOnly).not.toMatch(/https:\/\//);
    expect(codeOnly).not.toMatch(/http:\/\//);
  });
});

// ---------------------------------------------------------------------
// Type-level: ensures all 5 status values and all 8 section keys compile
// ---------------------------------------------------------------------

describe('type contract', () => {
  it('exposes all 5 status string-literal members usable in arrays', () => {
    const all: ArchitectureDraftStatus[] = [
      'draft',
      'reviewed',
      'approved',
      'requires_workshop',
      'blocked',
    ];
    expect(all.length).toBe(5);
  });

  it('exposes all 8 section key string-literal members usable in arrays', () => {
    const all: ArchitectureDraftSectionKey[] = [
      'context',
      'capabilities',
      'data_model',
      'integration',
      'security',
      'governance',
      'observability',
      'rollout',
    ];
    expect(all.length).toBe(8);
  });

  it('produces a draft whose top-level shape matches the expected contract', () => {
    const draft: ArchitectureDraft = buildArchitectureDraft();
    expect(typeof draft.archetypeKey).toBe('string');
    expect(typeof draft.draftKey).toBe('string');
    expect(typeof draft.status).toBe('string');
    expect(Array.isArray(draft.sections)).toBe(true);
    expect(Array.isArray(draft.assumptions)).toBe(true);
    expect(Array.isArray(draft.components)).toBe(true);
    expect(Array.isArray(draft.risks)).toBe(true);
    expect(Array.isArray(draft.evidenceGaps)).toBe(true);
    expect(typeof draft.recommendedNextAction).toBe('string');
    expect(draft.basis.source).toBe('deterministic_architecture_draft_seed');
    expect(draft.createdFrom).toBe('deterministic_architecture_draft_seed');
  });
});
