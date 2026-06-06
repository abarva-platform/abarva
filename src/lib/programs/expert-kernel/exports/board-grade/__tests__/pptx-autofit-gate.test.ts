// PPTX autofit gate — part of the Moves Deliverable Standard format bar.
//
// The editable PowerPoint must never ship with text that overruns its box.
// pptxgenjs `fit: 'shrink'` emits an `<a:normAutofit>` shrink-to-fit on the
// text body, so PowerPoint shrinks overflowing prose to fit. This gate proves
// the rendered deck is a valid OOXML package AND that shrink-to-fit autofit is
// actually applied to its prose slides — so a future edit that drops autofit
// (re-introducing the overrun) fails CI.

import JSZip from "jszip";

import {
  renderApexCostedBusinessCasePptx,
  renderMoveCostedBusinessCasePptx,
} from "../index";
import type { MoveBusinessCaseInput } from "../../../../move-business-case";

const GENERATED_ON = "2026-06-06";

async function slideAutofit(
  buf: Buffer,
): Promise<{ slides: number; autofit: number }> {
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files).filter((n) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(n),
  );
  let autofit = 0;
  for (const n of names) {
    autofit += (
      (await zip.files[n].async("string")).match(/normAutofit/g) ?? []
    ).length;
  }
  return { slides: names.length, autofit };
}

function boundMove(
  industry: string,
  tenantName: string,
  tenantKey: string,
  functionKey: string,
): MoveBusinessCaseInput {
  return {
    industry_code: industry,
    name: `${tenantName} — Strategic Move`,
    tenant_key: tenantKey,
    tenant_name: tenantName,
    id: `eng_${tenantKey}_pptx`,
    function_pack_key: functionKey,
    charter: { functionPackKey: functionKey },
  };
}

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

describe("generic Move costed-business-case PPTX (always-PPTX deliverable)", () => {
  const TENANTS = [
    boundMove(
      "HEALTHCARE_IDN",
      "Meridian Health System",
      "meridian-health",
      "population_health_value_based_care",
    ),
    boundMove(
      "RETAIL",
      "Apex Retail Group",
      "apex-retail",
      "pricing_promotions",
    ),
    boundMove(
      "FINANCIAL_SERVICES",
      "First Capital Financial",
      "first-capital",
      "fraud_financial_crime",
    ),
  ];

  for (const move of TENANTS) {
    it(`renders a valid, autofit, multi-slide deck for ${move.tenant_key}`, async () => {
      const buf = await renderMoveCostedBusinessCasePptx(move, GENERATED_ON);
      expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
      expect(buf.length).toBeGreaterThan(100_000);
      const { slides, autofit } = await slideAutofit(buf);
      expect(slides).toBeGreaterThanOrEqual(6);
      expect(autofit).toBeGreaterThanOrEqual(slides);
    });
  }

  it("renders an honest unbound deck without fabrication for an uncovered function", async () => {
    const buf = await renderMoveCostedBusinessCasePptx(
      boundMove(
        "HEALTHCARE_IDN",
        "Meridian Health System",
        "meridian-health",
        "no_such_function_xyz",
      ),
      GENERATED_ON,
    );
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    const zip = await JSZip.loadAsync(buf);
    const core = await zip.files["docProps/core.xml"]?.async("string");
    expect(core ?? "").toMatch(/unbound/i);
  });
});
