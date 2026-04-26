// SOL10 · Recommendation → Program Workshop Bridge tests.
//
// Pure deterministic projection of SOL9 solution recommendations into
// recommended workshops, SME role bundles, evidence-need hints, and
// deliverable hints. Covers byte-equal determinism, recommendation
// shape coverage, sparse-input fallback behavior, summary
// reconciliation, missing-evidence aggregation, and module hygiene.

import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  buildRecommendationWorkshopMap,
  getMissingEvidenceForBridge,
  summarizeWorkshopBridge,
  type RecommendationInputForBridge,
  type RecommendationWorkshopMap,
} from '@/lib/solutions/recommendation-workshop-bridge';

const MODULE_PATH = resolve(
  __dirname,
  '../../../lib/solutions/recommendation-workshop-bridge.ts',
);

const VALID_EVIDENCE_KINDS = new Set<string>([
  'current_state_input',
  'architecture_building_block',
  'governance_review',
]);

const VALID_EVIDENCE_SEVERITIES = new Set<string>([
  'must_capture',
  'should_capture',
  'nice_to_have',
]);

const HEALTHCARE_RECOMMENDATION: RecommendationInputForBridge = {
  archetypeKey: 'healthcare_ambient_clinical_value_chain',
  archetypeName: 'Healthcare Ambient Clinical Value Chain',
  confidence: 'high',
  recommendedComponents: [
    'ambient_clinical_capture',
    'clinical_summary_synthesis',
    'ehr_writeback_orchestration',
  ],
  recommendedWorkshops: [
    'current_state_discovery',
    'governance_risk_review',
    'architecture_solution_design',
    'deliverable_synthesis',
  ],
  smesRequired: [
    'clinical_informaticist',
    'physician_champion',
    'governance_lead',
  ],
  architectureBuildingBlocks: [
    'ambient_audio_capture_pipeline',
    'clinical_summarization_service',
    'ehr_integration_adapter',
  ],
  deliverablesGenerated: [
    'clinical_workflow_assessment',
    'ambient_pilot_runbook',
    'governance_risk_register',
  ],
  missingInputs: [],
};

const ANALYTICS_RECOMMENDATION: RecommendationInputForBridge = {
  archetypeKey: 'analytics_modernization',
  archetypeName: 'Analytics Modernization',
  confidence: 'medium',
  recommendedComponents: [
    'lakehouse_foundation',
    'semantic_layer',
    'metadata_catalog',
  ],
  recommendedWorkshops: [
    'data_foundation_assessment',
    'architecture_solution_design',
    'deliverable_synthesis',
  ],
  smesRequired: ['data_owner', 'data_engineer', 'enterprise_architect'],
  architectureBuildingBlocks: [
    'data_lakehouse',
    'semantic_layer',
    'metadata_catalog',
  ],
  deliverablesGenerated: [
    'data_foundation_assessment_report',
    'reference_architecture',
  ],
};

const SPARSE_RECOMMENDATION: RecommendationInputForBridge = {
  archetypeKey: 'kyc_customer_onboarding_ai',
  archetypeName: 'KYC Customer Onboarding AI',
  confidence: 'low',
  recommendedComponents: [],
  recommendedWorkshops: [],
  smesRequired: [],
  architectureBuildingBlocks: [],
  deliverablesGenerated: [],
};

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildRecommendationWorkshopMap determinism', () => {
  it('returns byte-equal output across repeated calls for the same input', () => {
    const a = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    const b = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('emits one map per input recommendation', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
      SPARSE_RECOMMENDATION,
    ]);
    expect(maps.length).toBe(3);
    expect(maps[0].archetypeKey).toBe('healthcare_ambient_clinical_value_chain');
    expect(maps[1].archetypeKey).toBe('analytics_modernization');
    expect(maps[2].archetypeKey).toBe('kyc_customer_onboarding_ai');
  });

  it('every map carries the canonical createdFrom marker', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    for (const m of maps) {
      expect(m.createdFrom).toBe(
        'deterministic_recommendation_workshop_bridge_seed',
      );
    }
  });
});

// ---------------------------------------------------------------------
// Shape coverage
// ---------------------------------------------------------------------

