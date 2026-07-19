import { readFileSync } from "node:fs";
import { join } from "node:path";

const EVENT_SCOPED_SOURCE_FILES = [
  "src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx",
  "src/app/(maestro)/source/events/[eventId]/workspace/page.tsx",
  "src/app/(maestro)/source/events/[eventId]/approval/page.tsx",
] as const;

describe("Source event shell chrome", () => {
  it("does not mount the retired SourceSubNav on event-scoped routes", () => {
    for (const relativePath of EVENT_SCOPED_SOURCE_FILES) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expect(source).not.toContain("SourceSubNav");
      expect(source).not.toContain("subNav={<SourceSubNav />}");
    }
  });
});
