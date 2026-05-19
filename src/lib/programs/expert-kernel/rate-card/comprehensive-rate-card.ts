// Moves Expert Kernel — comprehensive rate-card fabric.
//
// The benchmark SI card is useful, but it is only the default. A CFO-grade
// Moves business case needs to reconcile five different commercial signals:
// benchmark market rates, client-specific rates, vendor quotes, internal-team
// costs, and a committed budget envelope. This module turns those signals into
// the `KernelRateCard` consumed by the effort-estimator while preserving the
// provenance and warnings needed for an honest business-case narrative.
//
// Pure module: deterministic, no I/O, no database access.

import type {
  EnterpriseRateCardDomain,
  RoleRateCard,
  ShouldCostRole,
} from '@/lib/source/should-cost/should-cost-model';
import {
  ROLE_TO_ENTERPRISE_DOMAIN,
  SHOULD_COST_ROLES,
} from '@/lib/source/should-cost/should-cost-model';
import type { KernelRateCard } from '../effort-estimator';
import type { Confidence } from '../types';
import type {
  DeliveryLocation,
  WorkSpecialization,
} from './benchmark-rate-card';
import { RATE_CARD_AS_OF } from './benchmark-rate-card';
import {
  ANNUAL_BILLABLE_HOURS,
  RESEARCHED_PLANNING_RATES,
} from './derived-planning-rate-card';

export type RateCardSourceKind =
  | 'benchmark_market'
  | 'client_rate_card'
  | 'vendor_quote'
  | 'internal_team_cost'
  | 'committed_budget';

export type RateCardSeniority =
  | 'principal'
  | 'director'
  | 'manager'
  | 'lead'
  | 'senior'
  | 'mid'
  | 'junior'
  | 'blended';

export const RATE_CARD_TEMPLATE_COLUMNS = [
  'source_kind',
  'source_name',
  'role',
  'domain',
  'specialization',
  'delivery_location',
  'seniority',
  'rate_usd_per_hour',
  'annual_rate_usd',
  'committed_budget_usd',
  'currency',
  'as_of',
  'owner',
  'confidence',
  'note',
] as const;

export interface RateCardTemplateRow {
  sourceKind: RateCardSourceKind;
  /** Human source label, e.g. "First Capital FY26 delivery rate card". */
  sourceName: string;
  /** Required for rate rows; optional for committed-budget rows. */
  role?: ShouldCostRole;
  domain?: EnterpriseRateCardDomain;
  specialization?: WorkSpecialization;
  deliveryLocation?: DeliveryLocation;
  seniority?: RateCardSeniority;
  rateUsdPerHour?: number;
  annualRateUsd?: number;
  committedBudgetUsd?: number;
  currency?: 'USD';
  /** ISO date for the source vintage. */
  asOf: string;
  owner: string;
  confidence: Confidence;
  note?: string;
}

export interface RateCardValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AppliedRateSource {
  role: ShouldCostRole;
  lane: 'onshore' | 'offshore';
  annualRateUsd: number;
  sourceKind: RateCardSourceKind | 'fallback_benchmark';
  sourceName: string;
  confidence: Confidence;
  asOf: string;
  note: string;
}

export interface CommittedBudgetEnvelope {
  amountUsd: number;
  sources: Array<{
    sourceName: string;
    amountUsd: number;
    asOf: string;
    owner: string;
    confidence: Confidence;
    note?: string;
  }>;
}

export interface ComprehensiveRateCardBuild {
  kernelRateCard: KernelRateCard;
  appliedRates: AppliedRateSource[];
  committedBudget?: CommittedBudgetEnvelope;
  validation: RateCardValidation;
}

export interface BuildComprehensiveRateCardInput {
  label: string;
  rows: RateCardTemplateRow[];
  /** Fallback used for missing onshore/offshore role lanes. */
  benchmarkRates?: RoleRateCard[];
  /** If true, missing role lanes are errors instead of benchmark fallbacks. */
  strict?: boolean;
}

export interface BudgetFit {
  status: 'no_budget' | 'within_budget' | 'budget_pressure' | 'over_budget';
  committedBudgetUsd?: number;
  estimatePointUsd: number;
  varianceUsd?: number;
  variancePct?: number;
  note: string;
}

const SOURCE_PRECEDENCE: Record<
  Exclude<RateCardSourceKind, 'committed_budget'>,
  number
> = {
  client_rate_card: 50,
  vendor_quote: 40,
  internal_team_cost: 30,
  benchmark_market: 20,
};

const CONFIDENCE_PRECEDENCE: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function isRateRow(row: RateCardTemplateRow): boolean {
  return row.sourceKind !== 'committed_budget';
}

