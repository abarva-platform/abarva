import fs from "node:fs";
import path from "node:path";

import { resolveDocumentPolicy } from "@/lib/ai/document-generation-policy";

describe("legacy engagement deliverable model policy", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/lib/deliverables/generate.ts"),
    "utf8",
  );

  it("routes the reachable legacy deliverable path through document-generation policy", () => {
    expect(source).toContain("assertDeliverablePolicy");
    expect(source).toContain("runLegacyDeliverableModel");
    expect(source).not.toContain("runHaiku");
    expect(source).not.toContain("claude-haiku-4-5-20251001");
    expect(source).not.toMatch(/max_tokens:\s*2048/);
  });

  it("resolves legacy phase artifacts to board-grade or better defaults", () => {
    const deliverableTypes = [
      "engagement_charter",
      "diagnostic_charter",
      "solution_design",
      "execution_dashboard",
      "outcome_verification",
    ];

    for (const deliverableType of deliverableTypes) {
      const policy = resolveDocumentPolicy({ deliverableType });
      expect(policy.isChatTier).toBe(false);
      expect(policy.model).toMatch(/^claude-opus-/);
      expect(policy.maxTokens).toBeGreaterThanOrEqual(8000);
    }
  });
});
