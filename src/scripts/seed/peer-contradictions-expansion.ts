import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { getGraphDriver, closeGraphDriver } from '@/lib/graph/driver';
import { deterministicUuid, resolveClientMap } from './contradiction-engine-lib';

type TenantKey = 'meridian' | 'first_capital' | 'apex';

type Severity = 'high' | 'medium' | 'low';

interface PeerDecisionSeed {
  key: string;
  industryCode: 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL';
  phase: 0 | 1 | 2 | 3 | 4;
  choice: string;
  engagementName: string;
  outcomeSavingsUsd: number;
  notes?: string;
  madeAt: string;
  measuredAt: string;
}

interface ContradictionSeed {
  key: string;
  tenant: TenantKey;
  severity: Severity;
  contradictionType:
    | 'cost_vs_adoption'
    | 'value_vs_adoption'
    | 'value_vs_baseline'
    | 'risk_vs_value'
    | 'risk_vs_data'
    | 'shadow_ai'
    | 'stalled'
    | 'cost_trajectory';
  shortTitle: string;
  description: string;
  suggestedAction: string;
  oneLiner: string;
  refs: string[];
  detectedAt: string;
  monthlyTotalUsd?: number;
  eliminableUsdAnnual?: number;
  eliminablePct?: number;
  ownerNamed?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  stakesScore: number;
  surfacingPriority: number;
}

interface EngagementRef {
  id: string;
  graph_node_id: string | null;
  name: string;
  client_id: string | null;
}

