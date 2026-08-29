// The design file's mock dataset, transcribed into MART shape — FOR TESTS ONLY.
//
// `docs/design/tower/command-center-2026-07-23/tower-command-center-design.html`
// lines 599–700 carry an invented banking dataset ("Risk & Compliance AI",
// FINRA/OCC narrative, "First Capital Financial") layered on top of Healthcare
// Composite Demo aggregates. It is fiction.
//
// It is reproduced here, and ONLY here, as a typed fixture: it lets the layout
// be proven pixel-correct and the mapper be exercised against a full-density
// page without a database. Nothing under `src/` outside `__tests__/` may import
// this file — putting this content into a shipped surface would push
// un-governed synthetic copy into an agent-usable object, which
// `AGENTS.md` → "Context & corpus governance" forbids.
//
// The tenant is deliberately named "Fixture Tenant", not any real or cover
// client name.

import type {
  TowerMartAiPortfolioItem,
  TowerMartCommandViewModel,
  TowerMartCxoAction,
  TowerMartEvidenceLineage,
  TowerMartProgramLane,
  TowerMartRequiredFieldGap,
  TowerMartValueTrajectoryPoint,
} from "@/lib/tower/current-layer-view-model";

const M = 1_000_000;

const LANES: ReadonlyArray<
  Partial<TowerMartProgramLane> & { programCode: string }
> = [
  {
    programCode: "P3",
    programName: "Risk & Compliance AI",
    ownerRole: "Chief Risk Officer",
    decisionLane: "fund",
    approvedFundingUsd: 52 * M,
    promisedValueUsd: 12.4 * M,
    financeValidatedValueUsd: 3.1 * M,
    adoptionRatePct: 86,
    usageMetric: "alerts_scored_per_month",
    usageActual: 1_200_000,
    towerClaimAllowed: "partial",
    decisionRationale: "Finance has not signed the avoidance method",
    requiredGates: [{ ask: "Finance attestation of fraud-loss avoidance" }],
    caveat:
      "Strong usage and model performance; the benefit is not yet attested by Finance.",
  },
  {
    programCode: "P9",
    programName: "Workplace AI",
    ownerRole: "CIO",
    decisionLane: "fix",
    approvedFundingUsd: 16 * M,
    promisedValueUsd: 6.8 * M,
    financeValidatedValueUsd: 0.2 * M,
    adoptionRatePct: 44,
    usageMetric: "active_seats",
    usageActual: 1840,
    towerClaimAllowed: "partial",
    decisionRationale: "Paid seats idle behind a policy review",
    requiredGates: [{ ask: "DLP policy filed · adoption to 60%" }],
    caveat: "Funded and licensed but adoption is thin and uneven.",
  },
  {
    programCode: "P4",
    programName: "Payments Modernization",
    ownerRole: "SVP Payments Tech",
    decisionLane: "freeze",
    approvedFundingUsd: 38 * M,
    promisedValueUsd: 5.2 * M,
    financeValidatedValueUsd: 0,
    adoptionRatePct: 2,
    usageMetric: "instant_payment_volume",
    usageActual: 21_000,
    towerClaimAllowed: "blocked",
    decisionRationale: "Adoption at 2% against a 35% target",
    requiredGates: [{ ask: "Instant-payment adoption 2% → 20%" }],
    caveat: "Spend is ahead of adoption.",
  },
  {
    programCode: "P5",
    programName: "Digital Banking & Channels",
    ownerRole: "Chief Digital Officer",
    decisionLane: "fix",
    approvedFundingUsd: 28 * M,
    promisedValueUsd: 4.1 * M,
    financeValidatedValueUsd: 0.3 * M,
    adoptionRatePct: 29,
    usageMetric: "accounts_opened",
    usageActual: 42_000,
    towerClaimAllowed: "partial",
    decisionRationale: "Recovery programme early; benefit not usage-linked",
    requiredGates: [{ ask: "Account-open abandonment 58% → 30%" }],
    caveat:
      "Early usage signal is positive but below the promised improvement.",
  },
  {
    programCode: "P8",
    programName: "Data & AI Platform",
    ownerRole: "CDAO",
    decisionLane: "fix",
    approvedFundingUsd: 18 * M,
    promisedValueUsd: 3.3 * M,
    financeValidatedValueUsd: 0,
    adoptionRatePct: 30,
    usageMetric: "assets_with_lineage",
    usageActual: 5_800,
    towerClaimAllowed: "blocked",
    decisionRationale: "Lineage control deficient — gates customer AI scale",
    requiredGates: [{ ask: "Data-lineage control cleared" }],
    caveat:
      "A lineage control finding blocks scaling anything customer-facing.",
  },
  {
    programCode: "P6",
    programName: "Enterprise HR/Finance AI",
    ownerRole: "CFO",
    decisionLane: "fund",
    approvedFundingUsd: 26 * M,
    promisedValueUsd: 2.4 * M,
    financeValidatedValueUsd: 0.2 * M,
    adoptionRatePct: 74,
    usageMetric: "hr_queries_deflected",
    usageActual: 34_000,
    towerClaimAllowed: "partial",
    decisionRationale: "Embedded vendor AI deflection is untracked",
    requiredGates: [{ ask: "Bring embedded vendor AI into scope" }],
    caveat:
      "Deflection value is invisible because it is not measured or attributed.",
  },
  {
    programCode: "P10",
    programName: "Wealth Advisor Copilot",
    ownerRole: "SVP Wealth Tech",
    decisionLane: "stop",
    approvedFundingUsd: 10 * M,
    promisedValueUsd: 1.3 * M,
    financeValidatedValueUsd: 0,
    adoptionRatePct: null,
    usageMetric: null,
    usageActual: null,
    towerClaimAllowed: "blocked",
    decisionRationale: "Blocked by an unresolved supervision gap",
    requiredGates: [{ ask: "Supervision gap resolved" }],
    caveat: "A pilot with no verified usage and an open supervision gap.",
  },
  {
    // The run-and-sustain line: funded, nothing promised → reclassified to
    // the design's "watch" column by `laneFor()`.
    programCode: "P1",
    programName: "Core Banking Platform",
    ownerRole: "CIO",
    decisionLane: "fund",
    approvedFundingUsd: 84 * M,
    promisedValueUsd: 0,
    financeValidatedValueUsd: 0,
    adoptionRatePct: null,
    usageMetric: null,
    usageActual: null,
    towerClaimAllowed: "blocked",
    decisionRationale: "Run-and-sustain; no AI value promised",
    requiredGates: [],
    caveat: "The largest run line. No AI benefit is promised here.",
  },
];