function hasRate(row: RateCardTemplateRow): boolean {
  return row.rateUsdPerHour !== undefined || row.annualRateUsd !== undefined;
}

function toAnnualRate(row: RateCardTemplateRow): number {
  if (row.annualRateUsd !== undefined) return Math.round(row.annualRateUsd);
  return Math.round((row.rateUsdPerHour ?? 0) * ANNUAL_BILLABLE_HOURS);
}

function byBestSource(
  a: RateCardTemplateRow,
  b: RateCardTemplateRow,
): number {
  const precedenceA = SOURCE_PRECEDENCE[
    a.sourceKind as Exclude<RateCardSourceKind, 'committed_budget'>
  ];
  const precedenceB = SOURCE_PRECEDENCE[
    b.sourceKind as Exclude<RateCardSourceKind, 'committed_budget'>
  ];
  if (precedenceA !== precedenceB) return precedenceB - precedenceA;
  const confidenceA = CONFIDENCE_PRECEDENCE[a.confidence];
  const confidenceB = CONFIDENCE_PRECEDENCE[b.confidence];
  if (confidenceA !== confidenceB) return confidenceB - confidenceA;
  return b.asOf.localeCompare(a.asOf);
}

function benchmarkForRole(
  role: ShouldCostRole,
  benchmarkRates: RoleRateCard[],
): RoleRateCard {
  const hit = benchmarkRates.find((r) => r.role === role);
  if (!hit) {
    throw new Error(`Fallback benchmark rate card has no role: ${role}`);
  }
  return hit;
}

