import {
  evaluateHours,
  InvalidEffortRuleParametersError,
  parseEffortOperation,
  UnknownEffortOperationError,
} from "../rule-interpreter";

describe("parseEffortOperation — closed operation set", () => {
  it("parses fixed_hours", () => {
    const op = parseEffortOperation({ operation: "fixed_hours", driver_code: null, parameters: { hours: 40 }, rule_code: "R1" });
    expect(op).toEqual({ op: "fixed_hours", hours: 40 });
  });

  it("parses per_unit_hours", () => {
    const op = parseEffortOperation({
      operation: "per_unit_hours",
      driver_code: "integration_count",
      parameters: { unitHours: 30 },
      rule_code: "R1",
    });
    expect(op).toEqual({ op: "per_unit_hours", driverCode: "integration_count", unitHours: 30 });
  });

  it("parses tiered_unit_hours", () => {
    const op = parseEffortOperation({
      operation: "tiered_unit_hours",
      driver_code: "environment_count",
      parameters: { tiers: [{ uptoQuantity: 3, unitHours: 90 }, { uptoQuantity: null, unitHours: 65 }] },
      rule_code: "R1",
    });
    expect(op).toEqual({
      op: "tiered_unit_hours",
      driverCode: "environment_count",
      tiers: [
        { uptoQuantity: 3, unitHours: 90 },
        { uptoQuantity: null, unitHours: 65 },
      ],
    });
  });

  it("rejects tiered_unit_hours whose last tier is bounded", () => {
    expect(() =>
      parseEffortOperation({
        operation: "tiered_unit_hours",
        driver_code: "environment_count",
        parameters: { tiers: [{ uptoQuantity: 3, unitHours: 90 }] },
        rule_code: "R1",
      }),
    ).toThrow(InvalidEffortRuleParametersError);
  });

  it("parses percentage_of_selected_labor with selectionScope", () => {
    const op = parseEffortOperation({
      operation: "percentage_of_selected_labor",
      driver_code: null,
      parameters: { percentage: 0.12, selectionScope: "technical_packs_in_archetype" },
      rule_code: "R1",
    });
    expect(op).toEqual({ op: "percentage_of_selected_labor", percentage: 0.12, selectionScope: "technical_packs_in_archetype", selectedActivityPackCodes: undefined });
  });

  it("rejects percentage_of_selected_labor with neither scope nor explicit codes", () => {
    expect(() =>
      parseEffortOperation({ operation: "percentage_of_selected_labor", driver_code: null, parameters: { percentage: 0.1 }, rule_code: "R1" }),
    ).toThrow(InvalidEffortRuleParametersError);
  });

  it("parses hours_per_week / hours_per_wave / hours_per_stakeholder_group / hours_per_course / hours_per_training_session / hours_per_supplier_month", () => {
    expect(parseEffortOperation({ operation: "hours_per_week", driver_code: "hypercare_week_count", parameters: { hoursPerWeek: 60 }, rule_code: "R" })).toEqual({
      op: "hours_per_week",
      driverCode: "hypercare_week_count",
      hoursPerWeek: 60,
    });
    expect(parseEffortOperation({ operation: "hours_per_wave", driver_code: "rollout_wave_count", parameters: { hoursPerWave: 24 }, rule_code: "R" })).toEqual({
      op: "hours_per_wave",
      driverCode: "rollout_wave_count",
      hoursPerWave: 24,
    });
    expect(
      parseEffortOperation({ operation: "hours_per_stakeholder_group", driver_code: "stakeholder_group_count", parameters: { hoursPerGroup: 16 }, rule_code: "R" }),
    ).toEqual({ op: "hours_per_stakeholder_group", driverCode: "stakeholder_group_count", hoursPerGroup: 16 });
    expect(parseEffortOperation({ operation: "hours_per_course", driver_code: "course_count", parameters: { hoursPerCourse: 32 }, rule_code: "R" })).toEqual({
      op: "hours_per_course",
      driverCode: "course_count",
      hoursPerCourse: 32,
    });
    expect(
      parseEffortOperation({ operation: "hours_per_training_session", driver_code: "training_session_count", parameters: { hoursPerSession: 6 }, rule_code: "R" }),
    ).toEqual({ op: "hours_per_training_session", driverCode: "training_session_count", hoursPerSession: 6 });
    expect(
      parseEffortOperation({ operation: "hours_per_supplier_month", driver_code: "supplier_month_count", parameters: { hoursPerSupplierMonth: 8 }, rule_code: "R" }),
    ).toEqual({ op: "hours_per_supplier_month", driverCode: "supplier_month_count", hoursPerSupplierMonth: 8 });
  });

  it("parses manual_cost_line", () => {
    const op = parseEffortOperation({
      operation: "manual_cost_line",
      driver_code: null,
      parameters: { costCents: 150000, rationale: "License fee" },
      rule_code: "R1",
    });
    expect(op).toEqual({ op: "manual_cost_line", costCents: 150000, rationale: "License fee" });
  });

  it("throws UnknownEffortOperationError for anything outside the 11 closed operations", () => {
    expect(() =>
      parseEffortOperation({ operation: "eval_formula_string", driver_code: null, parameters: {}, rule_code: "R1" }),
    ).toThrow(UnknownEffortOperationError);
  });

  it("throws when a driver-requiring operation has no driver_code", () => {
    expect(() =>
      parseEffortOperation({ operation: "per_unit_hours", driver_code: null, parameters: { unitHours: 10 }, rule_code: "R1" }),
    ).toThrow(InvalidEffortRuleParametersError);
  });
});

