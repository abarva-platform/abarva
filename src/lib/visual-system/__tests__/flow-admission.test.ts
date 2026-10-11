import fs from "node:fs";
import path from "node:path";
import type {
  HomeReviewBundle,
  TechRecordType,
} from "@/lib/home/preview/types";
import { resolveArchitectureView } from "../resolveArchitectureView";
import {
  AUDIENCE_DENSITY,
  LAYER_SCHEMES,
  deriveOrientation,
  validateArchitectureView,
} from "../architecture-view-contract";
import { ZONE_ORDER } from "../semantics/technology-semantic-taxonomy";

function integrations(rows: TechRecordType["rows"]): TechRecordType {
  return {
    objectType: "data_asset_or_integration",
    label: "Flows",
    columns: ["sourceSystem", "targetSystem"],
    rows,
    primaryDimension: "sourceSystem",
    dimensionCounts: [],
  };
}
const resolve = (rows: TechRecordType["rows"]) =>
  resolveArchitectureView({
    format: "end_to_end_data_flow",
    tenantKey: "reference",
    tenantDisplayName: "Reference",
    integrations: integrations(rows),
  });
const movements = () => [
  ...Array.from({ length: 12 }, (_, i) => ({
    sourceSystem: `Source system ${i}`,
    targetSystem: "Epic Caboodle",
  })),
  ...Array.from({ length: 3 }, () => ({
    sourceSystem: "Epic Caboodle",
    targetSystem: "Tableau Server",
  })),
];

describe("current-state flow admission follows governed zone names", () => {
  it("uses the same ordered zones for layout, validation and edge orientation", () => {
    expect(LAYER_SCHEMES.current_state_zones_v1).toEqual(ZONE_ORDER);
    expect(
      deriveOrientation(
        "enterprise_warehouse",
        "analytics_bi",
        "current_state_zones_v1",
      ),
    ).toBe("forward");
  });
  it("admits a recorded converging warehouse-to-consumption path", () => {
    const result = resolve(movements());
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected admitted path");
    expect(
      result.view.nodes.find((node) => node.label === "Epic Caboodle"),
    ).toMatchObject({
      layer: "enterprise_warehouse",
      semanticRole: "data_store",
    });
  });
  it("admits a data mart as landing without requiring a warehouse", () => {
    const result = resolveArchitectureView({
      format: "end_to_end_data_flow",
      tenantKey: "reference",
      tenantDisplayName: "Reference",
      applications: {
        ...integrations([
          {
            systemName: "Recorded mart",
            systemCategory: "SQL Server database/mart",
          },
        ]),
        objectType: "application_system",
      },
      integrations: integrations(
        movements().map((row) => ({
          sourceSystem:
            row.sourceSystem === "Epic Caboodle"
              ? "Recorded mart"
              : row.sourceSystem,
          targetSystem:
            row.targetSystem === "Epic Caboodle"
              ? "Recorded mart"
              : row.targetSystem,
        })),
      ),
    });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected admitted mart");
    expect(
      result.view.nodes.some(
        (node) =>
          node.layer === "data_marts" && node.semanticRole === "data_store",
      ),
    ).toBe(true);
  });
  it("retains the integration role for governed movement platforms", () => {
    const rows = movements();
    rows[0].sourceSystem = "Rhapsody Integration Engine";
    const result = resolve(rows);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected admitted flow");
    expect(
      result.view.nodes.find(
        (node) => node.label === "Rhapsody Integration Engine",
      ),
    ).toMatchObject({
      layer: "healthcare_interoperability",
      semanticRole: "integration",
    });
  });
  it("continues to refuse consumption without a recorded landing", () => {
    const result = resolve(
      movements().map((row) => ({
        ...row,
        sourceSystem:
          row.sourceSystem === "Epic Caboodle" ? "Source" : row.sourceSystem,
        targetSystem: "Tableau Server",
      })),
    );
    expect(result.status).toBe("refused");
    if (result.status !== "refused") throw new Error("Expected refusal");
    expect(
      result.refusal.failedRules.find(
        (rule) => rule.ruleId === "FLOW-LANDING-CONSUMPTION",
      )?.measurement,
    ).toContain("landing=missing");
  });
  it("continues to refuse landing without consumption", () => {
    const result = resolve(
      movements().map((row) => ({ ...row, targetSystem: "Epic Caboodle" })),
    );
    expect(result.status).toBe("refused");
    if (result.status !== "refused") throw new Error("Expected refusal");
    expect(
      result.refusal.failedRules.find(
        (rule) => rule.ruleId === "FLOW-LANDING-CONSUMPTION",
      )?.measurement,
    ).toContain("consumption=missing");
  });
  it("does not weaken the independent convergence gate", () => {
    const result = resolve(
      Array.from({ length: 12 }, (_, i) => ({
        sourceSystem: "Epic Caboodle",
        targetSystem: i === 0 ? "Tableau Server" : `Destination ${i}`,
      })),
    );
    expect(result.status).toBe("refused");
    if (result.status !== "refused") throw new Error("Expected refusal");
    expect(result.refusal.failedRules.map((rule) => rule.ruleId)).toContain(
      "FLOW-CONVERGENCE",
    );
    expect(result.refusal.failedRules.map((rule) => rule.ruleId)).not.toContain(
      "FLOW-LANDING-CONSUMPTION",
    );
  });
  it("regresses the reviewed projection that was falsely rejected by legacy layer names", () => {
    const record: HomeReviewBundle = JSON.parse(
      fs.readFileSync(
        path.join(
          process.cwd(),
          "src/lib/home/preview/golden-snapshots/meridian-health.json",
        ),
        "utf8",
      ),
    );
    const result = resolveArchitectureView({
      format: "end_to_end_data_flow",
      tenantKey: record.tenantKey,
      tenantDisplayName: record.tenantKey,
      applications: record.technologyEstate!.recordTypes.find(
        (item) => item.objectType === "application_system",
      ),
      integrations: record.technologyEstate!.recordTypes.find(
        (item) => item.objectType === "data_asset_or_integration",
      ),
    });
    expect(result.status).toBe("ready");
    if (result.status !== "ready")
      throw new Error("Expected admitted reviewed view");
    expect(result.view.edges.length).toBeGreaterThan(10);
    expect(result.view.nodes.length).toBeLessThanOrEqual(
      AUDIENCE_DENSITY[result.view.audienceLevel].max!,
    );
    expect(
      result.view.nodes.some((node) => node.aggregation?.memberCount),
    ).toBe(true);
    expect(
      result.view.nodes.every((node) =>
        LAYER_SCHEMES.current_state_zones_v1.includes(node.layer),
      ),
    ).toBe(true);
    expect(
      validateArchitectureView(result.view).filter(
        (issue) => issue.level === "error",
      ),
    ).toEqual([]);
    expect(
      result.view.nodes
        .filter((node) =>
          ["enterprise_warehouse", "data_marts"].includes(node.layer),
        )
        .every((node) => node.semanticRole === "data_store"),
    ).toBe(true);
  });
});
