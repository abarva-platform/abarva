import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CATEGORY_TO_ARCHETYPE_ID } from "@/lib/source/archetypes/event-archetype-resolver";
import {
  buildCandidateSupplierRegistryImportPlan,
  parseCandidateSupplierRegistryImportArgs,
  runCandidateSupplierRegistryImport,
} from "../../../../scripts/source/load-candidate-supplier-registry";

const inputPath = path.join(
  process.cwd(),
  "datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv",
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

function args(
  overrides: Partial<ReturnType<typeof parseCandidateSupplierRegistryImportArgs>> = {},
) {
  return {
    ...parseCandidateSupplierRegistryImportArgs(
      ["--input", inputPath, "--load-run-id", "test-load-run"],
      testEnv,
    ),
    ...overrides,
  };
}

describe("candidate supplier registry loader", () => {
  it("plans only validated eligible suppliers without contact or event authority", () => {
    const plan = buildCandidateSupplierRegistryImportPlan({ args: args(), csvText });
    const expectedArchetypes = categoryRoutedArchetypeIds();

    expect(plan.rowCount).toBe(25);
    expect(plan.suppliers).toHaveLength(20);
    expect(plan.validation.summary.eligibleCandidateRows).toBe(20);
    expect(plan.validation.summary.negativeControlRows).toBe(5);
    expect(plan.validation.summary.coveredArchetypeCount).toBe(10);
    expect(plan.archetypes).toEqual(expectedArchetypes);
    expect(plan.failClosedControls.map((item) => item.expectedReason).sort()).toEqual([
      "draft_authority",
      "duplicate_identity",
      "mismatched_eligibility",
      "missing_contact_authority",
      "missing_lineage",
    ]);
    expect(plan.suppliers.every((supplier) => /^[a-f0-9]{64}$/.test(supplier.sourceSha256))).toBe(
      true,
    );
    expect(plan.suppliers.every((supplier) => supplier.contacts.length === 0)).toBe(true);
    expect(JSON.stringify(plan)).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(plan.authority).toEqual({
      dryRunDefault: true,
      supplierRegistryRowsOnly: true,
      candidateSupplierAuthoritiesWritten: false,
      eventsCreated: false,
      suppliersContacted: false,
      emailsSent: false,
    });
  });

  it("fails before planning when the fixture no longer satisfies the governed package", () => {
    const lines = csvText.trimEnd().split(/\r?\n/u);
    const partialCsv = `${lines
      .filter((line) => !line.startsWith("SYN-SUP-AMS-002,"))
      .join("\n")}\n`;

    expect(() =>
      buildCandidateSupplierRegistryImportPlan({ args: args(), csvText: partialCsv }),
    ).toThrow(/Archetype AMS_MANAGED_SERVICES has 1 eligible candidate row/);
  });

  it("requires an explicit non-global tenant for apply mode", () => {
    expect(() => parseCandidateSupplierRegistryImportArgs(["--apply"], testEnv)).toThrow(
      "Apply mode requires --tenant-key.",
    );
    expect(() =>
      parseCandidateSupplierRegistryImportArgs(
        [
          "--apply",
          "--operator-job",
          "--tenant-key",
          "corpus_global",
          "--input",
          inputPath,
          "--input-source-version",
          "candidate-supplier-registry-v1",
          "--input-sha256",
          csvSha256,
          "--load-run-id",
          "supplier-registry-load-20260922",
          "--idempotency-key",
          "supplier-registry:corpus-global:v1",
        ],
        testEnv,
      ),
    ).toThrow(/corpus_global cannot be used for apply/);
  });

  it("requires the full operator job contract before ACA execution", () => {
    expect(() =>
      parseCandidateSupplierRegistryImportArgs(["--operator-job", "--input", inputPath], testEnv),
    ).toThrow(/Operator job mode requires --tenant-key/);
    expect(() =>
      parseCandidateSupplierRegistryImportArgs(
        ["--operator-job", "--tenant-key", "synthetic_test", "--input", inputPath],
        testEnv,
      ),
    ).toThrow(/--input-source-version/);
    expect(() =>
      parseCandidateSupplierRegistryImportArgs(
        [
          "--operator-job",
          "--tenant-key",
          "synthetic_test",
          "--input",
          inputPath,
          "--input-source-version",
          "candidate-supplier-registry-v1",
          "--load-run-id",
          "supplier-registry-load-20260922",
        ],
        testEnv,
      ),
    ).toThrow(/--input-sha256/);
    expect(() =>
      parseCandidateSupplierRegistryImportArgs(
        [
          "--operator-job",
          "--tenant-key",
          "synthetic_test",
          "--input",
          inputPath,
          "--input-source-version",
          "candidate-supplier-registry-v1",
          "--input-sha256",
          "a".repeat(64),
          "--load-run-id",
          "supplier-registry-load-20260922",
        ],
        testEnv,
      ),
    ).toThrow(/--idempotency-key/);
  });

  it("runs a dry plan with no database configuration and writes auditable proof", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-supplier-registry-plan-"));
    const priorDatabaseUrl = process.env.DATABASE_URL;
    const priorSourceUrl = process.env.SOURCE_CONTEXT_DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.SOURCE_CONTEXT_DATABASE_URL;
    try {
      const result = await runCandidateSupplierRegistryImport(args({ outDir }));
      const proof = JSON.parse(
        readFileSync(path.join(outDir, "candidate-supplier-registry-import-plan.json"), "utf8"),
      ) as { supplierCount: number; validation: { status: string } };

      expect(result.committed).toBe(false);
      expect(result.inserted).toBe(0);
      expect(proof.supplierCount).toBe(20);
      expect(proof.validation.status).toBe("pass");
    } finally {
      if (priorDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = priorDatabaseUrl;
      if (priorSourceUrl === undefined) delete process.env.SOURCE_CONTEXT_DATABASE_URL;
      else process.env.SOURCE_CONTEXT_DATABASE_URL = priorSourceUrl;
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("rejects a mismatched immutable input hash before any plan or database access", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-supplier-registry-hash-"));
    try {
      await expect(
        runCandidateSupplierRegistryImport(
          args({
            operatorJob: true,
            tenantKey: "synthetic_test",
            outDir,
            expectedInputSha256: "0".repeat(64),
            inputSourceVersion: "candidate-supplier-registry-v1",
            idempotencyKey: "candidate-supplier-registry:synthetic-test:v1",
          }),
        ),
      ).rejects.toThrow(/input SHA mismatch/);
      expect(
        existsSync(path.join(outDir, "candidate-supplier-registry-import-plan.json")),
      ).toBe(false);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("emits a tarball proof bundle for the ACA wrapper in dry-run mode", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-supplier-registry-proof-"));
    const bundleOut = path.join(outDir, "decoded-proof");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      const result = await runCandidateSupplierRegistryImport(
        args({
          outDir,
          operatorJob: true,
          tenantKey: "synthetic_test",
          inputSourceVersion: "candidate-supplier-registry-v1",
          expectedInputSha256: csvSha256,
          idempotencyKey: "candidate-supplier-registry:synthetic-test:v1",
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
        inputSourceVersion: "candidate-supplier-registry-v1",
        idempotencyKey: "candidate-supplier-registry:synthetic-test:v1",
      });
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
            "candidate-supplier-registry-import-plan.json",
          ),
        ),
      ).toBe(true);
      const marker = consoleSpy.mock.calls
        .map(([line]) => String(line))
        .find((line) => line.startsWith("__SOURCE_CANDIDATE_SUPPLIER_PROOF_SUMMARY__"));
      expect(marker).toBeDefined();
      expect(JSON.parse(marker!.split("__SOURCE_CANDIDATE_SUPPLIER_PROOF_SUMMARY__")[1])).toMatchObject({
        event: "source_candidate_supplier_registry_import_proof_summary",
        mode: "dry_run",
        rowCount: 25,
        supplierCount: 20,
        archetypeCount: 10,
        failClosedControlCount: 5,
        inputSha256: csvSha256,
        inserted: 0,
        committed: false,
      });
    } finally {
      consoleSpy.mockRestore();
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it("rejects apply before opening a database when operator approval is absent", async () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "source-supplier-registry-reject-"));
    try {
      await expect(
        runCandidateSupplierRegistryImport(
          args({
            apply: true,
            approved: false,
            confirmation: "APPLY_CANDIDATE_SUPPLIER_REGISTRY",
            tenantKey: "synthetic_test",
            outDir,
          }),
        ),
      ).rejects.toThrow(/requires SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IMPORT_APPLY_APPROVED=true/);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