describe("evaluateHours", () => {
  it("fixed_hours ignores scope drivers", () => {
    expect(evaluateHours({ op: "fixed_hours", hours: 120 }, {})).toBe(120);
  });

  it("per_unit_hours multiplies driver quantity by unit hours", () => {
    expect(evaluateHours({ op: "per_unit_hours", driverCode: "integration_count", unitHours: 30 }, { integration_count: 5 })).toBe(150);
  });

  it("throws when a required driver quantity is not supplied", () => {
    expect(() => evaluateHours({ op: "per_unit_hours", driverCode: "integration_count", unitHours: 30 }, {})).toThrow();
  });

  it("tiered_unit_hours applies marginal tier rates across the bands", () => {
    const op = {
      op: "tiered_unit_hours" as const,
      driverCode: "environment_count",
      tiers: [
        { uptoQuantity: 3, unitHours: 90 },
        { uptoQuantity: null, unitHours: 65 },
      ],
    };
    // 3 environments entirely within tier 1: 3 * 90 = 270
    expect(evaluateHours(op, { environment_count: 3 })).toBe(270);
    // 5 environments: 3 * 90 (tier 1) + 2 * 65 (tier 2) = 270 + 130 = 400
    expect(evaluateHours(op, { environment_count: 5 })).toBe(400);
  });

  it("percentage_of_selected_labor multiplies percentage by the pre-computed selected-labor hours", () => {
    expect(evaluateHours({ op: "percentage_of_selected_labor", percentage: 0.12, selectionScope: "technical_packs_in_archetype" }, {}, 1000)).toBe(120);
  });

  it("percentage_of_selected_labor throws if called without the pre-computed pass", () => {
    expect(() => evaluateHours({ op: "percentage_of_selected_labor", percentage: 0.12, selectionScope: "technical_packs_in_archetype" }, {})).toThrow();
  });

  it("hours_per_week / hours_per_wave / hours_per_stakeholder_group / hours_per_course / hours_per_training_session / hours_per_supplier_month all multiply quantity by their named constant", () => {
    expect(evaluateHours({ op: "hours_per_week", driverCode: "hypercare_week_count", hoursPerWeek: 60 }, { hypercare_week_count: 4 })).toBe(240);
    expect(evaluateHours({ op: "hours_per_wave", driverCode: "rollout_wave_count", hoursPerWave: 24 }, { rollout_wave_count: 3 })).toBe(72);
    expect(evaluateHours({ op: "hours_per_stakeholder_group", driverCode: "stakeholder_group_count", hoursPerGroup: 16 }, { stakeholder_group_count: 6 })).toBe(96);
    expect(evaluateHours({ op: "hours_per_course", driverCode: "course_count", hoursPerCourse: 32 }, { course_count: 4 })).toBe(128);
    expect(
      evaluateHours({ op: "hours_per_training_session", driverCode: "training_session_count", hoursPerSession: 6 }, { training_session_count: 12 }),
    ).toBe(72);
    expect(
      evaluateHours({ op: "hours_per_supplier_month", driverCode: "supplier_month_count", hoursPerSupplierMonth: 8 }, { supplier_month_count: 8 }),
    ).toBe(64);
  });

  it("manual_cost_line returns null (not an hours-producing operation)", () => {
    expect(evaluateHours({ op: "manual_cost_line", costCents: 100, rationale: "x" }, {})).toBeNull();
  });
});
