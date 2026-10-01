import "server-only";

import { createHash } from "node:crypto";

import type { HomeRecordRenderSource } from "./types";

/** Identifies the record shown by Home; this is an equality marker, not an authorization token. */
export function homeRecordSourceToken(
  tenantKey: string,
  source: HomeRecordRenderSource,
): string {
  const version = source.contextVersion;
  return createHash("sha256")
    .update(
      JSON.stringify([
        tenantKey,
        source.kind,
        source.canonicalSnapshotHash,
        version?.assessmentId ?? null,
        version?.sourceSetHash ?? null,
        version?.sourceLineageHash ?? null,
        version?.projectionContentHash ?? null,
        version?.deterministicPacketHash ?? null,
        version?.narrativePacketHash ?? null,
        version?.narrativeGeneratedAt ?? null,
        version?.dataAsOf ?? null,
        version?.coherence ?? null,
      ]),
    )
    .digest("hex");
}
