import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  attachHomeInsightAdmission,
  type HomeInsightAdmission,
} from "@/lib/ecl/insights/home-admission";
import { insightHash } from "@/lib/ecl/insights/engine";
import { homeRecordSourceToken } from "./record-source-token";
import type { HomeReviewBundle, HomeRecordRenderSource } from "./types";

export async function readHomeIntegratedInsights(served: {
  bundle: HomeReviewBundle;
  recordSource: HomeRecordRenderSource;
}) {
  const { bundle, recordSource } = served;
  if (
    recordSource.kind !== "ecl_serving_projection" ||
    recordSource.contextVersion?.coherence !== "coherent"
  )
    return served;
  try {
    const token = homeRecordSourceToken(bundle.tenantKey, recordSource);
    const rows = await azureRead.query<{
      admission_hash: string;
      admission_json: HomeInsightAdmission;
    }>(
      `select admission_hash, admission_json from serving.home_insight_admissions
     where tenant_key=$1 and assessment_id=$2 and base_home_record_token=$3`,
      [bundle.tenantKey, recordSource.contextVersion.assessmentId, token],
      { missingTable: "empty" },
    );
    if (rows.length === 0) return served;
    if (
      rows.length !== 1 ||
      insightHash(rows[0].admission_json) !== rows[0].admission_hash
    ) {
      throw new Error("Home insight admission integrity failed");
    }
    const admission = rows[0].admission_json;
    const datasetId =
      (admission.manifest as { dataset_id?: string })?.dataset_id ?? "";
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,119}$/.test(datasetId))
      throw new Error("Unsafe insight dataset declaration");
    const currentManifest = JSON.parse(
      await readFile(
        path.join(
          process.cwd(),
          "docs/governance/dataset-manifests",
          `${datasetId}.json`,
        ),
        "utf8",
      ),
    );
    if (insightHash(currentManifest) !== insightHash(admission.manifest))
      throw new Error("Insight declaration or approval changed");
    return attachHomeInsightAdmission(bundle, recordSource, token, admission);
  } catch (error) {
    // An optional admission cannot turn a valid live base record into a stored fallback.
    console.warn("[home] integrated insight admission withheld", error);
    return served;
  }
}
