import fs from "node:fs";
import path from "node:path";

const workspaceClientSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx",
  ),
  "utf8",
);

describe("Source Workspace aVa contract", () => {
  it("passes structured workspace context instead of only a raw JSON context string", () => {
    expect(workspaceClientSource).toContain("surfaceContext: vm.avaSurfaceContext");
    expect(workspaceClientSource).toContain("tenantName,");
    expect(workspaceClientSource).not.toContain(
      "JSON.stringify(vm.avaSurfaceContext)}. The user is asking",
    );
  });

  it("does not render artifact protocol envelopes as visible chat prose", () => {
    expect(workspaceClientSource).toContain("stripArtifactsForDisplay");
    expect(workspaceClientSource).toContain(
      "do not echo raw JSON, context bundles, retrieval receipts, artifact tags, or internal ids",
    );
  });
});
