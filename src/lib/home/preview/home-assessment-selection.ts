import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";
import {
  HomeProjectionFault,
  reportHomeProjectionFault,
} from "./home-projection-fault";

/** The projection surface a Home declaration may name. */
const HOME_PROJECTION_KEY = "home_enterprise_landscape";

/** What an active declaration names. The row read serves only rows that carry both the id and the version. */
export interface HomeDeclaredProjection {
  manifestId: string;
  projectionVersion: number;
  projectionHash: string;
  sourceSetHash: string;
  rowCount: number;
}

export interface HomeAssessmentSelection {
  assessmentId: string;
  /** Null when no declaration applies and the tenant's default assessment is read, as before. */
  declared: HomeDeclaredProjection | null;
  /** An explicit retirement selects the reviewed record, not older undeclared ECL rows. */
  retired?: true;
}

interface DeclarationRow {
  assessment_id: string;
  state: "active" | "retired";
  projection_hash: string;
  source_set_hash: string;
  manifest_id: string | null;
  projection_version: number | null;
  row_count: number | null;
}

function isMissingRelation(error: unknown): boolean {
  const record = error as { code?: unknown; message?: unknown };
  const message =
    typeof record?.message === "string" ? record.message : String(error ?? "");
  return (
    record?.code === "42P01" || /relation .* does not exist/i.test(message)
  );
}

/**
 * The assessment Home reads for one tenant, and the projection a declaration bound it to.
 *
 * A declaration used to hand back an assessment id and nothing else, so the row read served every
 * row under that tenant and assessment -- including rows written after the declaration, under
 * another projection version or another manifest. The declaration already records the manifest it
 * was made for. That manifest is joined here on the declaration's own tenant, assessment and
 * hashes, so a declaration naming a manifest that belongs to another tenant or assessment, that is
 * not a Home projection, or that has since been rewritten selects nothing rather than something
 * else.
 */
export async function selectHomeAssessment(
  tenantKey: string,
): Promise<HomeAssessmentSelection> {
  let rows: DeclarationRow[];
  try {
    rows = await azureRead.query<DeclarationRow>(
      `select declaration.assessment_id,
              declaration.state,
              declaration.projection_hash,
              declaration.source_set_hash,
              manifest.id::text as manifest_id,
              manifest.projection_version,
              manifest.row_count
       from ecl_projection.home_active_assessment declaration
       left join ecl_projection.projection_manifest manifest
         on manifest.id = declaration.projection_manifest_id
        and manifest.tenant_key = declaration.tenant_key
        and manifest.assessment_id = declaration.assessment_id
        and manifest.projection_key = $2
        and manifest.projection_hash = declaration.projection_hash
        and manifest.source_hash = declaration.source_set_hash
       where declaration.tenant_key = $1 and declaration.state in ('active', 'retired')`,
      [tenantKey, HOME_PROJECTION_KEY],
    );
  } catch (error) {
    if (isMissingRelation(error)) {
      const assessmentId = denseAssessmentIdForTenant(tenantKey);
      reportHomeProjectionFault({
        tenantKey,
        reason: "declaration_table_missing",
        served: "default_assessment",
        assessmentId,
      });
      return { assessmentId, declared: null };
    }
    throw new HomeProjectionFault(
      "selection_query_error",
      `Home assessment selection failed for ${tenantKey}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
  const active = rows.filter((row) => row.state === "active");
  if (active.length > 1) {
    throw new HomeProjectionFault(
      "multiple_active_declarations",
      "Home has multiple declared active assessments",
    );
  }
  const declaration = active[0];
  if (!declaration) {
    if (rows.some((row) => row.state === "retired")) {
      return {
        assessmentId: denseAssessmentIdForTenant(tenantKey),
        declared: null,
        retired: true,
      };
    }
    return {
      assessmentId: denseAssessmentIdForTenant(tenantKey),
      declared: null,
    };
  }
  if (
    !declaration.manifest_id ||
    declaration.projection_version === null ||
    declaration.row_count === null
  ) {
    throw new HomeProjectionFault(
      "declaration_not_bound_to_manifest",
      `Home declaration for ${tenantKey}/${declaration.assessment_id} is not bound to its projection manifest.`,
      { assessmentId: declaration.assessment_id },
    );
  }
  return {
    assessmentId: declaration.assessment_id,
    declared: {
      manifestId: declaration.manifest_id,
      projectionVersion: declaration.projection_version,
      projectionHash: declaration.projection_hash,
      sourceSetHash: declaration.source_set_hash,
      rowCount: declaration.row_count,
    },
  };
}
