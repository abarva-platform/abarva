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
  senior_engineer: 0.84,
  engineer: 0.68,
  data_engineer: 0.7,
  integration_engineer: 0.66,
  qa_eval_lead: 0.72,
  business_analyst: 0.58,
  process_lead: 0.74,
  change_lead: 0.72,
  training_lead: 0.56,
  analyst: 0.54,
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
