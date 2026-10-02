#!/usr/bin/env tsx

/** Admit one independently proved synthetic Home projection for Home only. */

import { rm } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import type {
  HomeProjectionRow,
  HomeSourceFileReviewRow,
} from "../../src/lib/home/preview/ecl-projection-bundle";
import {
  resolveServingApproval,
  type ServingApprovalDecision,
} from "../../src/lib/governance/dataset-manifest";
import { isDirectInvocation } from "../exec/cli-entry.mjs";
import {
  generatePack,
  loadBinding,
  readDatasetManifests,
  type GeneratedPack,
} from "./load_synthetic_enterprise_v1";
import {
  applySqlLimits,
  assertRegisteredTenant,
  blobProofStore,
  boundedStore,
  commitTransaction,
  connectDatabase,
  declarationColumns,
  jobLimits,
  jobRecord,
  jobRun,
  lockHomeDeclarations,
  pinnedRunBlobPath,
  proofBytes,
  readHomeDeclaration,
  registeredTenantKeys,
  sqlTimeout,
  type HomeDeclaration,
  type JobClient,
  type JobDatabase,
  type JobLimits,
  type JobRun,
  type ProofStore,
} from "./synthetic_enterprise_home_job";
import {
  persistedProjectedRow,
  projectedRowsHash,
  type PersistedHomeRow,
} from "./synthetic_enterprise_home_rows";

const surface = "home_enterprise_landscape";
const version = 2;

export type ProjectionProof = {
  status: string;
  assessment_id: string;
  source_set_hash: string;
  projection_hash: string;
  readback_proof_uri: string;
  rows: number;
  source_linked_rows: number;
  projection_version?: number;
  canonical_relationships?: number;
  dependency_relationship_rows?: number;
  row_types: Record<string, number>;
  client_attestation_state: string;
  serving_state: string;
  /** Carried by proofs written since the projection job began recording it. */
  projected_rows_hash?: string;
};

export function assertProjectionProof(
  proof: ProjectionProof,
  expected: { assessmentId: string; sourceSetHash: string },
): void {
  if (
    proof.status !== "passed" ||
    proof.assessment_id !== expected.assessmentId ||
    proof.source_set_hash !== expected.sourceSetHash ||
    proof.client_attestation_state !== "not_client_attested" ||
    proof.serving_state !== "shadow_not_promoted" ||
    proof.projection_version !== version ||
    !/^[a-f0-9]{64}$/.test(proof.projection_hash) ||
    proof.rows !== 3989 ||
    proof.canonical_relationships !== 11727 ||
    proof.dependency_relationship_rows !== 346 ||
    proof.source_linked_rows !== proof.rows ||
    proof.row_types.relationship !== 346 ||
    proof.row_types.enterprise_profile !== 1 ||
    proof.row_types.business_segment !== 3 ||
    proof.row_types.business_function !== 14 ||
    proof.row_types.priority !== 5 ||
    proof.row_types.program !== 24 ||
    proof.row_types.application !== 344 ||
    proof.row_types.contract !== 230
  ) {
    throw new Error(
      "Projection proof does not meet the Home admission contract",
    );
  }
}

/**
 * A promoting run changes what Home serves, so it needs the dataset registry's
 * serving approval for this exact version: a named person's, on top of the
 * load approval. A check run changes nothing and only reports the decision.
 */
export function homeServingDecision(
  mode: string,
  manifests: unknown[],
  pack: Pick<GeneratedPack, "manifest" | "normalized">,
): ServingApprovalDecision {
  const decision = resolveServingApproval(manifests, {
    ...loadBinding(pack),
    surface: "home",
  });
  if (mode !== "check" && !decision.approved) {
    throw new Error(
      `Home admission gate failed: ${decision.reasons.join("; ")}`,
    );
  }
  return decision;
}

export const PROMOTION_MODES = ["check", "promote"] as const;
export type PromotionMode = (typeof PROMOTION_MODES)[number];

/**
 * What a run does. A run that is not told is a check, which changes nothing.
 * A run promotes only when it says so, and any other value is refused rather
 * than read as either.
 */
export function promotionMode(
  env: Record<string, string | undefined>,
): PromotionMode {
  const stated = env.ECL_SYNTHETIC_PROMOTION_MODE;
  if (stated === undefined) return "check";
  if (!(PROMOTION_MODES as readonly string[]).includes(stated)) {
    throw new Error(
      `Home admission mode must be ${PROMOTION_MODES.join(" or ")}; "${stated}" is refused`,
    );
  }
  return stated as PromotionMode;
}

/**
 * What an admission requires of the readback its projection was made from.
 * The counts come from the pack, never from the readback itself.
 */
export function expectedReadbackCounts(
  pack: Pick<GeneratedPack, "manifest" | "normalized">,
): Record<string, number> {
  const objects = (type: string) =>
    pack.normalized.objects.filter((object) => object.type === type).length;
  return {
    source_files: pack.manifest.files.length,
    objects: pack.normalized.objects.length,
    relationships: pack.normalized.relationships.length,
    applications: objects("application"),
    application_modules: objects("application_module"),
    missing_object_lineage: 0,
    missing_edge_lineage: 0,
    invalid_source_files: 0,
    home_projection_manifests: 0,
  };
}

