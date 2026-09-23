import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const WORKFLOW_PATH =
  ".github/workflows/source-candidate-supplier-registry-import-job.yml";

function workflow(): string {
  return readFileSync(WORKFLOW_PATH, "utf8");
}

describe("candidate supplier registry import workflow", () => {
  it("is manual and requires immutable tenant-scoped input identity", () => {
    const source = workflow();

    expect(source).toMatch(/workflow_dispatch:/);
    expect(source).not.toMatch(/\n\s+(push|pull_request|schedule):/);
    expect(source).toMatch(/tenant_key:[\s\S]*?required:\s*true/);
    expect(source).toMatch(/input_source_version:[\s\S]*?required:\s*true/);
    expect(source).toMatch(/input_sha256:[\s\S]*?required:\s*true/);
    expect(source).not.toMatch(
      /tenant_key:[\s\S]{0,180}default:\s*corpus_global/,
    );
    expect(source).toMatch(/corpus_global is never a writable tenant scope/);
  });

  it("keeps human and branch gates around apply", () => {
    const source = workflow();

    expect(source).toMatch(/confirm_apply/);
    expect(source).toMatch(/APPLY_CANDIDATE_SUPPLIER_REGISTRY/);
    expect(source).toMatch(/approval_reference:[\s\S]*?required:\s*false/);
    expect(source).toMatch(/approval_reference is required for apply/);
    expect(source).toMatch(/approval_reference_sha256/);
    expect(source).toMatch(/idempotency_key_sha256/);
    expect(source).toMatch(/GITHUB_REF.*refs\/heads\/main/);
    expect(source).toMatch(/source:candidate-supplier-registry:apply-job/);
    expect(source).not.toMatch(/run-migrations|db-migration-lab/);
  });

  it("reuses the single operator entrypoint and never shifts shared traffic", () => {
    const source = workflow();

    expect(source).toMatch(/source:candidate-supplier-registry:job/);
    expect(source).toMatch(/source:candidate-supplier-registry:apply-job/);
    expect(source).toMatch(/SOURCE_CANDIDATE_SUPPLIER_REGISTRY_INPUT_SHA256/);
    expect(source).toMatch(/SOURCE_CANDIDATE_SUPPLIER_REGISTRY_TENANT_KEY/);
    expect(source).toMatch(/Resolve current digest-pinned image/);
    expect(source).not.toMatch(/az containerapp update|az acr build|traffic-weight/);
  });

  it("requires matching no-write proof before a dry run can pass", () => {
    expect(workflow()).toMatch(/validate-candidate-supplier-proof\.mjs/);
    const outDir = mkdtempSync(path.join(tmpdir(), "supplier-workflow-proof-"));
    const contractPath = path.join(outDir, "workflow-contract.json");
    const runPath = path.join(outDir, "summary.json");
    const contract = { mode: "dry_run", input_sha256: "a".repeat(64), input_source_version: "v1" };
    const proofSummary = {
      schemaVersion: 1, event: "source_candidate_supplier_registry_import_proof_summary",
      mode: "dry_run", rowCount: 25, supplierCount: 20, archetypeCount: 10,
      failClosedControlCount: 5, inputSha256: contract.input_sha256,
      inputSourceVersion: "v1", inserted: 0, committed: false,
      authority: { dryRunDefault: true, supplierRegistryRowsOnly: true,
        candidateSupplierAuthoritiesWritten: false, eventsCreated: false,
        suppliersContacted: false, emailsSent: false },
    };
    const runSummary = { status: "Succeeded", ok: true,
      restored: { restored: true, idleVerification: { idleVerified: true, problems: [] } },
      proof: { extracted: true, extractionKind: "source_candidate_supplier_summary",
        summary: proofSummary } };
    const check = (value: unknown) => {
      writeFileSync(contractPath, JSON.stringify(contract));
      writeFileSync(runPath, JSON.stringify(value));
      return spawnSync(process.execPath, [
        "scripts/source/validate-candidate-supplier-proof.mjs", contractPath, runPath,
      ], { encoding: "utf8" }).status;
    };
    try {
      expect(check(runSummary)).toBe(0);
      expect(check({ ...runSummary, proof: { extracted: false } })).not.toBe(0);
      expect(check({ ...runSummary, proof: { ...runSummary.proof, summary: {
        ...proofSummary, inputSha256: "b".repeat(64),
      } } })).not.toBe(0);
      expect(check({ ...runSummary, proof: { ...runSummary.proof, summary: {
        ...proofSummary, authority: { ...proofSummary.authority, suppliersContacted: true },
      } } })).not.toBe(0);
      expect(check({ ...runSummary, proof: { ...runSummary.proof, summary: {
        ...proofSummary, inserted: 1,
      } } })).not.toBe(0);
      expect(check({ ...runSummary, proof: { ...runSummary.proof, summary: {
        ...proofSummary, failClosedControlCount: 4,
      } } })).not.toBe(0);

      contract.mode = "apply";
      const applySummary = { ...runSummary, proof: { ...runSummary.proof, summary: {
        ...proofSummary, mode: "apply", inserted: 20, committed: true,
      } } };
      expect(check(applySummary)).toBe(0);
      expect(check({ ...applySummary, proof: { ...applySummary.proof, summary: {
        ...applySummary.proof.summary, committed: false,
      } } })).not.toBe(0);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
