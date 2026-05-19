// Moves Expert Kernel — demo comprehensive rate-card packs.
//
// These are not market research and not client-provided production records.
// They are tenant-demo packs that fully exercise the comprehensive rate-card
// fabric for the three seeded case anchors. Each pack gives the current
// onshore/offshore estimator complete role-lane coverage plus a committed
// budget envelope, so the Moves business case can demonstrate client-specific
// economics without falling back to the benchmark by accident.

import type { ShouldCostRole } from '@/lib/source/should-cost/should-cost-model';
import {
  ENTERPRISE_RATE_CARD_DOMAINS,
  type EnterpriseRateCardDomain,
  ROLE_TO_ENTERPRISE_DOMAIN,
  SHOULD_COST_ROLES,
} from '@/lib/source/should-cost/should-cost-model';
import type { KernelRateCard } from '../effort-estimator';
import {
  buildComprehensiveRateCard,
  type ComprehensiveRateCardBuild,
  type RateCardSeniority,
  type RateCardTemplateRow,
} from './comprehensive-rate-card';
import { ROLE_TO_SPECIALIZATION } from './derived-planning-rate-card';

export type DemoRateCardPackId =
  | 'apex-contact-center'
  | 'meridian-ambient-clinical'
  | 'firstcapital-fraud-detection';

interface RoleLaneRates {
  onshore: number;
  offshore: number;
}

export const ENTERPRISE_RATE_CARD_TIERS = [
  'principal',
  'director',
  'manager',
  'lead',
  'senior',
  'mid',
  'junior',
] as const satisfies readonly RateCardSeniority[];

export type EnterpriseRateCardTier =
  (typeof ENTERPRISE_RATE_CARD_TIERS)[number];

const TIER_MULTIPLIERS: Record<EnterpriseRateCardTier, number> = {
  principal: 1.28,
  director: 1.18,
  manager: 1.08,
  lead: 1,
  senior: 0.9,
  mid: 0.76,
  junior: 0.58,
};

interface DemoPackSpec {
  id: DemoRateCardPackId;
  tenantKey: string;
  moveName: string;
  label: string;
  onshoreSourceName: string;
  offshoreSourceName: string;
  budgetSourceName: string;
  owner: string;
  asOf: string;
  onshoreKind: 'client_rate_card' | 'internal_team_cost' | 'vendor_quote';
  offshoreKind: 'client_rate_card' | 'internal_team_cost' | 'vendor_quote';
  rates: Record<ShouldCostRole, RoleLaneRates>;
  committedBudgetUsd: number;
  budgetNote: string;
}

export interface IndustryRateCardProfile {
  packId: DemoRateCardPackId;
  industry: string;
  techStackSignals: string[];
  mustPriceRoles: ShouldCostRole[];
  mustPriceDomains: EnterpriseRateCardDomain[];
  rationale: string[];
}

export const INDUSTRY_RATE_CARD_PROFILES: Record<
  DemoRateCardPackId,
  IndustryRateCardProfile
> = {
  'apex-contact-center': {
    packId: 'apex-contact-center',
    industry: 'Retail / consumer commerce',
    techStackSignals: [
      'Contact-center platform',
      'CRM / customer profile',
      'E-commerce and order management',
      'MarTech / loyalty',
      'Warehouse and fulfillment integration',
      'Digital web and mobile channels',
    ],
    mustPriceRoles: [
      'domain_sme',
      'product_owner',
      'ux_ui_designer',
      'frontend_engineer',
      'backend_engineer',
      'full_stack_engineer',
      'integration_engineer',
      'data_engineer',
      'ai_ml_lead',
      'qa_eval_lead',
      'change_lead',
    ],
    mustPriceDomains: [
      'domain_sme',
      'product_management',
      'digital_experience',
      'application_engineering',
      'integration',
      'data_engineering',
      'ai_ml',
      'qa_evaluation',
      'change_management',
    ],
    rationale: [
      'Retail contact-center AI touches digital channels, CRM, order flows, fulfillment, and agent adoption.',
      'The rate card must price both product/digital build and the integration work around customer/order systems.',
    ],
  },
  'meridian-ambient-clinical': {
    packId: 'meridian-ambient-clinical',
    industry: 'Healthcare provider',
    techStackSignals: [
      'Epic EHR',
      'Epic Clarity / Caboodle analytics',
      'HL7 / FHIR integration',
      'Clinical documentation workflow',
      'HIPAA / privacy controls',
      'Provider adoption and training',
    ],
    mustPriceRoles: [
      'domain_sme',
      'epic_clarity_analyst',
      'epic_integration_engineer',
      'data_architect',
      'data_engineer',
      'integration_engineer',
      'security_architect',
      'governance_risk_lead',
      'ai_ml_lead',
      'process_lead',
      'training_lead',
      'change_lead',
    ],
    mustPriceDomains: [
      'domain_sme',
      'clinical_platforms',
      'data_architecture',
      'data_engineering',
      'integration',
      'security_risk',
      'governance_compliance',
      'ai_ml',
      'process_redesign',
      'training_enablement',
      'change_management',
    ],
    rationale: [
      'A healthcare AI case without Epic/Clarity, HL7/FHIR, privacy, and clinical workflow pricing is not credible.',
      'Provider adoption and training must be priced as first-class work, not buried under generic change management.',
    ],
  },
  'firstcapital-fraud-detection': {
    packId: 'firstcapital-fraud-detection',
    industry: 'Regulated financial services',
    techStackSignals: [
      'Core banking',
      'Card / payments fraud platform',
      'AML case management',
      'Mainframe / legacy integration',
      'Model risk management',
      'Regulatory controls and audit evidence',
    ],
    mustPriceRoles: [
      'domain_sme',
      'governance_risk_lead',
      'security_architect',
      'legacy_mainframe_engineer',
      'integration_engineer',
      'middleware_engineer',
      'data_architect',
      'data_engineer',
      'ai_ml_lead',
      'qa_eval_lead',
      'process_lead',
      'change_lead',
    ],
    mustPriceDomains: [
      'domain_sme',
      'governance_compliance',
      'security_risk',
      'legacy_modernization',
      'integration',
      'data_architecture',
      'data_engineering',
      'ai_ml',
      'qa_evaluation',
      'process_redesign',
      'change_management',
    ],
    rationale: [
      'Bank fraud AI must price model-risk, security, auditability, payments/core integration, and legacy constraints.',
      'Legacy and middleware skills are not optional in a regulated-bank modernization path.',
    ],
  },
};

