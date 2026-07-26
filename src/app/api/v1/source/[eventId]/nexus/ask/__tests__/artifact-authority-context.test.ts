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

  // PR 4C (ADR-0015): hasActiveAcceptance is now populated for real —
  // previously no caller ever set it, so the SOURCE-SHELL-004 acceptance
  // ledger had zero effect on which artifact this route treats as
  // authoritative for d16/d19/d22/d24 and every other slot.
  it("wires getLatestArtifactAcceptancesByArtifactIds into the authority-candidate builder", () => {
    expect(ROUTE_SOURCE).toContain("getLatestArtifactAcceptancesByArtifactIds");
    expect(ROUTE_SOURCE).toContain("hasActiveAcceptance: acceptanceByArtifactId.has(artifact.id)");
  });

  it("an artifact with an active acceptance record outranks a newer, unaccepted 'generated' draft in the same slot", () => {
    // Confirms the precedence this route now actually exercises: acceptance
    // (pool 2) outranks isCurrentAuthoritative/status/generated-origin
    // (pools 3-5) — a scenario the pre-existing client-final-vs-superseded
    // test above never covered.
    const artifacts = [
      {
        id: "unaccepted-newer-draft",
        lifecycleState: "current",
        status: "draft",
        sourceOrigin: "generated",
        updatedAt: "2026-07-26T12:00:00.000Z", // newer
        hasActiveAcceptance: false,
        slotKey: "evaluation::d16_scorecard",
      },
      {
        id: "accepted-older-draft",
        lifecycleState: "current",
        status: "draft",
        sourceOrigin: "generated",
        updatedAt: "2026-07-20T12:00:00.000Z", // older
        hasActiveAcceptance: true,
        slotKey: "evaluation::d16_scorecard",
      },
    ];
    const slots = resolveAuthoritativeArtifactSlots(
      artifacts,
      (artifact) => artifact.slotKey,
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].authoritative.id).toBe("accepted-older-draft");
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
