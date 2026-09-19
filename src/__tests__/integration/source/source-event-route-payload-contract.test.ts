import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SOURCE_ARTIFACT_STATE_METADATA_COLUMNS } from "@/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter";

describe("Source event route payload contract", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "src/app/(maestro)/source/events/[eventId]/page.tsx"),
    "utf8",
  );

  it("keeps the event shell stage-scoped and metadata-only by default", () => {
    expect(routeSource).toContain("listSourceArtifactsForSourceEventId");
    expect(routeSource).not.toContain(
      "listSourceArtifactsForSourceEventIdWithContent",
    );
    expect(routeSource).toContain("listArtifactStatesForEventStage");
    expect(SOURCE_ARTIFACT_STATE_METADATA_COLUMNS.length).toBeLessThanOrEqual(
      17,
    );
    expect(SOURCE_ARTIFACT_STATE_METADATA_COLUMNS).not.toContain("body");
    expect(SOURCE_ARTIFACT_STATE_METADATA_COLUMNS).not.toContain(
      "body_generation_metadata",
    );
    expect(routeSource).toContain(
      "File cards do not render body previews, so content remains a",
    );
  });

  it("hydrates stage tasks from the same governed File Cabinet used by Source New", () => {
    expect(routeSource).toContain('from "@/lib/source/file-cabinet/repository"');
    expect(routeSource).toContain("listSourceArtifacts(event.id, {");
    expect(routeSource).toContain(
      "tenantKey: clientKeyToInventorySubstrateKey(activeClient.key)",
    );
    expect(routeSource).toContain("fileCabinetArtifacts.flatMap");
    expect(routeSource).toContain("originalName: artifact.fileName");
  });
});
