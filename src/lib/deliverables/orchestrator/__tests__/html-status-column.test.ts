// The status column is colour-coded in the HTML render too, matching the deck.
import { renderDeliverableHtml } from "../renderers";
import { goodDocument } from "../__fixtures__/ams-rfp";
import { CELL_TONE_HEX } from "@/lib/deliverables/shared/cell-tone";

describe("HTML status-column colouring", () => {
  it("colours the declared status column cell by value", () => {
    const doc = goodDocument();
    const risk = doc.tables.find((t) => t.key === "risk_register")!;
    risk.rows = [["Transition window", "risk", "High", "CIO", "Phased KT"]];
    risk.statusColumn = 2; // Impact = "High" -> critical
    const html = renderDeliverableHtml(doc);
    expect(html).toContain(`background:#${CELL_TONE_HEX.critical.fill}`);
  });

  it("leaves a table with no status column plain", () => {
    const doc = goodDocument();
    const html = renderDeliverableHtml(doc);
    expect(html).not.toContain(`background:#${CELL_TONE_HEX.critical.fill}`);
    expect(html).not.toContain(`background:#${CELL_TONE_HEX.good.fill}`);
  });
});