function lane(seed: (typeof LANES)[number], i: number): TowerMartProgramLane {
  return {
    laneKey: `fixture::lane::${seed.programCode}`,
    programCode: seed.programCode,
    programName: seed.programName ?? `Program ${i}`,
    ownerRole: seed.ownerRole ?? null,
    financeOwnerRole: "CFO",
    decisionLane: seed.decisionLane ?? "fix",
    decisionRationale: seed.decisionRationale ?? "",
    approvedFundingUsd: seed.approvedFundingUsd ?? 0,
    aiTaggedSpendUsd: (seed.approvedFundingUsd ?? 0) * 0.15,
    promisedValueUsd: seed.promisedValueUsd ?? 0,
    financeValidatedValueUsd: seed.financeValidatedValueUsd ?? 0,
    usageMetric: seed.usageMetric ?? null,
    usageActual: seed.usageActual ?? null,
    adoptionRatePct: seed.adoptionRatePct ?? null,
    valueClaimStatus: "blocked",
    towerClaimAllowed: seed.towerClaimAllowed ?? "blocked",
    requiredGates: seed.requiredGates ?? [],
    caveat: seed.caveat ?? "",
    sourceFile: "SA08_ai-benefits-realization-usage.csv",
    sourceRow: `row-${i + 1}`,
  };
}

