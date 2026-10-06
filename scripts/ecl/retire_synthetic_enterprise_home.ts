#!/usr/bin/env tsx

/** Retire a synthetic Home declaration without deleting its governed evidence. */

import { isDeepStrictEqual } from "node:util";
import { isDirectInvocation } from "../exec/cli-entry.mjs";
import {
  applySqlLimits,
  blobProofStore,
  boundedStore,
  commitTransaction,
  connectDatabase,
  declarationColumns,
  jobLimits,
  jobRecord,
  jobRun,
  lockHomeDeclarations,
  proofBytes,
  readHomeDeclaration,
  sqlTimeout,
  type HomeDeclaration,
  type JobClient,
  type JobDatabase,
  type JobLimits,
  type JobRun,
  type ProofStore,
} from "./synthetic_enterprise_home_job";

const jobName = "ecl-synthetic-enterprise-v2-retire-home";

/**
 * The declaration a retirement names, by the declaration's own identity. It
 * is stated by the operator and matched against the row; nothing about it is
 * regenerated, so a retirement does not depend on the source definition still
 * producing the version that was promoted.
 */
export type RetirementTarget = {
  tenantKey: string;
  assessmentId: string;
  projectionHash: string;
};

export type RetirementSettings = {
  databaseUrl: string;
  account: string;
  identity: string;
  target: RetirementTarget;
  run: JobRun;
  limits: JobLimits;
};

/** Every binding a run needs, checked before anything is opened. */
export function retirementSettings(
  env: Record<string, string | undefined>,
): RetirementSettings {
  const databaseUrl = env.DATABASE_URL;
  const account = env.AZURE_STORAGE_ACCOUNT_NAME;
  const identity = env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
  if (
    !databaseUrl ||
    !account ||
    !identity ||
    !env.ECL_SYNTHETIC_RUN_ID ||
    !env.ECL_SYNTHETIC_IMAGE_DIGEST ||
    env.ECL_SYNTHETIC_ROLLBACK_APPROVAL !== "retire_active_home"
  ) {
    throw new Error(
      "Home retirement requires a pinned, explicitly approved private job",
    );
  }
  const target = {
    tenantKey: env.ECL_SYNTHETIC_RETIRE_TENANT ?? "",
    assessmentId: env.ECL_SYNTHETIC_RETIRE_ASSESSMENT ?? "",
    projectionHash: env.ECL_SYNTHETIC_RETIRE_PROJECTION_HASH ?? "",
  };
  if (
    !/^[a-z0-9][a-z0-9-]{0,79}$/.test(target.tenantKey) ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(target.assessmentId) ||
    !/^[a-f0-9]{64}$/.test(target.projectionHash)
  ) {
    throw new Error(
      "Home retirement must name the declaration it retires: tenant, assessment and projection hash",
    );
  }
  return {
    databaseUrl,
    account,
    identity,
    target,
    run: jobRun(env, jobName),
    limits: jobLimits(env),
  };
}

export type Retirement = {
  outcome: "retired" | "already_retired";
  before: HomeDeclaration;
  /** The row as the retiring statement returned it, before the commit. */
  retired: HomeDeclaration;
};

/**
 * Retires the named declaration in one transaction held to the job's limits.
 * The row is found by tenant and assessment and must carry the projection
 * hash the operator stated. A declaration that is already retired is left
 * exactly as it is and reported as `already_retired`, so a run whose proof was
 * lost can be run again.
 */
export async function retireHomeDeclaration(
  db: JobDatabase,
  target: RetirementTarget,
  limits: JobLimits,
): Promise<Retirement> {
  let committing = false;
  await db.query("begin isolation level serializable");
  try {
    await applySqlLimits(db, limits);
    await lockHomeDeclarations(db, target.tenantKey);
    const before = await readHomeDeclaration(
      db,
      target.tenantKey,
      target.assessmentId,
    );
    if (!before || before.projection_hash !== target.projectionHash) {
      throw new Error("No matching Home declaration to retire");
    }
    if (before.state === "retired") {
      await db.query("rollback");
      return { outcome: "already_retired", before, retired: before };
    }
    const retired = await db.query<HomeDeclaration>(
      `update ecl_projection.home_active_assessment
       set state = 'retired', retired_at = now()
       where tenant_key = $1 and assessment_id = $2
         and projection_hash = $3 and state = 'active'
       returning ${declarationColumns}`,
      [target.tenantKey, target.assessmentId, target.projectionHash],
    );
    if (retired.rows.length !== 1) {
      throw new Error("No matching Home declaration to retire");
    }
    committing = true;
    await commitTransaction(db, "Home retirement", "nothing was retired");
    return { outcome: "retired", before, retired: retired.rows[0] };
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    const limit = committing ? null : sqlTimeout(error);
    if (limit) {
      throw new Error(
        `Home retirement stopped at its ${limit} timeout; nothing was retired`,
        { cause: error },
      );
    }
    throw error;
  }
}

/** Everything a run touches outside this module, so a test can stand in for it. */
export type RetirementRuntime = {
  connect: (databaseUrl: string) => Promise<JobClient>;
  store: (settings: RetirementSettings) => Promise<ProofStore>;
  report: (line: string) => void;
  fail: (error: unknown) => void;
};

