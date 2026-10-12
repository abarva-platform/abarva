#!/usr/bin/env tsx

/** Pure manifest decision for one exact Tower stage. It never writes approval fields. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolveServingApproval } from "../../src/lib/governance/dataset-manifest";
import { loadDelegationEvidence, type DelegatedApproval } from "../../src/lib/governance/delegated-approval";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestDir = path.join(root, "docs/governance/dataset-manifests");
const arg = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index < 0 ? null : process.argv[index + 1] ?? null;
};

const candidatePath = arg("--candidate");
const receiptPath = arg("--stage-receipt");
if (!candidatePath || !receiptPath) throw new Error("--candidate and --stage-receipt are required");

const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const candidateBytes = fs.readFileSync(candidatePath);
const receiptBytes = fs.readFileSync(receiptPath);
const candidate = JSON.parse(candidateBytes.toString("utf8"));
const receipt = JSON.parse(receiptBytes.toString("utf8"));
const manifests = fs.readdirSync(manifestDir)
  .filter((name) => name.endsWith(".json") && !name.startsWith("_"))
  .sort()
  .map((name) => JSON.parse(fs.readFileSync(path.join(manifestDir, name), "utf8")));

async function readPrivateApprovalProof(uri: string): Promise<Uint8Array> {
  const account = process.env.TOWER_RELOAD_PROOF_BLOB_ACCOUNT;
  const container = process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER;
  const url = new URL(uri);
  const prefix = `/${container}/operator-proof/delegated-approvals/`;
  if (!account || !container || url.protocol !== "https:" ||
      url.hostname !== `${account}.blob.core.windows.net` ||
      !url.pathname.startsWith(prefix) || url.search || url.hash) {
    throw new Error("Delegated approval proof is outside the private operator proof lane");
  }
  const objectPath = decodeURIComponent(url.pathname.slice(`/${container}/`.length));
  if (objectPath.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Delegated approval proof path is invalid");
  }
  const { BlobServiceClient } = await import("@azure/storage-blob");
  let service;
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    service = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  } else {
    const { DefaultAzureCredential } = await import("@azure/identity");
    const credential = new DefaultAzureCredential(process.env.AZURE_CLIENT_ID
      ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID } : undefined);
    service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  }
  return service.getContainerClient(container).getBlockBlobClient(objectPath).downloadToBuffer();
}

async function main() {
  const manifest = manifests.find((item) => item?.dataset_id === receipt.dataset_id);
  const delegated = [manifest?.load_approval?.delegated_decision,
    manifest?.serving_approval?.delegated_decision].filter(Boolean) as DelegatedApproval[];
  const releaseRecord = process.env.TOWER_PROMOTION_RELEASE_RECORD;
  if (delegated.length && !/^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/.test(releaseRecord ?? "")) {
    throw new Error("Delegated Tower serving requires a native operator release record");
  }
  const evidence = delegated.length
    ? await loadDelegationEvidence(delegated, readPrivateApprovalProof)
    : undefined;
  const priorAssessment = arg("--prior-assessment-id");
  const priorVersionText = arg("--prior-projection-version");
  const priorVersion = priorVersionText === null ? null : Number(priorVersionText);
  const privateBundleSha = arg("--private-bundle-sha256");
  const extraBindings = priorAssessment !== null && priorVersion !== null && Number.isInteger(priorVersion) &&
      privateBundleSha !== null && /^[a-f0-9]{64}$/.test(privateBundleSha)
    ? {
        build_version: receipt.build_version,
        candidate_sha256: sha(candidateBytes),
        prior_assessment_id: priorAssessment,
        prior_projection_version: priorVersion,
        private_bundle_sha256: privateBundleSha,
        projection_version: receipt.projection_version,
        stage_receipt_sha256: sha(receiptBytes),
      }
    : {};
  const decision = resolveServingApproval(manifests, {
    dataset_id: receipt.dataset_id,
    tenant_key: candidate.tenant_key,
    assessment_id: candidate.assessment_id,
    source_set_hash: candidate.input_fingerprint_sha256,
    object_count: receipt.object_count,
    ingestion_method: receipt.ingestion_method,
    surface: "tower",
    release_record: releaseRecord,
    extra_bindings: extraBindings,
  }, evidence);
  process.stdout.write(`${JSON.stringify(decision.approved
    ? { approved: true, release_record: decision.approval.release_record, approval: decision.approval }
    : { approved: false, reasons: decision.reasons })}\n`);
}

main().catch(() => {
  process.stdout.write(`${JSON.stringify({ approved: false,
    reasons: ["delegated approval private proof is unavailable or invalid"] })}\n`);
});