const AI_SEEDS: ReadonlyArray<{
  name: string;
  kind: string;
  spendType: string;
  category: string;
  vendor: string;
  system: string;
  value: number;
  readiness: number;
  spendUsd: number;
  adoption: number | null;
  usageMetric: string | null;
  usageActual: number | null;
  caveat: string;
}> = [
  {
    name: "Fraud Graph Analytics v2",
    kind: "funded_program",
    spendType: "funded",
    category: "data_ai_platform",
    vendor: "Vendor A",
    system: "Fraud platform",
    value: 92,
    readiness: 80,
    spendUsd: 7.3 * M,
    adoption: 96,
    usageMetric: "alerts_scored",
    usageActual: 1_200_000,
    caveat: "Blocked only on Finance attestation of the avoidance number.",
  },
  {
    name: "Workplace Copilot",
    kind: "funded_program",
    spendType: "funded",
    category: "copilot",
    vendor: "Vendor B",
    system: "Productivity suite",
    value: 64,
    readiness: 40,
    spendUsd: 3.8 * M,
    adoption: 44,
    usageMetric: "active_seats",
    usageActual: 1840,
    caveat:
      "Funded and paid for, but seats are idle and two functions are frozen.",
  },
  {
    name: "Developer Copilot",
    kind: "embedded_platform",
    spendType: "embedded",
    category: "copilot",
    vendor: "Vendor C",
    system: "Dev toolchain",
    value: 58,
    readiness: 78,
    spendUsd: 1.1 * M,
    adoption: 92,
    usageMetric: "engineers_active",
    usageActual: 590,
    caveat: "Value is real but not yet finance-attributed.",
  },
  {
    name: "ITSM AI Agents",
    kind: "embedded_platform",
    spendType: "embedded",
    category: "itsm_ai",
    vendor: "Vendor D",
    system: "ITSM",
    value: 52,
    readiness: 60,
    spendUsd: 2.2 * M,
    adoption: 62,
    usageMetric: "tickets_deflected",
    usageActual: 31_000,
    caveat: "Should be brought into the value scope, not treated as new spend.",
  },
  {
    name: "HCM / ERP Assist",
    kind: "embedded_platform",
    spendType: "embedded",
    category: "hcm_erp_ai",
    vendor: "Vendor E",
    system: "HCM / ERP",
    value: 49,
    readiness: 55,
    spendUsd: 6.2 * M,
    adoption: 68,
    usageMetric: "hr_queries_deflected",
    usageActual: 34_000,
    caveat:
      "Invisible to the value model because it is unattributed embedded spend.",
  },
  {
    name: "AML Case Triage",
    kind: "funded_program",
    spendType: "funded",
    category: "data_ai_platform",
    vendor: "Vendor F",
    system: "AML",
    value: 60,
    readiness: 34,
    spendUsd: 8.9 * M,
    adoption: 24,
    usageMetric: "cases_auto_triaged",
    usageActual: 4_800,
    caveat: "High promised value but blocked behind overdue model validations.",
  },
  {
    name: "Data Lineage & Governance",
    kind: "funded_program",
    spendType: "governance",
    category: "governance",
    vendor: "Vendor G",
    system: "Data governance",
    value: 38,
    readiness: 46,
    spendUsd: 2.6 * M,
    adoption: 58,
    usageMetric: "assets_with_lineage",
    usageActual: 5_800,
    caveat:
      "The control that unblocks scaling customer AI. Currently deficient.",
  },
  {
    name: "Cloud AI Services",
    kind: "usage_benefit",
    spendType: "platform",
    category: "cloud_ai",
    vendor: "Vendor H",
    system: "Cloud",
    value: 34,
    readiness: 52,
    spendUsd: 14.8 * M,
    adoption: null,
    usageMetric: "projects_using",
    usageActual: 14,
    caveat:
      "Spread across teams with no portfolio-level chargeback or value line.",
  },
];

const CANDIDATE_SEEDS: ReadonlyArray<{ name: string; reason: string }> = [
  {
    name: "Contact-Centre Sentiment",
    reason: "No KPI defined · pilot stalled",
  },
  { name: "Branch Queue Vision", reason: "Failed value gate · $0 claimable" },
  { name: "Commercial Credit Memo AI", reason: "Candidate — not funded" },
  { name: "Document Intelligence", reason: "Candidate — early, low usage" },
  {
    name: "Marketing Content Assist",
    reason: "Candidate — governance review pending",
  },
];

