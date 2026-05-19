// Moves Expert Kernel — demo comprehensive rate-card packs.
//
// These are not market research and not client-provided production records.
// They are tenant-demo packs that fully exercise the comprehensive rate-card
// fabric for the three seeded case anchors. Each pack gives the current
// onshore/offshore estimator complete role-lane coverage plus a committed
// budget envelope, so the Moves business case can demonstrate client-specific
// economics without falling back to the benchmark by accident.

import type { ShouldCostRole } from '@/lib/source/should-cost/should-cost-model';
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

const ROLES: ShouldCostRole[] = [
  'engagement_lead',
  'solution_architect',
  'senior_engineer',
  'engineer',
  'analyst',
  'project_manager',
];

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
    rates: {
      engagement_lead: { onshore: 390_000, offshore: 170_000 },
      solution_architect: { onshore: 340_000, offshore: 150_000 },
      senior_engineer: { onshore: 285_000, offshore: 132_000 },
      engineer: { onshore: 230_000, offshore: 115_000 },
      analyst: { onshore: 185_000, offshore: 88_000 },
      project_manager: { onshore: 250_000, offshore: 125_000 },
    },
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
    rates: {
      engagement_lead: { onshore: 430_000, offshore: 188_000 },
      solution_architect: { onshore: 365_000, offshore: 165_000 },
      senior_engineer: { onshore: 310_000, offshore: 145_000 },
      engineer: { onshore: 250_000, offshore: 125_000 },
      analyst: { onshore: 205_000, offshore: 96_000 },
      project_manager: { onshore: 280_000, offshore: 136_000 },
    },
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
    rates: {
      engagement_lead: { onshore: 340_000, offshore: 142_000 },
      solution_architect: { onshore: 295_000, offshore: 128_000 },
      senior_engineer: { onshore: 245_000, offshore: 110_000 },
      engineer: { onshore: 198_000, offshore: 92_000 },
      analyst: { onshore: 165_000, offshore: 78_000 },
      project_manager: { onshore: 218_000, offshore: 100_000 },
    },
    committedBudgetUsd: 1_800_000,
    budgetNote:
      'Seeded program inventory says FC-FRAUD-2026 has a committed $1.8M budget.',
  },
};

function rowsForSpec(spec: DemoPackSpec): RateCardTemplateRow[] {
  const rows: RateCardTemplateRow[] = ROLES.flatMap((role) => {
    const specialization = ROLE_TO_SPECIALIZATION[role];
    const rates = spec.rates[role];
    return [
      {
        sourceKind: spec.onshoreKind,
        sourceName: spec.onshoreSourceName,
        role,
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
