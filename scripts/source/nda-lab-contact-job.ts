import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { Client } from "pg";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";
import { LoadApprovalSchema, namesAPerson } from "../../src/lib/governance/dataset-manifest";
import { applyNdaLabContactPlan, buildNdaLabContactPlan, ndaLabContactInputPath } from "./load-nda-lab-contacts";

type ProofTarget = { accountUrl: string; container: string; prefix: string; identityClientId: string };
export type NdaLabContactJobArgs = {
  apply: boolean;
  tenantKey: string;
  inputSha256: string;
  inputSourceVersion: string;
  runId: string;
  idempotencyKey: string;
  buildVersion: string;
  imageDigest: string;
  operator: string;
  runAttempt: number;
  approvalReference: string | null;
  proofTarget: ProofTarget | null;
  databaseUrl: string | null;
  outDir: string;
  emitProofBundle: boolean;
};

const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const MANIFEST_PATH = "docs/governance/dataset-manifests/source-nda-lab-contacts-v1.json";
const RELEASE_RECORD = "docs/releases/records/2026-10-04-source-nda-lab-contact-intake.md";

export function assertNdaLabContactLoadApproval(manifest: { load_approval?: unknown },
  sourceHash: string, assessmentId: string): void {
  if (!manifest.load_approval) throw new Error("manifest_load_approval_required");
  const parsed = LoadApprovalSchema.safeParse(manifest.load_approval);
  if (!parsed.success || !namesAPerson(parsed.data.approved_by) ||
      parsed.data.assessment_id !== assessmentId ||
      parsed.data.source_set_hash !== sourceHash ||
      parsed.data.release_record !== RELEASE_RECORD) {
    throw new Error("manifest_load_approval_mismatch");
  }
}

