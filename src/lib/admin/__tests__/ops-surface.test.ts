import {
  buildAdminOpsSurfaceModel,
  getReadyAdminOps,
} from "../ops-surface";

describe("admin ops surface", () => {
  it("models governed operational actions without raw execution", () => {
    const model = buildAdminOpsSurfaceModel(
      new Date("2026-06-03T12:00:00.000Z"),
    );

    expect(model.generatedAt).toBe("2026-06-03T12:00:00.000Z");
    expect(model.operations).toHaveLength(6);
    expect(model.statusCounts).toEqual({
      ready: 1,
      gated: 3,
      blocked: 1,
      external: 1,
    });
    expect(model.requiredControls.join(" ")).toMatch(/one client/);
    expect(model.requiredControls.join(" ")).toMatch(/Dry-run output/);
  });

  it("keeps high-risk operations behind approval or external gates", () => {
    const model = buildAdminOpsSurfaceModel();
    const highRisk = model.operations.filter((operation) => operation.risk === "high");

    expect(highRisk).not.toHaveLength(0);
    expect(
      highRisk.every((operation) =>
        ["ready", "blocked", "external"].includes(operation.status) ||
        operation.approvalPath.toLowerCase().includes("approval"),
      ),
    ).toBe(true);
    expect(
      highRisk.every((operation) => operation.auditEvidence.length >= 4),
    ).toBe(true);
  });

  it("only reports migration dry-run as ready today", () => {
    const ready = getReadyAdminOps(buildAdminOpsSurfaceModel());

    expect(ready.map((operation) => operation.id)).toEqual([
      "migration-dry-run",
    ]);
    expect(ready[0].dryRunRequired).toBe(true);
  });
});
