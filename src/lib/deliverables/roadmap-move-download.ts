import "server-only";

// PR11 — the shared Move-addressable download handler. Both the `current` and
// explicit-`version` routes call this ONE function, so resolution + authorization
// + rendering are identical and there is a single governed path.

import {
  composeRoadmapDownload,
  roadmapProvenanceHeaders,
  type RoadmapDownloadResponse,
} from "./roadmap-download-service";
import { loadCurrentRoadmapTarget } from "./roadmap-current-resolver";
import type { RoadmapDownloadFormat } from "./roadmap-artifact-persistence";

const PUBLIC_FORMATS: ReadonlySet<string> = new Set(["pptx", "docx", "html"]);
const RESTRICTED_FORMATS: ReadonlySet<string> = new Set([
  "contract",
  "provenance",
]);

export type MoveRoadmapDownloadResult =
  | {
      ok: true;
      httpStatus: 200;
      contentType: string;
      body: string | Buffer;
      filename: string;
      /** Governed provenance to surface as response headers. */
      headers: Record<string, string>;
    }
  | {
      ok: false;
      httpStatus: 400 | 403 | 404 | 409;
      code: string;
      reason: string;
    };

/** Resolve the current (or explicit-version) governed roadmap for a Move and
 * produce the download or an honest governed refusal. Never requires the caller
 * to know `deliverables_v2.id`. */
export async function buildMoveRoadmapDownload(args: {
  tenantKey: string;
  canReadRestricted: boolean;
  moveId: string;
  format: string;
  requestedVersion?: number;
}): Promise<MoveRoadmapDownloadResult> {
  const { tenantKey, canReadRestricted, moveId, format, requestedVersion } =
    args;

  if (!PUBLIC_FORMATS.has(format) && !RESTRICTED_FORMATS.has(format)) {
    return {
      ok: false,
      httpStatus: 400,
      code: "unsupported_format",
      reason: `Unknown format "${format}".`,
    };
  }

  const target = await loadCurrentRoadmapTarget({
    tenantKey,
    moveId,
    requestedVersion,
  });

  const result: RoadmapDownloadResponse = await composeRoadmapDownload({
    requester: { tenantKey, canReadRestricted },
    target,
    format: format as RoadmapDownloadFormat,
    requestedVersion,
  });

  if (!result.ok) {
    return {
      ok: false,
      httpStatus: result.httpStatus,
      code: result.code,
      reason: result.reason,
    };
  }

  // Success → attach governed provenance headers from the resolved record.
  const headers = target.record ? roadmapProvenanceHeaders(target.record) : {};
  return {
    ok: true,
    httpStatus: 200,
    contentType: result.contentType,
    body: result.body,
    filename: result.filename,
    headers,
  };
}
