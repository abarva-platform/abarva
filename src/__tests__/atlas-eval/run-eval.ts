import fs from 'node:fs';
import path from 'node:path';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '../../lib/admin/ai-initiatives/queries';
import {
  buildTowerBandMetrics,
  type TowerLens,
} from '../../lib/tower/band-metrics-view';
import { buildTowerPressuresView } from '../../lib/tower/pressure-cards-view';
import { buildStrategicAlignment2x2View } from '../../lib/tower/strategic-alignment-2x2-view';
import {
  buildAtlasInterpretation,
  type AtlasReasoningInput,
} from '../../lib/tower/atlas-interpretation-view';
import type { AtlasPatternId } from '../../lib/tower/atlas-pattern-selectors';
import { probeCitationCompleteness } from './probes/citation-completeness';
import { probePatternCorrectness } from './probes/pattern-correctness';
import { probeCompression } from './probes/compression';

interface TemplateInitiative {
  initiative_id: string;
  display_id: string;
  name: string;
  description: string;
  primary_category_id: string;
  secondary_category_id?: string | null;
  primary_goal_id: string;
  stage: AIInitiative['stage'];
  stage_detail?: string | null;
  owner_name: string;
  owner_title: string;
  owner_function?: string | null;
  committed_annual_usd?: number | null;
  committed_total_usd?: number | null;
  measured_value_usd?: number | null;
  status_flag: AIInitiative['statusFlag'];
  status_summary: string;
  confidence_level: AIInitiative['confidenceLevel'];
  aligned_callout: boolean;
  aligned_rationale?: string | null;
}

interface TemplateVendor {
  initiative_id: string;
  vendor_name: string;
  contract_value_usd?: number | null;
  renewal_date?: string | null;
  financial_health?: AIInitiativeVendorRow['financialHealth'];
}

interface TemplatePayload {
  tenant_slug: string;
  business_goals: Array<{ goal_id: string; name: string }>;
  initiatives: TemplateInitiative[];
  vendors: TemplateVendor[];
}

interface EvalCase {
  id: string;
  tenantSlug: 'apex-retail' | 'meridian-health' | 'first-capital-financial';
  tenantName: string;
  lens: TowerLens;
  mutate?: (payload: {
    initiatives: AIInitiative[];
    vendors: AIInitiativeVendorRow[];
  }) => void;
  shouldFire?: ReadonlyArray<AtlasPatternId>;
  shouldNotFire?: ReadonlyArray<AtlasPatternId>;
  expectedRefusal?: boolean;
}

const TEMPLATE_BASE = 'docs/build/intelligence/ai-initiatives-package/templates';
const CATEGORY_NAMES: Record<string, string> = {
  'CAT-01': 'LLM Productivity',
  'CAT-02': 'Developer & IT SDLC AI',
  'CAT-03': 'Agentic Operations',
  'CAT-04': 'ERP & Domain Agents',
  'CAT-05': 'Predictive ML',
  'CAT-06': 'AI Infrastructure & FinOps',
  'CAT-07': 'Customer-Facing AI',
  'CAT-08': 'Compliance & Governance AI',
};

function readTemplate(slug: EvalCase['tenantSlug']): TemplatePayload {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), TEMPLATE_BASE, slug, 'full_load.json'), 'utf8'),
  ) as TemplatePayload;
}

function toInitiatives(tpl: TemplatePayload): AIInitiative[] {
  const goals = new Map(tpl.business_goals.map((goal) => [goal.goal_id, goal.name]));
  return tpl.initiatives.map((initiative) => ({
    initiativeId: initiative.initiative_id,
    displayId: initiative.display_id,
    name: initiative.name,
    description: initiative.description,
    primaryCategoryId: initiative.primary_category_id,
    primaryCategoryName: CATEGORY_NAMES[initiative.primary_category_id] ?? initiative.primary_category_id,
    secondaryCategoryId: initiative.secondary_category_id ?? null,
    secondaryCategoryName: initiative.secondary_category_id
      ? CATEGORY_NAMES[initiative.secondary_category_id] ?? initiative.secondary_category_id
      : null,
    primaryGoalId: initiative.primary_goal_id,
    primaryGoalName: goals.get(initiative.primary_goal_id) ?? initiative.primary_goal_id,
    stage: initiative.stage,
    stageDetail: initiative.stage_detail ?? null,
    ownerName: initiative.owner_name,
    ownerTitle: initiative.owner_title,
    ownerFunction: initiative.owner_function ?? null,
    committedAnnualUsd: initiative.committed_annual_usd ?? null,
    committedTotalUsd: initiative.committed_total_usd ?? null,
    measuredValueUsd: initiative.measured_value_usd ?? null,
    statusFlag: initiative.status_flag,
    statusSummary: initiative.status_summary,
    confidenceLevel: initiative.confidence_level,
    alignedCallout: initiative.aligned_callout,
    alignedRationale: initiative.aligned_rationale ?? null,
    loadedViaTemplate: `${tpl.tenant_slug}/full_load.json`,
  }));
}

