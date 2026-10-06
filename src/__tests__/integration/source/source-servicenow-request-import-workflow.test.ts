import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const WORKFLOW_PATH =
  ".github/workflows/source-servicenow-request-import-job.yml";

function workflow(): string {
  return readFileSync(WORKFLOW_PATH, "utf8");
}

describe("ServiceNow request import workflow", () => {
  it("is manual and requires immutable scope", () => {
    const source = workflow();

    expect(source).toMatch(/workflow_dispatch:/);
    expect(source).not.toMatch(/\n\s+(push|pull_request|schedule):/);
    expect(source).toMatch(/tenant_key:[\s\S]*?required:\s*true/);
    expect(source).toMatch(/input_sha256:[\s\S]*?required:\s*true/);
    expect(source).not.toMatch(
      /tenant_key:[\s\S]{0,180}default:\s*corpus_global/,
    );
    expect(source).toMatch(/corpus_global is never a writable tenant scope/);
  });

  it("keeps human and branch gates around apply", () => {
    const source = workflow();

    expect(source).toMatch(/confirm_apply/);
    expect(source).toMatch(/APPLY_SERVICENOW_REQUESTS/);
    expect(source).toMatch(
      /approval_reference:[\s\S]*?required:\s*false/,
    );
    expect(source).toMatch(/approval_reference is required for apply/);
    expect(source).toMatch(/approval_reference_sha256/);
    expect(source).toMatch(/idempotency_key_sha256/);
    expect(source).toMatch(/GITHUB_REF.*refs\/heads\/main/);
    expect(source).toMatch(/source:servicenow-requests:apply-job/);
    expect(source).not.toMatch(/run-migrations|db-migration-lab/);
  });

  it("reuses the single merged operator entrypoint", () => {
    const source = workflow();

    expect(source).toMatch(/source:servicenow-requests:job/);
    expect(source).toMatch(/source:servicenow-requests:apply-job/);
    expect(source).toMatch(/SOURCE_SERVICENOW_REQUEST_INPUT_SHA256/);
    expect(source).toMatch(/SOURCE_SERVICENOW_REQUEST_TENANT_KEY/);
    expect(source).not.toMatch(/load-servicenow-sourcing-requests-job/);
    expect(source).not.toMatch(/source:servicenow-requests:proof-job/);
  });

  it("requires matching, no-write proof before the dry run can pass", () => {
    const source = workflow();
    expect(source).toMatch(/Validate dry-run request proof/);
    expect(source).toMatch(/validate-servicenow-request-proof\.mjs/);

    const outDir = mkdtempSync(path.join(tmpdir(), "servicenow-workflow-proof-"));
    const contractPath = path.join(outDir, "workflow-contract.json");
    const summaryPath = path.join(outDir, "summary.json");
    const inputSha256 = "a".repeat(64);
    const contract = {
      mode: "dry_run", input_sha256: inputSha256,
      input_source_version: "extract-v1",
    };
    const summary = {
      status: "Succeeded", ok: true,
      restored: { restored: true, idleVerification: { idleVerified: true, problems: [] } },
      proof: { extracted: true, extractionKind: "source_servicenow_request_summary",
        proofBundleExtracted: false, summary: {
          schemaVersion: 1, event: "source_servicenow_request_import_proof_summary",
          mode: "dry_run", requestCount: 10, archetypeCount: 10,
          requiredFactGapCount: 0, missingArchetypeCount: 0,
          inputSha256, inputSourceVersion: "extract-v1", inserted: 0,
          committed: false, authority: { requestVersionsOnly: true,
            mappingDecisionsWritten: false, eventsCreated: false,
            suppliersContacted: false },
        } },
    };
    const run = (value: unknown) => {
      writeFileSync(contractPath, JSON.stringify(contract));
      writeFileSync(summaryPath, JSON.stringify(value));
      return spawnSync(process.execPath, [
        "scripts/source/validate-servicenow-request-proof.mjs",
        contractPath, summaryPath,
      ], { encoding: "utf8" });
    };
    try {
      expect(run(summary).status).toBe(0);
      expect(run({ ...summary, proof: { extracted: false } }).status).not.toBe(0);
      expect(run({ ...summary, proof: { ...summary.proof, summary: {
        ...summary.proof.summary, inputSha256: "b".repeat(64),
      } } }).status).not.toBe(0);
      expect(run({ ...summary, proof: { ...summary.proof, summary: {
        ...summary.proof.summary, committed: true,
      } } }).status).not.toBe(0);
      expect(run({ ...summary, proof: { ...summary.proof, summary: {
        ...summary.proof.summary, requestCount: 0,
      } } }).status).not.toBe(0);
      expect(run({ ...summary, proof: { ...summary.proof, summary: {
        ...summary.proof.summary, requiredFactGapCount: 1,
      } } }).status).not.toBe(0);
      expect(run({ ...summary, restored: { ...summary.restored,
        idleVerification: { idleVerified: false, problems: [] },
      } }).status).not.toBe(0);

      contract.mode = "apply";
      const applySummary = { ...summary, proof: { ...summary.proof, summary: {
        ...summary.proof.summary, mode: "apply", inserted: 10, committed: true,
      } } };
      expect(run(applySummary).status).toBe(0);
      expect(run({ ...applySummary, proof: { ...applySummary.proof, summary: {
        ...applySummary.proof.summary, committed: false,
      } } }).status).not.toBe(0);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