const ROLE_RATE_MULTIPLIERS: Record<ShouldCostRole, number> = {
  engagement_partner: 1.32,
  engagement_lead: 1.14,
  program_manager: 0.92,
  project_manager: 0.76,
  product_owner: 0.82,
  solution_architect: 1,
  enterprise_architect: 1.08,
  security_architect: 1.03,
  cloud_platform_architect: 0.96,
  devops_sre_lead: 0.82,
  data_architect: 0.98,
  ai_ml_lead: 1.06,
  governance_risk_lead: 0.94,
  domain_sme: 0.88,
  ux_ui_designer: 0.7,
  frontend_engineer: 0.68,
  backend_engineer: 0.72,
  full_stack_engineer: 0.76,
  mobile_engineer: 0.78,
  senior_engineer: 0.84,
  engineer: 0.68,
  data_engineer: 0.7,
  database_administrator: 0.7,
  integration_engineer: 0.66,
  middleware_engineer: 0.7,
  erp_functional_consultant: 0.86,
  erp_technical_consultant: 0.82,
  sap_abap_developer: 0.78,
  oracle_erp_consultant: 0.78,
  epic_clarity_analyst: 0.82,
  epic_integration_engineer: 0.84,
  legacy_mainframe_engineer: 0.86,
  qa_eval_lead: 0.72,
  business_analyst: 0.58,
  process_lead: 0.74,
  change_lead: 0.72,
  training_lead: 0.56,
  analyst: 0.54,
};

const ROLE_TIERS: Record<ShouldCostRole, EnterpriseRateCardTier[]> = {
  engagement_partner: ['principal', 'director'],
  engagement_lead: ['principal', 'director', 'manager'],
  program_manager: ['director', 'manager', 'lead', 'senior'],
  project_manager: ['manager', 'lead', 'senior', 'mid'],
  product_owner: ['director', 'manager', 'lead', 'senior'],
  solution_architect: ['principal', 'lead', 'senior'],
  enterprise_architect: ['principal', 'lead', 'senior'],
  security_architect: ['principal', 'lead', 'senior'],
  cloud_platform_architect: ['principal', 'lead', 'senior'],
  devops_sre_lead: ['lead', 'senior', 'mid'],
  data_architect: ['principal', 'lead', 'senior'],
  ai_ml_lead: ['principal', 'lead', 'senior'],
  governance_risk_lead: ['director', 'manager', 'lead', 'senior'],
  domain_sme: ['principal', 'lead', 'senior'],
  ux_ui_designer: ['lead', 'senior', 'mid', 'junior'],
  frontend_engineer: ['lead', 'senior', 'mid', 'junior'],
  backend_engineer: ['lead', 'senior', 'mid', 'junior'],
  full_stack_engineer: ['lead', 'senior', 'mid', 'junior'],
  mobile_engineer: ['lead', 'senior', 'mid', 'junior'],
  senior_engineer: ['lead', 'senior', 'mid'],
  engineer: ['senior', 'mid', 'junior'],
  data_engineer: ['lead', 'senior', 'mid', 'junior'],
  database_administrator: ['lead', 'senior', 'mid'],
  integration_engineer: ['lead', 'senior', 'mid', 'junior'],
  middleware_engineer: ['lead', 'senior', 'mid'],
  erp_functional_consultant: ['principal', 'lead', 'senior', 'mid'],
  erp_technical_consultant: ['lead', 'senior', 'mid', 'junior'],
  sap_abap_developer: ['lead', 'senior', 'mid', 'junior'],
  oracle_erp_consultant: ['lead', 'senior', 'mid', 'junior'],
  epic_clarity_analyst: ['lead', 'senior', 'mid', 'junior'],
  epic_integration_engineer: ['lead', 'senior', 'mid', 'junior'],
  legacy_mainframe_engineer: ['principal', 'lead', 'senior', 'mid'],
  qa_eval_lead: ['lead', 'senior', 'mid'],
  business_analyst: ['lead', 'senior', 'mid', 'junior'],
  process_lead: ['director', 'manager', 'lead', 'senior'],
  change_lead: ['director', 'manager', 'lead', 'senior'],
  training_lead: ['lead', 'senior', 'mid'],
  analyst: ['senior', 'mid', 'junior'],
};

