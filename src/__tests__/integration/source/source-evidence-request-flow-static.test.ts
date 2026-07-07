import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Source evidence request flow wiring", () => {
  it("logs governed evidence requests through the tenant-scoped Source write seam", () => {
    const route = read(
      "src/app/api/v1/source/[eventId]/evidence-requests/route.ts",
    );

    expect(route).toContain("requireTenancy");
    expect(route).toContain("getActiveClientRow");
    expect(route).toContain("resolveSourceEventUuidForClient");
    expect(route).toContain(".from(\"source_events\")");
    expect(route).toContain("loadUserSourceAccessPolicy");
    expect(route).toContain("canUploadSourceArtifacts");
    expect(route).toContain("selectSourceWriteAdapter");
    expect(route).toContain("insertActivityLog");
    expect(route).toContain("evidence_requested");
    expect(route).toContain("externalSend: false");
  });

  it("keeps the Evidence tab request inside the app rather than a mailto handoff", () => {
    const tab = read(
      "src/components/source/canvas/workspace-tabs/EvidenceTab.tsx",
    );

    expect(tab).toContain("source-canvas-evidence-request-panel");
    expect(tab).toContain("email is sent from AbarVa");
    expect(tab).toContain("/evidence-requests");
    expect(tab).not.toContain("mailto:");
  });
});
