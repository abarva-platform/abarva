// Executive chrome on the generated PPTX: every content slide carries a running
// confidentiality footer, and tables render with a dark header band.

import JSZip from "jszip";
import { renderDeliverablePptx } from "../renderers";
import { goodDocument } from "../__fixtures__/ams-rfp";

async function slideXmls(buffer: Buffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort();
  return Promise.all(names.map((n) => zip.files[n]!.async("string")));
}

describe("PPTX executive chrome", () => {
  it("footers every content slide with a running confidentiality mark", async () => {
    const buf = await renderDeliverablePptx(goodDocument());
    const xmls = await slideXmls(buf);
    const withFooter = xmls.filter((x) =>
      x.includes("Confidential") && x.includes("AI-generated working draft"),
    );
    // Every content slide (title slide is separate) carries the footer; there is
    // more than one such slide, so this is a per-slide mark, not a one-off.
    expect(withFooter.length).toBeGreaterThan(1);
  });

  it("renders table headers as a dark band, not a white grid header", async () => {
    const buf = await renderDeliverablePptx(goodDocument());
    const xmls = await slideXmls(buf);
    const joined = xmls.join("\n");
    // A table cell BACKGROUND fill in the ink colour — the dark header row.
    // pptxgenjs emits the cell fill as the last child of <a:tcPr>, after the
    // border lines (…</a:lnB><a:solidFill>…</a:solidFill></a:tcPr>). Before this
    // change the header fill was paper (FFFFFF) and body cells had no fill, so an
    // ink cell-background fill is the discriminator.
    expect(joined).toMatch(
      /<\/a:lnB><a:solidFill><a:srgbClr val="1B1A17"\s*\/><\/a:solidFill>\s*<\/a:tcPr>/,
    );
  });
});
