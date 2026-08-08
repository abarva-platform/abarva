import fs from "node:fs";
import path from "node:path";

const workspaceClientSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx",
  ),
  "utf8",
);

const chatAgentRouteSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
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

  it("keeps Source visual requests out of inline chart JSON mode", () => {
    expect(workspaceClientSource).toContain(
      "this Source dock must not show inline chart JSON",
    );
    expect(chatAgentRouteSource).toContain("SOURCE VISUAL OUTPUT CONTRACT");
    expect(chatAgentRouteSource).toContain(
      "do not print chart JSON, inline object literals, code fences, or renderer instructions",
    );
    expect(chatAgentRouteSource).toContain(
      "Do NOT use SQL snippets, raw JSON dumps, bracketed identifier dumps, generic code blocks, inline JSON objects, or `abarva-chart` blocks",
    );
  });
});