function toVendors(tpl: TemplatePayload, initiatives: ReadonlyArray<AIInitiative>): AIInitiativeVendorRow[] {
  const byId = new Map(initiatives.map((initiative) => [initiative.initiativeId, initiative]));
  return tpl.vendors.map((vendor, index) => {
    const initiative = byId.get(vendor.initiative_id);
    return {
      vendorId: `${vendor.initiative_id}-${index}`,
      initiativeId: vendor.initiative_id,
      initiativeDisplayId: initiative?.displayId ?? vendor.initiative_id,
      initiativeName: initiative?.name ?? vendor.initiative_id,
      vendorName: vendor.vendor_name,
      contractValueUsd: vendor.contract_value_usd ?? null,
      renewalDate: vendor.renewal_date ?? null,
      financialHealth: vendor.financial_health ?? null,
    };
  });
}

function makeInput(testCase: EvalCase): AtlasReasoningInput {
  const tpl = readTemplate(testCase.tenantSlug);
  const initiatives = toInitiatives(tpl);
  const vendors = toVendors(tpl, initiatives);
  testCase.mutate?.({ initiatives, vendors });
  const todayIso = '2026-05-12';
  const bandMetrics = buildTowerBandMetrics(initiatives, vendors, todayIso, testCase.lens);
  const pressuresView = buildTowerPressuresView(initiatives, vendors, todayIso, testCase.lens);
  return {
    tenant: { name: testCase.tenantName, clientId: testCase.tenantSlug },
    todayIso,
    lens: testCase.lens,
    bandMetrics,
    pressuresView,
    alignment2x2View: buildStrategicAlignment2x2View(initiatives),
    initiatives,
    vendors,
  };
}

function healthyPortfolio({ initiatives, vendors }: { initiatives: AIInitiative[]; vendors: AIInitiativeVendorRow[] }) {
  for (const initiative of initiatives) {
    initiative.statusFlag = 'healthy';
    initiative.confidenceLevel = initiative.confidenceLevel === 'LOW' ? 'MED' : initiative.confidenceLevel;
    if (initiative.stage === 'pilot') initiative.stage = 'scaled';
  }
  for (const vendor of vendors) vendor.renewalDate = '2027-12-31';
}

function vendorSoon({ vendors }: { initiatives: AIInitiative[]; vendors: AIInitiativeVendorRow[] }) {
  if (vendors[0]) vendors[0].renewalDate = '2026-06-19';
}

function noSharedRoot({ initiatives, vendors }: { initiatives: AIInitiative[]; vendors: AIInitiativeVendorRow[] }) {
  initiatives.splice(2);
  if (initiatives[0]) {
    initiatives[0].statusFlag = 'value_lag';
    initiatives[0].primaryGoalId = 'GOAL-A';
    initiatives[0].primaryCategoryId = 'CAT-01';
    initiatives[0].confidenceLevel = 'HIGH';
  }
  if (initiatives[1]) {
    initiatives[1].statusFlag = 'duplication_risk';
    initiatives[1].primaryGoalId = 'GOAL-B';
    initiatives[1].primaryCategoryId = 'CAT-02';
    initiatives[1].confidenceLevel = 'MED';
  }
  vendors.splice(0);
}

function emptySubstrate({ initiatives, vendors }: { initiatives: AIInitiative[]; vendors: AIInitiativeVendorRow[] }) {
  initiatives.splice(0);
  vendors.splice(0);
}

