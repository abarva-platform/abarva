/**
 * What the Home projection, admission and retirement jobs share: the run each
 * one records about itself, the store its proofs are read from and written to,
 * the limits it runs under, the declaration row it reads, and the tenant
 * registry.
 *
 * Nothing here opens a connection on import. The Blob client is loaded only by
 * the store a real run builds, so a run that is handed its own store never
 * loads it.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg, { type QueryResultRow } from "pg";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const PROOF_CONTAINER = "ecl-synthetic-intake";
export const RUN_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;

/** What a run records about itself, as the data-build job rule requires. */
export type JobRun = {
  jobName: string;
  runId: string;
  operatorIdentity: string;
  buildVersion: string;
  gitSha: string;
  /** The binding the commit was read from: it is stated by the run, not read from the image. */
  gitShaSource: string;
  imageDigest: string;
  releaseRecord: string;
  retryCount: number;
  startedAt: string;
};

const runBindings = [
  "ECL_SYNTHETIC_OPERATOR_IDENTITY",
  "ECL_SYNTHETIC_BUILD_VERSION",
  "ECL_SYNTHETIC_RELEASE_RECORD",
] as const;

/**
 * The bindings every Home job run must carry, checked before anything is
 * generated or opened. The image must be pinned and be the image the job runs.
 * The commit is the one stated for the run, or the one the operator wrapper
 * recorded when it submitted the job.
 */
export function jobRun(
  env: Record<string, string | undefined>,
  jobName: string,
): JobRun {
  const runId = env.ECL_SYNTHETIC_RUN_ID ?? "";
  if (!RUN_ID_PATTERN.test(runId)) throw new Error("Unsafe run ID");
  const missing = runBindings.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing governed job bindings: ${missing.join(", ")}`);
  }
  const imageDigest = env.ECL_SYNTHETIC_IMAGE_DIGEST ?? "";
  if (
    !/@sha256:[0-9a-f]{64}$/.test(imageDigest) ||
    imageDigest !== env.ABARVA_OPERATOR_IMAGE
  ) {
    throw new Error(
      "Job image digest must be pinned and be the image the job runs",
    );
  }
  const gitShaSource = env.ECL_SYNTHETIC_GIT_SHA
    ? "ECL_SYNTHETIC_GIT_SHA"
    : "ABARVA_OPERATOR_BRANCH_COMMIT";
  const gitSha = env[gitShaSource] ?? "";
  if (!/^[0-9a-f]{40}$/.test(gitSha)) {
    throw new Error("Job run must record the full git commit it is run from");
  }
  const releaseRecord = env.ECL_SYNTHETIC_RELEASE_RECORD!;
  if (!/^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/.test(releaseRecord)) {
    throw new Error(
      "Job release record must be a docs/releases/records/*.md path",
    );
  }
  const retryCount = Number(env.ECL_SYNTHETIC_RETRY_COUNT ?? "0");
  if (!Number.isInteger(retryCount) || retryCount < 0) {
    throw new Error("Job retry count must be a whole number");
  }
  return {
    jobName,
    runId,
    operatorIdentity: env.ECL_SYNTHETIC_OPERATOR_IDENTITY!,
    buildVersion: env.ECL_SYNTHETIC_BUILD_VERSION!,
    gitSha,
    gitShaSource,
    imageDigest,
    releaseRecord,
    retryCount,
    startedAt: new Date().toISOString(),
  };
}

/** The limits a job runs under. */
export type JobLimits = {
  statementTimeoutMs: number;
  lockTimeoutMs: number;
  proofStoreTimeoutMs: number;
};

const defaultLimits: JobLimits = {
  statementTimeoutMs: 60_000,
  lockTimeoutMs: 15_000,
  proofStoreTimeoutMs: 30_000,
};

function milliseconds(
  env: Record<string, string | undefined>,
  key: string,
  fallback: number,
): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 3_600_000) {
    throw new Error(`${key} must be a whole number of milliseconds`);
  }
  return value;
}

/** A job never runs without its limits; a value that cannot be read is refused. */
export function jobLimits(
  env: Record<string, string | undefined> = {},
): JobLimits {
  return {
    statementTimeoutMs: milliseconds(
      env,
      "ECL_SYNTHETIC_STATEMENT_TIMEOUT_MS",
      defaultLimits.statementTimeoutMs,
    ),
    lockTimeoutMs: milliseconds(
      env,
      "ECL_SYNTHETIC_LOCK_TIMEOUT_MS",
      defaultLimits.lockTimeoutMs,
    ),
    proofStoreTimeoutMs: milliseconds(
      env,
      "ECL_SYNTHETIC_PROOF_STORE_TIMEOUT_MS",
      defaultLimits.proofStoreTimeoutMs,
    ),
  };
}

/**
 * The fields every proof carries about the run that wrote it. A proof is one
 * document that holds its own validation and quality-gate sections, so their
 * locations point into it.
 */
export function jobRecord(
  run: JobRun,
  record: {
    tenantScope: string;
    inputSourceVersion: string;
    idempotencyKey: string;
    status: string;
    proofUri: string;
    limits: JobLimits;
  },
): Record<string, unknown> {
  return {
    job_name: run.jobName,
    run_id: run.runId,
    tenant_scope: record.tenantScope,
    build_version: run.buildVersion,
    input_source_version: record.inputSourceVersion,
    idempotency_key: record.idempotencyKey,
    started_at: run.startedAt,
    finished_at: new Date().toISOString(),
    operator_identity: run.operatorIdentity,
    git_sha: run.gitSha,
    git_sha_source: run.gitShaSource,
    image_digest: run.imageDigest,
    retry_count: run.retryCount,
    statement_timeout_ms: record.limits.statementTimeoutMs,
    lock_timeout_ms: record.limits.lockTimeoutMs,
    status: record.status,
    blob_proof_bundle: record.proofUri,
    validation_output: `${record.proofUri}#/validation`,
    quality_gate_output: `${record.proofUri}#/quality_gate`,
    release_record: run.releaseRecord,
  };
}