function roleRates(
  solutionArchitectOnshore: number,
  solutionArchitectOffshore: number,
): Record<ShouldCostRole, RoleLaneRates> {
  return Object.fromEntries(
    SHOULD_COST_ROLES.map((role) => {
      const multiplier = ROLE_RATE_MULTIPLIERS[role];
      return [
        role,
        {
          onshore: Math.round(solutionArchitectOnshore * multiplier),
          offshore: Math.round(solutionArchitectOffshore * multiplier),
        },
      ];
    }),
  ) as Record<ShouldCostRole, RoleLaneRates>;
}

const PACK_SPECS: Record<DemoRateCardPackId, DemoPackSpec> = {
  'apex-contact-center': {
    id: 'apex-contact-center',
    tenantKey: 'apex-retail',
    moveName: 'Contact Center AI Routing',
    label: 'Apex Contact Center AI Routing comprehensive demo rate card',
    onshoreSourceName: 'Apex Retail FY26 transformation delivery card',
    offshoreSourceName: 'Apex CX AI integrator BAFO rate sheet',
    budgetSourceName: 'Apex contact-center AI approved planning envelope',
    owner: 'Apex Procurement',
    asOf: '2026-05-19',
    onshoreKind: 'client_rate_card',
    offshoreKind: 'vendor_quote',
    rates: roleRates(340_000, 150_000),
    committedBudgetUsd: 5_200_000,
    budgetNote:
      'Demo planning envelope for the Apex contact-center AI routing Move.',
  },
  'meridian-ambient-clinical': {
    id: 'meridian-ambient-clinical',
    tenantKey: 'meridian-health',
    moveName: 'Ambient Clinical Value Chain Activation',
    label: 'Meridian Ambient Clinical comprehensive demo rate card',
    onshoreSourceName: 'Meridian clinical AI delivery rate card',
    offshoreSourceName: 'Meridian EHR integration partner quote sheet',
    budgetSourceName: 'Meridian ambulatory ambient-clinical planning envelope',
    owner: 'Meridian Procurement',
    asOf: '2026-05-19',
    onshoreKind: 'client_rate_card',
    offshoreKind: 'vendor_quote',
    rates: roleRates(365_000, 165_000),
    committedBudgetUsd: 7_500_000,
    budgetNote:
      'Demo planning envelope for the Meridian ambulatory clinical AI Move.',
  },
  'firstcapital-fraud-detection': {
    id: 'firstcapital-fraud-detection',
    tenantKey: 'first-capital',
    moveName: 'Fraud Detection Enhancement',
    label: 'First Capital Fraud Detection comprehensive demo rate card',
    onshoreSourceName: 'First Capital FY26 internal delivery cost model',
    offshoreSourceName: 'First Capital fraud platform integrator BAFO',
    budgetSourceName: 'First Capital committed FC-FRAUD-2026 budget',
    owner: 'First Capital Transformation Finance',
    asOf: '2026-05-19',
    onshoreKind: 'internal_team_cost',
    offshoreKind: 'vendor_quote',
    rates: roleRates(295_000, 128_000),
    committedBudgetUsd: 1_800_000,
    budgetNote:
      'Seeded program inventory says FC-FRAUD-2026 has a committed $1.8M budget.',
  },
};

