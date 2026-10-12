#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

export function proofPath(authorityId, digest, kind) {
  if (!SAFE_ID.test(authorityId) || !SHA256.test(digest) || !["authority", "decision"].includes(kind)) {
    throw new Error("Delegated approval proof identity is invalid");
  }
  return `operator-proof/delegated-approvals/${authorityId}/${digest}/${kind}.json`;
}

export function proofInputs(env = process.env) {
  const authorityBytes = Buffer.from(required(env, "DELEGATED_PROOF_SECRET_AUTHORITY_BASE64"), "base64");
  const decisionBytes = Buffer.from(required(env, "DELEGATED_PROOF_SECRET_DECISION_BASE64"), "base64");
  const authoritySha = required(env, "DELEGATED_PROOF_AUTHORITY_SHA256");
  const decisionSha = required(env, "DELEGATED_PROOF_DECISION_SHA256");
  if (!SHA256.test(authoritySha) || !SHA256.test(decisionSha) ||
      sha(authorityBytes) !== authoritySha || sha(decisionBytes) !== decisionSha) {
    throw new Error("Delegated approval input SHA-256 mismatch");
  }
  const authority = JSON.parse(authorityBytes.toString("utf8"));
  const decision = JSON.parse(decisionBytes.toString("utf8"));
  const authorityId = required(env, "DELEGATED_PROOF_AUTHORITY_ID");
  const decisionId = required(env, "DELEGATED_PROOF_DECISION_ID");
  if (authority.authority_id !== authorityId || !SAFE_ID.test(authorityId) ||
      decision.decisionId !== decisionId || !SAFE_ID.test(decisionId) ||
      authority.status !== "active" || decision.status !== "approved_with_execution_conditions" ||
      authority.authorizer !== decision.authorizer ||
      authority.actor?.session_id !== decision.managerThreadId ||
      authority.human_authorization_reference?.message_id !== decision.humanAuthorizationMessageId ||
      authority.independent_human_attestation !== false ||
      authority.independent_finance_attestation !== false ||
      decision.independentHumanClientOrFinanceAttestation !== false) {
    throw new Error("Delegated approval authority and decision identity mismatch");
  }
  const config = {
    authorityBytes, decisionBytes, authoritySha, decisionSha, authorityId, decisionId,
    account: required(env, "DELEGATED_PROOF_BLOB_ACCOUNT"),
    container: required(env, "DELEGATED_PROOF_BLOB_CONTAINER"),
    runId: required(env, "DELEGATED_PROOF_RUN_ID"),
    idempotencyKey: required(env, "DELEGATED_PROOF_IDEMPOTENCY_KEY"),
    operatorIdentity: required(env, "DELEGATED_PROOF_OPERATOR_IDENTITY"),
    gitSha: required(env, "DELEGATED_PROOF_GIT_SHA"),
    imageDigest: required(env, "DELEGATED_PROOF_IMAGE_DIGEST"),
    jobName: required(env, "DELEGATED_PROOF_JOB_NAME"),
    releaseRecord: required(env, "DELEGATED_PROOF_RELEASE_RECORD"),
  };
  if (!/^[a-z0-9-]{3,24}$/.test(config.account) ||
      !/^[a-z0-9-]{3,63}$/.test(config.container) ||
      !/^[a-zA-Z0-9_-]+$/.test(config.runId) ||
      !/^[a-zA-Z0-9_-]+$/.test(config.jobName) ||
      !/^[a-f0-9]{40}$/.test(config.gitSha) ||
      !/^sha256:[a-f0-9]{64}$/.test(config.imageDigest) ||
      env.ABARVA_OPERATOR_IMAGE_DIGEST !== config.imageDigest ||
      env.DELEGATED_PROOF_EXECUTION_LANE !== "aca_operator_job" ||
      !/^docs\/releases\/records\/[a-zA-Z0-9._-]+\.md$/.test(config.releaseRecord) ||
      !fs.existsSync(path.join(ROOT, config.releaseRecord))) {
    throw new Error("Delegated approval proof job identity is invalid");
  }
  return config;
}

export async function uploadExact(container, config, kind) {
  const bytes = kind === "authority" ? config.authorityBytes : config.decisionBytes;
  const digest = kind === "authority" ? config.authoritySha : config.decisionSha;
  const objectPath = proofPath(config.authorityId, digest, kind);
  const blob = container.getBlockBlobClient(objectPath);
  try {
    await blob.uploadData(bytes, {
      blobHTTPHeaders: { blobContentType: "application/json" },
      conditions: { ifNoneMatch: "*" },
    });
  } catch (error) {
    if (![409, 412].includes(error?.statusCode)) throw error;
  }
  const stored = await blob.downloadToBuffer();
  if (!stored.equals(bytes) || sha(stored) !== digest) throw new Error(`${kind} private Blob readback mismatch`);
  return {
    uri: `https://${config.account}.blob.core.windows.net/${config.container}/${objectPath}`,
    sha256: digest,
    bytes: stored.length,
  };
}

async function main() {
  const config = proofInputs();
  const { BlobServiceClient } = await import("@azure/storage-blob");
  let service;
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    service = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  } else {
    const { DefaultAzureCredential } = await import("@azure/identity");
    service = new BlobServiceClient(`https://${config.account}.blob.core.windows.net`,
      new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID }));
  }
  const container = service.getContainerClient(config.container);
  const authority = await uploadExact(container, config, "authority");
  const decision = await uploadExact(container, config, "decision");
  process.stdout.write(`__DELEGATED_PROOF_READBACK__${JSON.stringify({
    status: "verified", authority_id: config.authorityId, decision_id: config.decisionId,
    run_id: config.runId, idempotency_key: config.idempotencyKey,
    operator_identity: config.operatorIdentity, git_sha: config.gitSha,
    image_digest: config.imageDigest, job_name: config.jobName,
    release_record: config.releaseRecord, checked_at: new Date().toISOString(),
    authority, decision,
  })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
