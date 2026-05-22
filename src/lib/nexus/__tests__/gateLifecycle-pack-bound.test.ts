// Pack-bound phase-entry deliverables — tests.
//
// The final slice of the knowledge-layer wiring: when an originated Move
// resolves to a curated Domain Function Pack, its Phase-1-entry deliverables
// (charter, stakeholder map, risk register) inherit the pack's curated
// `deliverableOutline` as their real structure and surface the pack's precise
// `seedGaps` as an honest "what we still need" section — instead of the static
// interpolated prose.
//
// The discipline under test is honesty: a Move with a resolvable
// `charter.functionPackKey` inherits curated depth; a Move with no resolvable
// function falls back to the existing template behaviour with an honest "no
// curated Function Pack" note — never fabricated depth.

import {
  PHASE1_ENTRY_DELIVERABLES,
  resolveMovePackContext,
  type PhaseEntryContext,
} from '../gateLifecycle';
import { CHARTER_FUNCTION_PACK_KEY } from '@/lib/programs/function-identity';
import { careDeliveryCareManagementPack } from '@/lib/programs/expert-kernel/domain/healthcare/care-delivery-care-management';

const PACK = careDeliveryCareManagementPack;
const FUNCTION_KEY = String(PACK.functionKey); // 'care_delivery_care_management'

const DISCOVER_OUTLINE = PACK.deliverableOutlines.find(
  (o) => o.artifact === 'discover_brief',
)!;

// ─────────────────────────────────────────────────────────────────────────────
// Test-context builders — assemble a real PhaseEntryContext, no Supabase I/O.
// ─────────────────────────────────────────────────────────────────────────────

/** A PhaseEntryContext for a Move that resolves to the care-management pack. */
function boundContext(): PhaseEntryContext {
  const { packBindings, businessCase } = resolveMovePackContext({
    industry_code: 'HEALTHCARE_IDN',
    name: 'Care-gap closure acceleration',
    charter: { [CHARTER_FUNCTION_PACK_KEY]: FUNCTION_KEY },
    // One recorded metric so a seed-gap subset (not all) is exercised.
    baseline_metrics: [
      { metric_name: 'Care-gap closure rate', value: 61, unit: '%' },
    ],
  });
  return {
    engagement: {
      id: 'eng-bound',
      name: 'Care-gap closure acceleration',
      industry_code: 'HEALTHCARE_IDN',
      function_code: 'FRONT_OFFICE',
      objective_code: 'analytics_modernization',
    },
    sponsor: { name: 'Dr. Lena Ortiz', role: 'Chief Medical Officer' },
    coSponsor: { name: 'Ray Patel', role: 'VP Population Health' },
    packBindings,
    businessCase,
  };
}

/** A PhaseEntryContext for a Move that resolves NO curated pack. */
function unboundContext(): PhaseEntryContext {
  const { packBindings, businessCase } = resolveMovePackContext({
    industry_code: 'HEALTHCARE_IDN',
    name: 'Unclassified initiative',
    charter: {}, // no functionPackKey — no resolvable function identity
    baseline_metrics: [],
  });
  return {
    engagement: {
      id: 'eng-unbound',
      name: 'Unclassified initiative',
      industry_code: 'HEALTHCARE_IDN',
      function_code: 'FRONT_OFFICE',
      objective_code: 'analytics_modernization',
    },
    sponsor: { name: 'Sam Cole', role: 'COO' },
    coSponsor: null,
    packBindings,
    businessCase,
  };
}

const spec = (typeKey: string) =>
  PHASE1_ENTRY_DELIVERABLES.find((s) => s.typeKey === typeKey)!;