function rowsForSpec(spec: DemoPackSpec): RateCardTemplateRow[] {
  const rows: RateCardTemplateRow[] = SHOULD_COST_ROLES.flatMap((role) => {
    const specialization = ROLE_TO_SPECIALIZATION[role];
    const rates = spec.rates[role];
    return [
      {
        sourceKind: spec.onshoreKind,
        sourceName: spec.onshoreSourceName,
        role,
        domain: ROLE_TO_ENTERPRISE_DOMAIN[role],
        specialization,
        deliveryLocation: 'onshore',
        seniority: 'blended',
        annualRateUsd: rates.onshore,
        currency: 'USD',
        asOf: spec.asOf,
        owner: spec.owner,
        confidence: 'medium',
        note:
          'Demo comprehensive rate-card row. Replace with the client-approved rate source before commitment.',
      },
      {
        sourceKind: spec.offshoreKind,
        sourceName: spec.offshoreSourceName,
        role,
        domain: ROLE_TO_ENTERPRISE_DOMAIN[role],
        specialization,
        deliveryLocation: 'offshore',
        seniority: 'blended',
        annualRateUsd: rates.offshore,
        currency: 'USD',
        asOf: spec.asOf,
        owner: spec.owner,
        confidence: 'medium',
        note:
          'Demo comprehensive rate-card row. Replace with the executed quote or MSA rate before commitment.',
      },
    ];
  });

  rows.push({
    sourceKind: 'committed_budget',
    sourceName: spec.budgetSourceName,
    committedBudgetUsd: spec.committedBudgetUsd,
    currency: 'USD',
    asOf: spec.asOf,
    owner: spec.owner,
    confidence: 'medium',
    note: spec.budgetNote,
  });

  return rows;
}

export interface DemoRateCardPack {
  id: DemoRateCardPackId;
  tenantKey: string;
  moveName: string;
  label: string;
  rows: RateCardTemplateRow[];
}

export interface EnterpriseTieredRateCatalogRow
  extends Omit<RateCardTemplateRow, 'role' | 'domain' | 'deliveryLocation' | 'seniority' | 'annualRateUsd'> {
  role: ShouldCostRole;
  domain: EnterpriseRateCardDomain;
  deliveryLocation: 'onshore' | 'offshore';
  seniority: EnterpriseRateCardTier;
  annualRateUsd: number;
}

export const DEMO_RATE_CARD_PACKS: Record<
  DemoRateCardPackId,
  DemoRateCardPack
> = Object.fromEntries(
  Object.values(PACK_SPECS).map((spec) => [
    spec.id,
    {
      id: spec.id,
      tenantKey: spec.tenantKey,
      moveName: spec.moveName,
      label: spec.label,
      rows: rowsForSpec(spec),
    },
  ]),
) as Record<DemoRateCardPackId, DemoRateCardPack>;

export function buildDemoRateCardPack(
  id: DemoRateCardPackId,
): ComprehensiveRateCardBuild {
  const pack = DEMO_RATE_CARD_PACKS[id];
  return buildComprehensiveRateCard({
    label: pack.label,
    rows: pack.rows,
    strict: true,
  });
}

export function demoKernelRateCard(id: DemoRateCardPackId): KernelRateCard {
  return buildDemoRateCardPack(id).kernelRateCard;
}

export function buildTieredDemoRateCatalog(
  id: DemoRateCardPackId,
): EnterpriseTieredRateCatalogRow[] {
  const pack = DEMO_RATE_CARD_PACKS[id];
  return pack.rows.flatMap((row) => {
    const role = row.role;
    const domain = row.domain;
    const deliveryLocation = row.deliveryLocation;
    const annualRateUsd = row.annualRateUsd;
    if (
      row.sourceKind === 'committed_budget' ||
      !role ||
      !domain ||
      !deliveryLocation ||
      deliveryLocation === 'nearshore' ||
      !annualRateUsd
    ) {
      return [];
    }

    return ROLE_TIERS[role].map((tier) => ({
      sourceKind: row.sourceKind,
      sourceName: row.sourceName,
      role,
      domain,
      specialization: row.specialization,
      deliveryLocation,
      seniority: tier,
      annualRateUsd: Math.round(annualRateUsd * TIER_MULTIPLIERS[tier]),
      currency: row.currency,
      asOf: row.asOf,
      owner: row.owner,
      confidence: row.confidence,
      note:
        `${row.note ?? 'Demo tiered rate-card row.'} Tier multiplier: ${tier}.`,
    }));
  });
}

export function coveredEnterpriseDomains(
  pack: DemoRateCardPack,
): EnterpriseRateCardDomain[] {
  return Array.from(
    new Set(
      pack.rows
        .filter((row) => row.sourceKind !== 'committed_budget')
        .map((row) => row.domain)
        .filter((domain): domain is EnterpriseRateCardDomain => !!domain),
    ),
  ).sort();
}

export const REQUIRED_ENTERPRISE_RATE_CARD_DOMAINS =
  ENTERPRISE_RATE_CARD_DOMAINS;

export function industryProfileForPack(
  id: DemoRateCardPackId,
): IndustryRateCardProfile {
  return INDUSTRY_RATE_CARD_PROFILES[id];
}
