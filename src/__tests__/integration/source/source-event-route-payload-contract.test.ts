import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Source event route payload contract", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "src/app/(maestro)/source/events/[eventId]/page.tsx"),
    "utf8",
  );

  it("keeps the 11-stage event shell metadata-first by default", () => {
    expect(routeSource).toContain("listSourceArtifactsForSourceEventId");
    expect(routeSource).not.toContain(
      "listSourceArtifactsForSourceEventIdWithContent",
    );
    expect(routeSource).not.toContain("listArtifactStatesForEvent");
    expect(routeSource).toContain(
      "File cards do not render body previews, so content remains a",
    );
  });
});
