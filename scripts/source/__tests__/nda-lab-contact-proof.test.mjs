import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateNdaLabContactProof } from "../validate-nda-lab-contact-proof.mjs";

test("contact proof accepts exact dry run and rejects a disguised write", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "nda-contact-proof-"));
  try {
    const dir = path.join(root, "source-nda-lab-contact-job");
    mkdirSync(dir);
    const hash = "a".repeat(64);
    const digest = `sha256:${"b".repeat(64)}`;
    const contract = { mode: "dry_run", inputSha256: hash, runId: "run-1", imageDigest: digest };
    const summary = {
      schemaVersion: 1, event: "source_nda_lab_contact_intake_proof", mode: "dry_run",
      status: "succeeded", contract: { tenantKey: "meridian-health", inputSha256: hash,
        inputSourceVersion: "v1", runId: "run-1", imageDigest: digest },
      expectedCount: 4, validatedCount: 4, inserted: 0, committed: false,
      authority: { syntheticLabOnly: true, contactApprovalsWritten: false,
        suppliersContacted: false, emailsSent: false },
      blobProofLocation: "not_required_for_dry_run",
    };
    const write = (value) => writeFileSync(path.join(dir, "proof-manifest.json"), JSON.stringify(value));
    const run = { status: "Succeeded", ok: true, restored: { restored: true,
      idleVerification: { idleVerified: true, problems: [] } },
    proof: { extracted: true, extractDir: root } };
    write(summary);
    assert.equal(validateNdaLabContactProof(contract, run).committed, false);
    write({ ...summary, committed: true });
    assert.throws(() => validateNdaLabContactProof(contract, run), /Dry run wrote contacts/);
    write({ ...summary, mode: "apply", committed: true, blobProofLocation: "https://example.test" });
    assert.throws(() => validateNdaLabContactProof(contract, run), /identity mismatch/);
    write(summary);
    assert.throws(() => validateNdaLabContactProof(contract, { ...run, restored: null }),
      /idle restore is unverified/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