/**
 * Adoption targets and supported-case counts, by seed name. Deliberately partial: two rollouts
 * assert no target, so the fixture exercises both the "below their own target" headline and the
 * "targets are not loaded" one. Before these fields existed the panel hardcoded the count to zero
 * and only the second branch could ever render, whatever the data held.
 */
const ROLLOUT_ASSERTIONS: Readonly<
  Record<
    string,
    {
      target: number | null;
      cases: number | null;
      /** `null` with `reviewed: true` is a rollout checked and found clear. */
      blocker?: string | null;
      reviewed?: boolean;
    }
  >
> = {
  "Fraud Graph Analytics v2": { target: 90, cases: 4, blocker: "SOX evidence", reviewed: true },
  "Workplace Copilot": { target: 75, cases: 6, blocker: "DLP policy", reviewed: true },
  // Reviewed and clear — must render as clear, never as red and never as unknown.
  "Developer Copilot": { target: 85, cases: 2, blocker: null, reviewed: true },
  "ITSM AI Agents": { target: 70, cases: 3, blocker: "workflow telemetry", reviewed: true },
  "HCM / ERP Assist": { target: 60, cases: null, blocker: null, reviewed: true },
  "AML Case Triage": { target: 80, cases: 1, blocker: "clinical safety review", reviewed: true },
  // Asserts no target and was never reviewed — the two honest-absence paths.
  "Data Lineage & Governance": { target: null, cases: null, blocker: null, reviewed: false },
  "Cloud AI Services": { target: null, cases: 2, blocker: null, reviewed: false },
};

function aiItems(): TowerMartAiPortfolioItem[] {
  const funded: TowerMartAiPortfolioItem[] = AI_SEEDS.map((seed, i) => ({
    aiPortfolioKey: `fixture::ai::${i + 1}`,
    itemName: seed.name,
    itemKind: seed.kind,
    vendorName: seed.vendor,
    systemName: seed.system,
    aiSpendType: seed.spendType,
    aiSpendCategory: seed.category,
    fundingStatus: "approved",
    decisionLane: "fix",
    approvedFundingUsd: seed.spendUsd,
    aiTaggedSpendUsd: seed.spendUsd,
    promisedValueUsd: seed.spendUsd * 0.4,
    financeValidatedValueUsd: 0,
    usageMetric: seed.usageMetric,
    usageActual: seed.usageActual,
    adoptionRatePct: seed.adoption,
    adoptionTargetPct: ROLLOUT_ASSERTIONS[seed.name]?.target ?? null,
    controlBlocker: ROLLOUT_ASSERTIONS[seed.name]?.blocker ?? null,
    controlBlockerReviewed: ROLLOUT_ASSERTIONS[seed.name]?.reviewed ?? false,
    linkedBusinessCaseCount: ROLLOUT_ASSERTIONS[seed.name]?.cases ?? null,
    valueScore: seed.value,
    readinessScore: seed.readiness,
    riskScore: 100 - seed.readiness,
    duplicateRisk: null,
    valueClaimStatus: "blocked",
    towerClaimAllowed: "partial",
    caveat: seed.caveat,
    sourceFile: "10_ai-automation-use-cases.csv",
    sourceRow: `ai-${i + 1}`,
  }));

  const candidates: TowerMartAiPortfolioItem[] = CANDIDATE_SEEDS.map(
    (seed, i) => ({
      ...funded[0],
      aiPortfolioKey: `fixture::ai::cand-${i + 1}`,
      itemName: seed.name,
      itemKind: "candidate_opportunity",
      aiSpendType: "candidate",
      fundingStatus: "not_funded",
      aiTaggedSpendUsd: 0,
      approvedFundingUsd: 0,
      promisedValueUsd: 0,
      valueScore: 30,
      readinessScore: 20,
      usageMetric: null,
      usageActual: null,
      adoptionRatePct: null,
      // A candidate has no rollout, so it asserts neither. The spread from funded[0] would
      // otherwise hand it that rollout's target and case count.
      adoptionTargetPct: null,
      linkedBusinessCaseCount: null,
      controlBlocker: null,
      controlBlockerReviewed: false,
      caveat: seed.reason,
    }),
  );

  return [...funded, ...candidates];
}

