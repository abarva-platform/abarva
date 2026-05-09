import {
  fromGenomePatternRow,
  fromManifestEntry,
  fromPatternPackRow,
  fromPatternSeed,
  missingFieldNames,
} from './build-canonical-pattern';
import type { PatternManifestEntry } from '@/lib/intelligence/pattern-manifest';
import type { PatternSeed } from '@/lib/intelligence/seed-types';

function patternSeed(overrides: Partial<PatternSeed>): PatternSeed {
  return {
    id: 'PAT-TEST-001',
    slug: 'test-pattern',
    title: 'Test Pattern',
    domain: 'industry_specific',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis: 'A reusable pattern thesis.',
    applicability: 'Applies when the client has this problem.',
    status: 'AUTHORED-DRAFT',
    version: '1.0.0',
    confidence: 0.7,
    createdFrom: 'human_authored',
    createdBy: 'test',
    createdAt: '2026-05-09',
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: [],
    relatedPatternIds: [],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: 'Pattern body.',
    ...overrides,
  };
}

const manifestFixture: PatternManifestEntry = {
  id: 'pattern_prior_authorization_automation',
  slug: 'prior-authorization-automation',
  name: 'Prior Authorization Automation',
  version: '1.0.0',
  status: 'validated',
  category: 'Prior Auth',
  crossIndustry: false,
  sectorApplicability: ['healthcare/provider'],
  primarySector: 'healthcare',
  shortDescription: 'Automates prior authorization intake and exception routing.',
  longDescription: 'A payer operations pattern for reducing avoidable prior authorization cycle time.',
  confidenceFloor: 0.72,
  nObservationsFloor: 3,
  relatedPatternIds: [],
  regulatoryFrameworkIds: [],
  sourceFile: 'docs/patterns/prior-auth.md',
  sourceSection: 'Pattern',
  lastUpdatedAt: '2026-05-09',
  contentHash: 'abc123',
  evidenceCount: 2,
  observationCount: 3,
  observations: [],
  demoCritical: true,
  sections: [],
  triggerSymptoms: ['Long queue aging'],
  detectionSignals: ['Manual policy lookup'],
  diagnosticQuestions: ['Where does work stall?'],
  evidenceRequirements: ['Queue aging report'],
  interventions: ['Introduce exception triage'],
};

