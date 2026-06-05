import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EvalRubricTable } from "@/components/source/canvas/rfp/EvalRubricTable";

describe("EvalRubricTable", () => {
  it("warns softly when rubric weights do not total 100", () => {
    const html = renderToStaticMarkup(
      createElement(EvalRubricTable, {
        rows: [
          {
            criterion: "Run stability",
            weight: 50,
            scale: "1-5",
            evidence: "SLA model",
          },
          {
            criterion: "Commercial transparency",
            weight: 40,
            scale: "1-5",
            evidence: "Pricing workbook",
          },
        ],
      }),
    );

    expect(html).toContain("90% total");
    expect(html).toContain("source-rfp-rubric-soft-warning");
    expect(html).toContain("You can keep drafting");
    expect(html).toContain("sponsor sign-off will require");
  });
});
