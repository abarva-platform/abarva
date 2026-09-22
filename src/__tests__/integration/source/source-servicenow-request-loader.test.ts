import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { listSourceArchetypes } from "@/lib/source/archetypes/registry";
import {
  buildServiceNowImportPlan,
  parseServiceNowImportArgs,
  runServiceNowRequestImport,
} from "../../../../scripts/source/load-servicenow-sourcing-requests";

const inputPath = path.join(
  process.cwd(),
  "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv",
);
const csvText = readFileSync(inputPath, "utf8");

function args(overrides: Partial<ReturnType<typeof parseServiceNowImportArgs>> = {}) {
  return {
    ...parseServiceNowImportArgs(
      ["--input", inputPath, "--load-run-id", "test-load-run"],
      {},
    ),
    ...overrides,
  };
}

describe("ServiceNow sourcing request loader", () => {
  it("plans the governed fixture across every registered archetype without granting authority", () => {
    const plan = buildServiceNowImportPlan({ args: args(), csvText });
    const expectedArchetypes = listSourceArchetypes()
      .map((archetype) => archetype.id)
      .sort();

    expect(plan.rowCount).toBe(10);
    expect(plan.domains).toEqual(["delivery", "enterprise", "it", "plan"]);
    expect(plan.archetypes).toEqual(expectedArchetypes);
    expect(plan.missingArchetypes).toEqual([]);
    expect(plan.requests).toHaveLength(10);
    expect(plan.categories).toHaveLength(10);
    expect(plan.requests.every((request) => request.requiredFactGaps.length === 0)).toBe(
      true,
    );
    expect(
      plan.requests.every(
        (request) =>
          request.mappingProposal.categoryId &&
          request.mappingProposal.archetypeId &&
          Array.isArray(request.mappingProposal.reasons) &&
          request.mappingProposal.reasons.length > 0,
      ),
    ).toBe(true);
    expect(plan.requests.every((request) => /^[a-f0-9]{64}$/.test(request.sourceSha256))).toBe(
      true,
    );
    expect(plan.authority).toEqual({
      requestVersionsOnly: true,
      mappingDecisionsWritten: false,
      eventsCreated: false,
      suppliersContacted: false,
    });
  });

  it("fails when a supposedly complete synthetic fixture omits an archetype", () => {
    const lines = csvText.trimEnd().split("\n");
    const partialCsv = `${lines.slice(0, -1).join("\n")}\n`;

    expect(() => buildServiceNowImportPlan({ args: args(), csvText: partialCsv })).toThrow(
      /does not cover registered archetypes/,
    );
  });

  it("requires an explicit tenant for apply mode", () => {
    expect(() => parseServiceNowImportArgs(["--apply"], {})).toThrow(
      "Apply mode requires --tenant-key.",
    );
  });

  it("runs a dry plan with no database configuration and writes auditable proof", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-servicenow-plan-"));
    const priorDatabaseUrl = process.env.DATABASE_URL;
    const priorSourceUrl = process.env.SOURCE_CONTEXT_DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.SOURCE_CONTEXT_DATABASE_URL;
    try {
      const result = await runServiceNowRequestImport(args({ outDir }));
      const proof = JSON.parse(
        readFileSync(path.join(outDir, "servicenow-request-import-plan.json"), "utf8"),
      ) as { rowCount: number; missingArchetypes: string[] };

      expect(result.committed).toBe(false);
      expect(result.inserted).toBe(0);
      expect(proof.rowCount).toBe(10);
      expect(proof.missingArchetypes).toEqual([]);
    } finally {
      if (priorDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = priorDatabaseUrl;
      if (priorSourceUrl === undefined) delete process.env.SOURCE_CONTEXT_DATABASE_URL;
      else process.env.SOURCE_CONTEXT_DATABASE_URL = priorSourceUrl;
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("rejects apply before opening a database when operator approval is absent", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-servicenow-reject-"));
    try {
      await expect(
        runServiceNowRequestImport(
          args({
            apply: true,
            approved: false,
            confirmation: "APPLY_SERVICENOW_REQUESTS",
            tenantKey: "synthetic_test",
            outDir,
          }),
        ),
      ).rejects.toThrow(/requires SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_APPROVED=true/);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
