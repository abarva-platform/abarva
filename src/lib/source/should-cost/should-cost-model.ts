// Should-cost and role-mix model v1 (Slice 1.3).
//
// A deterministic should-cost estimator for the Source sourcing expert. It
// gives real economics — what a deal *should* cost once the whole TCO iceberg
// is modelled — rather than a vendor-quote comparison.
//
// Per SOURCE-SOURCING-METHODOLOGY.md §5 ("The TCO iceberg"), the quoted
// license/subscription is typically only 20–35% of true cost. This module
// models the visible layer plus the seven hidden layers and returns a cost
// RANGE with the iceberg itemised — never a single number.
//
// Pure module: no model calls, no network calls, no tenant data, no DB.
// Standalone — NOT wired into source-answer-engine.ts (separate follow-up).

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** Standard delivery roles used for the role-mix blended-rate calculation. */
export type ShouldCostRole =
  | 'engagement_partner'
  | 'engagement_lead'
  | 'program_manager'
  | 'project_manager'
  | 'product_owner'
  | 'solution_architect'
  | 'enterprise_architect'
  | 'security_architect'
  | 'cloud_platform_architect'
  | 'devops_sre_lead'
  | 'data_architect'
  | 'ai_ml_lead'
  | 'governance_risk_lead'
  | 'domain_sme'
  | 'senior_engineer'
  | 'engineer'
  | 'data_engineer'
  | 'integration_engineer'
  | 'qa_eval_lead'
  | 'business_analyst'
  | 'process_lead'
  | 'change_lead'
  | 'training_lead'
  | 'analyst';

export const SHOULD_COST_ROLES: ShouldCostRole[] = [
  'engagement_partner',
  'engagement_lead',
  'program_manager',
  'project_manager',
  'product_owner',
  'solution_architect',
  'enterprise_architect',
  'security_architect',
  'cloud_platform_architect',
  'devops_sre_lead',
  'data_architect',
  'ai_ml_lead',
  'governance_risk_lead',
  'domain_sme',
  'senior_engineer',
  'engineer',
  'data_engineer',
  'integration_engineer',
  'qa_eval_lead',
  'business_analyst',
  'process_lead',
  'change_lead',
  'training_lead',
  'analyst',
];

export type EnterpriseRateCardDomain =
  | 'strategy_advisory'
  | 'program_pmo'
  | 'product_management'
  | 'enterprise_architecture'
  | 'solution_architecture'
  | 'security_risk'
  | 'cloud_platform'
  | 'data_architecture'
  | 'data_engineering'
  | 'ai_ml'
  | 'governance_compliance'
  | 'domain_sme'
  | 'application_engineering'
  | 'integration'
  | 'qa_evaluation'
  | 'business_analysis'
  | 'process_redesign'
  | 'change_management'
  | 'training_enablement'
  | 'run_operations';

export const ENTERPRISE_RATE_CARD_DOMAINS: EnterpriseRateCardDomain[] = [
  'strategy_advisory',
  'program_pmo',
  'product_management',
  'enterprise_architecture',
  'solution_architecture',
  'security_risk',
  'cloud_platform',
  'data_architecture',
  'data_engineering',
  'ai_ml',
  'governance_compliance',
  'domain_sme',
  'application_engineering',
  'integration',
  'qa_evaluation',
  'business_analysis',
  'process_redesign',
  'change_management',
  'training_enablement',
  'run_operations',
];

export const ROLE_TO_ENTERPRISE_DOMAIN: Record<
  ShouldCostRole,
  EnterpriseRateCardDomain
