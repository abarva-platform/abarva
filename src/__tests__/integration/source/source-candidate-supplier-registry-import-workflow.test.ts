import { readFileSync } from "node:fs";

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
});