// ─────────────────────────────────────────────────────────────────────────────
// resolveMovePackContext — the pure pack-binding seam
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveMovePackContext', () => {
  it('binds every Moves-phase artifact for a Move with a resolvable function', () => {
    const { packBindings } = resolveMovePackContext({
      industry_code: 'HEALTHCARE_IDN',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: FUNCTION_KEY },
      baseline_metrics: [],
    });
    expect(packBindings.discover_brief.bound).toBe(true);
    expect(packBindings.business_case.bound).toBe(true);
    expect(packBindings.discover_brief.functionLabel).toBe(PACK.functionLabel);
  });

  it('runs the expert kernel only when a curated pack binds', () => {
    const bound = resolveMovePackContext({
      industry_code: 'HEALTHCARE_IDN',
      name: 'A bound Move',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: FUNCTION_KEY },
      baseline_metrics: [],
    });
    expect(bound.businessCase).not.toBeNull();
    expect(bound.businessCase!.bound).toBe(true);
    expect(bound.businessCase!.skeleton).not.toBeNull();
  });

  it('returns honest unbound bindings and a null business case for an unresolvable Move', () => {
    const { packBindings, businessCase } = resolveMovePackContext({
      industry_code: 'HEALTHCARE_IDN',
      charter: {}, // no functionPackKey
      baseline_metrics: [],
    });
    expect(packBindings.discover_brief.bound).toBe(false);
    expect(packBindings.discover_brief.fallbackNote.length).toBeGreaterThan(0);
    expect(businessCase).toBeNull();
  });

  it('does not throw on a missing industry code / charter', () => {
    expect(() => resolveMovePackContext({})).not.toThrow();
    const { packBindings } = resolveMovePackContext({});
    expect(packBindings.discover_brief.bound).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// A resolvable Move — deliverables inherit the curated outline + name seed gaps
// ─────────────────────────────────────────────────────────────────────────────

describe('pack-bound phase-entry deliverables — a Move that resolves a pack', () => {
  it('every Phase-1-entry spec maps to the discover_brief artifact', () => {
    for (const s of PHASE1_ENTRY_DELIVERABLES) {
      expect(s.packArtifact).toBe('discover_brief');
    }
  });

  it.each(['charter', 'stakeholder_map', 'risk_register'])(
    '%s structure is inherited from the bound pack deliverableOutline',
    (typeKey) => {
      const content = spec(typeKey).buildStructuredContent(boundContext()) as Record<
        string,
        unknown
      >;
      expect((content.function_pack as { bound: boolean }).bound).toBe(true);

      // The inherited outline matches the pack's discover_brief outline
      // exactly — structure is inherited, not improvised.
      const inherited = content.inherited_outline as Array<{
        heading: string;
        guidance: string;
      }>;
      expect(inherited.map((s) => s.heading)).toEqual(
        DISCOVER_OUTLINE.sections.map((s) => s.heading),
      );
      // Each section carries the curated guidance, not a bare label.
      for (const section of inherited) {
        expect(section.guidance.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(['charter', 'stakeholder_map', 'risk_register'])(
    '%s names the pack seed gaps in its "what we still need" section',
    (typeKey) => {
      const content = spec(typeKey).buildStructuredContent(boundContext()) as Record<
        string,
        unknown
      >;
      const gaps = content.what_we_still_need as Array<{
        metric_key: string;
        metric_name: string;
        why_it_matters: string;
      }>;
      expect(gaps.length).toBeGreaterThan(0);
      // The recorded metric is NOT a seed gap.
      expect(gaps.map((g) => g.metric_key)).not.toContain('care_gap_closure_rate');
      // A pack-expected, not-recorded metric IS a precise, named gap.
      const readmission = gaps.find((g) => g.metric_key === 'readmission_rate_30d');
      expect(readmission).toBeDefined();
      expect(readmission!.metric_name.length).toBeGreaterThan(0);
      expect(readmission!.why_it_matters.length).toBeGreaterThan(0);
    },
  );

  it.each(['charter', 'stakeholder_map', 'risk_register'])(
    '%s markdown inherits the curated section headings as a real TOC',
    (typeKey) => {
      const md = spec(typeKey).buildMarkdown(boundContext());
      // Every curated section heading appears in the rendered markdown.
      for (const section of DISCOVER_OUTLINE.sections) {
        expect(md).toContain(`## ${section.heading}`);
      }
      // The honest seed-gap section is present and names a real seed-gapped
      // metric by its pack name.
      expect(md).toContain('## What We Still Need');
      const readmissionMetric = PACK.operatingMetrics.find(
        (m) => m.key === 'readmission_rate_30d',
      )!;
      expect(md).toContain(readmissionMetric.name);
      expect(md).toContain(PACK.functionLabel);
    },
  );

  it('the charter folds in the kernel-derived value framing', () => {
    const content = spec('charter').buildStructuredContent(boundContext()) as Record<
      string,
      unknown
    >;
    const kv = content.kernel_value_framing as
      | { recommendation: string; honesty_note: string }
      | undefined;
    expect(kv).toBeDefined();
    expect(['fund', 'shape', 'kill']).toContain(kv!.recommendation);
    expect(kv!.honesty_note.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// An unresolvable Move — honest fallback, never fabricated depth
// ─────────────────────────────────────────────────────────────────────────────

describe('pack-bound phase-entry deliverables — a Move with no resolvable function', () => {
  it.each(['charter', 'stakeholder_map', 'risk_register'])(
    '%s falls back to the template structure with an honest "no pack" note',
    (typeKey) => {
      const content = spec(typeKey).buildStructuredContent(unboundContext()) as Record<
        string,
        unknown
      >;
      const fp = content.function_pack as { bound: boolean; note: string };
      expect(fp.bound).toBe(false);
      expect(fp.note.length).toBeGreaterThan(0);
      // No fabricated curated depth — no inherited outline, no seed gaps.
      expect(content.inherited_outline).toBeUndefined();
      expect(content.what_we_still_need).toBeUndefined();
      // No fabricated kernel value framing.
      expect(content.kernel_value_framing).toBeUndefined();
    },
  );

  it('the unbound charter still produces valid, non-empty structured content', () => {
    const content = spec('charter').buildStructuredContent(unboundContext()) as Record<
      string,
      unknown
    >;
    // The existing template fields survive the fallback.
    expect(content.program_name).toBe('Unclassified initiative');
    expect(content.business_context).toBeDefined();
    expect(content.phase_1_entry_commitments).toBeDefined();
  });

  it('the unbound markdown is the existing template, valid and non-empty', () => {
    const md = spec('charter').buildMarkdown(unboundContext());
    expect(md.startsWith('# Program Charter')).toBe(true);
    expect(md).toContain('## Business Context');
    expect(md).toContain('## Phase 1 Entry Commitments');
    expect(md.length).toBeGreaterThan(100);
  });

  it('every spec builds valid content for both bound and unbound Moves — no throw', () => {
    for (const s of PHASE1_ENTRY_DELIVERABLES) {
      for (const ctx of [boundContext(), unboundContext()]) {
        expect(() => s.buildStructuredContent(ctx)).not.toThrow();
        expect(() => s.buildMarkdown(ctx)).not.toThrow();
        const structured = s.buildStructuredContent(ctx);
        const md = s.buildMarkdown(ctx);
        // The gate-advance flow inserts these directly — they must be a valid,
        // non-empty object and a non-empty markdown string.
        expect(typeof structured).toBe('object');
        expect(Object.keys(structured).length).toBeGreaterThan(0);
        expect(typeof md).toBe('string');
        expect(md.length).toBeGreaterThan(0);
      }
    }
  });
});
