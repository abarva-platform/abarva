import "server-only";

// PR10 — governed persistence + download authorization + re-render from the
// persisted contract. Pure and testable; the live persist path and download
// route consume these (the DB writes / HTTP live in the route + persist site).
//
// Principles enforced here:
//   • Immutable synchronization metadata travels WITH the contract (one record).
//   • A regenerated contract is a NEW governed version — never a silent overwrite
//     (supersession lineage points at the version it supersedes).
//   • Downloads RE-RENDER from the persisted contract identified by
//     artifact/version — they never regenerate independently.
//   • Refusals are honest and non-enumerating for cross-tenant requests.

import { z } from "zod";
import type {
  RoadmapArtifactProvenance,
  RoadmapPipeline,
} from "./build-governed-roadmap-artifact";
import {
  ROADMAP_CONTRACT_VERSION,
  type RoadmapPresentationContract,
  roadmapContentHash,
} from "./roadmap-presentation-contract";
import { ROADMAP_STRUCTURED_OUTPUT_VERSION } from "./roadmap-structured-output";
import { renderRoadmapPreviewHtml } from "./roadmap-preview-html-renderer";
import { renderRoadmapDetailDocx } from "./roadmap-docx-renderer";
import { renderExecutiveRoadmapPptx } from "./roadmap-pptx-renderer";

/** Renderer versions stamped into the sync metadata so a download can prove
 * which renderer produced (or would re-produce) each format. Bump when a
 * renderer's output changes materially. */
export const ROADMAP_RENDERER_VERSIONS = {
  html: "1.0.0",
  docx: "1.0.0",
  pptx: "1.0.0",
} as const;

export type RoadmapDownloadFormat =
  | "pptx"
  | "docx"
  | "html"
  | "contract"
  | "provenance";

/** The immutable synchronization metadata persisted with every governed roadmap
 * version (user PR10 step 2). Every field is required — this is the audit spine. */
export interface RoadmapSyncMetadata {
  tenantKey: string;
  moveId: string;
  artifactId: string;
  pipeline: RoadmapPipeline;
  contractVersion: string;
  contentHash: string;
  lifecycleStateVersion: string;
  structuredOutputSchemaVersion: string;
  sourceLineageRefs: string[];
  generationRunId: string;
  generatedAt: string;
  validationResult: "passed";
  contradictionCheckResult: "passed";
  rendererVersions: typeof ROADMAP_RENDERER_VERSIONS;
  /** The prior version's content hash this one supersedes, or null for the first. */
  supersedesContentHash: string | null;
  /** Monotonic governed version number (new version, never an overwrite). */
  version: number;
}

/** The full persisted record: the contract, its provenance, and the immutable
 * sync metadata. This is what the persist site writes to structured_data and the
 * download route reads back. */
export interface PersistedRoadmapRecord {
  contract: RoadmapPresentationContract;
  provenance: RoadmapArtifactProvenance;
  sync: RoadmapSyncMetadata;
}

export interface BuildPersistPayloadArgs {
  contract: RoadmapPresentationContract;
  provenance: RoadmapArtifactProvenance;
  artifactId: string;
  generationRunId: string;
  lifecycleStateVersion: string;
  /** The prior governed record for this artifact, if regenerating. */
  prior?: { sync: RoadmapSyncMetadata } | null;
}

/** Build the immutable persisted record from a successful governed build. Pure. */
export function buildPersistedRoadmapRecord(
  args: BuildPersistPayloadArgs,
): PersistedRoadmapRecord {
  const { contract, provenance, artifactId, generationRunId } = args;
  const version = args.prior ? args.prior.sync.version + 1 : 1;
  const sync: RoadmapSyncMetadata = {
    tenantKey: contract.lineage.tenantKey,
    moveId: contract.lineage.moveId,
    artifactId,
    pipeline: provenance.pipeline,
    contractVersion: contract.contractVersion,
    contentHash: contract.contentHash,
    lifecycleStateVersion: args.lifecycleStateVersion,
    structuredOutputSchemaVersion: provenance.structuredOutputVersion,
    sourceLineageRefs: provenance.sourceLineageRefs,
    generationRunId,
    generatedAt: provenance.generatedAt,
    validationResult: "passed",
    contradictionCheckResult: "passed",
    rendererVersions: ROADMAP_RENDERER_VERSIONS,
    supersedesContentHash: args.prior ? args.prior.sync.contentHash : null,
    version,
  };
  return { contract, provenance, sync };
}

// ── Download authorization ─────────────────────────────────────────────────

export interface RoadmapDownloadRequester {
  tenantKey: string;
  /** Whether the caller may read restricted artifacts (contract JSON / provenance). */
  canReadRestricted: boolean;
}

export interface RoadmapDownloadTarget {
  /** The persisted record, or null when none exists / validation failed. */
  record: PersistedRoadmapRecord | null;
  /** Lifecycle/status of the stored artifact. */
  status: "active" | "superseded" | "rejected";
  /** Versions that actually exist for this artifact. */
  availableVersions: number[];
}

export type RoadmapDownloadDecision =
  | { allowed: true }
  | {
      allowed: false;
      httpStatus: 403 | 404 | 409;
      code:
        | "roadmap_contract_missing"
        | "roadmap_artifact_superseded"
        | "roadmap_artifact_rejected"
        | "roadmap_version_not_available"
        | "roadmap_forbidden"
        | "roadmap_not_found";
      reason: string;
    };

