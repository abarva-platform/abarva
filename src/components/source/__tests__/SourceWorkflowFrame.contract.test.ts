import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  SOURCE_WORKFLOW_GRID_TEMPLATE_COLUMNS,
  SOURCE_WORKFLOW_RAIL_WIDTH_PX,
} from "@/components/source/SourceWorkflowFrame";

const repoRoot = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("SourceWorkflowFrame shared layout contract", () => {
  it("keeps New Event and Optimize Contract on the same rail/grid primitive", () => {
    expect(SOURCE_WORKFLOW_RAIL_WIDTH_PX).toBe(264);
    expect(SOURCE_WORKFLOW_GRID_TEMPLATE_COLUMNS).toBe("264px minmax(0, 1fr)");

    const newEventCanvas = readRepoFile(
      "src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx",
    );
    const optimizeContractPage = readRepoFile(
      "src/components/source/SourceOptimizeContractPage.tsx",
    );

    expect(newEventCanvas).toMatch(/SourceWorkflowFrame/);
    expect(optimizeContractPage).toMatch(/SourceWorkflowFrame/);
    expect(newEventCanvas).not.toContain(
      'gridTemplateColumns: "264px minmax(0, 1fr)"',
    );
    expect(optimizeContractPage).not.toContain(
      'gridTemplateColumns: "264px minmax(0, 1fr)"',
    );
  });
});
