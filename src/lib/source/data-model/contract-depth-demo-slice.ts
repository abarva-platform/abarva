export interface ContractDepthScenarioArgs {
  readonly tenantKey: string;
  readonly contractId: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly contractName: string;
  readonly datasetVersion: string;
  readonly loadRunId: string;
  readonly idempotencyKey: string;
  readonly asOfMonth?: string;
  readonly annualBaseFeeUsd?: number;
  readonly monthlyBaseFeeUsd?: number;
}

export interface ContractDepthMonth {
  readonly monthStart: string;
  readonly monthEnd: string;
  readonly actualSpendUsd: number;
  readonly slaActualPct: number;
  readonly slaTargetPct: number;
  readonly breached: boolean;
  readonly creditOwedUsd: number;
  readonly creditClaimedUsd: number;
}

export interface ContractDepthScenario {
  readonly months: readonly ContractDepthMonth[];
  readonly annualSpendUsd: number;
  readonly annualBaseFeeUsd: number;
  readonly monthlyBaseFeeUsd: number;
  readonly missedMonthCount: number;
  readonly creditOwedUsd: number;
  readonly creditClaimedUsd: number;
  readonly unclaimedCreditUsd: number;
}

const DEFAULT_ANNUAL_BASE_FEE_USD = 8_600_000;
const DEFAULT_MONTHLY_BASE_FEE_USD = 716_667;
const DEFAULT_AS_OF_MONTH = "2026-08-01";
const SLA_TARGET_PCT = 95;
const MONTHLY_SPEND_USD = [
  708_400, 712_900, 721_300, 706_800, 718_250, 724_100, 709_750, 715_600,
  720_900, 711_500, 722_200, 716_300,
] as const;
const SLA_ACTUAL_PCT = [96, 97, 95, 98, 96, 89, 97, 91, 96, 95, 90, 98] as const;

export function buildContractDepthScenario(
  args: Pick<ContractDepthScenarioArgs, "annualBaseFeeUsd" | "asOfMonth" | "monthlyBaseFeeUsd"> = {},
): ContractDepthScenario {
  const annualBaseFeeUsd = args.annualBaseFeeUsd ?? DEFAULT_ANNUAL_BASE_FEE_USD;
  const monthlyBaseFeeUsd =
    args.monthlyBaseFeeUsd ??
    (args.annualBaseFeeUsd == null
      ? DEFAULT_MONTHLY_BASE_FEE_USD
      : roundCurrency(annualBaseFeeUsd / 12));
  const creditPerMissUsd = roundCurrency(monthlyBaseFeeUsd * 0.02);
  const months = trailingMonthStarts(args.asOfMonth ?? DEFAULT_AS_OF_MONTH, 12).map(
    (monthStart, index) => {
      const slaActualPct = SLA_ACTUAL_PCT[index] ?? SLA_TARGET_PCT;
      const breached = slaActualPct < SLA_TARGET_PCT;
      return {
        monthStart,
        monthEnd: monthEnd(monthStart),
        actualSpendUsd: MONTHLY_SPEND_USD[index] ?? monthlyBaseFeeUsd,
        slaActualPct,
        slaTargetPct: SLA_TARGET_PCT,
        breached,
        creditOwedUsd: breached ? creditPerMissUsd : 0,
        creditClaimedUsd: 0,
      };
    },
  );
  const annualSpendUsd = roundCurrency(
    months.reduce((sum, month) => sum + month.actualSpendUsd, 0),
  );
  const creditOwedUsd = roundCurrency(
    months.reduce((sum, month) => sum + month.creditOwedUsd, 0),
  );
  const creditClaimedUsd = roundCurrency(
    months.reduce((sum, month) => sum + month.creditClaimedUsd, 0),
  );
  return {
    months,
    annualSpendUsd,
    annualBaseFeeUsd,
    monthlyBaseFeeUsd,
    missedMonthCount: months.filter((month) => month.breached).length,
    creditOwedUsd,
    creditClaimedUsd,
    unclaimedCreditUsd: roundCurrency(creditOwedUsd - creditClaimedUsd),
  };
}

export function contractDepthQualityGate(
  scenario: ContractDepthScenario,
): readonly string[] {
  const failures: string[] = [];
  if (scenario.months.length !== 12) failures.push("expected 12 monthly rows");
  if (scenario.missedMonthCount !== 3) failures.push("expected 3 missed SLA months");
  if (scenario.creditClaimedUsd !== 0) {
    failures.push("expected all missed-month credits to remain unclaimed");
  }
  if (scenario.unclaimedCreditUsd < 42_900 || scenario.unclaimedCreditUsd > 43_100) {
    failures.push("expected unclaimed SLA credits near 43K USD");
  }
  if (scenario.annualSpendUsd < 8_500_000 || scenario.annualSpendUsd > 8_700_000) {
    failures.push("expected annual spend near 8.6M USD");
  }
  return failures;
}

function trailingMonthStarts(asOfMonth: string, count: number): string[] {
  const anchor = parseIsoMonth(asOfMonth);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - count + index + 1, 1));
    return isoDate(date);
  });
}

function monthEnd(monthStart: string): string {
  const start = parseIsoMonth(monthStart);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return isoDate(end);
}

function parseIsoMonth(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error(`Expected YYYY-MM-DD as-of month, received ${value}.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid as-of month, received ${value}.`);
  }
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
