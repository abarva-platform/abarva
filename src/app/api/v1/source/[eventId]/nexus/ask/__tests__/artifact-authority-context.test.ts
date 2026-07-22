// The full nexus/ask route depends on tenancy, Azure/Postgres, and Claude
// egress. This route-level regression follows this folder's established
// source-literal pattern while exercising the real shared authority resolver:
// downstream aVa evidence may use only authoritative same-slot artifact ids for
// substantive chunks/facts; superseded siblings may appear only as audit
// lineage.
import fs from "fs";
import path from "path";

import { resolveAuthoritativeArtifactSlots } from "@/lib/source/client-final-artifacts";

const ROUTE_SOURCE = fs.readFileSync(
  path.join(__dirname, "..", "route.ts"),
  "utf8",
);

describe("Source nexus/ask artifact authority context", () => {
  it("scopes artifact chunks and facts to authoritative artifact ids only", () => {
    expect(ROUTE_SOURCE).toContain("resolveAuthoritativeArtifactSlots");
    expect(ROUTE_SOURCE).toContain("toArtifactAuthorityCandidate");
    expect(ROUTE_SOURCE).toContain(
      "authoritativeArtifactIdSet.has(chunk.artifact_id)",
    );
    expect(ROUTE_SOURCE).toContain(
      "authoritativeArtifactIdSet.has(fact.artifact_id)",
    );
    expect(ROUTE_SOURCE).toContain("source-artifact-audit:${artifact.id}");
    expect(ROUTE_SOURCE).toContain("formatSourceArtifactAuditExcerpt");
  });

  it("keeps superseded same-slot draft chunks out of the substantive evidence set", () => {
    const artifacts = [
      {
        id: "generated-draft",
        lifecycleState: "superseded",
        status: "draft",
        sourceOrigin: "generated",
        updatedAt: "2026-07-03T10:00:00.000Z",
        slotKey: "rfp::d09_rfp_pack",
      },
      {
        id: "client-final",
        lifecycleState: "current",
        status: "client_final",
        isClientFinal: true,
        sourceOrigin: "uploaded",
        clientFinalAcceptedAt: "2026-07-04T10:00:00.000Z",
        slotKey: "rfp::d09_rfp_pack",
      },
    ];
    const slots = resolveAuthoritativeArtifactSlots(
      artifacts,
      (artifact) => artifact.slotKey,
    );
    const authoritativeIds = new Set(
      slots.map((slot) => slot.authoritative.id),
    );
    const chunks = [
      {
        artifact_id: "generated-draft",
        chunk_text: "superseded generated draft body must not answer aVa",
      },
      {
        artifact_id: "client-final",
        chunk_text: "client final text can answer aVa",
      },
    ];
    const substantiveChunks = chunks.filter((chunk) =>
      authoritativeIds.has(chunk.artifact_id),
    );
    const auditOnlyArtifacts = artifacts.filter(
      (artifact) => !authoritativeIds.has(artifact.id),
    );

    expect(substantiveChunks).toEqual([
      {
        artifact_id: "client-final",
        chunk_text: "client final text can answer aVa",
      },
    ]);
    expect(
      substantiveChunks.some((chunk) =>
        chunk.chunk_text.includes("superseded generated draft"),
      ),
    ).toBe(false);
    expect(auditOnlyArtifacts).toMatchObject([{ id: "generated-draft" }]);
  });
});