function loadEnv() {
  for (const filename of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      if (process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

function getSupabaseClient() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const PEER_DECISION_SEEDS: PeerDecisionSeed[] = [
  {
    key: 'meridian-p0-baseline',
    industryCode: 'HEALTHCARE_IDN',
    phase: 0,
    choice: 'baseline_current_workflow_first',
    engagementName: 'Ridgeview Care Analytics Intake',
    outcomeSavingsUsd: 8_400_000,
    notes: 'Front-loaded workflow baseline avoided a 3-month measurement gap later in execution.',
    madeAt: '2025-02-10T00:00:00Z',
    measuredAt: '2025-11-14T00:00:00Z',
  },
  {
    key: 'meridian-p0-interview-sprint',
    industryCode: 'HEALTHCARE_IDN',
    phase: 0,
    choice: 'launch_exec_interview_sprint',
    engagementName: 'Wasatch Clinical Ops Charter',
    outcomeSavingsUsd: 6_100_000,
    notes: 'Interview sprint accelerated sponsor alignment, but baseline quality stayed medium.',
    madeAt: '2025-03-03T00:00:00Z',
    measuredAt: '2025-10-29T00:00:00Z',
  },
  {
    key: 'meridian-p0-data-readiness',
    industryCode: 'HEALTHCARE_IDN',
    phase: 0,
    choice: 'stand_up_data_readiness_squad',
    engagementName: 'Canyon Care Data Foundation',
    outcomeSavingsUsd: 9_700_000,
    notes: 'Small data squad in Phase 0 reduced downstream integration churn and change orders.',
    madeAt: '2025-01-22T00:00:00Z',
    measuredAt: '2025-12-02T00:00:00Z',
  },
  {
    key: 'meridian-p1-dual-sponsor',
    industryCode: 'HEALTHCARE_IDN',
    phase: 1,
    choice: 'name_dual_sponsors',
    engagementName: 'Northern Peaks Revenue Integrity',
    outcomeSavingsUsd: 5_300_000,
    notes: 'Clinical plus finance co-sponsorship cut approval latency by five weeks.',
    madeAt: '2024-11-18T00:00:00Z',
    measuredAt: '2025-08-01T00:00:00Z',
  },
  {
    key: 'meridian-p1-charter-narrow',
    industryCode: 'HEALTHCARE_IDN',
    phase: 1,
    choice: 'narrow_charter_to_first_win',
    engagementName: 'Front Range CareOps Refresh',
    outcomeSavingsUsd: 4_600_000,
    notes: 'A tighter first-win scope avoided a board escalation and kept the pilot alive.',
    madeAt: '2024-10-11T00:00:00Z',
    measuredAt: '2025-07-12T00:00:00Z',
  },
  {
    key: 'meridian-p2-slip-arch',
    industryCode: 'HEALTHCARE_IDN',
    phase: 2,
    choice: 'slip_for_architecture',
    engagementName: 'Riverside Health Analytics Mod',
    outcomeSavingsUsd: 38_000_000,
    notes: 'Two-week slip paid back with a clean post-go-live and no rebuild wave.',
    madeAt: '2024-04-12T00:00:00Z',
    measuredAt: '2024-11-01T00:00:00Z',
  },
  {
    key: 'meridian-p2-honor-deadline',
    industryCode: 'HEALTHCARE_IDN',
    phase: 2,
    choice: 'honor_deadline',
    engagementName: 'Eastpoint IDN Mod',
    outcomeSavingsUsd: -12_000_000,
    notes: 'Cutover date held, but a post-go-live rebuild burned budget and leadership trust.',
    madeAt: '2024-02-26T00:00:00Z',
    measuredAt: '2024-12-15T00:00:00Z',
  },
  {
    key: 'meridian-p3-wave-cutover',
    industryCode: 'HEALTHCARE_IDN',
    phase: 3,
    choice: 'cutover_by_service_line',
    engagementName: 'Summit Health Modernization Wave 2',
    outcomeSavingsUsd: 11_800_000,
    notes: 'Service-line waves reduced clinician training overload and support tickets.',
    madeAt: '2025-05-08T00:00:00Z',
    measuredAt: '2026-01-20T00:00:00Z',
  },
  {
    key: 'meridian-p4-hypercare',
    industryCode: 'HEALTHCARE_IDN',
    phase: 4,
    choice: 'extend_hypercare_for_two_cycles',
    engagementName: 'Heartland Patient Access Automation',
    outcomeSavingsUsd: 7_900_000,
    notes: 'Two-cycle hypercare prevented denial-rate regression during the final rollout.',
    madeAt: '2025-07-18T00:00:00Z',
    measuredAt: '2026-02-28T00:00:00Z',
  },
  {
    key: 'fins-p0-consent-order',
    industryCode: 'FINSERV',
    phase: 0,
    choice: 'start_with_regulatory_guardrails',
    engagementName: 'Blue Ridge AML Charter',
    outcomeSavingsUsd: 9_400_000,
    notes: 'Regulatory guardrails in the intake avoided three late rework loops with compliance.',
    madeAt: '2025-01-17T00:00:00Z',
    measuredAt: '2025-12-09T00:00:00Z',
  },
  {
    key: 'fins-p0-front-office',
    industryCode: 'FINSERV',
    phase: 0,
    choice: 'lead_with_front_office_use_case',
    engagementName: 'Harbor Wealth Advisor Assist Intake',
    outcomeSavingsUsd: 4_300_000,
    notes: 'Front-office entry bought sponsor excitement but slowed model-risk review later.',
    madeAt: '2025-02-05T00:00:00Z',
    measuredAt: '2025-11-25T00:00:00Z',
  },
  {
    key: 'fins-p1-risk-cfo',
    industryCode: 'FINSERV',
    phase: 1,
    choice: 'pair_cfo_with_risk',
    engagementName: 'Piedmont Treasury Copilot Charter',
    outcomeSavingsUsd: 6_800_000,
    notes: 'Risk plus finance sponsorship gave the team room to make irreversible tooling decisions earlier.',
    madeAt: '2024-12-03T00:00:00Z',
    measuredAt: '2025-09-18T00:00:00Z',
  },
  {
    key: 'fins-p2-data-contract',
    industryCode: 'FINSERV',
    phase: 2,
    choice: 'lock_data_contract_before_build',
    engagementName: 'Summit Bank Client 360 Design',
    outcomeSavingsUsd: 12_200_000,
    notes: 'A signed data contract prevented six integration defects from hitting UAT.',
    madeAt: '2024-09-21T00:00:00Z',
    measuredAt: '2025-08-14T00:00:00Z',
  },
  {
    key: 'fins-p2-parallel-compliance',
    industryCode: 'FINSERV',
    phase: 2,
    choice: 'parallelize_compliance_review',
    engagementName: 'HarborOne AML Workflow Redesign',
    outcomeSavingsUsd: 7_100_000,
    notes: 'Parallel compliance review pulled 8 weeks out of the design schedule.',
    madeAt: '2024-08-05T00:00:00Z',
    measuredAt: '2025-05-02T00:00:00Z',
  },
  {
    key: 'fins-p3-migrate-waves',
    industryCode: 'FINSERV',
    phase: 3,
    choice: 'migrate_advisors_in_waves',
    engagementName: 'Tidewater Wealth Platform Wave Cutover',
    outcomeSavingsUsd: 18_400_000,
    notes: 'Advisor waves avoided service degradation during portfolio-report migration.',
    madeAt: '2025-04-09T00:00:00Z',
    measuredAt: '2026-01-09T00:00:00Z',
  },
  {
    key: 'fins-p3-retain-legacy',
    industryCode: 'FINSERV',
    phase: 3,
    choice: 'retain_legacy_books_for_quarter',
    engagementName: 'Seaboard Trust Platform Separation',
    outcomeSavingsUsd: 10_900_000,
    notes: 'Legacy retained for one quarter lowered client-service risk while new books stabilized.',
    madeAt: '2025-03-18T00:00:00Z',
    measuredAt: '2025-12-22T00:00:00Z',
  },
  {
    key: 'fins-p3-parallel-cutover',
    industryCode: 'FINSERV',
    phase: 3,
    choice: 'parallelize_front_back_office_cutover',
    engagementName: 'Bluewater Advisory Ops Reset',
    outcomeSavingsUsd: 14_700_000,
    notes: 'Parallel front/back office cutover gained speed but required stronger war-room coverage.',
    madeAt: '2025-05-14T00:00:00Z',
    measuredAt: '2026-02-11T00:00:00Z',
  },
  {
    key: 'fins-p4-scale-after-control',
    industryCode: 'FINSERV',
    phase: 4,
    choice: 'scale_after_control_validation',
    engagementName: 'HarborView Compliance Copilot Rollout',
    outcomeSavingsUsd: 8_800_000,
    notes: 'Validation-first scaling reduced exam prep friction and kept audit evidence coherent.',
    madeAt: '2025-08-02T00:00:00Z',
    measuredAt: '2026-03-18T00:00:00Z',
  },
  {
    key: 'retail-p0-shadow-inventory',
    industryCode: 'RETAIL',
    phase: 0,
    choice: 'inventory_shadow_ai_first',
    engagementName: 'Northstar StoreOps Intake',
    outcomeSavingsUsd: 5_700_000,
    notes: 'Starting with shadow-AI inventory surfaced duplicate vendors before charter scope hardened.',
    madeAt: '2025-02-07T00:00:00Z',
    measuredAt: '2025-10-30T00:00:00Z',
  },
  {
    key: 'retail-p1-dual-sponsor',
    industryCode: 'RETAIL',
    phase: 1,
    choice: 'pair_digital_with_store_ops',
    engagementName: 'Coastal Retail Workforce Charter',
    outcomeSavingsUsd: 6_600_000,
    notes: 'Digital plus store-ops sponsorship cut the usual back-half adoption fight.',
    madeAt: '2024-12-16T00:00:00Z',
    measuredAt: '2025-09-09T00:00:00Z',
  },
  {
    key: 'retail-p2-pilot-cohort',
    industryCode: 'RETAIL',
    phase: 2,
    choice: 'pilot_store_cohort_first',
    engagementName: 'Midwest Store Enablement Pilot',
    outcomeSavingsUsd: 8_200_000,
    notes: 'A 60-store cohort generated credible labor and conversion baselines before scale.',
    madeAt: '2025-03-12T00:00:00Z',
    measuredAt: '2025-12-17T00:00:00Z',
  },
  {
    key: 'retail-p2-task-taxonomy',
    industryCode: 'RETAIL',
    phase: 2,
    choice: 'standardize_task_taxonomy_first',
    engagementName: 'Southeast Associate Workflow Reset',
    outcomeSavingsUsd: 7_400_000,
    notes: 'Standard task taxonomy exposed where tooling overlap was masking adoption issues.',
    madeAt: '2025-04-04T00:00:00Z',
    measuredAt: '2025-11-21T00:00:00Z',
  },
  {
    key: 'retail-p2-integrate-wfm',
    industryCode: 'RETAIL',
    phase: 2,
    choice: 'integrate_wfm_before_rollout',
    engagementName: 'Harbor Retail Labor Modernization',
    outcomeSavingsUsd: 9_100_000,
    notes: 'Integrating workforce management before rollout prevented store-level rejection in week one.',
    madeAt: '2025-03-26T00:00:00Z',
    measuredAt: '2026-01-06T00:00:00Z',
  },
  {
    key: 'retail-p3-market-waves',
    industryCode: 'RETAIL',
    phase: 3,
    choice: 'roll_out_by_market_wave',
    engagementName: 'Sunbelt Contact Center AI Scale',
    outcomeSavingsUsd: 12_500_000,
    notes: 'Wave-based rollout kept training capacity inside regional ops limits.',
    madeAt: '2025-06-11T00:00:00Z',
    measuredAt: '2026-02-23T00:00:00Z',
  },
  {
    key: 'retail-p4-freeze-scope',
    industryCode: 'RETAIL',
    phase: 4,
    choice: 'freeze_scope_through_holiday',
    engagementName: 'Lakeshore Forecasting Stabilization',
    outcomeSavingsUsd: 10_300_000,
    notes: 'Scope freeze through holiday reduced defect rates and preserved store trust.',
    madeAt: '2025-09-08T00:00:00Z',
    measuredAt: '2026-03-31T00:00:00Z',
  },
];

const CONTRADICTION_SEEDS: ContradictionSeed[] = [
  {
    key: 'meridian-ambient-overlap',
    tenant: 'meridian',
    severity: 'high',
    contradictionType: 'cost_vs_adoption',
    shortTitle: 'Ambient documentation overlap still has no portfolio owner',
    description: 'Abridge, Nuance DAX, and Nabla are still drawing budget across regions even after Meridian narrowed to two strategic platforms. Clinical documentation leaders can describe the rollout, but no one can name the owner for the overlap unwind.',
    suggestedAction: 'Drive a 30-minute ambient documentation consolidation decision with CIO + CMIO + procurement and assign an owner for the exit sequence.',
    oneLiner: 'Three ambient-documentation tools, one problem, no owner. Meridian is still paying overlap while regional leaders act as if the decision was already made.',
    refs: ['ambient vendor inventory', 'regional adoption export', 'procurement overlap review'],
    detectedAt: '2026-04-10T00:00:00Z',
    monthlyTotalUsd: 522_000,
    eliminableUsdAnnual: 3_700_000,
    eliminablePct: 59,
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 88,
    surfacingPriority: 92,
  },
  {
    key: 'meridian-phi-shadow',
    tenant: 'meridian',
    severity: 'high',
    contradictionType: 'shadow_ai',
    shortTitle: 'PHI-adjacent shadow AI use still lacks remediation ownership',
    description: 'Clinical and research teams are still using ungoverned AI workflows around PHI-adjacent tasks. Security and compliance both say remediation is important, but the work remains orphaned between committee meetings.',
    suggestedAction: 'Assign named remediation owners to the PHI-adjacent shadow AI findings and set a 14-day closure rhythm.',
    oneLiner: 'The risk is not subtle: PHI-adjacent shadow AI is known, repeated, and still effectively unowned.',
    refs: ['zscaler logs', 'security review pack', 'committee minutes'],
    detectedAt: '2026-04-07T00:00:00Z',
    monthlyTotalUsd: 184_000,
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 91,
    surfacingPriority: 95,
  },
  {
    key: 'meridian-cloud-finops',
    tenant: 'meridian',
    severity: 'high',
    contradictionType: 'cost_trajectory',
    shortTitle: 'AI cloud spend is compounding faster than governance maturity',
    description: 'Azure OpenAI, Bedrock, and supporting storage costs are trending up faster than the governance process is hardening. Finance can see the spend curve, but attribution by use case remains incomplete.',
    suggestedAction: 'Stand up AI FinOps attribution before the next scale wave and require a named owner on every major workload line item.',
    oneLiner: 'AI spend is scaling like a production platform while governance still behaves like a pilot committee.',
    refs: ['finops forecast', 'azure openai invoice trend', 'aws usage rollup'],
    detectedAt: '2026-04-05T00:00:00Z',
    monthlyTotalUsd: 1_280_000,
    eliminableUsdAnnual: 3_900_000,
    eliminablePct: 25,
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 83,
    surfacingPriority: 90,
  },
  {
    key: 'meridian-legal-stall',
    tenant: 'meridian',
    severity: 'medium',
    contradictionType: 'stalled',
    shortTitle: 'Chart summarization has strong pull but no legal closure',
    description: 'Chart summarization keeps testing well with clinicians, yet the workflow has been held in a review loop for weeks because legal sign-off never becomes the top priority.',
    suggestedAction: 'Force a yes-or-no legal memo and stop letting a narrow policy question block a broader operating decision.',
    oneLiner: 'Clinician demand is real; the stall is legal process, not product weakness.',
    refs: ['pilot adoption report', 'legal issue tracker', 'clinician feedback excerpts'],
    detectedAt: '2026-04-02T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 68,
    surfacingPriority: 76,
  },
  {
    key: 'meridian-governance-theater',
    tenant: 'meridian',
    severity: 'medium',
    contradictionType: 'risk_vs_value',
    shortTitle: 'Governance committee exists, but production reviews are still incomplete',
    description: 'Meridian can point to a formal AI governance committee, yet multiple production use cases still have incomplete review records. The visible structure is stronger than the operating discipline behind it.',
    suggestedAction: 'Backfill production reviews and make unreviewed production use cases visible to the executive sponsor until the gap is closed.',
    oneLiner: 'The governance story sounds mature; the review trail still says otherwise.',
    refs: ['governance agenda archive', 'review status export'],
    detectedAt: '2026-03-29T00:00:00Z',
    ownerNamed: true,
    confidence: 'high',
    stakesScore: 63,
    surfacingPriority: 70,
  },
  {
    key: 'meridian-attribution',
    tenant: 'meridian',
    severity: 'medium',
    contradictionType: 'value_vs_baseline',
    shortTitle: 'Ambient documentation value claims are ahead of the measurement baseline',
    description: 'Regional leaders are citing time-saved and burnout-improvement claims, but the baseline methodology is inconsistent enough that finance will challenge the number set if it reaches a board deck unchanged.',
    suggestedAction: 'Rebuild the baseline before the next executive readout so the value story survives scrutiny.',
    oneLiner: 'The value story is directionally right, but the measurement discipline is not yet board-safe.',
    refs: ['regional scorecards', 'finance challenge memo', 'measurement methodology draft'],
    detectedAt: '2026-03-25T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 61,
    surfacingPriority: 66,
  },
  {
    key: 'meridian-epic-drift',
    tenant: 'meridian',
    severity: 'medium',
    contradictionType: 'risk_vs_data',
    shortTitle: 'Epic-integrated workflows are expanding faster than access review',
    description: 'Several AI-assisted workflows are now more deeply integrated with Epic than the original access reviews contemplated. The technology posture advanced; the control posture mostly did not.',
    suggestedAction: 'Re-run access and subprocessor review for the Epic-adjacent workflows now operating outside their original boundary.',
    oneLiner: 'The workflow boundary moved; the control boundary did not move with it.',
    refs: ['epic access delta review', 'integration roster', 'vendor control packet'],
    detectedAt: '2026-03-21T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 58,
    surfacingPriority: 64,
  },
  {
    key: 'meridian-bias-loop',
    tenant: 'meridian',
    severity: 'medium',
    contradictionType: 'risk_vs_value',
    shortTitle: 'Bias incidents were documented, but retraining never triggered',
    description: 'Meridian recorded bias-adjacent incidents in talent and scheduling workflows, but the escalation never turned into a retraining or stop-ship decision.',
    suggestedAction: 'Add a simple trigger: two documented incidents automatically force retraining or executive waiver.',
    oneLiner: 'Known bias signals are still treated like anecdotes instead of system triggers.',
    refs: ['incident log', 'workflow audit', 'talent operations review'],
    detectedAt: '2026-03-19T00:00:00Z',
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 56,
    surfacingPriority: 61,
  },
  {
    key: 'meridian-tempus-boundary',
    tenant: 'meridian',
    severity: 'low',
    contradictionType: 'risk_vs_data',
    shortTitle: 'Research-only access boundaries are still porous',
    description: 'Research-designated credentials continue to appear inside workflows that are brushing up against clinical operating contexts. The issue is fixable, but it is still live.',
    suggestedAction: 'Separate research and clinical entitlements before the next user expansion wave.',
    oneLiner: 'This is a boundary-management problem that is still open longer than it should be.',
    refs: ['tempus access log', 'epic audit trail'],
    detectedAt: '2026-03-14T00:00:00Z',
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 44,
    surfacingPriority: 49,
  },
  {
    key: 'meridian-first-win-scope',
    tenant: 'meridian',
    severity: 'low',
    contradictionType: 'value_vs_adoption',
    shortTitle: 'Adoption is stronger than executive focus on the first-win scope',
    description: 'Frontline adoption is healthier than the executive conversation suggests, but the team keeps broadening the narrative instead of locking onto the first measurable win.',
    suggestedAction: 'Refocus the next sponsor readout on one measurable win instead of another broad transformation story.',
    oneLiner: 'The team has more adoption proof than focus discipline right now.',
    refs: ['usage export', 'sponsor prep notes'],
    detectedAt: '2026-03-10T00:00:00Z',
    ownerNamed: true,
    confidence: 'medium',
    stakesScore: 38,
    surfacingPriority: 43,
  },
  {
    key: 'firstcapital-copilot-ghost-seats',
    tenant: 'first_capital',
    severity: 'high',
    contradictionType: 'cost_trajectory',
    shortTitle: 'Copilot seat growth is outrunning active usage',
    description: 'Seat growth continues to climb while a meaningful share of the licensed population is inactive. Finance can see the spend, but the usage discipline has not caught up.',
    suggestedAction: 'Right-size the licensed population before approving the next expansion wave.',
    oneLiner: 'First Capital is paying for the growth story before proving the usage story.',
    refs: ['m365 seat report', '30-day activity export', 'forecast expansion memo'],
    detectedAt: '2026-04-11T00:00:00Z',
    monthlyTotalUsd: 691_000,
    eliminableUsdAnnual: 3_800_000,
    eliminablePct: 35,
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 87,
    surfacingPriority: 93,
  },
  {
    key: 'firstcapital-consumer-ai',
    tenant: 'first_capital',
    severity: 'high',
    contradictionType: 'shadow_ai',
    shortTitle: 'Consumer AI is still touching market-sensitive work',
    description: 'Research and strategy teams continue to use consumer AI tools for workflows that edge into market-sensitive territory. The enterprise alternative exists, but migration discipline is incomplete.',
    suggestedAction: 'Cut over approved research users to governed tenants and explicitly shut down consumer use in sensitive workflows.',
    oneLiner: 'The policy says governed AI only. The observed workflow still says otherwise.',
    refs: ['desktop telemetry', 'expense review', 'research lead interviews'],
    detectedAt: '2026-04-08T00:00:00Z',
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 92,
    surfacingPriority: 96,
  },
  {
    key: 'firstcapital-agent-assist-overlap',
    tenant: 'first_capital',
    severity: 'high',
    contradictionType: 'cost_vs_adoption',
    shortTitle: 'Agent-assist stack is strategically chosen but commercially duplicated',
    description: 'Cresta is the chosen direction, but overlapping contracts and residual usage on alternative tools are still drawing spend. The organization has made the strategy decision but not finished the commercial one.',
    suggestedAction: 'Run the contract unwind as a procurement decision with a named owner and dated exit milestones.',
    oneLiner: 'The strategic call is done. The money is still behaving like it was never made.',
    refs: ['contact center tooling inventory', 'legacy contract list', 'procurement tracker'],
    detectedAt: '2026-04-04T00:00:00Z',
    monthlyTotalUsd: 106_000,
    eliminableUsdAnnual: 1_260_000,
    eliminablePct: 100,
    ownerNamed: true,
    confidence: 'high',
    stakesScore: 84,
    surfacingPriority: 89,
  },
  {
    key: 'firstcapital-residency-gap',
    tenant: 'first_capital',
    severity: 'medium',
    contradictionType: 'risk_vs_data',
    shortTitle: 'Data residency intent is stronger than data residency configuration',
    description: 'Teams believe sensitive materials are constrained to a domestic footprint, but control settings and reviews do not yet fully enforce that boundary.',
    suggestedAction: 'Lock the residency boundary in configuration and re-verify the workspace posture before further expansion.',
    oneLiner: 'The intended boundary is clear. The enforced boundary is still softer than the story being told.',
    refs: ['workspace config review', 'residency clause', 'security design note'],
    detectedAt: '2026-03-31T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 65,
    surfacingPriority: 71,
  },
  {
    key: 'firstcapital-attribution-dispute',
    tenant: 'first_capital',
    severity: 'medium',
    contradictionType: 'value_vs_baseline',
    shortTitle: 'Executive value claim still depends on a disputed baseline',
    description: 'A deposit-lift and advisor-productivity story is circulating at the executive level, but Finance still disputes the baseline methodology and attribution controls.',
    suggestedAction: 'Rebuild the baseline and remove the board-facing claim until the methodology survives Finance scrutiny.',
    oneLiner: 'The metric is catchy. The baseline is still too weak to carry executive weight.',
    refs: ['value deck', 'finance challenge memo', 'metric methodology'],
    detectedAt: '2026-03-28T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 60,
    surfacingPriority: 67,
  },
  {
    key: 'firstcapital-governance-gap',
    tenant: 'first_capital',
    severity: 'medium',
    contradictionType: 'risk_vs_value',
    shortTitle: 'Governance process looks formal, inventory discipline still does not',
    description: 'A formal governance committee exists, but multiple active AI use cases still remain outside a complete review trail. The structure is visible; the operating discipline still has holes.',
    suggestedAction: 'Make the unreviewed use cases explicit in the next governance readout and force remediation dates.',
    oneLiner: 'The committee exists. The control coverage still does not fully exist.',
    refs: ['governance agenda history', 'use case inventory'],
    detectedAt: '2026-03-24T00:00:00Z',
    ownerNamed: true,
    confidence: 'high',
    stakesScore: 59,
    surfacingPriority: 65,
  },
  {
    key: 'firstcapital-consent-order-framing',
    tenant: 'first_capital',
    severity: 'medium',
    contradictionType: 'stalled',
    shortTitle: 'Consent-order caution is slowing approved modernization moves',
    description: 'Teams are using the consent-order context as a blanket reason to slow even approved, controlled modernization work. Legitimate caution has become generalized inertia.',
    suggestedAction: 'Split the backlog into forbidden, conditional, and already-approved work so the order stops being used as a universal stop sign.',
    oneLiner: 'The regulatory context is real, but the current operating response is broader than the actual restriction.',
    refs: ['program steering notes', 'risk review memo', 'approved backlog'],
    detectedAt: '2026-03-22T00:00:00Z',
    ownerNamed: true,
    confidence: 'medium',
    stakesScore: 57,
    surfacingPriority: 62,
  },
  {
    key: 'firstcapital-sponsor-drift',
    tenant: 'first_capital',
    severity: 'medium',
    contradictionType: 'value_vs_adoption',
    shortTitle: 'Sponsor attention drift is landing on the working team',
    description: 'The program remains strategically endorsed, but visible sponsor time has thinned out. The working team is compensating with more escalation prep and informal stakeholder management.',
    suggestedAction: 'Re-establish a visible sponsor cadence before the team starts solving the attention problem with more overhead.',
    oneLiner: 'The team still has momentum, but sponsor energy is starting to drift faster than adoption.',
    refs: ['steering cadence log', 'team escalation notes'],
    detectedAt: '2026-03-18T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 54,
    surfacingPriority: 58,
  },
  {
    key: 'firstcapital-knowledge-duplication',
    tenant: 'first_capital',
    severity: 'low',
    contradictionType: 'cost_vs_adoption',
    shortTitle: 'Knowledge workflow duplication persists in adjacent teams',
    description: 'Multiple adjacent teams are still buying their own research or drafting helpers for similar work. The overlap is not existential, but it is unnecessary.',
    suggestedAction: 'Consolidate the adjacent-team workflow set under one approved capability map.',
    oneLiner: 'Not the biggest problem on the page, but still real money for duplicate workflow support.',
    refs: ['tool inventory', 'team spend rollup'],
    detectedAt: '2026-03-15T00:00:00Z',
    monthlyTotalUsd: 42_000,
    eliminableUsdAnnual: 290_000,
    eliminablePct: 58,
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 36,
    surfacingPriority: 41,
  },
  {
    key: 'firstcapital-story-vs-controls',
    tenant: 'first_capital',
    severity: 'low',
    contradictionType: 'risk_vs_data',
    shortTitle: 'Control posture is improving faster than internal storytelling acknowledges',
    description: 'Several controls have improved, but teams still describe the environment as uniformly blocked. The resulting caution is partly justified and partly outdated.',
    suggestedAction: 'Refresh the internal operating narrative so teams know where they actually do have room to move.',
    oneLiner: 'The controls have moved forward. The internal story has not fully caught up.',
    refs: ['control inventory refresh', 'program update deck'],
    detectedAt: '2026-03-12T00:00:00Z',
    ownerNamed: true,
    confidence: 'medium',
    stakesScore: 34,
    surfacingPriority: 39,
  },
  {
    key: 'apex-frontline-ghost-seats',
    tenant: 'apex',
    severity: 'high',
    contradictionType: 'cost_vs_adoption',
    shortTitle: 'Frontline assistant spend is still ahead of actual usage',
    description: 'Apex is still funding a large frontline assistant footprint while weekly active usage remains well below what the seat base implies. The current spend profile is paying for a future that has not materialized yet.',
    suggestedAction: 'Either retrain and relaunch the frontline program with store-ops ownership or cut the inactive seats now.',
    oneLiner: 'Apex is paying for a scaled frontline story before proving a scaled frontline habit.',
    refs: ['frontline usage export', 'seat assignment list', 'store ops readout'],
    detectedAt: '2026-04-12T00:00:00Z',
    monthlyTotalUsd: 182_000,
    eliminableUsdAnnual: 1_480_000,
    eliminablePct: 68,
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 86,
    surfacingPriority: 94,
  },
  {
    key: 'apex-personalization-overlap',
    tenant: 'apex',
    severity: 'high',
    contradictionType: 'cost_vs_adoption',
    shortTitle: 'Personalization stack overlap is suppressing both margin and clarity',
    description: 'Apex is still running multiple personalization tools with overlapping scope and no single attribution owner. Lift is harder to trust because logic and spend are split across competing systems.',
    suggestedAction: 'Collapse personalization onto one strategic stack and force a single measurement owner for lift and overlap savings.',
    oneLiner: 'Too many personalization engines, not enough ownership of the combined result.',
    refs: ['digital tooling map', 'marketing attribution review', 'vendor overlap audit'],
    detectedAt: '2026-04-09T00:00:00Z',
    monthlyTotalUsd: 430_000,
    eliminableUsdAnnual: 3_400_000,
    eliminablePct: 53,
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 89,
    surfacingPriority: 93,
  },
  {
    key: 'apex-store-shadow',
    tenant: 'apex',
    severity: 'high',
    contradictionType: 'shadow_ai',
    shortTitle: 'Store-level AI activity is still ahead of central visibility',
    description: 'Store and field teams continue to pilot or lightly operationalize AI tools on local budgets. The central team knows enough to be concerned but not enough to govern cleanly.',
    suggestedAction: 'Run a store-ops inventory sprint and move the highest-risk workflows into governed channels first.',
    oneLiner: 'Local experimentation is happening faster than headquarters visibility, which is exactly how audit findings get born.',
    refs: ['store ops interviews', 'expense audit', 'app discovery export'],
    detectedAt: '2026-04-06T00:00:00Z',
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 90,
    surfacingPriority: 95,
  },
  {
    key: 'apex-brand-review-gap',
    tenant: 'apex',
    severity: 'medium',
    contradictionType: 'risk_vs_data',
    shortTitle: 'Brand policy exists, but generative content review is still informal',
    description: 'Marketing can point to brand standards and legal can point to policy, yet generative content review remains inconsistent across business units. The policy presence is stronger than the operating discipline.',
    suggestedAction: 'Create one lightweight review path for gen-content instead of letting every business unit improvise it.',
    oneLiner: 'The policy exists on paper; the operating model still depends on who happens to be on the team that day.',
    refs: ['marketing review notes', 'brand policy', 'campaign QA sample'],
    detectedAt: '2026-04-03T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 64,
    surfacingPriority: 72,
  },
  {
    key: 'apex-signifyd-review',
    tenant: 'apex',
    severity: 'medium',
    contradictionType: 'risk_vs_data',
    shortTitle: 'Subprocessor review cadence is lagging production usage',
    description: 'Apex is running customer-sensitive workflows through a production vendor relationship whose control review cadence is visibly stale. The technology is live; the oversight rhythm is not.',
    suggestedAction: 'Refresh the subprocessor and privacy review on the live customer-data vendors before the next expansion wave.',
    oneLiner: 'Production usage is current. The supporting privacy review rhythm is not.',
    refs: ['vendor review archive', 'privacy checklist', 'commerce risk memo'],
    detectedAt: '2026-03-30T00:00:00Z',
    ownerNamed: false,
    confidence: 'high',
    stakesScore: 62,
    surfacingPriority: 69,
  },
  {
    key: 'apex-store-productivity-scope',
    tenant: 'apex',
    severity: 'medium',
    contradictionType: 'value_vs_baseline',
    shortTitle: 'Store productivity ambition is outrunning the current baseline quality',
    description: 'The store-associate productivity program has strong intuition and sponsor energy, but the current baseline for labor time and task-shift economics is still patchier than the pitch implies.',
    suggestedAction: 'Lock a clean baseline on the top store workflows before widening the business case further.',
    oneLiner: 'The opportunity is likely real; the current baseline still needs to earn the confidence level the story assumes.',
    refs: ['store task study', 'labor baseline draft', 'sponsor brief'],
    detectedAt: '2026-03-27T00:00:00Z',
    ownerNamed: true,
    confidence: 'medium',
    stakesScore: 58,
    surfacingPriority: 65,
  },
  {
    key: 'apex-cdp-sponsor-drift',
    tenant: 'apex',
    severity: 'medium',
    contradictionType: 'value_vs_adoption',
    shortTitle: 'CDP program still matters, but visible sponsor energy has cooled',
    description: 'The unified customer data platform remains strategically important, but visible sponsor advocacy has thinned out relative to launch. More of the political carrying cost is landing on digital and data leaders.',
    suggestedAction: 'Reset the sponsor cadence before the team starts overcompensating with more narrative and more meetings.',
    oneLiner: 'The program still has strategic weight. The sponsor behavior no longer fully matches that weight.',
    refs: ['sponsor cadence log', 'program team notes', 'steering deck'],
    detectedAt: '2026-03-23T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 55,
    surfacingPriority: 60,
  },
  {
    key: 'apex-contact-center-slip',
    tenant: 'apex',
    severity: 'medium',
    contradictionType: 'stalled',
    shortTitle: 'Contact-center tuning blocker is now a sponsor-level issue',
    description: 'The contact-center AI program has enough momentum to scale, but one critical tuning blocker is slipping from an execution detail into a sponsor visibility issue. The execute-phase team has burned through buffer.',
    suggestedAction: 'Escalate the tuning blocker now instead of pretending the current execute cadence can absorb it.',
    oneLiner: 'This is no longer just an execution hiccup; it is becoming a sponsor-confidence problem.',
    refs: ['execute sprint review', 'qa score trend', 'program escalation note'],
    detectedAt: '2026-03-20T00:00:00Z',
    ownerNamed: true,
    confidence: 'high',
    stakesScore: 57,
    surfacingPriority: 63,
  },
  {
    key: 'apex-forecasting-proof',
    tenant: 'apex',
    severity: 'low',
    contradictionType: 'value_vs_baseline',
    shortTitle: 'Forecasting success is real, but transferability proof is still thin',
    description: 'Demand forecasting has a strong signed-off outcome story, yet the evidence for how fully it transfers beyond the original cohort is still thinner than the headline suggests.',
    suggestedAction: 'Frame the forecasting story as proven-in-cohort, not universally solved, until the next cohort attests.',
    oneLiner: 'Apex has a win here. It just is not yet the universal proof point the story wants it to be.',
    refs: ['outcome report', 'cohort extension plan'],
    detectedAt: '2026-03-16T00:00:00Z',
    ownerNamed: true,
    confidence: 'medium',
    stakesScore: 39,
    surfacingPriority: 44,
  },
  {
    key: 'apex-marketing-shadow',
    tenant: 'apex',
    severity: 'low',
    contradictionType: 'shadow_ai',
    shortTitle: 'Marketing shadow AI is still treated as a policy issue, not an operating issue',
    description: 'The marketing team still treats shadow AI as something legal will eventually solve for them. The operating reality is that the workflow is already here and needs management, not just policy.',
    suggestedAction: 'Treat marketing shadow AI as an operating portfolio with owners and migration paths, not just a legal memo topic.',
    oneLiner: 'The workflow is already real. Treating it as hypothetical only extends the unmanaged period.',
    refs: ['campaign ops interviews', 'legal policy memo'],
    detectedAt: '2026-03-12T00:00:00Z',
    ownerNamed: false,
    confidence: 'medium',
    stakesScore: 35,
    surfacingPriority: 40,
  },
];

const TENANT_CLIENT_NAMES: Record<TenantKey, string[]> = {
  meridian: ['Meridian Health System', 'Meridian Health'],
  first_capital: ['First Capital Financial', 'First Capital'],
  apex: ['Apex Retail Group', 'Apex Retail'],
};

const TENANT_ENGAGEMENT_LOOKUPS: Record<TenantKey, Array<{ graph?: string; name?: string }>> = {
  meridian: [
    { graph: 'eng_meridian_analytics_mod' },
    { name: 'Meridian Analytics Modernization' },
  ],
  first_capital: [
    { graph: 'eng_arcturus_wealth_platform' },
    { name: 'Arcturus Wealth Platform Modernization' },
  ],
  apex: [
    { name: 'Contact Center AI Transformation' },
    { name: 'Unified Customer Data Platform' },
    { name: 'Store Associate Productivity' },
    { name: 'Demand Forecasting AI' },
    { graph: 'eng_apex_retail_hr_erp' },
    { name: 'Apex Retail HR ERP Replacement' },
  ],
};

async function resolveEngagementRefs(
  sb: ReturnType<typeof createClient>,
  clientIds: Map<TenantKey, string>,
): Promise<Map<TenantKey, EngagementRef[]>> {
  const out = new Map<TenantKey, EngagementRef[]>();

  for (const tenant of Object.keys(TENANT_ENGAGEMENT_LOOKUPS) as TenantKey[]) {
    const clientId = clientIds.get(tenant);
    if (!clientId) throw new Error(`Missing client id for ${tenant}`);

    const refs: EngagementRef[] = [];
    for (const lookup of TENANT_ENGAGEMENT_LOOKUPS[tenant]) {
      let query = sb
        .from('engagements')
        .select('id, graph_node_id, name, client_id')
        .eq('client_id', clientId)
        .limit(1);

      if (lookup.graph) query = query.eq('graph_node_id', lookup.graph);
      if (lookup.name) query = query.eq('name', lookup.name);

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (data) refs.push(data as EngagementRef);
    }
    if (refs.length === 0) {
      throw new Error(`No engagement rows found for ${tenant}`);
    }
    out.set(tenant, refs);
  }

  return out;
}

async function seedPeerDecisions() {
  const driver = getGraphDriver();
  const session = driver.session();
  try {
    for (const seed of PEER_DECISION_SEEDS) {
      const engagementId = `eng_peer_${seed.key.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
      const decisionId = `dec_peer_${seed.key.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
      const outcomeId = `out_peer_${seed.key.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
      await session.run(
        `
          MERGE (i:Industry {code: $industryCode})
          MERGE (e:Engagement {id: $engagementId})
          ON CREATE SET e.created_at = datetime($madeAt)
          SET
            e.name = $engagementName,
            e.industry_code = $industryCode,
            e.current_phase = $phase,
            e.status = 'completed'
          MERGE (d:Decision {id: $decisionId})
          ON CREATE SET d.made_at = datetime($madeAt)
          SET
            d.name = $decisionName,
            d.phase = $phase,
            d.choice = $choice
          MERGE (o:Outcome {id: $outcomeId})
          ON CREATE SET o.measured_at = datetime($measuredAt)
          SET
            o.name = $outcomeName,
            o.verified = true,
            o.savings_usd = $outcomeSavingsUsd,
            o.notes = $notes
          MERGE (e)-[:MADE]->(d)
          MERGE (d)-[:RESULTED_IN]->(o)
          MERGE (e)-[:IN_INDUSTRY]->(i)
        `,
        {
          industryCode: seed.industryCode,
          engagementId,
          engagementName: seed.engagementName,
          phase: seed.phase,
          decisionId,
          decisionName: `${seed.choice.replace(/_/g, ' ')} decision`,
          choice: seed.choice,
          outcomeId,
          outcomeName: `${seed.engagementName} outcome`,
          outcomeSavingsUsd: seed.outcomeSavingsUsd,
          notes: seed.notes ?? '',
          madeAt: seed.madeAt,
          measuredAt: seed.measuredAt,
        },
      );
    }
  } finally {
    await session.close();
    await closeGraphDriver();
  }
}

function targetEngagementId(index: number, engagements: EngagementRef[]): string {
  return engagements[index % engagements.length]?.id ?? engagements[0].id;
}

async function seedContradictions() {
  const sb = getSupabaseClient();
  const clientMap = await resolveClientMap(sb);

  const clientIds = new Map<TenantKey, string>();
  for (const tenant of Object.keys(TENANT_CLIENT_NAMES) as TenantKey[]) {
    const ref = clientMap.get(tenant);
    if (!ref?.id) throw new Error(`Missing client ref for ${tenant}`);
    clientIds.set(tenant, ref.id);
  }

  const engagementRefs = await resolveEngagementRefs(sb, clientIds);

  const rows = CONTRADICTION_SEEDS.map((seed, index) => {
    const clientId = clientIds.get(seed.tenant);
    if (!clientId) throw new Error(`Missing client id for ${seed.tenant}`);
    const engagements = engagementRefs.get(seed.tenant);
    if (!engagements || engagements.length === 0) {
      throw new Error(`Missing engagement refs for ${seed.tenant}`);
    }
    const id = deterministicUuid(`a3-contradiction:${seed.tenant}:${seed.key}`);
    return {
      id,
      client_id: clientId,
      use_case_id: null,
      contradiction_type: seed.contradictionType,
      severity: seed.severity,
      description: seed.description,
      suggested_action: seed.suggestedAction,
      evidence: {
        refs: seed.refs,
        source: 'a3_peer_contradictions_seed',
        impact: {
          one_liner: seed.oneLiner,
          monthly_total_usd: seed.monthlyTotalUsd,
          eliminable_usd_annual: seed.eliminableUsdAnnual,
          eliminable_pct: seed.eliminablePct,
          owner_named: seed.ownerNamed,
          confidence: seed.confidence,
        },
      },
      detected_at: seed.detectedAt,
      resolved_at: null,
      resolution_notes: null,
      triggered_engagement_id: targetEngagementId(index, engagements),
      summary: seed.shortTitle,
      short_title: seed.shortTitle,
      long_description: seed.description,
      category: null,
      subcategory: 'demo_seed_expansion',
      temporal_state: 'persistent',
      severity_label: seed.severity === 'high' ? 'material' : seed.severity === 'medium' ? 'significant' : 'minor',
      confidence_level: seed.confidence ?? 'medium',
      sensitivity: seed.severity === 'high' ? 'high' : 'medium',
      stakes_score: seed.stakesScore,
      stakes_components: {
        financial: seed.monthlyTotalUsd ? Math.min(40, Math.round(seed.monthlyTotalUsd / 25_000)) : 12,
        strategic: Math.max(10, Math.round(seed.stakesScore * 0.3)),
        operating: Math.max(8, Math.round(seed.stakesScore * 0.22)),
      },
      evidence_ids: [],
      source_count: seed.refs.length,
      implicated_priority_refs: [],
      implicated_initiative_refs: [],
      implicated_person_ids: [],
      implicated_kpi_ids: [],
      implicated_external_event_ids: [],
      related_pattern_ids: [],
      first_detected_at: seed.detectedAt,
      last_refreshed_at: seed.detectedAt,
      last_evidence_change_at: seed.detectedAt,
      resolution_state: 'open',
      resolution_evidence_ids: [],
      reasoning_scope_id: null,
      disclosure_scope_id: null,
      suppress_until: null,
      surfacing_priority: seed.surfacingPriority,
      recommended_conversation_context: seed.suggestedAction,
      detection_rule_id: null,
      detection_run_id: null,
      created_by: 'automated',
      reviewer_notes: [],
    };
  });

  const { error } = await sb.from('contradictions').upsert(rows, { onConflict: 'id' });
  if (error) throw error;

  const contradictionCounts = await Promise.all(
    (Object.keys(TENANT_CLIENT_NAMES) as TenantKey[]).map(async (tenant) => {
      const clientId = clientIds.get(tenant);
      if (!clientId) return [tenant, 0] as const;
      const { count, error: countError } = await sb
        .from('contradictions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .is('resolved_at', null);
      if (countError) throw countError;
      return [tenant, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(contradictionCounts);
}

async function main() {
  loadEnv();
  await seedPeerDecisions();
  const contradictionCounts = await seedContradictions();

  console.log('\nA3 seed expansion complete');
  console.log(`  peer decisions seeded/updated: ${PEER_DECISION_SEEDS.length}`);
  console.log(`  contradictions seeded/updated: ${CONTRADICTION_SEEDS.length}`);
  for (const tenant of ['meridian', 'first_capital', 'apex'] as TenantKey[]) {
    console.log(`  ${tenant} active contradictions: ${contradictionCounts[tenant] ?? 'n/a'}`);
  }
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((error) => {
    console.error('FAILED:', error);
    process.exit(1);
  });
}
