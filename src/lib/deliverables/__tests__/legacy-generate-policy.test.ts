import fs from "node:fs";
import path from "node:path";

import { resolveDocumentPolicy } from "@/lib/ai/document-generation-policy";

describe("legacy engagement deliverable model policy", () => {
  const legacyGeneratorPath = path.join(
    process.cwd(),
    "src/lib/deliverables/generate.ts",
  );

  it("keeps the retired legacy generator entry point absent", () => {
    expect(fs.existsSync(legacyGeneratorPath)).toBe(false);
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
