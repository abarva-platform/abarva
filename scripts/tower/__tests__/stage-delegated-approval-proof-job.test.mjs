import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

import { proofInputs, proofPath, uploadExact } from "../stage-delegated-approval-proof-job.mjs";

const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const authority = {
  authority_id: "integrated-manager-anand-20261012", status: "active",
  authorizer: "Anand Sundaram", actor: { session_id: "manager-thread" },
  human_authorization_reference: { message_id: "human-message" },
  independent_human_attestation: false, independent_finance_attestation: false,
};
const decision = {
  decisionId: "delegated-tower-source-fields-serving-20261012-001",
  status: "approved_with_execution_conditions", authorizer: "Anand Sundaram",
  managerThreadId: "manager-thread", humanAuthorizationMessageId: "human-message",
  independentHumanClientOrFinanceAttestation: false,
};
const encoded = (value) => Buffer.from(JSON.stringify(value)).toString("base64");
const digest = (value) => sha(Buffer.from(JSON.stringify(value)));
function validEnv() {
  const imageDigest = `sha256:${"a".repeat(64)}`;
  return {
    DELEGATED_PROOF_SECRET_AUTHORITY_BASE64: encoded(authority),
    DELEGATED_PROOF_SECRET_DECISION_BASE64: encoded(decision),
    DELEGATED_PROOF_AUTHORITY_SHA256: digest(authority),
    DELEGATED_PROOF_DECISION_SHA256: digest(decision),
    DELEGATED_PROOF_AUTHORITY_ID: authority.authority_id,
    DELEGATED_PROOF_DECISION_ID: decision.decisionId,
    DELEGATED_PROOF_BLOB_ACCOUNT: "stabarvaprivatedplab001",
    DELEGATED_PROOF_BLOB_CONTAINER: "ecl-synthetic-intake",
    DELEGATED_PROOF_RUN_ID: "proof_20261012", DELEGATED_PROOF_IDEMPOTENCY_KEY: "proof-key",
    DELEGATED_PROOF_OPERATOR_IDENTITY: "Tower operator",
    DELEGATED_PROOF_GIT_SHA: "b".repeat(40),
    DELEGATED_PROOF_IMAGE_DIGEST: imageDigest,
    ABARVA_OPERATOR_IMAGE_DIGEST: imageDigest,
    DELEGATED_PROOF_JOB_NAME: "job-abarva-private-operator-eus",
    DELEGATED_PROOF_RELEASE_RECORD: "docs/releases/records/2026-10-12-delegated-approval-proof-staging.md",
    DELEGATED_PROOF_EXECUTION_LANE: "aca_operator_job",
  };
}

test("exact authority and decision bytes bind to the private proof path", () => {
  const parsed = proofInputs(validEnv());
  assert.equal(parsed.authoritySha, digest(authority));
  assert.equal(parsed.decisionSha, digest(decision));
  assert.equal(proofPath(parsed.authorityId, parsed.authoritySha, "authority"),
    `operator-proof/delegated-approvals/${authority.authority_id}/${digest(authority)}/authority.json`);
});

test("changed bytes, mismatched reviewer provenance, or independent attestation fail closed", () => {
  const changed = validEnv();
  changed.DELEGATED_PROOF_SECRET_DECISION_BASE64 = encoded({ ...decision, status: "denied" });
  assert.throws(() => proofInputs(changed), /SHA-256 mismatch/);
  const wrongManager = validEnv();
  wrongManager.DELEGATED_PROOF_SECRET_DECISION_BASE64 = encoded({ ...decision, managerThreadId: "other" });
  wrongManager.DELEGATED_PROOF_DECISION_SHA256 = digest({ ...decision, managerThreadId: "other" });
  assert.throws(() => proofInputs(wrongManager), /identity mismatch/);
  const falseAttestation = validEnv();
  falseAttestation.DELEGATED_PROOF_SECRET_DECISION_BASE64 = encoded({ ...decision,
    independentHumanClientOrFinanceAttestation: true });
  falseAttestation.DELEGATED_PROOF_DECISION_SHA256 = digest({ ...decision,
    independentHumanClientOrFinanceAttestation: true });
  assert.throws(() => proofInputs(falseAttestation), /identity mismatch/);
});

test("existing proof must have the exact bytes", async () => {
  const config = proofInputs(validEnv());
  const correct = Buffer.from(JSON.stringify(authority));
  const blob = {
    uploadData: async () => { const error = new Error("exists"); error.statusCode = 412; throw error; },
    downloadToBuffer: async () => correct,
  };
  const container = { getBlockBlobClient: () => blob };
  const result = await uploadExact(container, config, "authority");
  assert.equal(result.sha256, digest(authority));
  blob.downloadToBuffer = async () => Buffer.from("changed");
  await assert.rejects(uploadExact(container, config, "authority"), /readback mismatch/);
});