const GAP_SEEDS: ReadonlyArray<{
  laneCode: string;
  field: string;
  severity: string;
  owner: string | null;
  remediation: string;
  blocking: boolean;
}> = [
  {
    laneCode: "P3",
    field: "finance_validated_value_usd",
    severity: "high",
    owner: "CFO",
    remediation:
      "Finance must validate the avoidance counterfactual before any of it can be booked.",
    blocking: true,
  },
  {
    laneCode: "P9",
    field: "usage_actual",
    severity: "high",
    owner: "CIO",
    remediation:
      "Seat-level usage must be tied to a benefit metric; paid seats show no measured outcome.",
    blocking: true,
  },
  {
    laneCode: "P6",
    field: "value_attribution_method",
    severity: "medium",
    owner: "CDAO",
    remediation:
      "Embedded vendor AI deflection must be attributed into the value model.",
    blocking: false,
  },
  {
    laneCode: "P8",
    field: "control_clearance",
    severity: "high",
    owner: "CDAO",
    remediation:
      "The data-lineage control finding must be remediated before customer AI can scale.",
    blocking: true,
  },
  {
    laneCode: "P3",
    field: "model_validation_status",
    severity: "high",
    owner: null,
    remediation:
      "Tier-1 model validations are overdue and gate the triage value.",
    blocking: true,
  },
  {
    laneCode: "P10",
    field: "supervision_coverage",
    severity: "medium",
    owner: "SVP Wealth Tech",
    remediation:
      "Supervision coverage for advisor AI is unresolved, so no value is claimable.",
    blocking: false,
  },
];

function gaps(): TowerMartRequiredFieldGap[] {
  return GAP_SEEDS.map((seed, i) => ({
    gapKey: `fixture::gap::${i + 1}`,
    martTable: "mart_program_decision_lanes",
    martRecordKey: `fixture::lane::${seed.laneCode}`,
    requiredField: seed.field,
    sourceTemplate: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
    sourceRecordId: `r-${i + 1}`,
    severity: seed.severity,
    ownerHint: seed.owner,
    remediationAction: seed.remediation,
    blocking: seed.blocking,
  }));
}

const ACTION_SEEDS: ReadonlyArray<{
  lane: string;
  owner: string;
  title: string;
  body: string;
}> = [
  {
    lane: "freeze",
    owner: "CFO",
    title: "Attest the avoidance method — or freeze the claim.",
    body: "The largest promised value is measured by the model team and unattested by Finance. Until it is signed, nothing is claimable.",
  },
  {
    lane: "fix",
    owner: "CFO",
    title: "Stand up a value-attribution model for embedded AI.",
    body: "Embedded AI is delivering deflection value that never reaches the value line.",
  },
  {
    lane: "fix",
    owner: "CIO",
    title: "Clear the policy review freezing Workplace Copilot.",
    body: "The highest-value Copilot use is frozen. Clearing it converts paid-for, unused seats into measured benefit with no new spend.",
  },
  {
    lane: "freeze",
    owner: "CIO",
    title: "Freeze Payments AI expansion until adoption moves.",
    body: "Adoption is 2% against a 35% target. Funding is well ahead of the value it depends on.",
  },
  {
    lane: "fix",
    owner: "CDAO",
    title: "Remediate the data-lineage control finding.",
    body: "A deficient lineage control is the gate on scaling any customer-facing AI.",
  },
  {
    lane: "fund",
    owner: "CDAO",
    title: "Bring embedded vendor AI into the portfolio view.",
    body: "These are not new spend — they are delivering value invisibly.",
  },
  {
    lane: "fix",
    owner: "Model Risk Office",
    title: "Approve a validation sprint for the overdue Tier-1 models.",
    body: "Overdue validations gate the triage value and carry control risk.",
  },
  {
    lane: "stop",
    owner: "Business owners",
    title: "Stop three AI initiatives with no verified value.",
    body: "Three initiatives have failed gates or no KPI and zero verified value.",
  },
  {
    lane: "fund",
    owner: "Procurement",
    title: "Meter and consolidate cloud AI consumption.",
    body: "Cloud AI is the largest AI line and runs without a portfolio view or chargeback.",
  },
];