> = {
  engagement_partner: 'strategy_advisory',
  engagement_lead: 'strategy_advisory',
  program_manager: 'program_pmo',
  project_manager: 'program_pmo',
  product_owner: 'product_management',
  solution_architect: 'solution_architecture',
  enterprise_architect: 'enterprise_architecture',
  security_architect: 'security_risk',
  cloud_platform_architect: 'cloud_platform',
  devops_sre_lead: 'cloud_platform',
  data_architect: 'data_architecture',
  ai_ml_lead: 'ai_ml',
  governance_risk_lead: 'governance_compliance',
  domain_sme: 'domain_sme',
  senior_engineer: 'application_engineering',
  engineer: 'application_engineering',
  data_engineer: 'data_engineering',
  integration_engineer: 'integration',
  qa_eval_lead: 'qa_evaluation',
  business_analyst: 'business_analysis',
  process_lead: 'process_redesign',
  change_lead: 'change_management',
  training_lead: 'training_enablement',
  analyst: 'run_operations',
};

/** A single role line in the proposed delivery role mix. */
export interface RoleMixEntry {
  role: ShouldCostRole;
  /** Number of full-time-equivalent people in this role. */
  headcount: number;
  /**
   * Fraction (0..1) of this role's headcount delivered offshore. The
   * remainder is treated as onshore. Defaults to the engagement-level
   * `offshoreRatio` when omitted.
   */
  offshoreRatio?: number;
}

/** Fully-loaded annual cost rates per role, split by delivery location. */
export interface RoleRateCard {
  role: ShouldCostRole;
  /** Fully-loaded annual cost of one onshore FTE in this role. */
  onshoreAnnualRate: number;
  /** Fully-loaded annual cost of one offshore FTE in this role. */
  offshoreAnnualRate: number;
}

/** Cloud and AI-model consumption inputs (the §5 "consumption/scaling" layer). */
export interface ConsumptionInputs {
  /** Monthly cloud infrastructure run-rate (compute, storage, network). */
  monthlyCloudCost: number;
  /** Monthly AI model / token usage run-rate. Zero for non-AI deals. */
  monthlyModelCost: number;
  /**
   * Upside multiplier applied to consumption in the high estimate to capture
   * token/usage pricing volatility. Defaults to 1.6 (a 60% overrun ceiling).
   */
  highScalingMultiplier?: number;
}

export interface ShouldCostModelInput {
  /** Free-text identifier for the deal/option being modelled. */
  estimateLabel: string;
  /** Vendor's quoted figure — the visible license/subscription layer. */
  vendorQuotedCost: number;
  /** Vendor's stated or assumed margin as a fraction (0..1) of its quote. */
  vendorMarginRatio: number;
  /** Proposed delivery role mix. */
  roleMix: RoleMixEntry[];
  /** Fully-loaded rate card covering every role used in `roleMix`. */
  rateCard: RoleRateCard[];
  /** Engagement duration in months. */
  durationMonths: number;
  /**
   * Engagement-level default offshore fraction (0..1), used for any
   * `RoleMixEntry` that omits its own `offshoreRatio`.
   */
  offshoreRatio: number;
  /** One-time transition / onboarding cost (knowledge transfer, ramp). */
  transitionCost: number;
  /** Cloud and AI-model consumption inputs. */
  consumption: ConsumptionInputs;
  /**
   * Optional overrides for hidden-layer drivers, each expressed as a fraction
   * of the implementation labour base. Sensible defaults are applied per §5.
   */
  hiddenLayerDrivers?: Partial<HiddenLayerDrivers>;
}

/**
 * Hidden-layer drivers — each is a fraction of the implementation labour base
 * (the blended delivery cost over the engagement). Defaults encode the typical
 * §5 iceberg shape where the quote is only 20–35% of true cost.
 */
export interface HiddenLayerDrivers {
  /** Integration to existing `it_landscape` connectors. */
  integration: number;
  /** Data migration & cleanup — driven by state of customer data. */
  dataMigration: number;
  /** Change management & training — driven by org size / adoption difficulty. */
  changeManagement: number;
  /** Ongoing operations & support — run-rate FTE, support tier (per year). */
  operationsPerYear: number;
  /** Exit & transition — data export, re-platforming, dual-run. */
  exit: number;
}