const productionRuntime: RetirementRuntime = {
  connect: connectDatabase,
  store: (settings) =>
    blobProofStore(settings.account, settings.identity, settings.limits),
  report: (line) => {
    process.stdout.write(`${line}\n`);
  },
  fail: (error) => {
    console.error(error);
  },
};

/**
 * One retirement run, start to finish. It returns the process exit code and
 * never throws.
 *
 * A retirement is a rollback, so it is committed before its proof is written:
 * a store that cannot be reached must not keep Home on a declaration that is
 * being withdrawn. The proof records the row before and the row read back
 * after the commit. When it cannot be written the run ends non-zero and says,
 * on stdout, that the retirement is committed and its proof is missing;
 * running the job again writes it and reports `already_retired`.
 *
 * Retirement returns Home to the assessment it reads when no declaration is
 * active. It does not restore an earlier declaration.
 */
export async function runRetirementJob(
  env: Record<string, string | undefined>,
  runtime: RetirementRuntime = productionRuntime,
): Promise<number> {
  try {
    const settings = retirementSettings(env);
    const { run, limits, target } = settings;
    const store = boundedStore(await runtime.store(settings), limits);
    const db = await runtime.connect(settings.databaseUrl);
    let retirement: Retirement;
    let after: HomeDeclaration | null = null;
    let readbackFailure: string | null = null;
    try {
      retirement = await retireHomeDeclaration(db, target, limits);
      try {
        await db.query("begin");
        await applySqlLimits(db, limits);
        after = await readHomeDeclaration(
          db,
          target.tenantKey,
          target.assessmentId,
        );
        await db.query("commit");
      } catch (error) {
        await db.query("rollback").catch(() => undefined);
        readbackFailure =
          error instanceof Error ? error.message : String(error);
      }
    } finally {
      await db.end();
    }
    const { before, outcome } = retirement;
    // The proof sits with the source set the declaration itself names.
    const proofPath = `${before.tenant_key}/${before.assessment_id}/${before.source_set_hash}/runs/${run.runId}/home-retirement-proof.json`;
    const proofUri = store.uriFor(proofPath);
    // `confirmed` is false when the row read back after the commit is not
    // the retired row this run reports.
    const failed = (reason: string, confirmed = true): number => {
      runtime.report(
        JSON.stringify({
          job_name: jobName,
          run_id: run.runId,
          tenant_scope: before.tenant_key,
          assessment_id: before.assessment_id,
          status: "failed",
          outcome,
          retirement: !confirmed
            ? "not_confirmed"
            : outcome === "retired"
              ? "committed_by_this_run"
              : "committed_before_this_run",
          proof: "missing",
          proof_uri: proofUri,
          declaration_before: before,
          declaration_after:
            readbackFailure === null ? after : retirement.retired,
          reason,
          recovery: confirmed
            ? "the retirement is committed; run the job again to write a proof, which reports already_retired"
            : "what Home serves is not what this run reports; read the declaration, then run the job again under a new run id",
        }),
      );
      return 1;
    };
    if (readbackFailure !== null) {
      return failed(
        `the declaration could not be read back after commit: ${readbackFailure}`,
      );
    }
    if (
      after?.state !== "retired" ||
      !isDeepStrictEqual(after, retirement.retired)
    ) {
      return failed(
        "the declaration read back after commit is not the retired declaration this run reports",
        false,
      );
    }
    const proof = {
      assessment_id: before.assessment_id,
      source_set_hash: before.source_set_hash,
      projection_hash: before.projection_hash,
      projection_proof_uri: before.projection_proof_uri,
      projection_manifest_id: before.projection_manifest_id,
      serving_state: "retired",
      outcome,
      declaration_before: before,
      declaration_after: after,
      validation: {
        named_tenant: target.tenantKey,
        named_assessment: target.assessmentId,
        named_projection_hash: target.projectionHash,
        declaration_matched: true,
      },
      quality_gate: {
        operator_intent: "retire_active_home",
        read_back_after_commit: true,
      },
      ...jobRecord(run, {
        tenantScope: before.tenant_key,
        inputSourceVersion: before.source_set_hash,
        idempotencyKey: `${before.assessment_id}:${before.projection_hash}`,
        status: "passed",
        proofUri,
        limits,
      }),
    };
    let written: { created: boolean };
    try {
      written = await store.writeOnce(proofPath, proofBytes(proof));
      if (!written.created) {
        // A proof this run did not write. It stands only for a run that
        // retired nothing and finds the retirement that proof describes.
        const earlier = JSON.parse(
          (await store.read(proofUri)).toString("utf8"),
        ) as { declaration_after?: unknown };
        if (
          outcome !== "already_retired" ||
          !isDeepStrictEqual(earlier.declaration_after, after)
        ) {
          return failed(
            "a proof already exists at this run's path and was not written by this run",
          );
        }
      }
    } catch (error) {
      runtime.fail(error);
      return failed(
        `the proof could not be written: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    runtime.report(
      JSON.stringify({
        ...proof,
        proof_uri: proofUri,
        proof_written: written.created,
      }),
    );
    return 0;
  } catch (error) {
    runtime.fail(error);
    return 1;
  }
}

// Compares resolved files: a path comparison answers "imported" for a run
// through a symlinked directory, and the job would exit 0 having done nothing.
if (isDirectInvocation(import.meta.url)) {
  void runRetirementJob(process.env).then((code) => {
    process.exitCode = code;
  });
}
