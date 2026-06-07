// Admin Loader — the "understand" orchestrator.
//
// Ties the foundation + Wave 2 modules into one server-side flow:
//   preserve original to Blob (Gate 0)  ->  parse  ->  propose mapping (Claude)
//   ->  deterministic checks + agent (Steward) review  ->  compose validation.
//
// No commit happens here — this stage produces a reviewable proposal +
// validation that the operator confirms before the governed commit pipeline
// (see commit-adapter.ts) runs. Every dependency is injectable so the whole
// flow is unit-testable without Azure, Anthropic, or a database.

import "server-only";

import type { MappingProposal, StewardValidation, LoaderDimension, PreservedSourceFile } from "./contract";
import type { ParsedContent, MappingModel } from "./mapping-proposal";
import { proposeMapping, auditedMappingModel } from "./mapping-proposal";
import type { BlobWriter } from "./preserve-original";
import { preserveOriginalToBlob, azureBlobWriter, DEFAULT_PRESERVE_CONTAINER } from "./preserve-original";
import type { ParseKind, DocumentParser } from "./parse-adapter";
import { parseUpload, classifyFileKind, azureDocumentParser } from "./parse-adapter";
import type { OrgProfile, StewardAgentReviewer } from "./steward-validation";
import { runDeterministicChecks, composeStewardValidation } from "./steward-validation";
import { auditedStewardReviewer } from "./steward-reviewer";

/** One upload to understand. */
export interface UnderstandFileInput {
  filename: string;
  contentType?: string;
  bytes: ArrayBuffer | Uint8Array;
  /** Operator-declared target dimension (optional hint to the mapper). */
  targetDimension?: LoaderDimension;
}

/** The reviewable result for a single file. */
export interface UnderstandResult {
  preserved: PreservedSourceFile;
  parseKind: ParseKind;
  proposal: MappingProposal;
  validation: StewardValidation;
}

/** Injectable seams. Production defaults wire Azure + the audited Anthropic path. */
export interface UnderstandDeps {
  blob: BlobWriter;
  mappingModel: MappingModel;
  stewardReviewer: StewardAgentReviewer;
  documentParser: DocumentParser;
  container: string;
  now?: () => Date;
  uuid?: () => string;
}

/**
 * Build the production dependency set. Each is independently audited / Azure-backed.
 * Kept lazy (called per request) so a request that never reaches the model never
 * constructs a client.
 */
export function productionUnderstandDeps(args: {
  tenantId: string;
  userId?: string;
  container?: string;
}): UnderstandDeps {
  return {
    blob: azureBlobWriter(),
    mappingModel: auditedMappingModel({ tenantId: args.tenantId, userId: args.userId }),
    stewardReviewer: auditedStewardReviewer({ tenantId: args.tenantId, userId: args.userId }),
    documentParser: azureDocumentParser(),
    container: args.container ?? DEFAULT_PRESERVE_CONTAINER,
  };
}

function toUint8(bytes: ArrayBuffer | Uint8Array): Uint8Array {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

/**
 * Understand a single uploaded file end-to-end (no commit).
 *
 * Gate 0 is enforced first: the original is preserved to Blob (hash-verified)
 * BEFORE any parsing or reasoning. If preservation fails, nothing downstream runs.
 */
export async function understandFile(args: {
  file: UnderstandFileInput;
  tenantKey: string;
  uploadedBy?: string;
  orgProfile?: OrgProfile;
  deps: UnderstandDeps;
}): Promise<UnderstandResult> {
  const { file, tenantKey, uploadedBy, orgProfile, deps } = args;
  const bytes = toUint8(file.bytes);

  // 1. Gate 0 — preserve the original, hash-verified, before anything else.
  const preserved = await preserveOriginalToBlob({
    bytes,
    filename: file.filename,
    tenantKey,
    container: deps.container,
    ...(file.contentType !== undefined ? { contentType: file.contentType } : {}),
    ...(uploadedBy !== undefined ? { uploadedBy } : {}),
    blob: deps.blob,
    ...(deps.now ? { now: deps.now } : {}),
    ...(deps.uuid ? { uuid: deps.uuid } : {}),
  });

  // 2. Parse — any format into ParsedContent.
  const { kind: parseKind } = classifyFileKind(file.filename, file.contentType);
  const parsed: ParsedContent = await parseUpload({
    filename: file.filename,
    ...(file.contentType !== undefined ? { contentType: file.contentType } : {}),
    bytes: Buffer.from(bytes),
    documentParser: deps.documentParser,
  });

  // 3. Propose mapping (Claude, falls back deterministically on model error).
  const proposal = await proposeMapping({
    parsed,
    source: preserved,
    tenantKey,
    ...(file.targetDimension !== undefined ? { targetDimension: file.targetDimension } : {}),
    model: deps.mappingModel,
  });

  // 4. Validate — deterministic checks + open-ended agent review (Steward).
  const deterministic = runDeterministicChecks({
    proposal,
    ...(orgProfile !== undefined ? { orgProfile } : {}),
  });
  // Agent reviewer fails open to [] internally; never throws.
  const agent = await deps.stewardReviewer(proposal, parsed.text);
  const validation = composeStewardValidation({ proposal, deterministic, agent });

  return { preserved, parseKind, proposal, validation };
}

/** Understand a batch of uploads. Files are independent; one failure does not abort the rest. */
export async function understandBatch(args: {
  files: UnderstandFileInput[];
  tenantKey: string;
  uploadedBy?: string;
  orgProfile?: OrgProfile;
  deps: UnderstandDeps;
}): Promise<Array<{ ok: true; result: UnderstandResult } | { ok: false; filename: string; error: string }>> {
  return Promise.all(
    args.files.map(async (file) => {
      try {
        const result = await understandFile({
          file,
          tenantKey: args.tenantKey,
          ...(args.uploadedBy !== undefined ? { uploadedBy: args.uploadedBy } : {}),
          ...(args.orgProfile !== undefined ? { orgProfile: args.orgProfile } : {}),
          deps: args.deps,
        });
        return { ok: true as const, result };
      } catch (error) {
        return {
          ok: false as const,
          filename: file.filename,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}
