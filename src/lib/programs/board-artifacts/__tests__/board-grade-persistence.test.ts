jest.mock("@/lib/active-client", () => ({ getActiveClientKey: jest.fn() }));
jest.mock("@/lib/artifacts/repository", () => ({
  saveRenderedBoardGradeMoveArtifact: jest.fn(),
}));

import { getActiveClientKey } from "@/lib/active-client";
import { saveRenderedBoardGradeMoveArtifact } from "@/lib/artifacts/repository";
import {
  persistBoardGradeMoveArtifact,
  generatedArtifactResponseHeaders,
} from "../board-grade-persistence";

const mockActive = getActiveClientKey as jest.Mock;
const mockSave = saveRenderedBoardGradeMoveArtifact as jest.Mock;

const baseInput = {
  moveId: "m1",
  artifactId: "costed-business-case",
  title: "Costed Business-Case Pack",
  html: "<html></html>",
  renderedBy: "user-1",
  routePath: "/api/v1/moves/board-grade-business-case",
  generatedOn: "2026-06-09",
};

const record = {
  id: "rec-1",
  blobUrl: "/api/v1/artifacts/rec-1",
  sourceArtifactRef: "move:m1:costed-business-case",
} as never;

describe("persistBoardGradeMoveArtifact — clientId resolution", () => {
  beforeEach(() => {
    mockActive.mockReset();
    mockSave.mockReset();
    mockSave.mockResolvedValue(record);
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("persists under the explicit clientId when provided", async () => {
    const r = await persistBoardGradeMoveArtifact({
      ...baseInput,
      clientId: "apex-retail",
    });
    expect(r).toBe(record);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "apex-retail" }),
    );
    expect(mockActive).not.toHaveBeenCalled();
  });

  it("forwards the structured renderable document when one exists", async () => {
    const renderableDoc = {
      title: "Structured Decision Pack",
      generatedSections: [{ key: "summary", title: "Summary" }],
    };
    const renderableMetadata = {
      artifactType: "discover-brief",
      source: "moves_orchestrated_deliverables",
      evidenceRefs: ["ctx:1"],
    };

    await persistBoardGradeMoveArtifact({
      ...baseInput,
      clientId: "apex-retail",
      renderableDoc,
      renderableMetadata,
    });

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "apex-retail",
        renderableDoc,
        renderableMetadata,
      }),
    );
  });

  it("falls back to the active tenant when clientId is null (the silent-no-op fix)", async () => {
    mockActive.mockResolvedValue("apexretail");
    const r = await persistBoardGradeMoveArtifact({
      ...baseInput,
      clientId: null,
    });
    expect(r).toBe(record);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "apexretail" }),
    );
  });

  it("treats an empty-string clientId as missing and falls back (|| not ??)", async () => {
    mockActive.mockResolvedValue("apexretail");
    await persistBoardGradeMoveArtifact({ ...baseInput, clientId: "   " });
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "apexretail" }),
    );
  });

  it("returns null and warns (NOT silent) when no client key can be resolved", async () => {
    mockActive.mockResolvedValue(null);
    const warn = jest.spyOn(console, "warn");
    const r = await persistBoardGradeMoveArtifact({
      ...baseInput,
      clientId: null,
    });
    expect(r).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("NOT persisted"),
      expect.objectContaining({ moveId: "m1" }),
    );
  });

  it("returns null when the active-tenant lookup throws", async () => {
    mockActive.mockRejectedValue(new Error("no tenant"));
    const r = await persistBoardGradeMoveArtifact({
      ...baseInput,
      clientId: undefined,
    });
    expect(r).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();
  });
});

describe("generatedArtifactResponseHeaders", () => {
  it("signals persisted:true with id/url/source-ref when a record exists", () => {
    expect(generatedArtifactResponseHeaders(record)).toEqual({
      "x-generated-artifact-persisted": "true",
      "x-generated-artifact-id": "rec-1",
      "x-generated-artifact-url": "/api/v1/artifacts/rec-1",
      "x-generated-artifact-source-ref": "move:m1:costed-business-case",
    });
  });

  it("signals persisted:false (not silent) when nothing was persisted", () => {
    expect(generatedArtifactResponseHeaders(null)).toEqual({
      "x-generated-artifact-persisted": "false",
    });
  });
});
