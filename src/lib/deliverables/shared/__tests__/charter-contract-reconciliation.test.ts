// Reconciliation proof (2026-07-25): confirms both live Moves generation
// pipelines derive the Charter's word budget / token ceiling / section list
// from the SAME shared contract (artifact-contracts.ts) by inspecting their
// actual, real assembled runtime output — not just importing and comparing
// constants. See docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md.

import { buildArtifactPrompt } from "@/lib/deliverables/solution-prompt-factory";
import {
  modelTokenBudgetForArtifact,
  maximumWordCountForArtifact,
} from "@/lib/deliverables/strategic-moves-artifact-standard";
import { emptySolutionContext } from "@/lib/programs/solution-context";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { resolvePassTokenBudget } from "@/lib/ai/document-generation-policy";
import { buildPassPrompt } from "@/lib/deliverables/orchestrator/prompt-builder";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { amsRfpRequest } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import { CHARTER_CONTRACT } from "@/lib/deliverables/shared/artifact-contracts";

describe("Charter contract reconciliation — real runtime output, both pipelines", () => {
  it("golden-bar's actual assembled prompt states the canonical word/token numbers", () => {
    const prompt = buildArtifactPrompt({
      artifact: "charter",
      phase: 1,
      context: emptySolutionContext("m1", "t"),
    });

    expect(prompt.user).toContain(
      `Target ${CHARTER_CONTRACT.wordBudget.targetWords.min}-${CHARTER_CONTRACT.wordBudget.targetWords.max.toLocaleString()} body words`,
    );
    expect(prompt.user).toContain(
      `Hard maximum ${CHARTER_CONTRACT.wordBudget.hardMaxWords.toLocaleString()} body words`,
    );
    expect(maximumWordCountForArtifact("charter")).toBe(
      CHARTER_CONTRACT.wordBudget.hardMaxWords,
    );
    expect(modelTokenBudgetForArtifact("charter")).toBe(
      CHARTER_CONTRACT.maxOutputTokens,
    );
  });

  it("orchestrator's actual resolved quality bar states the canonical word numbers", () => {
    const qb = resolveQualityBar("moves", "charter");
    expect(qb.minBodyWords).toBe(CHARTER_CONTRACT.wordBudget.minWords);
    expect(qb.targetBodyWordsMax).toBe(
      CHARTER_CONTRACT.wordBudget.hardMaxWords,
    );
    expect(qb.enforceMaxAsBlocker).toBe(true);
    expect(qb.excludeNonProseFromBody).toBe(true);
  });

  it("orchestrator's actual resolved token budget for charter's content-drafting passes equals the canonical ceiling", () => {
    expect(
      resolvePassTokenBudget({
        pass: "section_draft",
        deliverableType: "charter",
      }),
    ).toBe(CHARTER_CONTRACT.maxOutputTokens);
    expect(
      resolvePassTokenBudget({ pass: "synthesis", deliverableType: "charter" }),
    ).toBe(CHARTER_CONTRACT.maxOutputTokens);
  });

  it("orchestrator's actual assembled section-draft prompt states the canonical per-section word cap, per real section", () => {
    const charterReq = amsRfpRequest({
      module: "moves",
      useCaseArchetype: "AI_PDLC",
      deliverableType: "charter",
      qualityBar: resolveQualityBar("moves", "charter"),
    });
    const brief = getArtifactBrief(charterReq);

    for (const section of CHARTER_CONTRACT.sections) {
      const p = buildPassPrompt("section_draft", {
        req: charterReq,
        brief,
        evidence: charterReq.governedEvidenceBundle.slice(0, 1),
        outlineSummary: `1. ${section.title}`,
        section: {
          key: section.key,
          title: section.title,
          groundingMode: "mixed",
          evidenceCitations: [1],
          assumptionsUsed: [],
          placeholders: [],
          rationale: section.intent,
        },
      });
      expect(p.user).toContain(
        `Hard cap for this section: ${section.maxWords} body words`,
      );
    }
  });

  it("orchestrator's fixed structure requires exactly the shared contract's 7 sections", () => {
    const charterReq = amsRfpRequest({
      module: "moves",
      useCaseArchetype: "AI_PDLC",
      deliverableType: "charter",
      qualityBar: resolveQualityBar("moves", "charter"),
    });
    const brief = getArtifactBrief(charterReq);
    expect(new Set(brief.requiredSections)).toEqual(
      new Set(CHARTER_CONTRACT.sections.map((s) => s.key)),
    );
    expect(brief.fixedStructure).toBe(true);
  });
});
