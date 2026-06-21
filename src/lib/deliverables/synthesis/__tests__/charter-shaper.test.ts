import {
  buildCharter,
  charterNarrativeText,
  renderCharterMarkdown,
} from "../charter-shaper";
import { FC_CHARTER } from "../__fixtures__/first-capital-charter";
import { assessClientDeliverable } from "@/lib/deliverables/quality/assess-deliverable";

describe("charter shaper (W1 vertical)", () => {
  it("builds a decision-first charter (decision requested leads)", () => {
    const doc = buildCharter(FC_CHARTER);
    expect(doc.title).toBe("Initiative Charter");
    expect(doc.sections[0].heading).toBe("Decision requested");
    expect(doc.sections.map((s) => s.heading)).toContain("Proceed / hold / stop");
  });

  it("the shaped narrative PASSES the transformation gates", () => {
    const doc = buildCharter(FC_CHARTER);
    const a = assessClientDeliverable({
      deliverableKey: "charter",
      narrativeText: charterNarrativeText(doc),
      renderedExhibits: [
        "decision_box",
        "known_unknown_table",
        "proceed_hold_stop_gate",
        "open_inputs_required",
      ],
    });
    expect(a.quality.findings.filter((f) => f.severity === "block")).toHaveLength(0);
    expect(a.clientReady).toBe(true);
  });

  it("emits ONE Open Inputs table and keeps traceability in an appendix", () => {
    const md = renderCharterMarkdown(buildCharter(FC_CHARTER));
    expect(md).toContain("## Open Inputs Required");
    expect((md.match(/## Open Inputs Required/g) ?? []).length).toBe(1);
    expect(md).toContain("## Appendix — Traceability");
    // no machinery in the body
    expect(md).not.toMatch(/\bsource register\b/i);
    expect(md).not.toMatch(/\bsubstrate\b/i);
    expect(md).not.toMatch(/\[CLIENT TO COMPLETE/i);
    expect(md).not.toMatch(/(?<![A-Za-z0-9])P[1-5](?![A-Za-z0-9])/);
  });
});
