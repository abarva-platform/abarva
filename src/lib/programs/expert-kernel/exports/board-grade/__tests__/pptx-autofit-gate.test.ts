// PPTX autofit gate — part of the Moves Deliverable Standard format bar.
//
// The editable PowerPoint must never ship with text that overruns its box.
// pptxgenjs `fit: 'shrink'` emits an `<a:normAutofit>` shrink-to-fit on the
// text body, so PowerPoint shrinks overflowing prose to fit. This gate proves
// the rendered deck is a valid OOXML package AND that shrink-to-fit autofit is
// actually applied to its prose slides — so a future edit that drops autofit
// (re-introducing the overrun) fails CI.

import JSZip from "jszip";

import { renderApexCostedBusinessCasePptx } from "../index";

const GENERATED_ON = "2026-06-06";

describe("PPTX autofit gate", () => {
  let buf: Buffer;
  let zip: JSZip;
  let slideNames: string[];

  beforeAll(async () => {
    buf = await renderApexCostedBusinessCasePptx(GENERATED_ON);
    zip = await JSZip.loadAsync(buf);
    slideNames = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort();
  });

  it("renders a valid, non-trivial OOXML (zip) package", () => {
    expect(buf.length).toBeGreaterThan(200_000);
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("produces the full board deck (multiple slides)", () => {
    expect(slideNames.length).toBeGreaterThanOrEqual(8);
  });

  it("applies shrink-to-fit autofit so prose never overruns its box", async () => {
    let autofitNodes = 0;
    let slidesWithAutofit = 0;
    for (const name of slideNames) {
      const xml = await zip.files[name].async("string");
      const count = (xml.match(/normAutofit/g) ?? []).length;
      autofitNodes += count;
      if (count > 0) slidesWithAutofit += 1;
    }
    // Every content slide carries at least one shrink-to-fit text box.
    expect(autofitNodes).toBeGreaterThanOrEqual(slideNames.length);
    expect(slidesWithAutofit).toBeGreaterThanOrEqual(slideNames.length - 1);
  });
});
