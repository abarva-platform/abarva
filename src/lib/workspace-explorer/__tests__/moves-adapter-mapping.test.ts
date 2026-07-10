import {
  buildMovesWorkspaceItems,
  generatedMoveArtifactToWorkspaceItem,
  moveArtifactToWorkspaceItem,
} from "../moves-adapter-mapping";
import type { GeneratedArtifactRecord } from "@/lib/artifacts/repository";
import type { MoveArtifactRow } from "@/lib/programs/deliverables/move-artifacts";

const moveArtifact: MoveArtifactRow = {
  artifact_id: "move-artifact-1",
  move_id: "move-1",
  phase: 2,
  artifact_type: "discovery_plan",
  artifact_family: "uploaded_evidence",
  title: "Discovery Plan Upload",
  file_name: "discovery-plan.pdf",
  file_format: "pdf",
  blob_container: "context-drops",
  blob_path: "moves/acme/move-1/uploads/discovery-plan.pdf",
  file_size: 2000,
  version: 3,
  status: "aligned",
  generated_by: "user-1",
  generated_at: "2026-06-12T10:00:00.000Z",
  quality_score: null,
  unsupported_claims_count: 0,
  lifecycle_state: "current",
  created_at: "2026-06-12T09:55:00.000Z",
  metadata: {},
};

const generatedArtifact: GeneratedArtifactRecord = {
  id: "generated-1",
  clientId: "client-1",
  artifactType: "move_board_pack",
  sourceArtifactRef: "move:move-1:business_case",
  renderEngine: "internal",
  outputFormat: "html",
  blobUrl: "/api/v1/artifacts/generated-1",
  blobSha256: "sha",
  qualityScore: 0.91,
  evidenceLedgerIds: [],
  citedInputIds: ["11111111-1111-1111-1111-111111111111"],
  generationEgressAudit: "egress:audit",
  renderedAt: "2026-06-12T11:00:00.000Z",
  renderedBy: "user-2",
  quarantineReason: null,
  supersededBy: null,
  metadata: {
    title: "Board-grade Business Case",
    moveId: "move-1",
    artifactId: "business_case",
  },
};

describe("MovesWorkspaceAdapter mapping", () => {
  it("maps Move File Cabinet rows without inventing lineage", () => {
    const item = moveArtifactToWorkspaceItem(moveArtifact);

    expect(item).toMatchObject({
      id: "move-artifact:move-artifact-1",
      module: "moves",
      kind: "evidence",
      origin: "uploaded",
      state: "loaded",
      version: 3,
      stageKey: "P2",
      href: "/api/v1/programs/move-1/artifacts/move-artifact-1/download",
    });
    expect(item.lineage).toEqual({
      cites: [],
      usedBy: [],
      status: "not_recorded",
    });
  });

  it("maps generated Move rows with recorded cited input lineage", () => {
    const item = generatedMoveArtifactToWorkspaceItem(generatedArtifact);

    expect(item).toMatchObject({
      id: "generated-artifact:generated-1",
      module: "moves",
      kind: "deliverable",
      origin: "generated",
      state: "draft",
      name: "Board-grade Business Case",
      href: "/api/v1/artifacts/generated-1",
    });
    expect(item.lineage).toEqual({
      cites: ["11111111-1111-1111-1111-111111111111"],
      usedBy: [],
      status: "recorded",
    });
  });

  it("sorts mixed Move workspace items by newest update first", () => {
    const items = buildMovesWorkspaceItems({
      moveArtifacts: [moveArtifact],
      generatedArtifacts: [generatedArtifact],
    });

    expect(items.map((item) => item.id)).toEqual([
      "generated-artifact:generated-1",
      "move-artifact:move-artifact-1",
    ]);
  });

  it("normalizes Date-valued audit timestamps before sorting", () => {
    const olderMoveArtifact = {
      ...moveArtifact,
      artifact_id: "move-artifact-date-older",
      created_at: new Date("2026-06-12T09:55:00.000Z"),
      generated_at: new Date("2026-06-12T10:00:00.000Z"),
    } as unknown as MoveArtifactRow;
    const newerMoveArtifact = {
      ...moveArtifact,
      artifact_id: "move-artifact-date-newer",
      created_at: new Date("2026-06-13T09:55:00.000Z"),
      generated_at: new Date("2026-06-13T10:00:00.000Z"),
    } as unknown as MoveArtifactRow;

    const items = buildMovesWorkspaceItems({
      moveArtifacts: [olderMoveArtifact, newerMoveArtifact],
      generatedArtifacts: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      "move-artifact:move-artifact-date-newer",
      "move-artifact:move-artifact-date-older",
    ]);
    expect(items[0]?.audit.updatedAt).toBe("2026-06-13T10:00:00.000Z");
  });
});
