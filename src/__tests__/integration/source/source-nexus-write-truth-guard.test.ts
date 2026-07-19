import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Source legacy Nexus ask route write-truth guard", () => {
  it("guards event-scoped model summaries from claiming chat answers were saved", () => {
    const routeSource = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/v1/source/[eventId]/nexus/ask/route.ts",
      ),
      "utf8",
    );

    expect(routeSource).toContain("enforceSourceExistingEventWriteTruth");
    expect(routeSource).toContain("guardedClaudeSummary");
  });
});
