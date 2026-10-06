import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'cto-readiness-'));
  const fixtureDir = path.join(fixtureRoot, 'datasets/tenant-inputs/active/skyharbor-air/current');
  const fixtureFiles = [
    ['04_applications_systems.csv', 'SYS'],
    ['05_data_assets_integrations.csv', 'DATA'],
    ['10_ai_automation_use_cases.csv', 'AI'],
    ['09_programs_initiatives.csv', 'PROG'],
    ['08_spend_value.csv', 'SPEND'],
    ['11_risks_controls.csv', 'RISK'],
    ['12_relationships.csv', 'REL'],
    ['13_evidence_sources.csv', 'EVID'],
    ['14_metrics_outcomes.csv', 'METRIC'],
    ['15_industry_context_patterns.csv', 'PATTERN'],
    ['16_expert_lenses.csv', 'LENS'],
  ] as const;

  beforeAll(() => {
    mkdirSync(fixtureDir, { recursive: true });
    for (const [name, kind] of fixtureFiles) {
      writeFileSync(path.join(fixtureDir, name), [
        'record_id,tenant_key,system_name,data_asset_name,use_case,record_name,risk_or_control',
        `SHA-${kind}-CTO-001,skyharbor-air,Dispatch system,Flight events,Recovery AI,Recovery program,Human approval`,
      ].join('\n'));
    }
  });

  afterAll(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  it('refuses readiness when the active packet has no curated CTO IDs', () => {
    const packet = buildSkyHarborCtoReadinessPacket();

    expect(packet.availability).toBe('unavailable');
    expect(packet.systems).toEqual([]);
    expect(packet.dataAssets).toEqual([]);
    expect(packet.claimMaturity).toEqual([]);
    expect(packet.decision).toBe('unavailable');
    expect(packet.branch.choices).toEqual([]);
    expect(composeSkyHarborCtoAnswer('Is IROPS ready?', packet)).toMatch(/curated CTO readiness evidence is unavailable/i);
    expect(composeSkyHarborCtoAnswer('Is IROPS ready?', packet)).not.toMatch(/0 IROPS-critical systems|fund readiness before autonomous scale/i);
  });

  it('returns an unavailable packet when active files are missing', () => {
    const packet = buildSkyHarborCtoReadinessPacket(path.join(fixtureRoot, 'missing'));

    expect(packet.availability).toBe('unavailable');
    expect(packet.sourceFiles).toEqual([]);
    expect(composeSkyHarborCtoAnswer('Is IROPS ready?', packet)).toMatch(/evidence is unavailable/i);
  });
  it('builds a packet only from verified curated IDs', () => {
    const packet = buildSkyHarborCtoReadinessPacket(fixtureRoot);

    expect(packet.availability).toBe('available');
    expect(packet.systems).toHaveLength(1);
    expect(packet.dataAssets).toHaveLength(1);
    expect(packet.aiInitiatives).toHaveLength(1);
    expect(packet.programs).toHaveLength(1);
    expect(packet.risksControls).toHaveLength(1);
    expect(packet.spend).toHaveLength(1);
    expect(packet.relationships).toHaveLength(1);
    expect(packet.evidenceSources).toHaveLength(1);
    expect(packet.missingEvidenceChecklist.length).toBeGreaterThanOrEqual(5);
    expect(packet.sourceFiles).toEqual(expect.arrayContaining([
      expect.stringContaining('04_applications_systems.csv'),
      expect.stringContaining('05_data_assets_integrations.csv'),
      expect.stringContaining('10_ai_automation_use_cases.csv'),
      expect.stringContaining('12_relationships.csv'),
      expect.stringContaining('13_evidence_sources.csv'),
    ]));
  });

  it('refuses a partially curated packet and records for another tenant', () => {
    const file = path.join(fixtureDir, '05_data_assets_integrations.csv');
    const original = readFileSync(file, 'utf8');
    try {
      writeFileSync(file, original.replace('SHA-DATA-CTO-001', 'SHA-SYS-CTO-001'));
      expect(buildSkyHarborCtoReadinessPacket(fixtureRoot).availability).toBe('unavailable');

      writeFileSync(file, original.replace('skyharbor-air', 'other-tenant'));
      expect(buildSkyHarborCtoReadinessPacket(fixtureRoot).availability).toBe('unavailable');
    } finally {
      writeFileSync(file, original);
    }
  });

  it('classifies claim maturity and does not allow board-grade value without signoff evidence', () => {
    const packet = buildSkyHarborCtoReadinessPacket(fixtureRoot);
    const maturities = packet.claimMaturity.map((claim) => claim.maturity);

    for (const maturity of REQUIRED_MATURITIES) {
      expect(maturities).toContain(maturity);
    }
    expect(packet.claimMaturity.find((claim) => claim.maturity === 'client_signoff_required')?.statement).toMatch(/planning-grade/i);
    expect(packet.claimMaturity.some((claim) => /board use/i.test(claim.statement) && claim.signoffRequired)).toBe(true);
    expect(packet.claimMaturity.map((claim) => claim.statement).join('\n')).not.toMatch(/exact ROI is proven|board-grade today/i);
  });

  it('generates branch options when value evidence is missing', () => {
    const packet = buildSkyHarborCtoReadinessPacket(fixtureRoot);

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
    const answer = composeSkyHarborCtoAnswer('What is blocking agentic IROPS from scaling?', buildSkyHarborCtoReadinessPacket(fixtureRoot));
    const parsed = parseDecisionBranch(answer);

    expect(parsed.visibleText).toContain('My point of view');
    expect(parsed.visibleText).toContain('What would make it board-grade');
    expect(parsed.branch?.choices[0]?.label).toBe('Use planning assumptions');
    expect(parsed.branch?.choices[0]?.description).toContain('assumption-led');
    expect(parsed.branch?.rawBlock).toContain('custom_allowed: true');
    expect(parsed.visibleText).not.toContain('[DECISION_BRANCH]');
  });

  it('answers hard CTO questions with point of view and without invented value precision', () => {
    const answer = composeSkyHarborCtoAnswer('Is the IROPS AI case board-grade today?', buildSkyHarborCtoReadinessPacket(fixtureRoot));

    expect(answer).toContain('planning-grade today, not board-grade');
    expect(answer).toContain('Finance signoff is required');
    expect(answer).not.toMatch(/\$270M|\bROI is proven\b|autonomous scale immediately/i);
    expect(answer).toContain('[DECISION_BRANCH]');
  });
});