describe('canonical pattern draft builders', () => {
  it('builds a Retail PatternSeed draft without inventing KPIs or source basis', () => {
    const draft = fromPatternSeed(patternSeed({
      id: 'PAT-IND-RET-002',
      title: 'Demand Forecasting & Inventory AI',
      vertical: 'retail-cpg',
      sourceDocuments: ['internal retail pattern note'],
      taggedContradictionIds: ['CON-RET-001'],
    }));

    expect(draft.source_systems).toEqual(['pattern_seed']);
    expect(draft.source_ids).toEqual(['PAT-IND-RET-002']);
    expect(draft.industry).toEqual(['retail']);
    expect(draft.confidence_level).toEqual('medium');
    expect(draft.primary_kpis).toBeUndefined();
    expect(draft.quantitative_claims).toEqual([]);
    expect(draft.source_references).toEqual([{ label: 'internal retail pattern note' }]);
    expect(draft.missing_provenance).toBe(true);
    expect(missingFieldNames(draft)).toContain('primary_kpis');
  });

  it('preserves canonical PatternSeed enrichment for retail AI patterns', () => {
    const draft = fromPatternSeed(patternSeed({
      id: 'PAT-IND-RET-AI-TEST',
      title: 'Apex Retail Contact Center AI Routing',
      vertical: 'retail',
      canonical: {
        enterprise_area: 'front_office',
        function: 'customer_service',
        process_area: 'contact_center',
        use_case_category: 'agentic_routing',
        strategic_move_phases: ['diagnose_discover', 'design'],
        maturity_level: 'proven',
        confidence_level: 'high',
        target_personas: ['Chief Customer Officer', 'Contact Center VP'],
        business_problem: 'Contact routing lacks customer, order, and policy context.',
        why_now: 'Apex Retail needs faster routing with stronger containment and escalation controls.',
        value_hypothesis: 'A grounded routing agent can improve containment and service quality.',
        primary_kpis: ['containment_rate', 'average_handle_time', 'transfer_rate'],
        secondary_kpis: ['csat', 'escalation_rate', 'qa_score'],
        baseline_needed: ['current_containment_rate', 'current_average_handle_time', 'current_transfer_rate'],
        measurement_method: 'Compare pilot queues to matched baseline queues.',
        value_levers: ['experience', 'productivity', 'cost_takeout'],
        required_data_domains: ['customer_profile', 'case_history', 'order_status'],
        recommended_workshops: ['Contact center diagnostic workshop'],
        recommended_artifacts: ['Routing policy map'],
        common_failure_modes: ['Routing model optimizes speed but misses escalation risk'],
        failure_mode_mitigations: ['Require escalation guardrails before autonomous routing'],
        source_basis: 'inferred_from_patterns',
        confidence_rationale: 'Internal retail corpus enrichment; no external quantitative claim embedded.',
      },
    }));

    expect(draft.title).toBe('Apex Retail Contact Center AI Routing');
    expect(draft.enterprise_area).toBe('front_office');
    expect(draft.function).toBe('customer_service');
    expect(draft.strategic_move_phases).toEqual(['diagnose_discover', 'design']);
    expect(draft.primary_kpis).toEqual(['containment_rate', 'average_handle_time', 'transfer_rate']);
    expect(draft.required_data_domains).toEqual(['customer_profile', 'case_history', 'order_status']);
    expect(draft.recommended_workshops).toEqual(['Contact center diagnostic workshop']);
    expect(draft.source_basis).toBe('inferred_from_patterns');
    expect(draft.missing_provenance).toBe(false);
    expect(missingFieldNames(draft)).not.toContain('primary_kpis');
  });

  it('builds a Healthcare PatternSeed draft', () => {
    const draft = fromPatternSeed(patternSeed({
      id: 'PAT-IND-HC-001',
      title: 'Ambient Intelligence & Clinical Value Chain Automation',
      vertical: 'health-care',
    }));

    expect(draft.industry).toEqual(['healthcare']);
    expect(draft.title).toBe('Ambient Intelligence & Clinical Value Chain Automation');
  });

  it('builds a Financial Services PatternSeed draft', () => {
    const draft = fromPatternSeed(patternSeed({
      id: 'PAT-IND-FIN-001',
      title: 'Fraud Detection Modernization',
      vertical: 'financial-services',
      confidence: 0.82,
    }));

    expect(draft.industry).toEqual(['financial_services']);
    expect(draft.confidence_level).toEqual('high');
  });

  it('builds a generated manifest draft with provenance envelope', () => {
    const draft = fromManifestEntry(manifestFixture);

    expect(draft.source_systems).toEqual(['generated_pattern_manifest']);
    expect(draft.industry).toEqual(['healthcare']);
    expect(draft.gate_evidence_required).toEqual(['Queue aging report']);
    expect(draft.source_basis).toEqual('internal_pattern');
    expect(draft.confidence_rationale).toContain('Manifest confidence floor');
    expect(draft.missing_provenance).toBe(false);
  });

  it('builds a pattern_pack-like draft and preserves missing fields', () => {
    const draft = fromPatternPackRow({
      id: 'apex_pattern_owned_brand_margin_underperformance',
      category: 'Merchandising Strategy',
      sector_applicability: ['retail'],
      common_failure_modes: ['Margin leakage hidden by aggregate reporting'],
      anti_patterns: ['Diagnosing margin without item-level evidence'],
      intervention_options: ['Run SKU-family margin bridge'],
      phase_2_deliverables: ['discovery_report'],
      phase_3_deliverables: ['target_state_architecture'],
      evidence_requirements: ['Margin bridge'],
      confidence_level: 'high',
      source_id: 'internal-pattern-pack',
      as_of_date: '2026-05-09',
    });

    expect(draft.source_systems).toEqual(['pattern_packs']);
    expect(draft.industry).toEqual(['retail']);
    expect(draft.strategic_move_phases).toEqual(['diagnose_discover', 'design']);
    expect(draft.recommended_artifacts).toEqual(['discovery_report', 'target_state_architecture']);
    expect(draft.primary_kpis).toBeUndefined();
    expect(missingFieldNames(draft)).toContain('primary_kpis');
  });

  it('builds a genome_pattern-like draft and flags unsupported quantitative claims', () => {
    const draft = fromGenomePatternRow({
      code: 'F220',
      name: 'Vendor Fill Rate AI Blind To Contract Terms',
      description: 'Retail supply chain pattern.',
      industry: 'retail',
      office_category: 'middle_office',
      tags: ['supply chain', 'vendor fill rate', 'decision intelligence'],
      failure_rate_pct: 31,
    });

    expect(draft.source_systems).toEqual(['genome_patterns']);
    expect(draft.industry).toEqual(['retail']);
    expect(draft.enterprise_area).toEqual('middle_office');
    expect(draft.quantitative_claims).toHaveLength(1);
    expect(draft.unsupported_claim_flags).toEqual([{
      claim: 'failure_rate_pct=31',
      reason: 'Genome row supplied a quantitative field without a structured source reference in the row fixture.',
      recommended_action: 'source_required',
    }]);
    expect(draft.missing_provenance).toBe(true);
  });
});
