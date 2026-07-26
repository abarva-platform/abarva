import "server-only";

// PR10 — the pure download-response composer. Given a requester, the loaded
// target, and a format, it produces a governed HTTP result: authorize →
// re-render from the persisted contract → shape the response, or an honest
// refusal. Pure (no Next.js, no DB) so the whole decision + render surface is
// unit-tested; the route file is a thin adapter that supplies `requester` (from
// tenancy) and `target` (from the loader) and turns this into a Response.

import {
  authorizeRoadmapDownload,
  renderPersistedRoadmap,
  type RoadmapDownloadFormat,
  type RoadmapDownloadRequester,
  type RoadmapDownloadTarget,
} from "./roadmap-artifact-persistence";

export type RoadmapDownloadResponse =
  | {
      ok: true;
      httpStatus: 200;
      contentType: string;
      body: string | Buffer;
      filename: string;
    }
  | {
      ok: false;
      httpStatus: 403 | 404 | 409;
      code: string;
      reason: string;
    };

const EXT: Record<RoadmapDownloadFormat, string> = {
  pptx: "pptx",
  docx: "docx",
  html: "html",
  contract: "contract.json",
  provenance: "provenance.json",
};

/** Compose the governed download response. Pure. */
export async function composeRoadmapDownload(args: {
  requester: RoadmapDownloadRequester;
  target: RoadmapDownloadTarget;
  format: RoadmapDownloadFormat;
  requestedVersion?: number;
}): Promise<RoadmapDownloadResponse> {
  const decision = authorizeRoadmapDownload(args);
  if (!decision.allowed) {
    return {
      ok: false,
      httpStatus: decision.httpStatus,
      code: decision.code,
      reason: decision.reason,
    };
  }

  // Authorized. Re-render from the PERSISTED contract (never regenerate).
  const rendered = await renderPersistedRoadmap(
    args.target.record,
    args.format,
  );
  if (!rendered.ok) {
    // A valid-looking target whose stored contract fails integrity → 409, no body.
    return {
      ok: false,
      httpStatus: 409,
      code: rendered.code,
      reason: rendered.reason,
    };
  }

  const version = args.target.record?.sync.version ?? 1;
  return {
    ok: true,
    httpStatus: 200,
    contentType: rendered.contentType,
    body: rendered.body,
    filename: `executive-roadmap-v${version}.${EXT[args.format]}`,
  };
}