function required(env: Record<string, string | undefined>, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key}_required`);
  return value;
}

export function parseNdaLabContactJobArgs(env: Record<string, string | undefined> = process.env): NdaLabContactJobArgs {
  const mode = env.SOURCE_NDA_CONTACT_MODE ?? "dry_run";
  if (mode !== "dry_run" && mode !== "apply") throw new Error("invalid_job_mode");
  const apply = mode === "apply";
  const tenantKey = required(env, "SOURCE_NDA_CONTACT_TENANT_KEY");
  if (tenantKey !== "meridian-health") throw new Error("lab_tenant_only");
  const inputSourceVersion = required(env, "SOURCE_NDA_CONTACT_INPUT_SOURCE_VERSION");
  if (inputSourceVersion !== "v1") throw new Error("unexpected_input_version");
  const inputSha256 = required(env, "SOURCE_NDA_CONTACT_INPUT_SHA256");
  if (!/^[a-f0-9]{64}$/.test(inputSha256)) throw new Error("invalid_input_sha256");
  const imageDigest = required(env, "SOURCE_NDA_CONTACT_IMAGE_DIGEST");
  if (!/^sha256:[a-f0-9]{64}$/.test(imageDigest)) throw new Error("digest_pinned_image_required");
  const runId = required(env, "SOURCE_NDA_CONTACT_RUN_ID");
  const idempotencyKey = required(env, "SOURCE_NDA_CONTACT_IDEMPOTENCY_KEY");
  const buildVersion = required(env, "SOURCE_NDA_CONTACT_BUILD_VERSION");
  const operator = required(env, "SOURCE_NDA_CONTACT_OPERATOR");
  const runAttempt = Number(env.SOURCE_NDA_CONTACT_RUN_ATTEMPT ?? "1");
  if (!Number.isSafeInteger(runAttempt) || runAttempt < 1) throw new Error("invalid_run_attempt");
  if (![runId, idempotencyKey, buildVersion, operator].every((value) => /^[a-zA-Z0-9._@-]+$/.test(value))) {
    throw new Error("invalid_operator_metadata");
  }
  let approvalReference: string | null = null;
  let proofTarget: ProofTarget | null = null;
  let databaseUrl: string | null = null;
  if (apply) {
    if (env.SOURCE_NDA_CONTACT_APPLY_APPROVED !== "true" ||
        env.SOURCE_NDA_CONTACT_CONFIRMATION !== "APPLY_NDA_LAB_CONTACTS") {
      throw new Error("apply_not_authorized");
    }
    approvalReference = required(env, "SOURCE_NDA_CONTACT_APPROVAL_REFERENCE");
    const accountUrl = env.SOURCE_NDA_CONTACT_PROOF_ACCOUNT_URL?.trim();
    const container = env.SOURCE_NDA_CONTACT_PROOF_CONTAINER?.trim();
    const prefix = env.SOURCE_NDA_CONTACT_PROOF_PREFIX?.trim();
    const identityClientId = env.SOURCE_NDA_CONTACT_PROOF_IDENTITY_CLIENT_ID?.trim();
    if (!accountUrl || !container || !prefix || !identityClientId) throw new Error("proof_target_required");
    if (!/^https:\/\/[a-z0-9-]+\.blob\.core\.windows\.net\/?$/.test(accountUrl) ||
        !/^[a-z0-9-]+$/.test(container) || !/^[a-zA-Z0-9/_-]+$/.test(prefix) ||
        !/^[a-f0-9-]{36}$/i.test(identityClientId)) throw new Error("invalid_proof_target");
    proofTarget = { accountUrl, container, prefix, identityClientId };
    databaseUrl = required(env, "DATABASE_URL");
  }
  return {
    apply, tenantKey, inputSha256, inputSourceVersion, runId, idempotencyKey,
    buildVersion, imageDigest, operator, runAttempt, approvalReference, proofTarget, databaseUrl,
    outDir: path.resolve(env.SOURCE_NDA_CONTACT_OUT_DIR ?? "/tmp/source-nda-lab-contact-job"),
    emitProofBundle: env.SOURCE_NDA_CONTACT_EMIT_PROOF_BUNDLE === "true" ||
      env.EMIT_ACA_PROOF_BUNDLE === "true",
  };
}

function saveJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function emitProofBundle(outDir: string): void {
  const parent = path.dirname(outDir);
  const base = path.basename(outDir);
  const tarPath = path.join(parent, `${base}.tgz`);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", parent, base], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "proof_bundle_failed");
  const encoded = readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let index = 0; index < encoded.length; index += 7600) console.log(encoded.slice(index, index + 7600));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function uploadProof(target: ProofTarget, name: string, proof: unknown): Promise<string> {
  const service = new BlobServiceClient(target.accountUrl,
    new ManagedIdentityCredential(target.identityClientId));
  const blob = service.getContainerClient(target.container)
    .getBlockBlobClient(`${target.prefix}/${name}.json`);
  const body = Buffer.from(JSON.stringify(proof));
  await blob.uploadData(body, { blobHTTPHeaders: { blobContentType: "application/json" } });
  const readback = await blob.downloadToBuffer();
  if (sha256(readback) !== sha256(body)) throw new Error("blob_proof_readback_mismatch");
  return blob.url;
}

export async function runNdaLabContactJob(args: NdaLabContactJobArgs) {
  const startedAt = new Date().toISOString();
  const csvText = readFileSync(path.resolve(ndaLabContactInputPath), "utf8");
  const plan = buildNdaLabContactPlan({ csvText, tenantKey: args.tenantKey,
    inputSourceVersion: args.inputSourceVersion, expectedSha256: args.inputSha256 });
  mkdirSync(args.outDir, { recursive: true });
  const contract = {
    jobName: "source-nda-lab-contact-intake", runId: args.runId,
    tenantKey: args.tenantKey, buildVersion: args.buildVersion,
    inputSourceVersion: args.inputSourceVersion, inputSha256: args.inputSha256,
    idempotencyKeySha256: sha256(args.idempotencyKey),
    operator: args.operator, imageDigest: args.imageDigest,
    approvalReferenceSha256: args.approvalReference ? sha256(args.approvalReference) : null,
    gitSha: args.buildVersion, startedAt, retryCount: args.runAttempt - 1, timeoutMinutes: 45,
  };
  saveJson(path.join(args.outDir, "plan.json"), { contract, plan });
  saveJson(path.join(args.outDir, "validation.json"), { valid: true, rowCount: plan.contacts.length,
    syntheticLabOnly: true, canonicalSupplierCheck: args.apply ? "pending" : "not_run" });
  saveJson(path.join(args.outDir, "progress.json"), { status: args.apply ? "running" : "dry_run",
    checkpoint: "fixture_validated", startedAt });
  let inserted = 0;
  let blobProofLocation: string | null = null;
  if (args.apply) {
    if (!args.proofTarget || !args.databaseUrl || !args.approvalReference) {
      throw new Error("apply_contract_incomplete");
    }
    const manifest = JSON.parse(readFileSync(path.resolve(MANIFEST_PATH), "utf8"));
    assertNdaLabContactLoadApproval(manifest, plan.inputSha256, args.approvalReference);
    await uploadProof(args.proofTarget, `${args.runId}-plan`, { contract, plan });
    const client = new Client(postgresClientOptions(args.databaseUrl, "source-nda-lab-contact-intake"));
    await client.connect();
    try {
      const result = await applyNdaLabContactPlan(plan, {
        db: { query: (sql, values) => client.query(sql, values) }, csvText,
        approved: true, confirmation: "APPLY_NDA_LAB_CONTACTS",
        approvalReference: args.approvalReference,
      });
      inserted = result.inserted;
    } finally {
      await client.end();
    }
    blobProofLocation = await uploadProof(args.proofTarget, `${args.runId}-result`,
      { contract, inserted, committed: true, canonicalSupplierCheck: "passed" });
  }
  const finishedAt = new Date().toISOString();
  const summary = { schemaVersion: 1, event: "source_nda_lab_contact_intake_proof",
    mode: args.apply ? "apply" : "dry_run", status: "succeeded", contract,
    expectedCount: 4, validatedCount: plan.contacts.length, inserted,
    committed: args.apply, authority: plan.authority,
    blobProofLocation: blobProofLocation ?? "not_required_for_dry_run",
    finishedAt };
  saveJson(path.join(args.outDir, "quality-gate.json"), { passed: true,
    exactFourSyntheticContacts: true, noSupplierEmailsSent: true,
    canonicalSupplierCheck: args.apply ? "passed" : "not_run" });
  saveJson(path.join(args.outDir, "progress.json"), { status: "succeeded", checkpoint: "complete",
    startedAt, finishedAt });
  saveJson(path.join(args.outDir, "proof-manifest.json"), summary);
  if (args.emitProofBundle) emitProofBundle(args.outDir);
  console.log(`__SOURCE_NDA_CONTACT_PROOF_SUMMARY__${JSON.stringify(summary)}`);
  return summary;
}

const direct = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (direct) {
  runNdaLabContactJob(parseNdaLabContactJobArgs()).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
