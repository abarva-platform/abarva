import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Source communication draft flow wiring", () => {
  it("creates internal drafts through the tenant-scoped Source write seam", () => {
    const route = read(
      "src/app/api/v1/source/[eventId]/communications/draft/route.ts",
    );

    expect(route).toContain("requireTenancy");
    expect(route).toContain("buildSourceGenerationContext");
    expect(route).toContain("loadUserSourceAccessPolicy");
    expect(route).toContain("canGenerateSourcingArtifacts");
    expect(route).toContain("buildSourceCommunicationDraft");
    expect(route).toContain("selectSourceWriteAdapter");
    expect(route).toContain("insertActivityLog");
    expect(route).toContain("communication_draft_generated");
    expect(route).toContain("externalSend: false");
  });

  it("keeps the canvas communication panel copy/download only", () => {
    const panel = read(
      "src/components/source/canvas/workspace-tabs/CommunicationDraftsPanel.tsx",
    );

    expect(panel).toContain("Draft only");
    expect(panel).toContain("AbarVa does not send external messages");
    expect(panel).toContain("Copy text");
    expect(panel).toContain("Download text");
    expect(panel).not.toContain("Send email");
  });
});
