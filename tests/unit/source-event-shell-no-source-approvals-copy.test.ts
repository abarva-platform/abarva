import { readFileSync } from "node:fs";
import { join } from "node:path";

const EVENT_SHELL_FILES = [
  "src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx",
  "src/components/source/canvas/analytics/ScopeGate.tsx",
  "src/lib/source/source-event-shell-v2.ts",
] as const;

const EVENT_APPROVAL_ROUTE_FILES = [
  "src/components/source/canvas/analytics/ScopeGate.tsx",
] as const;

describe("Source event shell approval language", () => {
  it("does not send event-stage users back to the old Source Approvals mental model", () => {
    for (const relativePath of EVENT_SHELL_FILES) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expect(source).not.toContain("approval belongs in Source Approvals");
      expect(source).not.toContain("Open Source Approvals");
      expect(source).not.toContain("formal decision happens in Source Approvals");
    }
  });

  it("does not route event-stage approval actions to the old global approvals page", () => {
    for (const relativePath of EVENT_APPROVAL_ROUTE_FILES) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expect(source).not.toContain("\"/source/approvals\"");
      expect(source).not.toContain("'/source/approvals'");
    }
  });
});
