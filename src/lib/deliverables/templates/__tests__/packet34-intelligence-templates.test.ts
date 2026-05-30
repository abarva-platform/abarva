import { executiveBriefingMemoDeliverableType } from "../executive_briefing_memo";
import { quarterlyExecutiveMemoDeliverableType } from "../quarterly_executive_memo";
import { strategicDecisionPaperDeliverableType } from "../strategic_decision_paper";

const PACKET34_TEMPLATES = [
  executiveBriefingMemoDeliverableType,
  strategicDecisionPaperDeliverableType,
  quarterlyExecutiveMemoDeliverableType,
] as const;

describe("Packet 34 Intelligence/Tower deliverable templates", () => {
  it("ships the missing Packet 34 templates as production markdown deliverables", () => {
    expect(PACKET34_TEMPLATES.map((template) => template.type_key)).toEqual([
      "executive_briefing_memo",
      "strategic_decision_paper",
      "quarterly_executive_memo",
    ]);

    for (const template of PACKET34_TEMPLATES) {
      expect(template.output_format).toBe("markdown");
      expect(template.maturity).toBe("production");
      expect(
        template.template_structure.sections.length,
      ).toBeGreaterThanOrEqual(7);
      expect(template.quality_rubric.length).toBeGreaterThanOrEqual(6);
      expect(template.generation_prompt_template).toContain("STRUCTURE");
      expect(template.generation_prompt_template).toContain(
        "[DATA GAP: what is missing]",
      );
    }
  });

  it("keeps worked examples on every required section", () => {
    for (const template of PACKET34_TEMPLATES) {
      for (const section of template.template_structure.sections) {
        expect(section.required).toBe(true);
        expect(section.example_completed.trim().length).toBeGreaterThan(40);
      }
    }
  });
});
