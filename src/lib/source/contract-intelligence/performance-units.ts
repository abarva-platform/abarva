export type SourcePerformanceUnit = "%" | "minutes" | "hours" | "count";

const METRIC_UNITS: Readonly<Record<string, SourcePerformanceUnit>> = {
  critical_incident_response_minutes: "minutes",
  p1_p2_resolution_hours: "hours",
  problem_backlog_older_30_days: "count",
};

function declaredUnit(value: string | null | undefined): SourcePerformanceUnit | null {
  switch (value?.trim().toLowerCase()) {
    case "%":
    case "percent":
      return "%";
    case "minutes":
    case "min":
      return "minutes";
    case "hours":
    case "hr":
      return "hours";
    case "count":
      return "count";
    default:
      return null;
  }
}

function expectedUnit(metricName: string): SourcePerformanceUnit | null {
  const normalized = metricName.trim().toLowerCase();
  if (METRIC_UNITS[normalized]) return METRIC_UNITS[normalized];
  if (normalized.endsWith("_pct") || normalized.endsWith(" %")) return "%";
  return null;
}

function parseNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const text = String(raw).trim();
  if (!/^-?\d+(?:\.\d+)?$/u.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function normalizedValue(value: number | null, unit: SourcePerformanceUnit): number | null {
  if (value === null) return null;
  return unit === "%" && value > 0 && value <= 1 ? value * 100 : value;
}

function formatValue(value: number | null, unit: SourcePerformanceUnit): string | null {
  if (value === null) return null;
  if (unit === "%") return `${value.toFixed(1)}%`;
  const number = Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (unit === "minutes") return `${number} min`;
  if (unit === "hours") return `${number} hr`;
  return number;
}

export function performanceMeasureFromSource(
  metricName: string,
  actualRaw: unknown,
  targetRaw: unknown,
  sourceUnit?: string | null,
) {
  const expected = expectedUnit(metricName);
  const declared = declaredUnit(sourceUnit);
  if ((sourceUnit && !declared) || (expected && declared && expected !== declared)) {
    throw new Error(`Conflicting or unsupported performance unit for ${metricName}`);
  }
  const unit = declared ?? expected;
  if (!unit) throw new Error(`Missing performance unit for ${metricName}`);
  const actual = normalizedValue(parseNumber(actualRaw), unit);
  const target = normalizedValue(parseNumber(targetRaw), unit);
  if (actualRaw !== null && actualRaw !== undefined && actualRaw !== "" && actual === null) {
    throw new Error(`Invalid performance actual for ${metricName}`);
  }
  if (targetRaw !== null && targetRaw !== undefined && targetRaw !== "" && target === null) {
    throw new Error(`Invalid performance target for ${metricName}`);
  }
  return {
    unit,
    actual,
    target,
    actualText: formatValue(actual, unit),
    targetText: formatValue(target, unit),
  };
}

export function formatGovernedPerformanceActual(row: {
  metricName: string;
  unit: string | null | undefined;
  actualValue: unknown;
  valueNum: unknown;
}): string {
  const expected = expectedUnit(row.metricName);
  const unit = declaredUnit(row.unit);
  if (!unit || (expected && expected !== unit)) return "Unit needs review";
  if (unit !== "%" && String(row.actualValue ?? "").includes("%")) {
    return "Unit needs review";
  }
  const actual = normalizedValue(parseNumber(row.valueNum), unit);
  return formatValue(actual, unit) ?? "Not established";
}

export function governedPercentPerformanceValue(row: {
  metricName: string;
  unit: string | null | undefined;
  actualValue: unknown;
  valueNum: unknown;
}): number | null {
  if (expectedUnit(row.metricName) !== "%" || declaredUnit(row.unit) !== "%") {
    return null;
  }
  const actualText = String(row.actualValue ?? "").trim();
  if (actualText && !/^-?\d+(?:\.\d+)?%?$/u.test(actualText)) return null;
  return normalizedValue(parseNumber(row.valueNum), "%");
}

export function selectGovernedPercentTrend<T extends {
  metric_name: string;
  unit: string | null | undefined;
  actual_value: unknown;
  value_num: unknown;
  period_start: string;
}>(rows: readonly T[]): {
  metricName: string;
  points: { row: T; actual: number }[];
} | null {
  const byMetric = new Map<string, { row: T; actual: number }[]>();
  for (const row of rows) {
    const actual = governedPercentPerformanceValue({
      metricName: row.metric_name,
      unit: row.unit,
      actualValue: row.actual_value,
      valueNum: row.value_num,
    });
    if (actual === null) continue;
    const points = byMetric.get(row.metric_name) ?? [];
    points.push({ row, actual });
    byMetric.set(row.metric_name, points);
  }
  const [metricName, points] = [...byMetric].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!metricName || !points || new Set(points.map(({ row }) => row.period_start)).size < 2) {
    return null;
  }
  return {
    metricName,
    points: points.sort((a, b) => a.row.period_start.localeCompare(b.row.period_start)).slice(-12),
  };
}
