// A table's declared statusColumn is colour-coded by value in the rendered PPTX,
// so a risk / acceptance / readiness table reads at a glance.

import JSZip from "jszip";
import { renderDeliverablePptx } from "../renderers";
import { goodDocument } from "../__fixtures__/ams-rfp";
import { CELL_TONE_HEX } from "@/lib/deliverables/shared/cell-tone";

async function joinedSlides(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((n) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(n),
  );
  const parts = await Promise.all(names.map((n) => zip.files[n]!.async("string")));
  return parts.join("\n");
}

describe("PPTX status-column colouring", () => {
  it("colours the declared status column by value, and leaves a plain table alone", async () => {
    const colored = goodDocument();
    // risk_register columns: [Item, Type, Impact, Owner, Mitigation]; Impact="high".
    const risk = colored.tables.find((t) => t.key === "risk_register")!;
    risk.statusColumn = 2; // Impact

    const plain = goodDocument(); // no statusColumn set

    const coloredXml = await joinedSlides(await renderDeliverablePptx(colored));
    const plainXml = await joinedSlides(await renderDeliverablePptx(plain));

    const criticalFill = CELL_TONE_HEX.critical.fill!; // "high" -> critical
    // The critical tone fill appears as a cell background only when the status
    // column is declared.
    expect(coloredXml).toContain(criticalFill);
    expect(plainXml).not.toContain(criticalFill);
  });

  it("ignores an out-of-range statusColumn (renders a plain table, no throw)", async () => {
    const doc = goodDocument();
    doc.tables.find((t) => t.key === "risk_register")!.statusColumn = 99;
    const xml = await joinedSlides(await renderDeliverablePptx(doc));
    expect(xml).not.toContain(CELL_TONE_HEX.critical.fill!);
  });
});
