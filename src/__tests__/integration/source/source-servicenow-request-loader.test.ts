import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CATEGORY_TO_ARCHETYPE_ID } from "@/lib/source/archetypes/event-archetype-resolver";
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
const csvSha256 = createHash("sha256").update(csvText, "utf8").digest("hex");
const testEnv = { NODE_ENV: "test" } as NodeJS.ProcessEnv;

function categoryRoutedArchetypeIds(): string[] {
  return [
    ...new Set(
      Object.values(CATEGORY_TO_ARCHETYPE_ID).filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ].sort();
}

function args(overrides: Partial<ReturnType<typeof parseServiceNowImportArgs>> = {}) {
  return {
    ...parseServiceNowImportArgs(
      ["--input", inputPath, "--load-run-id", "test-load-run"],
      testEnv,
    ),
    ...overrides,
  };
}

describe("ServiceNow sourcing request loader", () => {
  it("plans the governed fixture across every category-routed archetype without granting authority", () => {
    const plan = buildServiceNowImportPlan({ args: args(), csvText });
    const expectedArchetypes = categoryRoutedArchetypeIds();

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
      /does not cover category-routed archetypes/,
    );
  });

  it("requires an explicit tenant for apply mode", () => {
    expect(() => parseServiceNowImportArgs(["--apply"], testEnv)).toThrow(
      "Apply mode requires --tenant-key.",
    );
  });

  it("requires the full operator job contract before ACA execution", () => {
    expect(() =>
      parseServiceNowImportArgs(["--operator-job", "--input", inputPath], testEnv),
    ).toThrow(/Operator job mode requires --tenant-key/);

    expect(() =>
      parseServiceNowImportArgs(
        ["--operator-job", "--tenant-key", "synthetic_test", "--input", inputPath],
        testEnv,
      ),
    ).toThrow(/--input-source-version/);

    expect(() =>
      parseServiceNowImportArgs(
        [
          "--operator-job",
          "--tenant-key",
          "synthetic_test",
          "--input",
          inputPath,
          "--input-source-version",
          "servicenow-requests-v1",
          "--load-run-id",
          "servicenow-request-load-20260922",
        ],
        testEnv,
      ),
    ).toThrow(/--input-sha256/);

    expect(() =>
      parseServiceNowImportArgs(
        [
          "--operator-job",
          "--tenant-key",
          "synthetic_test",
          "--input",
          inputPath,
          "--input-source-version",
          "servicenow-requests-v1",
          "--input-sha256",
          "a".repeat(64),
          "--load-run-id",
          "servicenow-request-load-20260922",
        ],
        testEnv,
      ),
    ).toThrow(/--idempotency-key/);
  });

  it("rejects the cross-tenant corpus key for operator apply before database access", () => {
    expect(() =>
      parseServiceNowImportArgs(
        [
          "--apply",
          "--operator-job",
          "--tenant-key",
          "corpus_global",
          "--input",
          inputPath,
          "--input-source-version",
          "servicenow-requests-v1",
          "--input-sha256",
          csvSha256,
          "--load-run-id",
          "servicenow-request-load-20260922",
          "--idempotency-key",
          "servicenow-requests:corpus-global:v1",
        ],
        testEnv,
      ),
    ).toThrow(/corpus_global cannot be used for apply/);
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

  it("rejects a mismatched immutable input hash before any apply path can open a database", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-servicenow-hash-"));
    try {
      await expect(
        runServiceNowRequestImport(
          args({
            operatorJob: true,
            tenantKey: "synthetic_test",
            outDir,
            expectedInputSha256: "0".repeat(64),
            inputSourceVersion: "servicenow-requests-v1",
            idempotencyKey: "servicenow-requests:synthetic-test:v1",
          }),
        ),
      ).rejects.toThrow(/input SHA mismatch/);
      expect(existsSync(path.join(outDir, "servicenow-request-import-plan.json"))).toBe(
        false,
      );
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("emits a tarball proof bundle for the ACA wrapper in dry-run mode", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-servicenow-proof-"));
    const bundleOut = path.join(outDir, "decoded-proof");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      const result = await runServiceNowRequestImport(
        args({
          outDir,
          operatorJob: true,
          tenantKey: "synthetic_test",
          inputSourceVersion: "servicenow-requests-v1",
          expectedInputSha256: csvSha256,
          idempotencyKey: "servicenow-requests:synthetic-test:v1",
          emitProofBundle: true,
        }),
      );
      const proofManifest = JSON.parse(
        readFileSync(path.join(outDir, "proof-manifest.json"), "utf8"),
      ) as {
        contract: {
          tenantKey: string;
          inputSourceVersion: string;
          idempotencyKey: string;
        };
        blobCompatible: boolean;
      };

      expect(result.committed).toBe(false);
      expect(proofManifest.blobCompatible).toBe(true);
      expect(proofManifest.contract).toMatchObject({
        tenantKey: "synthetic_test",
        inputSourceVersion: "servicenow-requests-v1",
        idempotencyKey: "servicenow-requests:synthetic-test:v1",
      });
      const finalLog = consoleSpy.mock.calls.at(-1)?.[0] as string;
      expect(finalLog).toMatch(/^__SOURCE_SERVICENOW_REQUEST_PROOF_SUMMARY__\{/);
      const summary = JSON.parse(
        finalLog.slice("__SOURCE_SERVICENOW_REQUEST_PROOF_SUMMARY__".length),
      );
      expect(summary).toEqual({
        schemaVersion: 1,
        event: "source_servicenow_request_import_proof_summary",
        mode: "dry_run",
        requestCount: 10,
        archetypeCount: 10,
        requiredFactGapCount: 0,
        missingArchetypeCount: 0,
        inputSha256: csvSha256,
        inputSourceVersion: "servicenow-requests-v1",
        inserted: 0,
        committed: false,
        authority: {
          requestVersionsOnly: true,
          mappingDecisionsWritten: false,
          eventsCreated: false,
          suppliersContacted: false,
        },
      });
      expect(finalLog).not.toContain("synthetic_test");
      expect(finalLog).not.toContain("idempotency");
      expect(finalLog).not.toContain("rawSource");
      mkdirSync(bundleOut, { recursive: true });
      const tar = spawnSync("tar", ["-xzf", path.join(outDir, "proof-bundle.tgz"), "-C", bundleOut], {
        encoding: "utf8",
      });
      expect(tar.status).toBe(0);
      expect(
        existsSync(
          path.join(
            bundleOut,
            path.basename(outDir),
            "servicenow-request-import-plan.json",
          ),
        ),
      ).toBe(true);
    } finally {
      consoleSpy.mockRestore();
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("keeps the operator summary extractable from a real CLI log tail", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-servicenow-cli-proof-"));
    const wrapper = await import("../../../../scripts/ops/submit-aca-operator-job.mjs");
    try {
      const run = spawnSync(
        process.execPath,
        [
          path.join(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
          "scripts/source/load-servicenow-sourcing-requests.ts",
          "--operator-job",
          "--emit-proof-bundle",
          "--tenant-key", "synthetic_test",
          "--input", inputPath,
          "--input-source-version", "extract-v1",
          "--input-sha256", csvSha256,
          "--load-run-id", "test-load-run",
          "--idempotency-key", "test-idempotency-key",
          "--out-dir", outDir,
        ],
        {
          encoding: "utf8",
          maxBuffer: 16 * 1024 * 1024,
          env: { ...process.env, DATABASE_URL: "", SOURCE_CONTEXT_DATABASE_URL: "" },
        },
      );
      expect(run.status).toBe(0);
      expect(run.stderr).toBe("");
      const logLines = run.stdout.trimEnd().split("\n");
      expect(logLines.at(-1)).toMatch(/^__SOURCE_SERVICENOW_REQUEST_PROOF_SUMMARY__\{/);
      expect(run.stdout).not.toContain("synthetic_test");
      const tail = logLines.slice(-300).join("\n");
      const proof = wrapper.extractProofBundle(tail, outDir);
      expect(proof).toMatchObject({
        extracted: true,
        summary: {
          mode: "dry_run",
          requestCount: 10,
          archetypeCount: 10,
          requiredFactGapCount: 0,
          missingArchetypeCount: 0,
          inputSha256: csvSha256,
          inputSourceVersion: "extract-v1",
          inserted: 0,
          committed: false,
        },
      });
      const fullOutDir = path.join(outDir, "full-extraction");
      mkdirSync(fullOutDir);
      expect(wrapper.extractProofBundle(run.stdout, fullOutDir)).toMatchObject({
        extracted: true,
        extractionKind: "proof_bundle",
        proofBundleExtracted: true,
        summary: { requestCount: 10, archetypeCount: 10 },
      });
      expect(existsSync(path.join(fullOutDir, "proof.tgz"))).toBe(true);
    } finally {
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