export function proofBytes(proof: Record<string, unknown>): Buffer {
  return Buffer.from(JSON.stringify(proof));
}

/** Where the jobs read proofs from and write them to. */
export type ProofStore = {
  /** The URI a path in the proof container has. */
  uriFor: (blobPath: string) => string;
  /** The bytes at a URI of this store. It throws when the blob cannot be opened. */
  read: (uri: string) => Promise<Buffer>;
  /**
   * Writes a blob that does not exist yet. An existing blob is left exactly as
   * it is and reported as not created; it is never overwritten.
   */
  writeOnce: (
    blobPath: string,
    bytes: Buffer,
  ) => Promise<{ uri: string; created: boolean }>;
};

export function storeHost(account: string): string {
  return `${account}.blob.core.windows.net`;
}

/**
 * The path, inside the proof container, of a run-scoped proof a URI names, or
 * null when the URI is anything else. The URI is parsed, never searched: it
 * must be on this account's host, in the proof container, directly under one
 * run of the pinned prefix, and carry the expected file name and nothing more.
 */
export function pinnedRunBlobPath(
  uri: unknown,
  expected: { account: string; prefix: string; fileName: string },
): string | null {
  if (typeof uri !== "string") return null;
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return null;
  }
  // The address is exactly this account's host and the path it parses to:
  // no other scheme, host, port or credentials, no query or fragment, even an
  // empty one, and no path that is rewritten on the way in.
  if (uri !== `https://${storeHost(expected.account)}${url.pathname}`) {
    return null;
  }
  let segments: string[];
  try {
    segments = url.pathname.split("/").map(decodeURIComponent);
  } catch {
    return null;
  }
  // "", container, ...prefix, "runs", run id, file name
  const wanted = ["", PROOF_CONTAINER, ...expected.prefix.split("/"), "runs"];
  if (
    segments.length !== wanted.length + 2 ||
    wanted.some((segment, index) => segments[index] !== segment) ||
    !RUN_ID_PATTERN.test(segments[wanted.length]) ||
    segments[wanted.length + 1] !== expected.fileName
  ) {
    return null;
  }
  return segments.slice(2).join("/");
}

/** Fails a wait that outlasts its limit, so a store that never answers cannot hold a run open. */
export async function withDeadline<T>(
  work: Promise<T>,
  ms: number,
  what: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${what} did not finish within ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** A store whose every read and write is held to the proof-store limit. */
export function boundedStore(store: ProofStore, limits: JobLimits): ProofStore {
  return {
    uriFor: store.uriFor,
    read: (uri) =>
      withDeadline(store.read(uri), limits.proofStoreTimeoutMs, "Proof read"),
    writeOnce: (blobPath, bytes) =>
      withDeadline(
        store.writeOnce(blobPath, bytes),
        limits.proofStoreTimeoutMs,
        "Proof write",
      ),
  };
}

/** The store a real run uses: the proof container of one storage account. */
export async function blobProofStore(
  account: string,
  identityClientId: string,
  limits: JobLimits,
): Promise<ProofStore> {
  if (!/^[a-z0-9]{3,24}$/.test(account)) {
    throw new Error("Invalid Azure storage account name");
  }
  const [{ BlobServiceClient }, { ManagedIdentityCredential }] =
    await Promise.all([
      import("@azure/storage-blob"),
      import("@azure/identity"),
    ]);
  const container = new BlobServiceClient(
    `https://${storeHost(account)}`,
    new ManagedIdentityCredential({ clientId: identityClientId }),
  ).getContainerClient(PROOF_CONTAINER);
  const base = `https://${storeHost(account)}/${PROOF_CONTAINER}/`;
  const abortSignal = () => AbortSignal.timeout(limits.proofStoreTimeoutMs);
  return {
    uriFor: (blobPath) => container.getBlockBlobClient(blobPath).url,
    read: async (uri) => {
      const url = new URL(uri);
      if (!`${url.origin}${url.pathname}`.startsWith(base) || url.search) {
        throw new Error("not a blob of this store's proof container");
      }
      return container
        .getBlockBlobClient(
          decodeURIComponent(url.pathname.slice(PROOF_CONTAINER.length + 2)),
        )
        .downloadToBuffer(0, undefined, { abortSignal: abortSignal() });
    },
    writeOnce: async (blobPath, bytes) => {
      const blob = container.getBlockBlobClient(blobPath);
      try {
        await blob.uploadData(bytes, {
          abortSignal: abortSignal(),
          conditions: { ifNoneMatch: "*" },
          blobHTTPHeaders: { blobContentType: "application/json" },
        });
        return { uri: blob.url, created: true };
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode === 409) {
          return { uri: blob.url, created: false };
        }
        throw error;
      }
    },
  };
}