export const DEFAULT_HIDDEN_LAYER_DRIVERS: HiddenLayerDrivers = {
  integration: 0.35,
  dataMigration: 0.25,
  changeManagement: 0.3,
  operationsPerYear: 0.18,
  exit: 0.12,
};

/** Upside fraction applied to hidden layers to produce the high estimate. */
const DEFAULT_HIGH_LAYER_UPSIDE = 0.35;
const DEFAULT_HIGH_SCALING_MULTIPLIER = 1.6;

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

/** Identifier for each modelled cost layer. */
export type IcebergLayerId =
  | 'license_subscription'
  | 'implementation'
  | 'integration'
  | 'data_migration'
  | 'change_management'
  | 'operations'
  | 'consumption_scaling'
  | 'exit_transition';

/** One itemised layer of the TCO iceberg, expressed as a low–high range. */
export interface IcebergLayer {
  layer: IcebergLayerId;
  label: string;
  visible: boolean;
  low: number;
  high: number;
  /** Midpoint of the layer range, rounded. */
  point: number;
  /** Short human-readable note on how the layer was derived. */
  basis: string;
}

/** Role-mix economics — blended rates and on/offshore split. */
export interface RoleMixSummary {
  totalHeadcount: number;
  /** Headcount-weighted blended annual rate across the whole mix. */
  blendedAnnualRate: number;
  /** Fraction (0..1) of total headcount delivered offshore. */
  effectiveOffshoreRatio: number;
  /** Total fully-loaded labour cost over the engagement duration. */
  implementationLabourBase: number;
  perRole: Array<{
    role: ShouldCostRole;
    headcount: number;
    offshoreRatio: number;
    blendedAnnualRate: number;
    engagementCost: number;
  }>;
}

