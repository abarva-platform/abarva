import fs from "node:fs";
import path from "node:path";
import {
  buildModuleV6PacketContract,
  buildModuleV6VisibleOutputAudit,
  moduleV6PacketPromptBlock,
  validateModuleV6VisibleSections,
} from "../module-v6-answer-contract";

describe("module V6 answer contract", () => {
  it("builds an explicit packet and visible-output prompt block", () => {
    const contract = buildModuleV6PacketContract({
      surface: "source",
      packetType: "vendor-commercial-packet",
      tenantKey: "skyharbor-air",
      tenantName: "Airline Demo",
      question: "Which vendor renewals are exposed?",
      packetSummary: "Three vendor renewals and one missing pricing file.",
      requiredEvidenceFamilies: ["vendor contracts"],
      availableEvidenceFamilies: ["renewal dates"],
      missingEvidence: ["Current BAFO pricing"],
    });

    expect(contract).toMatchObject({
      surface: "source",
      packetType: "vendor-commercial-packet",
      claudeOwnsVisibleOutput: true,
      rendererRole: "placement_only",
    });
    expect(moduleV6PacketPromptBlock(contract)).toContain(
      "Claude must produce every user-visible answer word",
    );
  });

  it("computes visible section parity byte-for-byte except whitespace", () => {
    const audit = buildModuleV6VisibleOutputAudit({
      surface: "tower",
      packetType: "metric-read-model",
      answerSource: "claude_text",
      claudeInvoked: true,
      claudeSelected: true,
      fallbackUsed: false,
      rawClaudePreserved: true,
      sections: [
        {
          id: "answer",
          label: "Answer",
          modelText: "Airline Demo has $248.0M in initiative budget.",
          renderedText: "Airline Demo has\n$248.0M in initiative budget.",
        },
      ],
    });

    expect(audit.validationErrors).toEqual([]);
    expect(audit.visibleSectionParity[0]?.byteEqualExceptWhitespace).toBe(true);
  });

  it("flags renderer-visible mutation and internal answer language", () => {
    const audit = buildModuleV6VisibleOutputAudit({
      surface: "intelligence",
      packetType: "advisory-packet",
      answerSource: "claude_text",
      claudeInvoked: true,
      claudeSelected: true,
      fallbackUsed: false,
      rawClaudePreserved: false,
      sections: [
        {
          id: "decision",
          label: "Decision",
          modelText: "Scale the governed option.",
          renderedText: "Scale the governed option after adding a caveat.",
        },
      ],
    });

    expect(audit.validationErrors).toContain(
      "visible_section_mutated:decision",
    );
    expect(
      validateModuleV6VisibleSections([
        {
          id: "answer",
          label: "Answer",
          modelText: "The semantic packet has 12 rows.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "answer:implementation_semantic_packet",
        "answer:implementation_rows",
      ]),
    );
  });

  it("keeps Source and Moves synthesis caches versioned by the V6 contract", () => {
    const repoRoot = path.resolve(__dirname, "../../../..");
    const routeSources = [
      fs.readFileSync(
        path.join(repoRoot, "src/app/api/source/synthesis/route.ts"),
        "utf8",
      ),
      fs.readFileSync(
        path.join(repoRoot, "src/app/api/programs/synthesis/route.ts"),
        "utf8",
      ),
    ];

    for (const source of routeSources) {
      expect(source).toContain("MODULE_V6_ANSWER_CONTRACT_VERSION");
      expect(source).toContain("X-AbarVa-V6-Contract");
      expect(source).toContain("X-AbarVa-Renderer-Policy");
      expect(source).toContain("placement-only");
      expect(source).toContain("moduleV6PacketPromptBlock");
    }
  });
});