export type JobDatabase = {
  query: <Row extends QueryResultRow>(
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Row[] }>;
};

/** A connection a job owns: it can hear the server's notices and must be closed. */
export type JobClient = JobDatabase & {
  on: (
    event: "notice",
    listener: (notice: { message?: string }) => void,
  ) => unknown;
  removeListener: (
    event: "notice",
    listener: (notice: { message?: string }) => void,
  ) => unknown;
  end: () => Promise<void>;
};

export async function connectDatabase(databaseUrl: string): Promise<JobClient> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

/** Sets the statement and lock limits for the current transaction only. */
export async function applySqlLimits(
  db: JobDatabase,
  limits: JobLimits,
): Promise<void> {
  await db.query(
    "select set_config('statement_timeout', $1, true), set_config('lock_timeout', $2, true)",
    [`${limits.statementTimeoutMs}ms`, `${limits.lockTimeoutMs}ms`],
  );
}

/** Which limit an error is, when it is one: a cancelled statement, or a lock not granted in time. */
export function sqlTimeout(error: unknown): "statement" | "lock" | null {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "57014") return "statement";
  if (code === "55P03") return "lock";
  return null;
}

/** A commit the server never answered: whether it took effect is not known. */
export class CommitNotConfirmed extends Error {}

/**
 * Commits the open transaction. When the server answers a commit with an
 * error it has rolled the transaction back, and the error says so along with
 * `undone`, the caller's statement of what therefore did not happen. A commit
 * that fails with no answer from the server is reported as not confirmed.
 */
export async function commitTransaction(
  db: JobDatabase,
  what: string,
  undone: string,
): Promise<void> {
  try {
    await db.query("commit");
  } catch (error) {
    const said = error instanceof Error ? error.message : String(error);
    if (typeof (error as { code?: unknown } | null)?.code === "string") {
      throw new Error(
        `${what} could not commit and was rolled back; ${undone}: ${said}`,
        { cause: error },
      );
    }
    throw new CommitNotConfirmed(
      `${what} commit was not confirmed and may or may not have taken effect: ${said}`,
      { cause: error },
    );
  }
}

/** One tenant's Home declaration is changed by one transaction at a time. */
export async function lockHomeDeclarations(
  db: JobDatabase,
  tenantKey: string,
): Promise<void> {
  await db.query("select pg_advisory_xact_lock(hashtext($1))", [
    `home-assessment:${tenantKey}`,
  ]);
}

/** A Home declaration as a proof records it. Timestamps are UTC, to the microsecond. */
export type HomeDeclaration = {
  tenant_key: string;
  assessment_id: string;
  projection_manifest_id: string;
  source_set_hash: string;
  projection_hash: string;
  projection_proof_uri: string;
  state: string;
  activated_at: string;
  retired_at: string | null;
};

const utc = (column: string) =>
  `to_char(${column} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as ${column}`;

export const declarationColumns = `tenant_key, assessment_id, projection_manifest_id::text,
  source_set_hash, projection_hash, projection_proof_uri, state,
  ${utc("activated_at")}, ${utc("retired_at")}`;

export async function readHomeDeclaration(
  db: JobDatabase,
  tenantKey: string,
  assessmentId: string,
): Promise<HomeDeclaration | null> {
  const found = await db.query<HomeDeclaration>(
    `select ${declarationColumns}
     from ecl_projection.home_active_assessment
     where tenant_key = $1 and assessment_id = $2`,
    [tenantKey, assessmentId],
  );
  return found.rows[0] ?? null;
}

export const tenantRegistryPath = path.join(
  root,
  "datasets/tenant-inputs/tenant-input-registry.json",
);

/**
 * The tenant keys the tenant input registry declares as active. A tenant is
 * known because the registry lists its key, never because of a name or a path.
 */
export async function registeredTenantKeys(
  file: string = tenantRegistryPath,
): Promise<Set<string>> {
  const registry = JSON.parse(await readFile(file, "utf8")) as {
    activeTenants?: Array<{ tenantKey?: unknown }>;
  };
  if (!Array.isArray(registry.activeTenants)) {
    throw new Error("Tenant input registry declares no active tenants");
  }
  return new Set(
    registry.activeTenants
      .map((tenant) => tenant.tenantKey)
      .filter((key): key is string => typeof key === "string" && key !== ""),
  );
}

export function assertRegisteredTenant(
  tenantKey: string,
  registered: ReadonlySet<string>,
): void {
  if (!registered.has(tenantKey)) {
    throw new Error(
      `Tenant ${tenantKey} is not an active tenant in the tenant input registry`,
    );
  }
}