export function validateRateCardRows(
  rows: RateCardTemplateRow[],
): RateCardValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    const id = `row ${index + 1} (${row.sourceName || 'unnamed source'})`;
    if (!row.sourceName) errors.push(`${id}: sourceName is required.`);
    if (!row.asOf || !/^\d{4}-\d{2}-\d{2}$/.test(row.asOf)) {
      errors.push(`${id}: asOf must be YYYY-MM-DD.`);
    }
    if (!row.owner) errors.push(`${id}: owner is required.`);
    if (row.currency && row.currency !== 'USD') {
      errors.push(`${id}: only USD is supported in this rate-card fabric.`);
    }

    if (isRateRow(row)) {
      if (!row.role) errors.push(`${id}: role is required for rate rows.`);
      if (row.role && row.domain && row.domain !== ROLE_TO_ENTERPRISE_DOMAIN[row.role]) {
        errors.push(
          `${id}: domain '${row.domain}' does not match role '${row.role}' ` +
            `(${ROLE_TO_ENTERPRISE_DOMAIN[row.role]}).`,
        );
      }
      if (!row.deliveryLocation) {
        errors.push(`${id}: deliveryLocation is required for rate rows.`);
      }
      if (!hasRate(row)) {
        errors.push(`${id}: rateUsdPerHour or annualRateUsd is required.`);
      }
      if ((row.rateUsdPerHour ?? 1) <= 0) {
        errors.push(`${id}: rateUsdPerHour must be positive when present.`);
      }
      if ((row.annualRateUsd ?? 1) <= 0) {
        errors.push(`${id}: annualRateUsd must be positive when present.`);
      }
      if (row.deliveryLocation === 'nearshore') {
        warnings.push(
          `${id}: nearshore is loaded for provenance, but the current ` +
            'RoleRateCard estimator has only onshore/offshore lanes; it will ' +
            'not be used for effort costing until the estimator grows a ' +
            'nearshore lane.',
        );
      }
    } else {
      if ((row.committedBudgetUsd ?? 0) <= 0) {
        errors.push(
          `${id}: committedBudgetUsd must be positive for committed_budget rows.`,
        );
      }
      if (hasRate(row)) {
        warnings.push(
          `${id}: rate fields are ignored on committed_budget rows.`,
        );
      }
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

export function buildComprehensiveRateCard(
  input: BuildComprehensiveRateCardInput,
): ComprehensiveRateCardBuild {
  const benchmarkRates = input.benchmarkRates ?? RESEARCHED_PLANNING_RATES;
  const validation = validateRateCardRows(input.rows);
  const errors = [...validation.errors];
  const warnings = [...validation.warnings];

  const budgetSources = input.rows
    .filter((row) => row.sourceKind === 'committed_budget')
    .map((row) => ({
      sourceName: row.sourceName,
      amountUsd: Math.round(row.committedBudgetUsd ?? 0),
      asOf: row.asOf,
      owner: row.owner,
      confidence: row.confidence,
      note: row.note,
    }));

  const appliedRates: AppliedRateSource[] = [];
  const rates: RoleRateCard[] = SHOULD_COST_ROLES.map((role) => {
    const roleRate: RoleRateCard = {
      role,
      onshoreAnnualRate: 0,
      offshoreAnnualRate: 0,
    };

    (['onshore', 'offshore'] as const).forEach((lane) => {
      const candidates = input.rows
        .filter(
          (row) =>
            isRateRow(row) &&
            row.role === role &&
            row.deliveryLocation === lane &&
            hasRate(row),
        )
        .sort(byBestSource);

      const selected = candidates[0];
      if (selected) {
        const annualRate = toAnnualRate(selected);
        if (lane === 'onshore') {
          roleRate.onshoreAnnualRate = annualRate;
        } else {
          roleRate.offshoreAnnualRate = annualRate;
        }
        appliedRates.push({
          role,
          lane,
          annualRateUsd: annualRate,
          sourceKind: selected.sourceKind,
          sourceName: selected.sourceName,
          confidence: selected.confidence,
          asOf: selected.asOf,
          note: selected.note ?? 'Loaded from comprehensive rate-card row.',
        });
        return;
      }

      if (input.strict) {
        errors.push(
          `Missing ${lane} rate for ${role}; strict mode requires an explicit row.`,
        );
      }

      const fallback = benchmarkForRole(role, benchmarkRates);
      const annualRate =
        lane === 'onshore'
          ? fallback.onshoreAnnualRate
          : fallback.offshoreAnnualRate;
      if (lane === 'onshore') {
        roleRate.onshoreAnnualRate = annualRate;
      } else {
        roleRate.offshoreAnnualRate = annualRate;
      }
      warnings.push(
        `Missing ${lane} rate for ${role}; using researched benchmark fallback.`,
      );
      appliedRates.push({
        role,
        lane,
        annualRateUsd: annualRate,
        sourceKind: 'fallback_benchmark',
        sourceName: 'Researched benchmark planning fallback',
        confidence: 'medium',
        asOf: RATE_CARD_AS_OF,
        note:
          'Fallback from the researched benchmark rate card; override before commitment.',
      });
    });

    return roleRate;
  });

  const committedBudget =
    budgetSources.length > 0
      ? {
          amountUsd: budgetSources.reduce((sum, source) => {
            return sum + source.amountUsd;
          }, 0),
          sources: budgetSources,
        }
      : undefined;

  const hasClientSpecificRate = appliedRates.some(
    (rate) => rate.sourceKind === 'client_rate_card',
  );
  const hasAnyNonFallbackRate = appliedRates.some(
    (rate) => rate.sourceKind !== 'fallback_benchmark',
  );

  const kernelRateCard: KernelRateCard = {
    provenance:
      hasClientSpecificRate && hasAnyNonFallbackRate
        ? 'comprehensive'
        : hasAnyNonFallbackRate
          ? 'comprehensive'
          : 'researched_benchmark',
    label:
      `${input.label} — comprehensive rate card. ` +
      'Precedence: client rate card > vendor quote > internal team cost > ' +
      'loaded benchmark row > researched benchmark fallback. Planning input, ' +
      'not a quote.',
    rates,
  };

  return {
    kernelRateCard,
    appliedRates,
    committedBudget,
    validation: {
      valid: errors.length === 0,
      errors,
      warnings,
    },
  };
}

export function assessBudgetFit(
  estimatePointUsd: number,
  committedBudget?: CommittedBudgetEnvelope,
): BudgetFit {
  if (!committedBudget) {
    return {
      status: 'no_budget',
      estimatePointUsd,
      note:
        'No committed budget was loaded; compare against a client-approved envelope before funding.',
    };
  }

  const varianceUsd = Math.round(
    committedBudget.amountUsd - estimatePointUsd,
  );
  const variancePct =
    committedBudget.amountUsd > 0
      ? Math.round((varianceUsd / committedBudget.amountUsd) * 1000) / 10
      : undefined;
  const ratio = estimatePointUsd / committedBudget.amountUsd;
  const status =
    ratio <= 1
      ? 'within_budget'
      : ratio <= 1.2
        ? 'budget_pressure'
        : 'over_budget';

  const note =
    status === 'within_budget'
      ? 'Estimate is within the committed budget envelope.'
      : status === 'budget_pressure'
        ? 'Estimate is above budget but close enough to require scope/rate reconciliation before a kill call.'
        : 'Estimate materially exceeds the committed budget envelope; do not use benchmark economics alone as the funding decision.';

  return {
    status,
    committedBudgetUsd: committedBudget.amountUsd,
    estimatePointUsd,
    varianceUsd,
    variancePct,
    note,
  };
}