/**
 * The readback a projection proof names is read, not trusted by its address:
 * it must be a passed readback of this tenant, assessment and source set, and
 * must have counted what the pack holds, with no Home projection yet written.
 */
export function assertReadbackBinding(
  readback: {
    status?: unknown;
    tenant_scope?: unknown;
    assessment_id?: unknown;
    source_set_hash?: unknown;
    actual?: unknown;
  },
  pack: Pick<GeneratedPack, "manifest" | "normalized">,
): Record<string, number> {
  const expected = expectedReadbackCounts(pack);
  const actual =
    typeof readback.actual === "object" && readback.actual !== null
      ? (readback.actual as Record<string, unknown>)
      : {};
  if (
    readback.status !== "passed" ||
    readback.tenant_scope !== pack.manifest.tenant_key ||
    readback.assessment_id !== pack.manifest.assessment_id ||
    readback.source_set_hash !== pack.manifest.source_set_hash ||
    Object.entries(expected).some(([key, value]) => actual[key] !== value)
  ) {
    throw new Error(
      "Projection proof is not bound to the independent readback",
    );
  }
  return expected;
}

/**
 * The serving views Home reads, in the reader's own order. The reader keeps
 * its list private, so this is a copy; a test fails when the two differ.
 */
export const HOME_SERVING_VIEWS: readonly string[] = [
  "serving.home_executive_brief",
  "serving.home_our_business",
  "serving.home_strategy_value_creation",
  "serving.home_how_we_operate",
  "serving.home_technology_data",
  "serving.home_performance_value",
  "serving.home_leadership_perspective",
  "serving.home_needs_attention",
  "serving.home_current_state_architecture",
  "serving.home_current_state_data_flow",
  "serving.home_loaded_record",
  "serving.home_browse_record",
  "serving.home_applications_systems",
  "serving.home_vendor_contracts",
  "serving.home_infrastructure_platforms",
  "serving.home_data_assets_integrations",
  "serving.home_metrics_outcomes",
  "serving.home_risks_controls",
  "serving.home_programs_initiatives",
  "serving.home_org_ownership",
  "serving.home_ai_use_cases",
  "serving.home_executive_interviews",
  "serving.home_relationships",
  "serving.home_business_unit_profile",
  "serving.home_data_maturity",
  "serving.home_kpi_register",
];

type VerifiedSourceRefs = Map<string, Map<string, Set<string>>>;

/** What Home is handed for one assessment: the rows its views serve and what they cite. */
export type ServedHome = {
  tenantKey: string;
  assessmentId: string;
  rows: HomeProjectionRow[];
  verifiedSourceRefs: VerifiedSourceRefs;
  sourceCatalogRows: HomeSourceFileReviewRow[];
};

/** What Home's own builder makes of those rows. */
export type ServedHomeSummary = {
  /** Whether Home holds the base bundle it builds this tenant's page on. */
  baseBundle: boolean;
  enterpriseContext: {
    businessModel: string;
    segments: number;
    functions: number;
    priorities: number;
    excludedUncitedRows: number;
    dependencyLinks: number;
  } | null;
  /** Rows per record type of the estate Home shows. */
  estate: Record<string, number>;
};

/**
 * Builds the bundle the Home page builds, with the Home reader's own builder,
 * and reports what came out. The reader is loaded here and not at the top of
 * the module, so the gates before this one do not depend on it.
 */
export async function buildServedHome(
  served: ServedHome,
): Promise<ServedHomeSummary> {
  const [
    { buildHomeReviewBundleFromEclProjectionRows },
    { getHomeReviewBundle },
  ] = await Promise.all([
    import("../../src/lib/home/preview/ecl-projection-bundle"),
    import("../../src/lib/home/preview/golden-snapshot"),
  ]);
  const base = getHomeReviewBundle(served.tenantKey);
  if (!base) return { baseBundle: false, enterpriseContext: null, estate: {} };
  const bundle = buildHomeReviewBundleFromEclProjectionRows(
    base,
    served.rows,
    served.assessmentId,
    served.verifiedSourceRefs,
    served.sourceCatalogRows,
  );
  const context = bundle.thesis.signalPacket.homeEnterpriseContext ?? null;
  return {
    baseBundle: true,
    enterpriseContext: context && {
      businessModel: context.profile.businessModel,
      segments: context.segmentSpine.segments.length,
      functions: context.functions.length,
      priorities: context.priorities.length,
      excludedUncitedRows: context.excludedUncitedRows,
      dependencyLinks: context.dependencyProof?.projectedLinks ?? 0,
    },
    estate: Object.fromEntries(
      (bundle.technologyEstate?.recordTypes ?? []).map((type) => [
        type.objectType,
        type.rows.length,
      ]),
    ),
  };
}