const CASES: EvalCase[] = [
  { id: 'A1', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'value', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'A2', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'risk', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'A3', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'contract', shouldNotFire: ['pattern_04_vendor_clock'] },
  { id: 'A4', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'adopt', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'A5', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'contract', mutate: vendorSoon, shouldFire: ['pattern_04_vendor_clock'] },
  { id: 'A6', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'value', mutate: healthyPortfolio, shouldFire: ['pattern_06_healthy_posture'] },
  { id: 'A7', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'value', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'A8', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'value', shouldNotFire: ['pattern_04_vendor_clock'] },
  { id: 'B1', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'value', shouldFire: ['pattern_04_vendor_clock'] },
  { id: 'B2', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'risk', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'B3', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'contract', shouldFire: ['pattern_04_vendor_clock'] },
  { id: 'B4', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'adopt', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'B5', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'value', shouldFire: ['pattern_04_vendor_clock'] },
  { id: 'B6', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'value', mutate: healthyPortfolio, shouldFire: ['pattern_06_healthy_posture'] },
  { id: 'B7', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'contract', mutate: vendorSoon, shouldFire: ['pattern_04_vendor_clock'] },
  { id: 'B8', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'risk', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'C1', tenantSlug: 'first-capital-financial', tenantName: 'First Capital Financial', lens: 'value', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'C2', tenantSlug: 'first-capital-financial', tenantName: 'First Capital Financial', lens: 'risk', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'C3', tenantSlug: 'first-capital-financial', tenantName: 'First Capital Financial', lens: 'contract', mutate: vendorSoon, shouldFire: ['pattern_04_vendor_clock'] },
  { id: 'C4', tenantSlug: 'first-capital-financial', tenantName: 'First Capital Financial', lens: 'value', mutate: healthyPortfolio, shouldFire: ['pattern_06_healthy_posture'] },
  { id: 'C5', tenantSlug: 'first-capital-financial', tenantName: 'First Capital Financial', lens: 'adopt', shouldFire: ['pattern_01_top_pressure'] },
  { id: 'D1', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'value', mutate: emptySubstrate, expectedRefusal: true },
  { id: 'D2', tenantSlug: 'apex-retail', tenantName: 'Apex Retail', lens: 'value', mutate: noSharedRoot, shouldNotFire: ['pattern_02_shared_root'] },
  { id: 'D3', tenantSlug: 'meridian-health', tenantName: 'Meridian Health', lens: 'value', mutate: noSharedRoot, shouldNotFire: ['pattern_02_shared_root'] },
];

function runCase(testCase: EvalCase): { id: string; passed: boolean; errors: string[] } {
  const input = makeInput(testCase);
  const interpretation = buildAtlasInterpretation(input);
  const errors: string[] = [];
  if (testCase.expectedRefusal) {
    if (interpretation.interpretationConfidence !== 'low' || !interpretation.isEmpty) {
      errors.push('expected low-confidence substrate refusal');
    }
    return { id: testCase.id, passed: errors.length === 0, errors };
  }

  errors.push(...probeCitationCompleteness(interpretation.observations));
  errors.push(
    ...probePatternCorrectness({
      fired: interpretation.patternsFired,
      shouldFire: testCase.shouldFire,
      shouldNotFire: testCase.shouldNotFire,
    }),
  );
  errors.push(...probeCompression(interpretation.observations));
  if (interpretation.interpretationConfidence === 'low') {
    errors.push(`unexpected low confidence: ${interpretation.citationErrors.join('; ')}`);
  }
  return { id: testCase.id, passed: errors.length === 0, errors };
}

function main() {
  const caseArg = process.argv.find((arg) => arg.startsWith('--case='))?.split('=')[1];
  const tenantArg = process.argv.find((arg) => arg.startsWith('--tenant='))?.split('=')[1];
  const filtered = CASES.filter((testCase) => {
    if (caseArg && testCase.id !== caseArg) return false;
    if (tenantArg && !testCase.tenantSlug.includes(tenantArg)) return false;
    return true;
  });
  const results = filtered.map(runCase);
  for (const result of results) {
    process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.id}\n`);
    for (const error of result.errors) process.stdout.write(`  - ${error}\n`);
  }
  const passed = results.filter((result) => result.passed).length;
  const rate = results.length === 0 ? 0 : Math.round((passed / results.length) * 100);
  process.stdout.write(`\nAtlas eval pass rate: ${passed}/${results.length} (${rate}%)\n`);
  if (rate < 75) process.exitCode = 1;
}

main();