function actions(): TowerMartCxoAction[] {
  return ACTION_SEEDS.map((seed, i) => ({
    actionKey: `fixture::action::${i + 1}`,
    sequence: i + 1,
    actionLane: seed.lane,
    title: seed.title,
    actionBody: seed.body,
    ownerHint: seed.owner,
    moduleHandoff: "Strategic Moves",
  }));
}

function lineage(): TowerMartEvidenceLineage[] {
  return [
    {
      lineageKey: "fixture::ev::1",
      surfaceSection: "value_funnel",
      displayedFact: "Promised value FY26",
      displayedValueText: "$35.5M",
      displayedValueNumeric: 35.5 * M,
      sourceFile: "08_it_budget_spend_value.csv",
      sourceRow: "row-12",
      sourceSystem: "finance",
      lineageState: "ONE_SOURCE",
      sourceCount: 1,
      resolutionOwnerRole: "Business owner",
      caveat: "",
    },
    {
      lineageKey: "fixture::ev::2",
      surfaceSection: "command_center",
      displayedFact: "FY26 IT budget",
      displayedValueText: "$650.0M",
      displayedValueNumeric: 650 * M,
      sourceFile: "08_it_budget_spend_value.csv",
      sourceRow: "row-1",
      sourceSystem: "finance",
      lineageState: "ONE_SOURCE",
      sourceCount: 1,
      resolutionOwnerRole: "FP&A",
      caveat: "",
    },
    {
      lineageKey: "fixture::ev::3",
      surfaceSection: "ai_portfolio",
      displayedFact: "AI-tagged spend",
      displayedValueText: "$53.7M",
      displayedValueNumeric: 53.7 * M,
      sourceFile: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
      sourceRow: "row-4",
      sourceSystem: "finance",
      lineageState: "ONE_SOURCE",
      sourceCount: 1,
      resolutionOwnerRole: "IT Finance",
      caveat: "Non-additive lens on the funded base.",
    },
    {
      lineageKey: "fixture::ev::4",
      surfaceSection: "value_funnel",
      displayedFact: "Finance-validated (partial)",
      displayedValueText: "$3.8M",
      displayedValueNumeric: 3.8 * M,
      sourceFile: "14_metrics-outcomes.csv",
      sourceRow: "row-7",
      sourceSystem: "finance",
      lineageState: "AGREE",
      sourceCount: 2,
      resolutionOwnerRole: "Finance",
      caveat: "Only partially validated by finance.",
    },
  ];
}

function valueTrajectory(): TowerMartValueTrajectoryPoint[] {
  const start = new Date("2026-01-01T00:00:00.000Z");
  return Array.from({ length: 8 }, (_, i) => {
    const periodStart = new Date(start);
    periodStart.setUTCMonth(start.getUTCMonth() + i * 3);
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMonth(periodStart.getUTCMonth() + 3);
    periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);
    const quarter = `${periodStart.getUTCFullYear()}-Q${
      Math.floor(periodStart.getUTCMonth() / 3) + 1
    }`;
    return {
      tenantKey: "fixture-tenant",
      valueCaseId: "fixture-value-case",
      programId: "P3",
      initiativeId: "P3",
      valueCaseName: "Fixture value case",
      valueArchetype: "risk_loss_avoidance",
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      fiscalQuarter: quarter,
      scenario: "forecast",
      plannedInvestmentUsd: (600 * M) / 8,
      actualSpendUsd: i < 2 ? (53.7 * M) / 2 : null,
      remainingCommitmentUsd: Math.max(0, 600 * M - 53.7 * M) / 8,
      businessCaseValueUsd: (35.5 * M) / 8,
      businessCaseBenefitUsd: (35.5 * M) / 8,
      riskAdjustedForecastUsd: ((18 + i * 1.8) * M) / 8,
      financeValidatedRunRateUsd: (3.8 * M) / 8,
      realizedPAndLUsd: null,
      realizedCashUsd: null,
      forecastAtCompletionUsd: 35.5 * M,
      financialConversionUsd: null,
      usageEvidenceState: "present",
      operationalOutcomeEvidenceState: "missing",
      financeAttestationState: "missing",
      sourceTrustState: "ONE_SOURCE",
      claimState: "evidence_gap",
      datasetVersion: "fixture-dataset",
      sourceRunId: "fixture-run",
      sourceRefs: [{ view: "consumption.tower_value_trajectory_v1" }],
      economicClassification: "risk_loss_avoidance",
      boardScopeState: "board_portfolio",
      materialScopeState: "material",
      sourceCount: 1,
    };
  });
}

