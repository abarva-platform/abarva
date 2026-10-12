import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  runInsightJob,
  type InsightRuntime,
  emitInsightProofBundle,
} from "./integrated_insights_job";
import {
  runHomeInsightAdmissionJob,
  type HomeAdmissionRuntime,
} from "./home_insight_admission_job";

type Env = Record<string, string | undefined>;
export interface InsightRefreshRuntime {
  plan: (env: Env) => Promise<Awaited<ReturnType<typeof runInsightJob>>>;
  apply: (env: Env) => Promise<Awaited<ReturnType<typeof runInsightJob>>>;
  admit: (
    env: Env,
  ) => Promise<Awaited<ReturnType<typeof runHomeInsightAdmissionJob>>>;
}

export function insightRefreshRuntime(
  candidate?: InsightRuntime,
  admission?: HomeAdmissionRuntime,
): InsightRefreshRuntime {
  return {
    plan: (env) => runInsightJob(env, "plan", candidate),
    apply: (env) => runInsightJob(env, "apply", candidate),
    admit: (env) => runHomeInsightAdmissionJob(env, admission),
  };
}

/** Invoked by an approved private ACA job, not by a web request or an unbound upstream event. */
export async function runIntegratedInsightRefresh(
  env: Env,
  runtime = insightRefreshRuntime(),
) {
  const runId = env.ECL_INSIGHT_RUN_ID ?? "";
  const planProof = await runtime.plan({
    ...env,
    ECL_INSIGHT_RUN_ID: `${runId}-plan`,
  });
  if (!("plan" in planProof))
    throw new Error("Refresh planning returned no candidate version");
  const plan = planProof.plan;
  const base = {
    load_version_hash: plan.loadVersionHash,
    finding_count: plan.findings.length,
    plan_proof_uri: planProof.blob_proof_bundle,
    home_activation_changed: false,
  };
  if (!planProof.load_approval.approved)
    return {
      ...base,
      state: "awaiting_load_approval",
      steps_complete: 1,
      steps_total: 3,
    };
  if (env.ECL_INSIGHT_EXPECTED_VERSION_HASH !== plan.loadVersionHash)
    return {
      ...base,
      state: "input_changed",
      steps_complete: 1,
      steps_total: 3,
    };
  const applied = await runtime.apply({
    ...env,
    ECL_INSIGHT_RUN_ID: `${runId}-load`,
  });
  if (
    !("plan" in applied) ||
    applied.plan.loadVersionHash !== plan.loadVersionHash ||
    !applied.mutation_applied
  ) {
    throw new Error("Refresh load did not persist the exact planned candidate");
  }
  if (!env.ECL_INSIGHT_REVIEW_PROOF_URI || !env.ECL_INSIGHT_REVIEW_PROOF_HASH)
    return {
      ...base,
      state: "awaiting_review_and_serving",
      steps_complete: 2,
      steps_total: 3,
      load_proof_uri: applied.blob_proof_bundle,
    };
  const admitted = await runtime.admit({
    ...env,
    ECL_INSIGHT_RUN_ID: `${runId}-admit`,
  });
  return {
    ...base,
    state: "admitted_browser_proof_pending",
    steps_complete: 3,
    steps_total: 3,
    load_proof_uri: applied.blob_proof_bundle,
    admission_proof_uri: admitted.blob_proof_bundle,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runIntegratedInsightRefresh(process.env)
    .then((proof) => {
      console.log(JSON.stringify(proof));
      if (process.env.ECL_INSIGHT_EMIT_PROOF_BUNDLE === "true")
        emitInsightProofBundle(proof);
      if (proof.state !== "admitted_browser_proof_pending")
        process.exitCode = 2;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
