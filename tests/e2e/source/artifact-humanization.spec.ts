import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const documentTabSource = () =>
  readFileSync(
    join(
      process.cwd(),
      "src/components/source/canvas/workspace-tabs/DocumentTab.tsx",
    ),
    "utf8",
  );

const displayHelperSource = () =>
  readFileSync(
    join(process.cwd(), "src/lib/source/artifact-display-names.ts"),
    "utf8",
  );

test.describe("Source artifact humanization", () => {
  test("production document tab copy hides backend artifact jargon", () => {
    const source = documentTabSource();
    const helperSource = displayHelperSource();
    const combinedSource = `${source}\n${helperSource}`;

    for (const forbidden of [
      "No DB-backed documents yet",
      "DB-backed document",
      "source_artifacts",
      "Template scaffold",
      "Awaiting authoring",
      "Stored documents",
      "Download xlsx template",
    ]) {
      expect(source).not.toContain(forbidden);
    }

    expect(combinedSource).toContain("Required to advance");
    expect(combinedSource).toContain("Awaiting draft");
    expect(combinedSource).toContain("Event documents");
    expect(combinedSource).toContain("Nothing to export yet");
  });
});