/** The full fixture, in mart shape. Feed to `buildTowerCommandCenterView()`. */
export function designFixtureMart(): TowerMartCommandViewModel {
  return {
    generatedFrom: "tower_schema",
    headline: "Tower fixture",
    command: {
      commandCenterKey: "fixture::cc",
      tenantKey: "fixture-tenant",
      tenantName: "Fixture Tenant",
      martVersion: "fixture-v1",
      sourceStandard: "fixture-standard",
      formulaVersion: "fixture-f1",
      totalItBudgetFy26: 650 * M,
      runBudgetFy26: 442 * M,
      changeBudgetFy26: 208 * M,
      approvedProgramBudgetFy26: 600 * M,
      aiTaggedSpendFy26NonAdditive: 53.7 * M,
      promisedValueFy26: 35.5 * M,
      partialFinanceValidatedValueYtd: 3.8 * M,
      realizedValueYtdAllowed: 0,
      candidateAiOpportunities: 5,
      watchPressureSignals: 2,
      runRatio: 0.68,
      changeRatio: 0.32,
      financeValidationRatio: 0.107,
      decisionQuestion: "Funded ahead of proof. Value is the constraint.",
      executiveSummary:
        "Nothing is claimable today; the constraint is value proof, not spend visibility.",
      sourceFiles: [
        "08_it_budget_spend_value.csv",
        "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
      ],
    },
    valueFunnel: [
      {
        funnelKey: "f1",
        sequence: 1,
        stageKey: "approved_funding",
        stageLabel: "Approved funding",
        valueNumeric: 600 * M,
        denominatorStageKey: null,
        conversionRatio: null,
        claimStatus: "funded",
        caveat: "",
        sourceFile: null,
        sourceRow: null,
      },
      {
        funnelKey: "f2",
        sequence: 2,
        stageKey: "ai_tagged_spend",
        stageLabel: "AI-tagged spend",
        valueNumeric: 53.7 * M,
        denominatorStageKey: "approved_funding",
        conversionRatio: null,
        claimStatus: "spending",
        caveat: "Non-additive lens on the funded base.",
        sourceFile: null,
        sourceRow: null,
      },
      {
        funnelKey: "f3",
        sequence: 3,
        stageKey: "promised_value",
        stageLabel: "Promised value",
        valueNumeric: 35.5 * M,
        denominatorStageKey: "approved_funding",
        conversionRatio: null,
        claimStatus: "promised",
        caveat: "Business-case value, not yet evidenced.",
        sourceFile: null,
        sourceRow: null,
      },
      {
        funnelKey: "f4",
        sequence: 4,
        stageKey: "finance_validated",
        stageLabel: "Finance-validated (partial)",
        valueNumeric: 3.8 * M,
        denominatorStageKey: "promised_value",
        conversionRatio: null,
        claimStatus: "partial",
        caveat: "Only partially validated by finance.",
        sourceFile: null,
        sourceRow: null,
      },
      {
        funnelKey: "f5",
        sequence: 5,
        stageKey: "realized_claimable",
        stageLabel: "Claimable value allowed",
        valueNumeric: 0,
        denominatorStageKey: "finance_validated",
        conversionRatio: null,
        claimStatus: "blocked",
        caveat: "Not claimable until validation completes.",
        sourceFile: null,
        sourceRow: null,
      },
    ],
    valueTrajectory: valueTrajectory(),
    programLanes: LANES.map(lane),
    aiPortfolio: aiItems(),
    cxoActions: actions(),
    evidenceLineage: lineage(),
    requiredFieldGaps: gaps(),
  };
}
