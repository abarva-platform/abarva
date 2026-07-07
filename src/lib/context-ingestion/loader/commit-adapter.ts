// Admin Loader — manifest synthesis + commit adapter.
//
// Bridges the *intelligent* loader (mapping proposals over preserved originals)
// to the *existing governed* bulk pipeline (`runBulkContextUpload`). Synthesizing
// a `BulkContextUploadManifest` and handing it to the governed runner means we
// inherit its blob staging, attestation, queue handoff, and tenant-context
// commit verbatim — no parallel security path, no duplication.
//
// Pure synthesis (`synthesizeManifest`/`planCommit`) is I/O-free and unit-tested
// against a fake runner; only `commitAcceptedProposals` touches the real pipeline.

import {
  runBulkContextUpload,
  type BulkContextUploadManifest,
  type BulkContextUploadManifestFile,
  type BulkContextUploadResult,
} from "@/lib/context-ingestion/bulk-context-upload";
import { getTemplateForDimension } from "@/lib/context-ingestion/template-registry";
import type { ContextDimension } from "@/lib/context-ingestion/types";
import {
  classifyConfidence,
  type LoaderDimension,
  type MappingProposal,
} from "@/lib/context-ingestion/loader/contract";

/**
 * Loader dimension → canonical context dimension. Every right-hand value is a
 * member of the `ContextDimension` union (verified at compile time by the
 * `Record<…, ContextDimension>` annotation, and at runtime by the test suite).
 */
export const LOADER_DIMENSION_TO_CONTEXT: Record<
  Exclude<LoaderDimension, "unknown">,
  ContextDimension
> = {
  leadership_org: "org_roles_teams",
  kpis: "financial_kpis",
  applications_systems: "application_portfolio",
  data_analytics_stack: "data_platform_lineage",
  integrations: "integration_topology",
  vendors_contracts: "vendor_contracts",
  business_units_geographies: "business_units_segment_pnl",
  initiatives_roadmap: "transformation_initiatives",
  risks_controls: "regulatory_qms_risk",
  financial_baseline: "financial_kpis",
  processes_operating_model: "enterprise_profile",
  infrastructure_estate: "infrastructure_cloud",
  business_capability: "capabilities_value_streams",
};

const DEFAULT_DATA_CLASSIFICATION = "confidential";

/**
 * Resolve the governed bulk template id for a loader dimension via its canonical
 * context dimension. Returns null for `unknown` or when no template is registered
 * for the resolved dimension (under the given tenant).
 */
export function resolveTemplateId(
  dimension: LoaderDimension,
  opts: { tenantKey?: string | null },
): string | null {
  if (dimension === "unknown") return null;
  const contextDimension = LOADER_DIMENSION_TO_CONTEXT[dimension];
  if (!contextDimension) return null;
  return (
    getTemplateForDimension(contextDimension, {
      tenantKey: opts.tenantKey ?? null,
    })?.id ?? null
  );
}

/**
 * Translate one accepted mapping proposal into a governed manifest file entry.
 * Only mappings classified above the `ask` threshold are committed; low-confidence
 * mappings are dropped (they belong in clarification, not in an auto-commit).
 *
 * @throws `loader_commit_no_template_for_dimension:<dim>` when no template resolves.
 */
export function proposalToManifestFile(
  proposal: MappingProposal,
  opts: { tenantKey?: string | null },
): BulkContextUploadManifestFile {
  const templateId = resolveTemplateId(proposal.dimension, opts);
  if (!templateId) {
    throw new Error(
      `loader_commit_no_template_for_dimension:${proposal.dimension}`,
    );
  }

  const fieldMappings: Record<string, string> = {};
  for (const mapping of proposal.fieldMappings) {
    // Skip low-confidence ('ask') mappings — only commit confident ones.
    if (classifyConfidence(mapping.confidence) === "ask") continue;
    fieldMappings[mapping.sourceColumn] = mapping.canonicalField;
  }

  return {
    path: proposal.source.filename,
    templateId,
    fieldMappings,
    dataClassification: DEFAULT_DATA_CLASSIFICATION,
  };
}

/**
 * Pure manifest builder. Maps each accepted proposal to a manifest file. Callers
 * should pass proposals that are already cleared for auto-commit (see
 * `planCommit`, which filters review-required ones first).
 *
 * @throws `loader_commit_no_accepted_files` when `accepted` is empty.
 */
export function synthesizeManifest(args: {
  loadName: string;
  accepted: MappingProposal[];
  tenantKey?: string | null;
  defaultDataClassification?: string;
}): BulkContextUploadManifest {
  if (args.accepted.length === 0) {
    throw new Error("loader_commit_no_accepted_files");
  }

  const files = args.accepted.map((proposal) =>
    proposalToManifestFile(proposal, { tenantKey: args.tenantKey ?? null }),
  );

  return {
    loadName: args.loadName,
    defaultDataClassification:
      args.defaultDataClassification ?? DEFAULT_DATA_CLASSIFICATION,
    files,
  };
}

/**
 * Plan a commit: filter out document-derived proposals (`reviewRequired: true`,
 * which must never be auto-committed) and synthesize a manifest from the rest.
 * Returns the manifest plus the filenames skipped because they need review.
 */
export function planCommit(args: {
  loadName: string;
  accepted: MappingProposal[];
  tenantKey?: string | null;
  defaultDataClassification?: string;
}): {
  manifest: BulkContextUploadManifest;
  skippedReviewRequired: string[];
} {
  const committable: MappingProposal[] = [];
  const skippedReviewRequired: string[] = [];

  for (const proposal of args.accepted) {
    if (proposal.reviewRequired) {
      skippedReviewRequired.push(proposal.source.filename);
      continue;
    }
    committable.push(proposal);
  }

  const manifest = synthesizeManifest({
    loadName: args.loadName,
    accepted: committable,
    tenantKey: args.tenantKey ?? null,
    defaultDataClassification: args.defaultDataClassification,
  });

  return { manifest, skippedReviewRequired };
}

/** Injectable governed-pipeline dependency so tests never hit blob/queue/DB. */
export interface CommitDeps {
  runBulk: typeof runBulkContextUpload;
}

type Attestation = Parameters<typeof runBulkContextUpload>[0]["attestation"];

/**
 * Synthesize a manifest from accepted proposals and hand it to the governed bulk
 * pipeline, which owns blob staging, attestation verification, queue handoff, and
 * tenant-context commit. Document-derived proposals are filtered out (returned in
 * `skippedReviewRequired`) — they never auto-commit.
 */
export async function commitAcceptedProposals(args: {
  loadName: string;
  accepted: MappingProposal[];
  tenantKey: string;
  clientId: string;
  uploadedBy: string;
  attestation: Attestation;
  mode: "validate_only" | "stage_and_enqueue" | "stage_and_process";
  files: Array<{ name: string; type?: string; bytes: ArrayBuffer }>;
  deps?: CommitDeps;
}): Promise<{
  result: BulkContextUploadResult;
  skippedReviewRequired: string[];
}> {
  const runBulk = args.deps?.runBulk ?? runBulkContextUpload;

  const { manifest, skippedReviewRequired } = planCommit({
    loadName: args.loadName,
    accepted: args.accepted,
    tenantKey: args.tenantKey,
  });

  const result = await runBulk({
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    uploadedBy: args.uploadedBy,
    manifest,
    files: args.files,
    attestation: args.attestation,
    mode: args.mode,
  });

  return { result, skippedReviewRequired };
}
