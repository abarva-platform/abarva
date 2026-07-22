import { mergeFactsByCanonicalIdentity } from "../merge-facts";
import {
  type CioTowerFactRow,
  type CanonicalIdentity,
  type CioTowerFactValueSource,
  withCanonicalIdentity,
  SOURCE_PRIORITY,
} from "../facts-schema";

function fact(
  factKey: string,
  value: number,
  valueSource: CioTowerFactValueSource,
  canonical: Partial<CanonicalIdentity> & {
    metric_key: string;
    source_priority: number;
  },
): CioTowerFactRow {
  const identity: CanonicalIdentity = {
    canonical_tool_key: canonical.canonical_tool_key ?? "tool::github-copilot",
    canonical_program_key: canonical.canonical_program_key ?? null,
    vendor_name: canonical.vendor_name ?? "GitHub",
    system_name: canonical.system_name ?? "GitHub Copilot",
    program_code: canonical.program_code ?? null,
    metric_key: canonical.metric_key,
    metric_unit: canonical.metric_unit ?? "usd",
    period_start: canonical.period_start ?? "2026-05-01",
    period_end: canonical.period_end ?? "2026-05-31",
    source_priority: canonical.source_priority,
  };
  return {
    fact_key: factKey,
    tenant_key: "meridian-health",
    entity_key: null,
    entity_type: "other",
    measure: canonical.metric_key,
    scope: "system",
    view: "app_run_cost",
    amount_type: "run",
    basis: "actual",
    period: "2026-05-01..2026-05-31",
    value_numeric: value,
    value_text: null,
    value_date: null,
    value_bool: null,
    unit: "usd",
    value_source: valueSource,
    confidence: "high",
    source_key: null,
    source_row: null,
    formula_key: "",
    formula_version: "test",
    is_rollup_of: "",
    component_of: "",
    superseded_by: "",
    valid_from: null,
    valid_to: null,
    attributes: JSON.stringify(withCanonicalIdentity({}, identity)),
  };
}

describe("mergeFactsByCanonicalIdentity", () => {
  it("keeps the real tenant_file fact over a synthetic estimate for the SAME metric+period", () => {
    const synthetic = fact("f-synth", 4000, "synthetic", {
      metric_key: "ai_tool_monthly_cost_usd",
      source_priority: SOURCE_PRIORITY.synthetic,
    });
    const real = fact("f-real", 6300, "tenant_file", {
      metric_key: "ai_tool_monthly_cost_usd",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const result = mergeFactsByCanonicalIdentity([synthetic, real]);
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].fact_key).toBe("f-real");
    expect(result.facts[0].value_numeric).toBe(6300);
    expect(result.suppressed).toHaveLength(1);
    expect(result.suppressed[0].droppedFactKey).toBe("f-synth");
    expect(result.suppressed[0].reason).toBe("higher_source_priority_wins");
  });

  it("does NOT collapse complementary metrics for the same tool (spend vs. usage)", () => {
    const spend = fact("f-spend", 6300, "tenant_file", {
      metric_key: "ai_tool_monthly_cost_usd",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const usage = fact("f-usage", 210, "tenant_file", {
      metric_key: "ai_tool_active_users",
      metric_unit: "users",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const result = mergeFactsByCanonicalIdentity([spend, usage]);
    expect(result.facts).toHaveLength(2);
    expect(result.suppressed).toHaveLength(0);
  });

  it("does NOT collapse the same metric across different periods", () => {
    const may = fact("f-may", 6300, "tenant_file", {
      metric_key: "ai_tool_monthly_cost_usd",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const jun = fact("f-jun", 6800, "tenant_file", {
      metric_key: "ai_tool_monthly_cost_usd",
      period_start: "2026-06-01",
      period_end: "2026-06-30",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const result = mergeFactsByCanonicalIdentity([may, jun]);
    expect(result.facts).toHaveLength(2);
  });

  it("does NOT collapse the same metric across different canonical tools", () => {
    const copilot = fact("f-cop", 6300, "tenant_file", {
      canonical_tool_key: "tool::github-copilot",
      metric_key: "ai_tool_monthly_cost_usd",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const cursor = fact("f-cur", 600, "tenant_file", {
      canonical_tool_key: "tool::cursor",
      metric_key: "ai_tool_monthly_cost_usd",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const result = mergeFactsByCanonicalIdentity([copilot, cursor]);
    expect(result.facts).toHaveLength(2);
  });

  it("applies the full precedence ladder: tenant_file > v3_template > synthetic", () => {
    const synth = fact("f-s", 1, "synthetic", {
      metric_key: "m",
      source_priority: SOURCE_PRIORITY.synthetic,
    });
    const tmpl = fact("f-t", 2, "synthetic", {
      metric_key: "m",
      source_priority: SOURCE_PRIORITY.v3_template,
    });
    const real = fact("f-r", 3, "tenant_file", {
      metric_key: "m",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    // order shuffled to prove it's priority, not insertion order
    const result = mergeFactsByCanonicalIdentity([tmpl, real, synth]);
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].fact_key).toBe("f-r");
    expect(result.suppressed).toHaveLength(2);
  });

  it("reports an equal-priority duplicate rather than silently doubling", () => {
    const a = fact("f-a", 6300, "tenant_file", {
      metric_key: "m",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const b = fact("f-b", 6300, "tenant_file", {
      metric_key: "m",
      source_priority: SOURCE_PRIORITY.tenant_file,
    });
    const result = mergeFactsByCanonicalIdentity([a, b]);
    expect(result.facts).toHaveLength(1);
    expect(result.suppressed[0].reason).toBe(
      "duplicate_same_priority_first_kept",
    );
  });

  it("passes through facts that carry no canonical identity untouched", () => {
    const bare: CioTowerFactRow = {
      ...fact("f-bare", 100, "tenant_file", {
        metric_key: "m",
        source_priority: 3,
      }),
      attributes: JSON.stringify({ note: "no canonical block" }),
    };
    const result = mergeFactsByCanonicalIdentity([bare]);
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].fact_key).toBe("f-bare");
  });
});