/** Decide whether a download is permitted. Non-enumerating: a cross-tenant
 * request returns not_found (404), never a 403 that would confirm the artifact
 * exists. Pure. */
export function authorizeRoadmapDownload(args: {
  requester: RoadmapDownloadRequester;
  target: RoadmapDownloadTarget;
  format: RoadmapDownloadFormat;
  requestedVersion?: number;
}): RoadmapDownloadDecision {
  const { requester, target, format, requestedVersion } = args;

  // 1) No valid contract exists at all → not found (do not distinguish from
  //    cross-tenant, so existence is never leaked).
  if (!target.record) {
    return {
      allowed: false,
      httpStatus: 404,
      code: "roadmap_not_found",
      reason: "No valid structured roadmap contract exists for this artifact.",
    };
  }

  // 2) Tenant / move ownership mismatch → non-enumerating not_found.
  if (requester.tenantKey !== target.record.sync.tenantKey) {
    return {
      allowed: false,
      httpStatus: 404,
      code: "roadmap_not_found",
      reason: "Not found.",
    };
  }

  // 3) Restricted formats require the restricted-read permission.
  if (
    (format === "contract" || format === "provenance") &&
    !requester.canReadRestricted
  ) {
    return {
      allowed: false,
      httpStatus: 403,
      code: "roadmap_forbidden",
      reason:
        "Contract JSON and provenance are restricted to audit/admin access.",
    };
  }

  // 4) Rejected or superseded artifacts are not downloadable as current.
  if (target.status === "rejected") {
    return {
      allowed: false,
      httpStatus: 409,
      code: "roadmap_artifact_rejected",
      reason: "This roadmap artifact has been rejected.",
    };
  }
  if (target.status === "superseded" && requestedVersion === undefined) {
    return {
      allowed: false,
      httpStatus: 409,
      code: "roadmap_artifact_superseded",
      reason:
        "This roadmap version has been superseded; request the current version explicitly.",
    };
  }

  // 5) A specific version was requested that does not exist.
  if (
    requestedVersion !== undefined &&
    !target.availableVersions.includes(requestedVersion)
  ) {
    return {
      allowed: false,
      httpStatus: 404,
      code: "roadmap_version_not_available",
      reason: `Version ${requestedVersion} is not available.`,
    };
  }

  return { allowed: true };
}

// ── Re-render from the persisted contract (never regenerate) ────────────────

/** Minimal shape validation of a stored contract so a corrupt/absent contract
 * cannot be served. We re-derive the hash and require it to match what was
 * stored — a stored contract whose content no longer hashes to its recorded
 * hash is treated as invalid. */
const StoredContractShape = z.object({
  contractVersion: z.string(),
  contentHash: z.string(),
  executiveConclusion: z.string(),
  lineage: z.object({ moveId: z.string(), tenantKey: z.string() }),
});

export type RenderPersistedResult =
  | { ok: true; format: "html"; body: string; contentType: string }
  | { ok: true; format: "docx" | "pptx"; body: Buffer; contentType: string }
  | {
      ok: true;
      format: "contract" | "provenance";
      body: string;
      contentType: string;
    }
  | { ok: false; code: "roadmap_contract_missing"; reason: string };

const CONTENT_TYPES = {
  html: "text/html; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  json: "application/json; charset=utf-8",
} as const;

/** Re-render a persisted record into the requested format. It renders from the
 * STORED contract — it does not regenerate. A missing/invalid stored contract
 * yields a governed failure, never a fabricated render. */
export async function renderPersistedRoadmap(
  record: PersistedRoadmapRecord | null,
  format: RoadmapDownloadFormat,
): Promise<RenderPersistedResult> {
  if (!record) {
    return {
      ok: false,
      code: "roadmap_contract_missing",
      reason: "No persisted roadmap contract to render.",
    };
  }
  const shape = StoredContractShape.safeParse(record.contract);
  if (!shape.success) {
    return {
      ok: false,
      code: "roadmap_contract_missing",
      reason: "Persisted roadmap contract failed shape validation.",
    };
  }
  // Integrity: the stored contract must still hash to its recorded hash.
  const { contentHash, ...seed } = record.contract;
  if (roadmapContentHash(seed) !== contentHash) {
    return {
      ok: false,
      code: "roadmap_contract_missing",
      reason: "Persisted roadmap contract failed hash integrity check.",
    };
  }

  switch (format) {
    case "html":
      return {
        ok: true,
        format: "html",
        body: renderRoadmapPreviewHtml(record.contract),
        contentType: CONTENT_TYPES.html,
      };
    case "docx":
      return {
        ok: true,
        format: "docx",
        body: await renderRoadmapDetailDocx(record.contract),
        contentType: CONTENT_TYPES.docx,
      };
    case "pptx":
      return {
        ok: true,
        format: "pptx",
        body: await renderExecutiveRoadmapPptx(record.contract),
        contentType: CONTENT_TYPES.pptx,
      };
    case "contract":
      return {
        ok: true,
        format: "contract",
        body: JSON.stringify(record.contract, null, 2),
        contentType: CONTENT_TYPES.json,
      };
    case "provenance":
      return {
        ok: true,
        format: "provenance",
        body: JSON.stringify(
          { provenance: record.provenance, sync: record.sync },
          null,
          2,
        ),
        contentType: CONTENT_TYPES.json,
      };
  }
}

export { ROADMAP_CONTRACT_VERSION, ROADMAP_STRUCTURED_OUTPUT_VERSION };
