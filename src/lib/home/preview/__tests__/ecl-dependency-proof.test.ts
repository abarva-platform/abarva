import { buildHomeDependencyProof } from "../ecl-dependency-proof";
import type { HomeProjectionRow } from "../ecl-projection-bundle";

function row(
  key: string,
  type: string,
  objectId: string,
  payload: Record<string, unknown>,
): HomeProjectionRow {
  return {
    page_key: type === "relationship" ? "relationships" : `${type}s_controls`,
    row_key: key,
    row_type: type,
    title: key,
    summary: null,
    primary_object_id: objectId,
    projection_entry_id: key,
    source_hash: key,
    source_refs_json: [],
    display_payload_json: payload,
    admission_status: "not_applicable",
  };
}

function edge(
  key: string,
  fromId: string,
  fromName: string,
  toId: string,
  toName: string,
  type: string,
): HomeProjectionRow {
  return row(key, "relationship", fromId, {
    scope: "risk_and_program_dependency_slice",
    from_object_id: fromId,
    from_object_name: fromName,
    from_object_type: "risk",
    to_object_id: toId,
    to_object_name: toName,
    to_object_type: type === "SUPPLIED_BY" ? "vendor" : "application",
    relationship_type: type,
    source_as_of: "2026-09-30",
  });
}

describe("Home canonical dependency proof", () => {
  it("joins by object ID, not by repeated display name", () => {
    const rows = [
      row("risk-a", "risk", "risk-id", {
        severity: "critical", control_state: "unknown",
      }),
      edge("edge-a", "risk-id", "Risk", "app-a", "Shared application name", "APPLIES_TO"),
      edge("edge-b", "app-b", "Shared application name", "vendor-b", "Wrong supplier", "SUPPLIED_BY"),
    ];
    const proof = buildHomeDependencyProof(rows, (item) => [`source-${item.row_key}`]);
    expect(proof?.riskPaths).toHaveLength(1);
    expect(proof?.riskPaths[0].asset.id).toBe("app-a");
    expect(proof?.riskPaths[0].supplier).toBeNull();
    expect(proof?.riskPaths[0].sourceRefs).not.toContain("source-edge-b");
  });

  it("excludes an uncited relationship instead of borrowing another row's evidence", () => {
    const rows = [
      row("risk-a", "risk", "risk-id", {
        severity: "critical", control_state: "unknown",
      }),
      edge("edge-a", "risk-id", "Risk", "app-a", "Application", "APPLIES_TO"),
    ];
    expect(buildHomeDependencyProof(rows, (item) =>
      item.row_key === "edge-a" ? [] : [`source-${item.row_key}`])).toBeNull();
  });
});
