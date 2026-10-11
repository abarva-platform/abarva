import fs from "node:fs";
import path from "node:path";
import RetiredCanvasPreview from "../canvas/page";

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

describe("Home canvas cutover", () => {
  beforeEach(() => mockRedirect.mockClear());
  it("redirects the old preview address without losing view, source or filter", async () => {
    await RetiredCanvasPreview({
      searchParams: Promise.resolve({
        tenant: "bound-tenant",
        provider: "ecl",
        view: "tech:vendor_contract",
        panel: "evidence",
        q: "A&B",
        extra: ["one", "two"],
      }),
    });
    const url = new URL(
      mockRedirect.mock.calls[0][0],
      "https://example.invalid",
    );
    expect(url.pathname).toBe("/home");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      tenant: "bound-tenant",
      provider: "ecl",
      view: "tech:vendor_contract",
      panel: "evidence",
      q: "A&B",
    });
    expect(url.searchParams.getAll("extra")).toEqual(["one", "two"]);
  });
  it("redirects an empty preview request directly to Home", async () => {
    await RetiredCanvasPreview({ searchParams: Promise.resolve({}) });
    expect(mockRedirect).toHaveBeenCalledWith("/home");
  });
  it("leaves no mounted scrolling root in any Home route", () => {
    for (const file of ["page.tsx", "preview/page.tsx", "canvas/page.tsx"]) {
      const source = fs.readFileSync(
        path.join(process.cwd(), "src/app/(maestro)/home", file),
        "utf8",
      );
      expect(source).not.toMatch(/HomePreviewAppRoot|HomeV4App|legacy=1/);
    }
  });
});
