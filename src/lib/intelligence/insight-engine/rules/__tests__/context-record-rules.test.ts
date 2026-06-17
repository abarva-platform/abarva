import { evaluate as evaluateAdoptionBelowValueCase } from "../adoption-below-value-case";
import { evaluate as evaluateConflictingFact } from "../conflicting-fact";
import { evaluate as evaluateMaterialClaimUnapproved } from "../material-claim-unapproved";
import { evaluate as evaluateRenewalWindowNoBenchmark } from "../renewal-window-no-benchmark";
import { evaluate as evaluateSlaBreachWorsening } from "../sla-breach-worsening";
import { evaluate as evaluateValueCoverageGap } from "../value-coverage-gap";
import type { ContextRecordRow } from "../context-records";
import type { RuleEvaluationContext } from "../../types";

function futureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

function record(
  id: string,
  recordType: string,
  title: string,
  payload: Record<string, unknown>,
): ContextRecordRow {
  return {
    id,
    title,
    record_type: recordType,
    source_file: `${recordType}.csv`,
    source_row_number: 7,
    payload,
    freshness_status: "fresh",
    lifecycle_state: "active",
  };
}

function ctxWith(records: ContextRecordRow[]): RuleEvaluationContext {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: records, error: null }),
  };
  return {
    tenantKey: "skyharbor-air",
    clientId: "client-skyharbor",
    db: {
      from: jest.fn().mockReturnValue(query),
    } as unknown as RuleEvaluationContext["db"],
  };
}

describe("context insight record rules", () => {
  it("fires renewal insights from SkyHarbor contract payload fields", async () => {
    const result = await evaluateRenewalWindowNoBenchmark(
      ctxWith([
        record("rec-contract-1", "contract", "Microsoft Azure", {
          vendor_name: "Microsoft Azure",
          annual_value_usd: "70000000",
          renewal_date: futureDate(90),
        }),
      ]),
    );

    expect(result.fired).toBe(true);
    expect(result.insights[0]?.ruleId).toBe("renewal-window-no-benchmark");
    expect(result.insights[0]?.derivedFromRecordIds).toEqual(["rec-contract-1"]);
  });

  it("fires the five non-renewal rules instead of no-op stubs", async () => {
    const checks = await Promise.all([
      evaluateAdoptionBelowValueCase(
        ctxWith([
          record("rec-ai-1", "ai_tooling_model_inventory", "Claude Code", {
            tool_name: "Claude Code",
            risk_classification: "high",
            workflow: "revenue accounting",
            model_name: "claude-opus",
          }),
        ]),
      ),
      evaluateSlaBreachWorsening(
        ctxWith([
          record("rec-sla-1", "service_level", "Mainframe service", {
            service_name: "Mainframe service",
            metric: "P2 resolution",
            target: "8h",
            actual: "9.9h",
            breach_count: "3",
            credit_at_risk_usd: "939820",
          }),
        ]),
      ),
      evaluateMaterialClaimUnapproved(
        ctxWith([
          record("rec-init-1", "initiative", "Legacy Teradata exit", {
            title: "Legacy Teradata exit",
            status: "at_risk",
            sponsor_role: "CTO",
            committed_usd: "88002966",
          }),
        ]),
      ),
      evaluateConflictingFact(
        ctxWith([
          record("rec-app-1", "cmdb_application", "Revenue Core", {
            name: "Revenue Core",
            criticality: "tier1",
            owner_role: "Director Revenue Accounting",
            ams_vendor: "TCS",
            system_of_record: "ServiceNow",
            annual_run_cost_usd: "636759",
          }),
        ]),
      ),
      evaluateValueCoverageGap(
        ctxWith([
          record("rec-value-1", "initiative", "Mainframe offload", {
            title: "Mainframe offload",
            status: "proposed",
            committed_usd: "46015863",
            projected_value_usd: "12000000",
          }),
        ]),
      ),
    ]);

    expect(checks.map((result) => result.fired)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  });
});
