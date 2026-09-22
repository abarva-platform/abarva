import { readFileSync } from "node:fs";

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
});
