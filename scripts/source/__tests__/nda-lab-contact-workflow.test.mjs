import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import yaml from "js-yaml";

test("lab contact workflow has a manual, hash-pinned, separately approved apply path", () => {
  const workflow = yaml.load(readFileSync(
    ".github/workflows/source-nda-lab-contact-intake-job.yml", "utf8"));
  assert.deepEqual(Object.keys(workflow.on), ["workflow_dispatch"]);
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.mode.options, ["dry_run", "apply"]);
  const job = workflow.jobs["lab-contact-intake"];
  assert.equal(job.environment, "production");
  const scope = job.steps.find((step) => step.id === "scope").run;
  assert.match(scope, /actual=.*sha256sum datasets\/source\/source-nda-lab-contacts-v1\/contacts\.csv/);
  assert.match(scope, /\[\[ "\$actual" == "\$expected" \]\]/);
  assert.match(scope, /\[\[ "\$GITHUB_REF" == 'refs\/heads\/main' \]\]/);
  assert.match(scope, /\[\[ "\$CONFIRM_APPLY" == 'APPLY_NDA_LAB_CONTACTS' \]\]/);
  assert.match(scope, /\[\[ -n "\$APPROVAL_REFERENCE" \]\]/);
  const dryRun = job.steps.find((step) => step.name === "Run dry-run through private ACA operator");
  const apply = job.steps.find((step) => step.name === "Run separately approved apply through private ACA operator");
  assert.equal(dryRun.if, "inputs.mode == 'dry_run'");
  assert.equal(apply.if, "inputs.mode == 'apply'");
  assert.doesNotMatch(dryRun.run, /--secret-env DATABASE_URL/);
  assert.match(apply.run, /--secret-env DATABASE_URL=azure-postgres-control-database-url/);
  assert.match(apply.run, /--env SOURCE_NDA_CONTACT_APPLY_APPROVED=true/);
  assert.match(apply.run, /--env SOURCE_NDA_CONTACT_PROOF_ACCOUNT_URL=/);
  assert.equal(job.steps.find((step) => step.name === "Validate operator quality proof").run.includes(
    "validate-nda-lab-contact-proof.mjs"), true);
});

test("contact operator and validator read the same mode-specific proof directory", () => {
  const workflow = yaml.load(readFileSync(
    ".github/workflows/source-nda-lab-contact-intake-job.yml", "utf8"));
  const job = workflow.jobs["lab-contact-intake"];
  const proofDir = job.env.PROOF_OUTPUT_DIR;
  assert.match(proofDir, /inputs\.mode == 'dry_run'/);
  assert.match(proofDir, /live-dry-run/);
  assert.match(proofDir, /live-apply/);
  for (const name of [
    "Run dry-run through private ACA operator",
    "Run separately approved apply through private ACA operator",
  ]) {
    assert.match(job.steps.find((step) => step.name === name).run,
      /--out-dir audit-artifacts\/source-nda-lab-contact-intake-job\/\$PROOF_OUTPUT_DIR/);
  }
  assert.match(job.steps.find((step) => step.name === "Validate operator quality proof").run,
    /audit-artifacts\/source-nda-lab-contact-intake-job\/\$PROOF_OUTPUT_DIR\/summary\.json/);
});
