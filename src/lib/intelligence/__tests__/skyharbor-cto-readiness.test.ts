import {
  buildSkyHarborCtoReadinessPacket,
  composeSkyHarborCtoAnswer,
  parseDecisionBranch,
  type ClaimMaturity,
} from '../skyharbor-cto-readiness';

const REQUIRED_MATURITIES: ClaimMaturity[] = [
  'loaded_fact',
  'relationship_inferred',
  'abarva_assessment',
  'industry_context',
  'client_signoff_required',
  'missing_evidence',
];

describe('SkyHarbor CTO readiness packet', () => {
  it('builds the IROPS packet from enriched V6 rows across systems, data, AI, value, risks, and gaps', () => {
    const packet = buildSkyHarborCtoReadinessPacket();

    expect(packet.systems).toHaveLength(12);
    expect(packet.dataAssets).toHaveLength(16);
    expect(packet.aiInitiatives).toHaveLength(8);
    expect(packet.programs).toHaveLength(8);
    expect(packet.risksControls).toHaveLength(12);
    expect(packet.spend).toHaveLength(8);
    expect(packet.relationships).toHaveLength(32);
    expect(packet.evidenceSources).toHaveLength(12);
    expect(packet.missingEvidenceChecklist.length).toBeGreaterThanOrEqual(5);
    expect(packet.sourceFiles).toEqual(expect.arrayContaining([
      'V6_05_applications_systems.csv',
      'V6_06_data_assets_integrations.csv',
      'V6_10_ai_initiatives.csv',
      'V6_12_relationships.csv',
      'V6_13_evidence_sources.csv',
    ]));
  });

  it('classifies claim maturity and does not allow board-grade value without signoff evidence', () => {
    const packet = buildSkyHarborCtoReadinessPacket();
    const maturities = packet.claimMaturity.map((claim) => claim.maturity);

    for (const maturity of REQUIRED_MATURITIES) {
      expect(maturities).toContain(maturity);
    }
    expect(packet.claimMaturity.find((claim) => claim.maturity === 'client_signoff_required')?.statement).toMatch(/planning-grade/i);
    expect(packet.claimMaturity.some((claim) => /board use/i.test(claim.statement) && claim.signoffRequired)).toBe(true);
    expect(packet.claimMaturity.map((claim) => claim.statement).join('\n')).not.toMatch(/exact ROI is proven|board-grade today/i);
  });

  it('generates branch options when value evidence is missing', () => {
    const packet = buildSkyHarborCtoReadinessPacket();

    expect(packet.branch.choices.map((choice) => choice.id)).toEqual([
      'use_planning_assumptions',
      'enter_missing_values',
      'generate_evidence_checklist',
      'continue_readiness_only',
      'ask_owner_for_evidence',
    ]);
    expect(packet.branch.customAllowed).toBe(true);
    expect(packet.branch.rawBlock).toContain('Use planning assumptions');
    expect(packet.branch.rawBlock).toContain('Enter missing values');
  });

  it('preserves Claude-owned branch wording while exposing renderable buttons', () => {
    const answer = composeSkyHarborCtoAnswer('What is blocking agentic IROPS from scaling?');
    const parsed = parseDecisionBranch(answer);

    expect(parsed.visibleText).toContain('My point of view');
    expect(parsed.visibleText).toContain('What would make it board-grade');
    expect(parsed.branch?.choices[0]?.label).toBe('Use planning assumptions');
    expect(parsed.branch?.choices[0]?.description).toContain('assumption-led');
    expect(parsed.branch?.rawBlock).toContain('custom_allowed: true');
    expect(parsed.visibleText).not.toContain('[DECISION_BRANCH]');
  });

  it('answers hard CTO questions with point of view and without invented value precision', () => {
    const answer = composeSkyHarborCtoAnswer('Is the IROPS AI case board-grade today?');

    expect(answer).toContain('not board-ready yet; it is planning-grade');
    expect(answer).toContain('Fund the readiness gate now');
    expect(answer).toContain('Finance signoff is required');
    expect(answer).not.toMatch(/\$270M|\bROI is proven\b|autonomous scale immediately/i);
    expect(answer).toContain('[DECISION_BRANCH]');
  });

  it('answers board-gap questions with named V6 facts, evidence domains, and caveats after the headline', () => {
    const answer = composeSkyHarborCtoAnswer('What evidence gaps matter before a board decision on IROPS AI?');

    expect(answer).toContain('Airline Demo IROPS AI case is not board-ready yet');
    expect(answer).toContain('Operations Control Center Platform');
    expect(answer).toContain('Crew Legality System');
    expect(answer).toContain('IROPS Data Foundation');
    expect(answer).toContain('AI Governance Readiness Program');
    expect(answer).toContain('Finance-approved disruption cost baseline');
    expect(answer).toContain('owner-signed freshness SLAs');
    expect(answer).toContain('human-in-loop approval and override logs');
    expect(answer).not.toMatch(/SHA-|Row:|\.csv|exact ROI is proven/i);
  });
});
