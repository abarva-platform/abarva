import {
  isDocxGeneratable,
  isHtmlGeneratable,
  isPdfGeneratable,
} from "../index";

describe("Source renderable artifact code registry", () => {
  it("renders the vendor response pack as a narrative export", () => {
    expect(isHtmlGeneratable("d13_vendor_responses")).toBe(true);
    expect(isDocxGeneratable("d13_vendor_responses")).toBe(true);
    expect(isPdfGeneratable("d13_vendor_responses")).toBe(true);
  });

  it("renders the pricing workbook authored body as shareable HTML", () => {
    expect(isHtmlGeneratable("d19_pricing_workbook")).toBe(true);
    expect(isDocxGeneratable("d19_pricing_workbook")).toBe(true);
    expect(isPdfGeneratable("d19_pricing_workbook")).toBe(true);
  });
});