type LandscapeRow = PersistedHomeRow & {
  projection_entry_id: string;
  projection_manifest_id: string;
  projection_version: number;
  quality_state: string;
  admission_status: string;
};

type ProjectionRead = {
  landscape: LandscapeRow[];
  entries: { id: string; source_hash: string }[];
  links: {
    projection_entry_id: string;
    source_record_id: string;
    source_hash: string;
    ref_role: string;
  }[];
  sourceRecordIds: Set<string>;
};

/**
 * Reads a projection one table at a time. No statement here joins two tables,
 * so none has a plan that depends on table statistics: a join of these tables
 * with no statistics behind it was planned as nested loops over every row and
 * did not finish. The rows are joined in memory instead.
 */
async function readProjection(
  db: JobDatabase,
  scope: [string, string],
  manifestId: string,
): Promise<ProjectionRead> {
  const landscape = await db.query<LandscapeRow>(
    `select page_key, row_key, row_type, section_key, title, summary,
            primary_object_id::text, source_refs_json, source_hash, value_state,
            display_payload_json, projection_entry_id::text,
            projection_manifest_id::text, projection_version, quality_state,
            admission_status
     from ecl_projection.home_enterprise_landscape
     where tenant_key = $1 and assessment_id = $2
       and projection_manifest_id = $3 and projection_version = $4`,
    [...scope, manifestId, version],
  );
  const entries = await db.query<{ id: string; source_hash: string }>(
    `select id::text, source_hash from ecl_projection.projection_entry
     where tenant_key = $1 and assessment_id = $2
       and projection_manifest_id = $3 and projection_version = $4`,
    [...scope, manifestId, version],
  );
  const links = await db.query<ProjectionRead["links"][number]>(
    `select projection_entry_id::text, source_record_id::text, source_hash, ref_role
     from ecl_projection.projection_entry_source_record_ref
     where tenant_key = $1 and assessment_id = $2`,
    scope,
  );
  const sourceRecords = await db.query<{ id: string }>(
    `select id::text from ecl_source.source_record
     where tenant_key = $1 and assessment_id = $2`,
    scope,
  );
  return {
    landscape: landscape.rows,
    entries: entries.rows,
    links: links.rows,
    sourceRecordIds: new Set(sourceRecords.rows.map((row) => row.id)),
  };
}

/**
 * The source links Home accepts, by the rule its reader applies: a link counts
 * when its projection entry exists with the link's own source hash and the
 * source record it names exists. Returned with the number of such links per
 * entry and hash, which a set of record ids alone would hide.
 */