export interface ShouldCostEstimate {
  estimateLabel: string;
  modelVersion: '1.0';
  /** Vendor's quoted figure, echoed for the should-cost-vs-quote framing. */
  vendorQuotedCost: number;
  roleMix: RoleMixSummary;
  /** The itemised iceberg — visible layer plus the seven hidden layers. */
  icebergLayers: IcebergLayer[];
  /** Total TCO range across all layers. */
  totalLow: number;
  totalHigh: number;
  /** Midpoint of the total range. */
  totalPoint: number;
  /**
   * Fraction (0..1) of the should-cost midpoint that is visible (the quote).
   * Per §5 this is typically 0.20–0.35.
   */
  visibleShareOfTotal: number;
  /**
   * The should-cost-vs-quote headline the expert can repeat verbatim, e.g.
   * "the vendor quoted $X; should-cost is $Y–$Z once the iceberg is modelled."
   */
  headline: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const round = (n: number): number => Math.round(n * 100) / 100;

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const ICEBERG_LABELS: Record<IcebergLayerId, string> = {
  license_subscription: 'License / subscription',
  implementation: 'Implementation & configuration',
  integration: 'Integration',
  data_migration: 'Data migration & cleanup',
  change_management: 'Change management & training',
  operations: 'Ongoing operations & support',
  consumption_scaling: 'Consumption / scaling cost',
  exit_transition: 'Exit & transition',
};

function blendedRoleRate(
  rate: RoleRateCard,
  offshoreRatio: number,
): number {
  const r = clamp01(offshoreRatio);
  return rate.onshoreAnnualRate * (1 - r) + rate.offshoreAnnualRate * r;
}

function formatRange(low: number, high: number): string {
  const fmt = (n: number): string =>
    `$${Math.round(n).toLocaleString('en-US')}`;
  return `${fmt(low)}–${fmt(high)}`;
}

// ---------------------------------------------------------------------------
// Estimator
// ---------------------------------------------------------------------------

/**
 * Build a deterministic should-cost estimate. Given the same input this always
 * returns the same output — no randomness, no clock, no I/O.
 *
 * @throws if the input is structurally invalid (negative duration, a role-mix
 *   entry with no matching rate card, etc.).
 */
export function buildShouldCostEstimate(
  input: ShouldCostModelInput,
): ShouldCostEstimate {
  if (input.durationMonths <= 0) {
    throw new Error('durationMonths must be positive');
  }
  if (input.vendorQuotedCost < 0) {
    throw new Error('vendorQuotedCost must not be negative');
  }

  const drivers: HiddenLayerDrivers = {
    ...DEFAULT_HIDDEN_LAYER_DRIVERS,
    ...(input.hiddenLayerDrivers ?? {}),
  };
  const years = input.durationMonths / 12;

  // --- Role mix → implementation labour base --------------------------------
  const rateByRole = new Map<ShouldCostRole, RoleRateCard>(
    input.rateCard.map((r) => [r.role, r]),
  );

  const perRole = input.roleMix.map((entry) => {
    const rate = rateByRole.get(entry.role);
    if (!rate) {
      throw new Error(`No rate card entry for role: ${entry.role}`);
    }
    if (entry.headcount < 0) {
      throw new Error(`headcount must not be negative for role: ${entry.role}`);
    }
    const offshoreRatio = clamp01(entry.offshoreRatio ?? input.offshoreRatio);
    const blended = blendedRoleRate(rate, offshoreRatio);
    return {
      role: entry.role,
      headcount: entry.headcount,
      offshoreRatio,
      blendedAnnualRate: round(blended),
      engagementCost: round(blended * entry.headcount * years),
    };
  });

  const totalHeadcount = perRole.reduce((s, r) => s + r.headcount, 0);
  const implementationLabourBase = round(
    perRole.reduce((s, r) => s + r.engagementCost, 0),
  );
  const weightedAnnualRate = perRole.reduce(
    (s, r) => s + r.blendedAnnualRate * r.headcount,
    0,
  );
  const blendedAnnualRate =
    totalHeadcount > 0 ? round(weightedAnnualRate / totalHeadcount) : 0;
  const offshoreHeadcount = perRole.reduce(
    (s, r) => s + r.headcount * r.offshoreRatio,
    0,
  );
  const effectiveOffshoreRatio =
    totalHeadcount > 0 ? round(offshoreHeadcount / totalHeadcount) : 0;

  const roleMix: RoleMixSummary = {
    totalHeadcount,
    blendedAnnualRate,
    effectiveOffshoreRatio,
    implementationLabourBase,
    perRole,
  };

  // --- Iceberg layers -------------------------------------------------------
  const labourBase = implementationLabourBase;
  const highUpside = 1 + DEFAULT_HIGH_LAYER_UPSIDE;
  const scalingMultiplier =
    input.consumption.highScalingMultiplier ?? DEFAULT_HIGH_SCALING_MULTIPLIER;

  // Visible layer: the vendor quote net of stated margin gives the low
  // (the underlying delivery cost the vendor should bear); the quote itself
  // is the high (what the customer is actually asked to pay).
  const marginRatio = clamp01(input.vendorMarginRatio);
  const licenseLow = round(input.vendorQuotedCost * (1 - marginRatio));
  const licenseHigh = round(input.vendorQuotedCost);

  // Implementation: the role-mix labour base, plus the one-time transition
  // cost which is part of standing the engagement up.
  const implLow = round(labourBase + input.transitionCost);
  const implHigh = round((labourBase + input.transitionCost) * highUpside);

  const layerFromDriver = (
    id: IcebergLayerId,
    driver: number,
    basis: string,
  ): IcebergLayer => {
    const low = round(labourBase * driver);
    const high = round(labourBase * driver * highUpside);
    return {
      layer: id,
      label: ICEBERG_LABELS[id],
      visible: false,
      low,
      high,
      point: round((low + high) / 2),
      basis,
    };
  };

  const operationsAnnual = labourBase * drivers.operationsPerYear;
  const operationsLow = round(operationsAnnual * years);
  const operationsHigh = round(operationsAnnual * years * highUpside);

  const consumptionMonthly =
    input.consumption.monthlyCloudCost + input.consumption.monthlyModelCost;
  const consumptionLow = round(consumptionMonthly * input.durationMonths);
  const consumptionHigh = round(
    consumptionMonthly * input.durationMonths * scalingMultiplier,
  );

  const icebergLayers: IcebergLayer[] = [
    {
      layer: 'license_subscription',
      label: ICEBERG_LABELS.license_subscription,
      visible: true,
      low: licenseLow,
      high: licenseHigh,
      point: round((licenseLow + licenseHigh) / 2),
      basis: `Vendor quote ${formatRange(licenseLow, licenseHigh)}; low is net of ${Math.round(marginRatio * 100)}% stated margin.`,
    },
    {
      layer: 'implementation',
      label: ICEBERG_LABELS.implementation,
      visible: false,
      low: implLow,
      high: implHigh,
      point: round((implLow + implHigh) / 2),
      basis: `Role-mix labour base ${formatRange(labourBase, labourBase)} over ${input.durationMonths} months plus $${Math.round(input.transitionCost).toLocaleString('en-US')} transition.`,
    },
    layerFromDriver(
      'integration',
      drivers.integration,
      `Connectors to existing it_landscape — ${Math.round(drivers.integration * 100)}% of labour base.`,
    ),
    layerFromDriver(
      'data_migration',
      drivers.dataMigration,
      `Data migration & cleanup — ${Math.round(drivers.dataMigration * 100)}% of labour base.`,
    ),
    layerFromDriver(
      'change_management',
      drivers.changeManagement,
      `Change management & training — ${Math.round(drivers.changeManagement * 100)}% of labour base.`,
    ),
    {
      layer: 'operations',
      label: ICEBERG_LABELS.operations,
      visible: false,
      low: operationsLow,
      high: operationsHigh,
      point: round((operationsLow + operationsHigh) / 2),
      basis: `Run-rate ops & support at ${Math.round(drivers.operationsPerYear * 100)}% of labour base per year over ${round(years)} year(s).`,
    },
    {
      layer: 'consumption_scaling',
      label: ICEBERG_LABELS.consumption_scaling,
      visible: false,
      low: consumptionLow,
      high: consumptionHigh,
      point: round((consumptionLow + consumptionHigh) / 2),
      basis: `Cloud + model run-rate $${Math.round(consumptionMonthly).toLocaleString('en-US')}/mo over ${input.durationMonths} months; high applies ${scalingMultiplier}x usage-volatility ceiling.`,
    },
    layerFromDriver(
      'exit_transition',
      drivers.exit,
      `Data export, re-platforming, dual-run — ${Math.round(drivers.exit * 100)}% of labour base.`,
    ),
  ];

  // --- Totals ---------------------------------------------------------------
  const totalLow = round(icebergLayers.reduce((s, l) => s + l.low, 0));
  const totalHigh = round(icebergLayers.reduce((s, l) => s + l.high, 0));
  const totalPoint = round((totalLow + totalHigh) / 2);

  const visibleLayer = icebergLayers.find(
    (l) => l.layer === 'license_subscription',
  )!;
  const visibleShareOfTotal =
    totalPoint > 0 ? round(visibleLayer.point / totalPoint) : 0;

  const headline =
    `The vendor quoted $${Math.round(input.vendorQuotedCost).toLocaleString('en-US')}; ` +
    `should-cost is ${formatRange(totalLow, totalHigh)} once the TCO iceberg is modelled ` +
    `(the quote is ~${Math.round(visibleShareOfTotal * 100)}% of true cost).`;

  return {
    estimateLabel: input.estimateLabel,
    modelVersion: '1.0',
    vendorQuotedCost: round(input.vendorQuotedCost),
    roleMix,
    icebergLayers,
    totalLow,
    totalHigh,
    totalPoint,
    visibleShareOfTotal,
    headline,
  };
}