describe('buildRecommendationWorkshopMap shape coverage', () => {
  it('every map has at least one workshop, sme, evidence hint, and deliverable', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
      SPARSE_RECOMMENDATION,
    ]);
    expect(maps.length).toBeGreaterThan(0);
    for (const m of maps) {
      expect(m.workshops.length).toBeGreaterThan(0);
      expect(m.smes.length).toBeGreaterThan(0);
      expect(m.evidenceNeeds.length).toBeGreaterThan(0);
      expect(m.deliverables.length).toBeGreaterThan(0);
    }
  });

  it('marks exactly one workshop as the recommended first workshop', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    for (const m of maps) {
      const firstFlags = m.workshops.filter((w) => w.isFirstWorkshop);
      expect(firstFlags.length).toBe(1);
      expect(firstFlags[0].workshopKey).toBe(m.recommendedFirstWorkshopKey);
    }
  });

  it('every workshop bundle has at least one expected role', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    for (const m of maps) {
      for (const w of m.workshops) {
        expect(w.expectedRoles.length).toBeGreaterThan(0);
        expect(w.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it('every sme bundle has a populated roleLabel and workshopKey', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    for (const m of maps) {
      for (const sme of m.smes) {
        expect(sme.roleKey.length).toBeGreaterThan(0);
        expect(sme.roleLabel.length).toBeGreaterThan(0);
        expect(sme.workshopKey.length).toBeGreaterThan(0);
        expect(sme.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it('every evidence hint carries a canonical kind and severity', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    for (const m of maps) {
      for (const ev of m.evidenceNeeds) {
        expect(VALID_EVIDENCE_KINDS.has(ev.kind)).toBe(true);
        expect(VALID_EVIDENCE_SEVERITIES.has(ev.severity)).toBe(true);
        expect(ev.workshopKey.length).toBeGreaterThan(0);
        expect(ev.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('every deliverable hint references a canonical workshop', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    for (const m of maps) {
      const workshopKeys = new Set(m.workshops.map((w) => w.workshopKey));
      for (const d of m.deliverables) {
        expect(d.deliverableKey.length).toBeGreaterThan(0);
        expect(workshopKeys.has(d.workshopKey)).toBe(true);
        expect(d.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it('routes deliverables onto deliverable_synthesis when present', () => {
    const maps = buildRecommendationWorkshopMap([HEALTHCARE_RECOMMENDATION]);
    expect(maps.length).toBe(1);
    for (const d of maps[0].deliverables) {
      expect(d.workshopKey).toBe('deliverable_synthesis');
    }
  });
});

// ---------------------------------------------------------------------
// Sparse input fallback
// ---------------------------------------------------------------------

describe('buildRecommendationWorkshopMap sparse input', () => {
  it('falls back to current_state_discovery when no workshops are recommended', () => {
    const maps = buildRecommendationWorkshopMap([SPARSE_RECOMMENDATION]);
    expect(maps.length).toBe(1);
    const m = maps[0];
    expect(m.recommendedFirstWorkshopKey).toBe('current_state_discovery');
    expect(m.workshops.length).toBeGreaterThan(0);
    expect(m.workshops[0].workshopKey).toBe('current_state_discovery');
    expect(m.workshops[0].isFirstWorkshop).toBe(true);
  });

  it('emits the default solution brief deliverable when archetype lists none', () => {
    const maps = buildRecommendationWorkshopMap([SPARSE_RECOMMENDATION]);
    expect(maps.length).toBe(1);
    expect(maps[0].deliverables.length).toBeGreaterThan(0);
    expect(maps[0].deliverables[0].deliverableKey).toBe(
      'archetype_solution_brief',
    );
  });

  it('still emits a governance evidence hint when architecture blocks are empty', () => {
    const maps = buildRecommendationWorkshopMap([SPARSE_RECOMMENDATION]);
    const governance = maps[0].evidenceNeeds.filter(
      (ev) => ev.kind === 'governance_review',
    );
    expect(governance.length).toBeGreaterThan(0);
    expect(governance[0].severity).toBe('nice_to_have');
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeWorkshopBridge', () => {
  it('reconciles to the bridge map list', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    const summary = summarizeWorkshopBridge(maps);
    let expectedWorkshops = 0;
    let expectedSmes = 0;
    let expectedEvidence = 0;
    let expectedDeliverables = 0;
    for (const m of maps) {
      expectedWorkshops += m.workshops.length;
      expectedSmes += m.smes.length;
      expectedEvidence += m.evidenceNeeds.length;
      expectedDeliverables += m.deliverables.length;
    }
    expect(summary.totalMaps).toBe(maps.length);
    expect(summary.totalWorkshops).toBe(expectedWorkshops);
    expect(summary.totalSmes).toBe(expectedSmes);
    expect(summary.totalEvidenceNeeds).toBe(expectedEvidence);
    expect(summary.totalDeliverables).toBe(expectedDeliverables);
    expect(summary.archetypeKeys.length).toBe(maps.length);
    expect(summary.firstWorkshopKeys.length).toBe(maps.length);
  });

  it('handles the empty input case', () => {
    const summary = summarizeWorkshopBridge([]);
    expect(summary.totalMaps).toBe(0);
    expect(summary.totalWorkshops).toBe(0);
    expect(summary.totalSmes).toBe(0);
    expect(summary.totalEvidenceNeeds).toBe(0);
    expect(summary.totalDeliverables).toBe(0);
    expect(summary.archetypeKeys.length).toBe(0);
    expect(summary.firstWorkshopKeys.length).toBe(0);
  });
});

// ---------------------------------------------------------------------
// Missing evidence aggregation
// ---------------------------------------------------------------------

describe('getMissingEvidenceForBridge', () => {
  it('returns only must_capture / should_capture entries', () => {
    const maps = buildRecommendationWorkshopMap([
      HEALTHCARE_RECOMMENDATION,
      ANALYTICS_RECOMMENDATION,
    ]);
    const missing = getMissingEvidenceForBridge(maps);
    expect(missing.length).toBeGreaterThan(0);
    for (const ev of missing) {
      expect(['must_capture', 'should_capture']).toContain(ev.severity);
    }
  });

  it('returns an empty list when no maps are supplied', () => {
    const missing = getMissingEvidenceForBridge([]);
    expect(missing.length).toBe(0);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  const moduleSource = readFileSync(MODULE_PATH, 'utf8');

  it('does not invoke Date.now / new Date / fetch / Math.random / hooks', () => {
    expect(moduleSource).not.toContain('Date.now');
    expect(moduleSource).not.toContain('Math.random');
    expect(moduleSource).not.toContain('new Date(');
    expect(moduleSource).not.toContain('fetch(');
    expect(moduleSource).not.toContain('useState');
    expect(moduleSource).not.toContain('useEffect');
  });

  it('does not name model providers', () => {
    expect(moduleSource).not.toContain('anthropic');
    expect(moduleSource).not.toContain('openai');
  });

  it('does not contain placeholder copy', () => {
    expect(moduleSource).not.toContain('Coming soon');
    expect(moduleSource).not.toContain('TBD');
    expect(moduleSource).not.toContain('Lorem ipsum');
  });

  it('does not import from forbidden directories', () => {
    expect(moduleSource).not.toMatch(/from ['"]@\/lib\/source\//);
    expect(moduleSource).not.toMatch(/from ['"]@\/lib\/nexus\//);
    expect(moduleSource).not.toMatch(/from ['"]@\/lib\/sentinel\//);
    expect(moduleSource).not.toMatch(/from ['"]@\/lib\/atlas\//);
    expect(moduleSource).not.toMatch(/from ['"]@\/lib\/agent\//);
    expect(moduleSource).not.toMatch(/from ['"]@\/lib\/auth\//);
    expect(moduleSource).not.toMatch(/from ['"]@\/lib\/programs\//);
    expect(moduleSource).not.toMatch(/from ['"][^'"]*supabase/);
  });

  it('does not import live runtime modules', () => {
    expect(moduleSource).not.toMatch(/from ['"]@\/components\/agent\//);
    expect(moduleSource).not.toMatch(/from ['"][^'"]*\/programs\/mock/);
  });
});

// ---------------------------------------------------------------------
// Recommendation shape passthrough
// ---------------------------------------------------------------------

describe('recommendation shape passthrough', () => {
  it('preserves archetype identity on the produced map', () => {
    const maps: readonly RecommendationWorkshopMap[] =
      buildRecommendationWorkshopMap([HEALTHCARE_RECOMMENDATION]);
    expect(maps.length).toBe(1);
    const m = maps[0];
    expect(m.archetypeKey).toBe(HEALTHCARE_RECOMMENDATION.archetypeKey);
    expect(m.archetypeName).toBe(HEALTHCARE_RECOMMENDATION.archetypeName);
  });

  it('does not silently drop or duplicate workshops from the canonical list', () => {
    const maps = buildRecommendationWorkshopMap([HEALTHCARE_RECOMMENDATION]);
    const wsKeys = maps[0].workshops.map((w) => w.workshopKey);
    expect(wsKeys).toEqual([
      'current_state_discovery',
      'governance_risk_review',
      'architecture_solution_design',
      'deliverable_synthesis',
    ]);
  });
});