function verifiedLinks(read: ProjectionRead): {
  refs: VerifiedSourceRefs;
  linkCount: (entryId: string, sourceHash: string, role: string) => number;
} {
  const entryHash = new Map(
    read.entries.map((entry) => [entry.id, entry.source_hash]),
  );
  const refs: VerifiedSourceRefs = new Map();
  const counts = new Map<string, number>();
  for (const link of read.links) {
    if (
      entryHash.get(link.projection_entry_id) !== link.source_hash ||
      !read.sourceRecordIds.has(link.source_record_id)
    ) {
      continue;
    }
    const byHash =
      refs.get(link.projection_entry_id) ?? new Map<string, Set<string>>();
    const linked = byHash.get(link.source_hash) ?? new Set<string>();
    linked.add(link.source_record_id);
    byHash.set(link.source_hash, linked);
    refs.set(link.projection_entry_id, byHash);
    const key = `${link.projection_entry_id}|${link.source_hash}|${link.ref_role}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    refs,
    linkCount: (entryId, sourceHash, role) =>
      counts.get(`${entryId}|${sourceHash}|${role}`) ?? 0,
  };
}

/** Every way the persisted projection differs from what its proof states. */
function projectionDrift(
  read: ProjectionRead,
  links: ReturnType<typeof verifiedLinks>,
  proof: ProjectionProof,
  manifestId: string,
): string[] {
  const issues: string[] = [];
  if (read.landscape.length !== proof.rows) {
    issues.push(
      `${read.landscape.length} projected rows, the proof states ${proof.rows}`,
    );
  }
  const count = (test: (row: LandscapeRow) => boolean) =>
    read.landscape.filter(test).length;
  const outside = count(
    (row) =>
      row.projection_manifest_id !== manifestId ||
      row.projection_version !== version,
  );
  if (outside) {
    issues.push(
      `${outside} rows are not under the proved manifest and version`,
    );
  }
  const unlinked = count(
    (row) => links.linkCount(row.projection_entry_id, row.source_hash, "primary_source") !== 1 ||
      links.linkCount(row.projection_entry_id, row.source_hash, "endpoint_source") !==
        (row.row_type === "relationship" ? 2 : 0),
  );
  if (unlinked) {
    issues.push(
      `${unlinked} rows do not have their required verified source links`,
    );
  }
  const unpassed = count((row) => row.quality_state !== "passed");
  if (unpassed) issues.push(`${unpassed} rows are not quality-passed`);
  const refused = count((row) => row.admission_status === "refused");
  if (refused) issues.push(`${refused} rows are refused`);
  const types: Record<string, number> = {};
  for (const row of read.landscape) {
    types[row.row_type] = (types[row.row_type] ?? 0) + 1;
  }
  for (const type of [
    ...new Set([...Object.keys(types), ...Object.keys(proof.row_types)]),
  ].sort()) {
    if (types[type] !== proof.row_types[type]) {
      issues.push(
        `${types[type] ?? 0} ${type} rows, the proof states ${proof.row_types[type] ?? 0}`,
      );
    }
  }
  return issues;
}

/**
 * The rows Home is served for one declared projection: every serving view the
 * reader reads that this database has, restricted to the tenant, the
 * assessment, the manifest and its projection version, which is the predicate
 * the reader applies to a declared assessment.
 */
async function readServedRows(
  db: JobDatabase,
  scope: [string, string],
  manifestId: string,
): Promise<{
  rows: HomeProjectionRow[];
  views: string[];
  absentViews: string[];
}> {
  const catalogued = await db.query<{ full_name: string }>(
    `select table_schema || '.' || table_name as full_name
     from information_schema.views
     where table_schema = 'serving' and table_name like 'home\\_%'`,
  );
  const present = new Set(catalogued.rows.map((row) => row.full_name));
  const views = HOME_SERVING_VIEWS.filter((view) => present.has(view));
  const absentViews = HOME_SERVING_VIEWS.filter((view) => !present.has(view));
  if (views.length === 0) return { rows: [], views, absentViews };
  const served = await db.query<HomeProjectionRow>(
    views
      .map(
        (view) => `
      select page_key, row_key, row_type, title, summary, projection_entry_id,
             source_hash, source_refs_json, primary_object_id, admission_status,
             payload_json as display_payload_json
      from ${view}
      where tenant_key = $1 and assessment_id = $2
        and projection_manifest_id = $3::uuid and projection_version = $4`,
      )
      .join("\n      union all\n") + "\n      order by page_key, row_key",
    [...scope, manifestId, version],
  );
  return { rows: served.rows, views, absentViews };
}

/** What one admission run is asked to do, and what it was shown before it opened the database. */
export type AdmissionInputs = {
  mode: PromotionMode;
  run: JobRun;
  limits: JobLimits;
  pack: Pick<GeneratedPack, "manifest" | "normalized">;
  projectionProofUri: string;
  proof: ProjectionProof;
  /** The counts the readback named by the proof was held to. */
  readbackCounts: Record<string, number>;
  serving: ServingApprovalDecision;
};

export type AdmissionDeps = {
  /** Where proofs are written, and where one already written is read back. */
  store: ProofStore;
  /** Home's own builder. */
  buildServedHome: (served: ServedHome) => Promise<ServedHomeSummary>;
};

export type AdmissionResult = {
  exitCode: number;
  report: Record<string, unknown>;
};

const sameDeclaration = (
  row: HomeDeclaration,
  binding: Pick<
    HomeDeclaration,
    | "assessment_id"
    | "projection_manifest_id"
    | "source_set_hash"
    | "projection_hash"
    | "projection_proof_uri"
  >,
) =>
  row.assessment_id === binding.assessment_id &&
  row.projection_manifest_id === binding.projection_manifest_id &&
  row.source_set_hash === binding.source_set_hash &&
  row.projection_hash === binding.projection_hash &&
  row.projection_proof_uri === binding.projection_proof_uri;

/**
 * One admission: every gate, and in a promoting run the switch.
 *
 * The gates and the switch are one transaction, held to the job's statement
 * and lock limits. A promoting run writes a pending proof to its own
 * run-scoped path before it commits, so Home is never switched with nothing
 * written, and writes the final proof after. A final proof that cannot be
 * written ends the run non-zero with a report that says the switch is
 * committed and the proof is missing.
 *
 * A run that finds its declaration already active with the same binding
 * switches nothing and does not touch the row: it reports `already_active`
 * and writes a final proof that says so. A check run never writes to the
 * database.
 */
export async function admitHomeProjection(
  db: JobDatabase,
  inputs: AdmissionInputs,
  deps: AdmissionDeps,
): Promise<AdmissionResult> {
  const { mode, run, limits, proof, projectionProofUri, serving } = inputs;
  const { manifest, normalized } = inputs.pack;
  const scope: [string, string] = [manifest.tenant_key, manifest.assessment_id];
  const prefix = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}`;
  const runPath = (file: string) => `${prefix}/runs/${run.runId}/${file}`;
  const idempotencyKey = `${manifest.assessment_id}:${manifest.source_set_hash}`;
  const objects = (type: string) =>
    normalized.objects.filter((object) => object.type === type).length;
  const spine = {
    segments: objects("business_segment"),
    functions: objects("business_function"),
    priorities: objects("strategic_priority"),
  };
  const timings: Record<string, number> = {};
  const timed = async <T>(name: string, work: () => Promise<T>): Promise<T> => {
    const started = Date.now();
    try {
      return await work();
    } finally {
      timings[name] = Date.now() - started;
    }
  };

  let before: HomeDeclaration | null = null;
  let switchedTo: HomeDeclaration | null = null;
  let alreadyActive = false;
  let replaceActiveV1 = false;
  let pendingProofUri: string | null = null;
  let evidence: Record<string, unknown> = {};
  let committing = false;

  await db.query("begin isolation level serializable");
  try {
    await applySqlLimits(db, limits);
    await lockHomeDeclarations(db, manifest.tenant_key);
    const active = await db.query<HomeDeclaration>(
      `select ${declarationColumns}
       from ecl_projection.home_active_assessment
       where tenant_key = $1 and state = 'active'`,
      [manifest.tenant_key],
    );
    const manifests = await db.query<{
      id: string;
      row_count: number;
      projection_hash: string;
      proof_uri: string;
      quality_state: string;
    }>(
      `select id::text, row_count, projection_hash, proof_uri, quality_state
       from ecl_projection.projection_manifest
       where tenant_key = $1 and assessment_id = $2
         and projection_key = $3 and source_hash = $4
         and projection_version = $5`,
      [...scope, surface, manifest.source_set_hash, version],
    );
    const proved = manifests.rows[0];
    if (
      manifests.rows.length !== 1 ||
      proved.row_count !== proof.rows ||
      proved.projection_hash !== proof.projection_hash ||
      proved.proof_uri !== projectionProofUri
    ) {
      throw new Error(
        "Projection manifest does not match the independent proof",
      );
    }
    const binding = {
      assessment_id: manifest.assessment_id,
      projection_manifest_id: proved.id,
      source_set_hash: manifest.source_set_hash,
      projection_hash: proof.projection_hash,
      projection_proof_uri: projectionProofUri,
    };
    alreadyActive =
      active.rows.length === 1 && sameDeclaration(active.rows[0], binding);
    if (active.rows.length === 1 && !alreadyActive) {
      const current = active.rows[0];
      const prior = await db.query<{
        projection_version: number;
        row_count: number;
        source_hash: string;
        projection_hash: string;
        proof_uri: string;
      }>(
        `select projection_version, row_count, source_hash, projection_hash, proof_uri
         from ecl_projection.projection_manifest
         where tenant_key = $1 and assessment_id = $2 and id = $3`,
        [...scope, current.projection_manifest_id],
      );
      const old = prior.rows[0];
      replaceActiveV1 = current.assessment_id === manifest.assessment_id &&
        current.source_set_hash === manifest.source_set_hash &&
        prior.rows.length === 1 && old.projection_version === 1 &&
        old.row_count === 3643 && old.source_hash === manifest.source_set_hash &&
        old.projection_hash === current.projection_hash &&
        old.proof_uri === current.projection_proof_uri;
    }
    if (
      active.rows.length > 1 ||
      (active.rows.length === 1 && !alreadyActive && !replaceActiveV1)
    ) {
      throw new Error("A different Home assessment is already active");
    }
    // Recorded, and refused only when the projection itself is blocked.
    if (proved.quality_state === "blocked") {
      throw new Error("Projection manifest is blocked and cannot be served");
    }

    const read = await timed("projection_read", () =>
      readProjection(db, scope, proved.id),
    );
    const links = verifiedLinks(read);
    const drift = projectionDrift(read, links, proof, proved.id);
    if (drift.length) {
      throw new Error(
        `Canonical Home rows or source links drifted before admission: ${drift.join("; ")}`,
      );
    }
    const persistedRowsHash = projectedRowsHash(
      read.landscape.map(persistedProjectedRow),
    );
    if (
      proof.projected_rows_hash !== undefined &&
      proof.projected_rows_hash !== persistedRowsHash
    ) {
      throw new Error(
        "Projected Home rows are not the rows the projection proof was written for",
      );
    }

    const served = await timed("serving_read", () =>
      readServedRows(db, scope, proved.id),
    );
    if (
      served.rows.length !== proof.rows ||
      new Set(served.rows.map((row) => `${row.page_key}:${row.row_key}`))
        .size !== proof.rows
    ) {
      throw new Error(
        `Home serving views do not serve the proved projection: ${served.rows.length} of ${proof.rows} rows are served${
          served.absentViews.length
            ? `; no serving view for ${served.absentViews.join(", ")}`
            : ""
        }`,
      );
    }
    const sourceCatalog = await db.query<HomeSourceFileReviewRow>(
      `select id::text, file_name, file_hash, source_date::text, quality_state
       from ecl_source.source_file
       where tenant_key = $1 and assessment_id = $2`,
      scope,
    );
    const home = await timed("home_build", () =>
      deps.buildServedHome({
        tenantKey: manifest.tenant_key,
        assessmentId: manifest.assessment_id,
        rows: served.rows,
        verifiedSourceRefs: links.refs,
        sourceCatalogRows: sourceCatalog.rows,
      }),
    );
    const context = home.enterpriseContext;
    if (
      !home.baseBundle ||
      !context ||
      context.segments !== spine.segments ||
      context.functions !== spine.functions ||
      context.priorities !== spine.priorities ||
      context.excludedUncitedRows !== 0 ||
      context.dependencyLinks !== proof.dependency_relationship_rows
    ) {
      throw new Error(
        "Home business spine cannot be built from the served projection",
      );
    }
    if (
      home.estate.application_system !== proof.row_types.application ||
      home.estate.vendor_contract !== proof.row_types.contract
    ) {
      throw new Error(
        "Home does not show the proved applications and contracts",
      );
    }

    before = await readHomeDeclaration(db, ...scope);
    evidence = {
      assessment_id: manifest.assessment_id,
      source_set_hash: manifest.source_set_hash,
      projection_hash: proof.projection_hash,
      projection_proof_uri: projectionProofUri,
      projection_manifest_id: proved.id,
      projection_version: version,
      projected_rows_hash: persistedRowsHash,
      manifest_quality_state: proved.quality_state,
      client_attestation_state: "not_client_attested",
      serving_approval: serving.approved ? serving.approval : null,
      serving_approval_reasons: serving.approved ? [] : serving.reasons,
      validation: {
        projected_rows: read.landscape.length,
        source_linked_rows: read.landscape.length,
        dependency_relationship_rows: context.dependencyLinks,
        row_types: proof.row_types,
        projected_rows_hash_compared_with_proof:
          proof.projected_rows_hash !== undefined,
        served_rows: served.rows.length,
        serving_views_read: served.views.length,
        absent_serving_views: served.absentViews,
        readback_proof_uri: proof.readback_proof_uri,
        readback_counts: inputs.readbackCounts,
        timings_ms: timings,
      },
      quality_gate: {
        manifest_quality_state: proved.quality_state,
        home_enterprise_context: context,
        home_estate: {
          application_system: home.estate.application_system,
          vendor_contract: home.estate.vendor_contract,
        },
        serving_approved: serving.approved,
      },
    };

    if (mode === "promote" && !alreadyActive) {
      const selected = replaceActiveV1
        ? await db.query<HomeDeclaration>(
          `update ecl_projection.home_active_assessment
           set projection_manifest_id = $3, projection_hash = $4,
               projection_proof_uri = $5, activated_at = now(), retired_at = null
           where tenant_key = $1 and assessment_id = $2 and state = 'active'
             and projection_manifest_id = $6 and source_set_hash = $7
             and projection_hash = $8 and projection_proof_uri = $9
           returning ${declarationColumns}`,
          [
            ...scope, proved.id, proof.projection_hash, projectionProofUri,
            active.rows[0].projection_manifest_id, manifest.source_set_hash,
            active.rows[0].projection_hash, active.rows[0].projection_proof_uri,
          ],
        )
        : await db.query<HomeDeclaration>(
        `insert into ecl_projection.home_active_assessment
         (tenant_key, assessment_id, projection_manifest_id, source_set_hash,
          projection_hash, projection_proof_uri, state)
         values ($1,$2,$3,$4,$5,$6,'active')
         on conflict (tenant_key, assessment_id) do update
         set state = 'active', retired_at = null, activated_at = now()
         where ecl_projection.home_active_assessment.state = 'retired'
           and ecl_projection.home_active_assessment.projection_manifest_id = excluded.projection_manifest_id
           and ecl_projection.home_active_assessment.source_set_hash = excluded.source_set_hash
           and ecl_projection.home_active_assessment.projection_hash = excluded.projection_hash
           and ecl_projection.home_active_assessment.projection_proof_uri = excluded.projection_proof_uri
         returning ${declarationColumns}`,
        [
          ...scope,
          proved.id,
          manifest.source_set_hash,
          proof.projection_hash,
          projectionProofUri,
        ],
        );
      if (selected.rows.length !== 1) {
        throw new Error(
          "Existing retired Home declaration has a different proof",
        );
      }
      switchedTo = selected.rows[0];
      // Evidence first: the switch is not committed until this is written.
      const pendingPath = runPath("home-admission-pending.json");
      const pending = {
        ...evidence,
        serving_state: "home_active_pending_commit",
        outcome: "pending",
        declaration_before: before,
        declaration_after: switchedTo,
        ...jobRecord(run, {
          tenantScope: manifest.tenant_key,
          inputSourceVersion: manifest.source_set_hash,
          idempotencyKey,
          status: "pending",
          proofUri: deps.store.uriFor(pendingPath),
          limits,
        }),
      };
      let recorded: { uri: string; created: boolean };
      try {
        recorded = await deps.store.writeOnce(pendingPath, proofBytes(pending));
        if (!recorded.created) {
          // This run id already recorded a pending admission. Its path names
          // the tenant, assessment and source set, so it can only be for this
          // projection; it must also have started from the same declaration.
          const earlier = JSON.parse(
            (await deps.store.read(recorded.uri)).toString("utf8"),
          ) as Record<string, unknown>;
          if (!isDeepStrictEqual(earlier.declaration_before, before)) {
            throw new Error(
              "This run id already recorded a different pending admission; use a new run id",
            );
          }
        }
      } catch (error) {
        throw new Error(
          `Home admission could not record its pending proof; nothing was switched: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { cause: error },
        );
      }
      pendingProofUri = recorded.uri;
    }
    committing = true;
    await commitTransaction(db, "Home admission", "nothing was switched");
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    const limit = committing ? null : sqlTimeout(error);
    if (limit) {
      throw new Error(
        `Home admission stopped at its ${limit} timeout; nothing was switched`,
        { cause: error },
      );
    }
    throw error;
  }

  // Past this point the transaction is committed. Nothing below may throw:
  // each failure is reported with what is already true of Home.
  const switched = switchedTo !== null;
  const proofFile =
    mode === "check"
      ? "home-preflight-proof.json"
      : "home-admission-proof.json";
  const proofUri = deps.store.uriFor(runPath(proofFile));
  const outcome =
    mode === "check" ? "checked" : switched ? "promoted" : "already_active";
  const homeSwitch = switched
    ? "committed_by_this_run"
    : alreadyActive
      ? "committed_before_this_run"
      : "not_switched";
  // `declaration` is the row as last read: after the commit when that read
  // succeeded, and otherwise what the transaction itself saw. `confirmed` is
  // false when that read contradicts what this run reports.
  const failed = (
    reason: string,
    declaration: HomeDeclaration | null,
    confirmed = true,
  ): AdmissionResult => ({
    exitCode: 1,
    report: {
      job_name: run.jobName,
      run_id: run.runId,
      tenant_scope: manifest.tenant_key,
      assessment_id: manifest.assessment_id,
      status: "failed",
      outcome,
      home_switch: confirmed ? homeSwitch : "not_confirmed",
      final_proof: "missing",
      final_proof_uri: proofUri,
      pending_proof_uri: pendingProofUri,
      declaration_before: before,
      declaration_after: declaration,
      reason,
      recovery: !confirmed
        ? "what Home serves is not what this run reports; run a check, then run the job again under a new run id"
        : homeSwitch === "not_switched"
          ? "nothing was switched; run the job again under a new run id"
          : "the switch is committed; run the job again to write a final proof, which reports already_active",
    },
  });

  let after: HomeDeclaration | null;
  try {
    await db.query("begin");
    await applySqlLimits(db, limits);
    after = await readHomeDeclaration(db, ...scope);
    await db.query("commit");
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    return failed(
      `the declaration could not be read back after commit: ${
        error instanceof Error ? error.message : String(error)
      }`,
      switchedTo ?? before,
    );
  }
  if (!isDeepStrictEqual(after, switchedTo ?? before)) {
    return failed(
      "the declaration read back after commit is not the active declaration this run reports",
      after,
      false,
    );
  }
  const isActive = mode === "promote" || alreadyActive;
  const final = {
    ...evidence,
    serving_state: isActive ? "home_active" : "shadow_verified",
    outcome,
    home_switch: homeSwitch,
    declaration_before: before,
    declaration_after: after,
    pending_proof_uri: pendingProofUri,
    ...jobRecord(run, {
      tenantScope: manifest.tenant_key,
      inputSourceVersion: manifest.source_set_hash,
      idempotencyKey,
      status: "passed",
      proofUri,
      limits,
    }),
  };
  let written: { created: boolean };
  try {
    written = await deps.store.writeOnce(runPath(proofFile), proofBytes(final));
    if (!written.created) {
      // A proof this run did not write. It stands only for a run that
      // switched nothing and finds the declaration that proof describes.
      const earlier = JSON.parse(
        (await deps.store.read(proofUri)).toString("utf8"),
      ) as Record<string, unknown>;
      if (
        outcome !== "already_active" ||
        !isDeepStrictEqual(earlier.declaration_after, after)
      ) {
        return failed(
          "a proof already exists at this run's path and was not written by this run",
          after,
        );
      }
    }
  } catch (error) {
    return failed(
      `the final proof could not be written: ${
        error instanceof Error ? error.message : String(error)
      }`,
      after,
    );
  }
  return {
    exitCode: 0,
    report: { ...final, proof_uri: proofUri, proof_written: written.created },
  };
}

export type PromotionSettings = {
  mode: PromotionMode;
  databaseUrl: string;
  account: string;
  identity: string;
  projectionProofUri: string;
  inputSourceVersion: string | undefined;
  idempotencyKey: string | undefined;
  run: JobRun;
  limits: JobLimits;
};

/** Every binding a run needs, checked before anything is generated or opened. */
export function promotionSettings(
  env: Record<string, string | undefined>,
): PromotionSettings {
  const databaseUrl = env.DATABASE_URL;
  const account = env.AZURE_STORAGE_ACCOUNT_NAME;
  const identity = env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
  const projectionProofUri = env.ECL_SYNTHETIC_PROJECTION_PROOF_URI;
  if (
    !databaseUrl ||
    !account ||
    !identity ||
    !env.ECL_SYNTHETIC_RUN_ID ||
    !projectionProofUri ||
    env.ECL_SYNTHETIC_LAB_APPROVAL !== "accepted_lab" ||
    !env.ECL_SYNTHETIC_IMAGE_DIGEST
  ) {
    throw new Error(
      "Home admission requires a pinned, approved private job and projection proof",
    );
  }
  const mode = promotionMode(env);
  return {
    mode,
    databaseUrl,
    account,
    identity,
    projectionProofUri,
    inputSourceVersion: env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION,
    idempotencyKey: env.ECL_SYNTHETIC_IDEMPOTENCY_KEY,
    run: jobRun(
      env,
      mode === "check"
        ? "ecl-synthetic-enterprise-v2-check-home"
        : "ecl-synthetic-enterprise-v2-promote-home",
    ),
    limits: jobLimits(env),
  };
}

/** Everything a run touches outside this module, so a test can stand in for it. */
export type PromotionRuntime = {
  generate: () => Promise<GeneratedPack>;
  dispose: (pack: GeneratedPack) => Promise<void>;
  manifests: () => Promise<unknown[]>;
  registeredTenants: () => Promise<ReadonlySet<string>>;
  connect: (databaseUrl: string) => Promise<JobClient>;
  store: (settings: PromotionSettings) => Promise<ProofStore>;
  buildServedHome: AdmissionDeps["buildServedHome"];
  report: (line: string) => void;
  fail: (error: unknown) => void;
};

const productionRuntime: PromotionRuntime = {
  generate: () => generatePack("v2"),
  dispose: (pack) => rm(pack.dir, { recursive: true, force: true }),
  manifests: () => readDatasetManifests(),
  registeredTenants: () => registeredTenantKeys(),
  connect: connectDatabase,
  store: (settings) =>
    blobProofStore(settings.account, settings.identity, settings.limits),
  buildServedHome,
  report: (line) => {
    process.stdout.write(`${line}\n`);
  },
  fail: (error) => {
    console.error(error);
  },
};

/**
 * One admission run, start to finish. It returns the process exit code and
 * never throws. Everything a run is refused for before the database is opened
 * is checked in this order: its bindings, the pinned source version, the
 * tenant, the registry's approval, the proof and the readback the proof names.
 */
export async function runPromotionJob(
  env: Record<string, string | undefined>,
  runtime: PromotionRuntime = productionRuntime,
): Promise<number> {
  try {
    const settings = promotionSettings(env);
    const { mode, run, limits } = settings;
    const pack = await runtime.generate();
    try {
      const { manifest } = pack;
      if (settings.inputSourceVersion !== manifest.source_set_hash) {
        throw new Error("Home admission source version is not pinned");
      }
      if (
        settings.idempotencyKey !==
        `${manifest.assessment_id}:${manifest.source_set_hash}`
      ) {
        throw new Error(
          "Home admission idempotency key does not name this assessment and source set",
        );
      }
      // Tenancy is what the tenant input registry declares, and nothing else.
      assertRegisteredTenant(
        manifest.tenant_key,
        await runtime.registeredTenants(),
      );
      const serving = homeServingDecision(
        mode,
        await runtime.manifests(),
        pack,
      );
      const prefix = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}`;
      const pinned = (uri: unknown, fileName: string) =>
        pinnedRunBlobPath(uri, { account: settings.account, prefix, fileName });
      if (!pinned(settings.projectionProofUri, "projection-proof.json")) {
        throw new Error(
          "Projection proof URI is outside the pinned source set",
        );
      }
      const store = boundedStore(await runtime.store(settings), limits);
      const proof = JSON.parse(
        (await store.read(settings.projectionProofUri)).toString("utf8"),
      ) as ProjectionProof;
      assertProjectionProof(proof, {
        assessmentId: manifest.assessment_id,
        sourceSetHash: manifest.source_set_hash,
      });
      if (!pinned(proof.readback_proof_uri, "readback.json")) {
        throw new Error(
          "Projection proof is not bound to the independent readback",
        );
      }
      const readbackCounts = assertReadbackBinding(
        JSON.parse(
          (await store.read(proof.readback_proof_uri)).toString("utf8"),
        ),
        pack,
      );
      const db = await runtime.connect(settings.databaseUrl);
      let result: AdmissionResult;
      try {
        result = await admitHomeProjection(
          db,
          {
            mode,
            run,
            limits,
            pack,
            projectionProofUri: settings.projectionProofUri,
            proof,
            readbackCounts,
            serving,
          },
          { store, buildServedHome: runtime.buildServedHome },
        );
      } finally {
        await db.end();
      }
      runtime.report(JSON.stringify(result.report));
      return result.exitCode;
    } finally {
      await runtime.dispose(pack);
    }
  } catch (error) {
    runtime.fail(error);
    return 1;
  }
}

// Compares resolved files: a path comparison answers "imported" for a run
// through a symlinked directory, and the job would exit 0 having done nothing.
if (isDirectInvocation(import.meta.url)) {
  void runPromotionJob(process.env).then((code) => {
    process.exitCode = code;
  });
}
