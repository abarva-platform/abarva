import { htmlToPlainText, isFullHtmlDocument } from "../html-to-plain-text";

describe("htmlToPlainText", () => {
  it("strips a fully-closed style block", () => {
    const html =
      "<!doctype html><html><head><style>:root{--bg:#fff;}</style></head><body><h1>Title</h1><p>Body text.</p></body></html>";
    expect(htmlToPlainText(html)).toBe("Title Body text.");
  });

  it("strips a <style> block even when the closing tag is missing from the slice", () => {
    // Reproduces the real bug: source-artifact summaries used to slice raw
    // HTML to 600 chars BEFORE stripping. For a generated artifact whose
    // <style> block runs past that cutoff, the closing </style> never
    // appears in the slice, so the old (strip-after-slice) approach left
    // raw CSS custom-property declarations visible in the rendered summary.
    // The fix is strip-before-slice: run htmlToPlainText over the FULL
    // document first, then truncate the already-clean text.
    const fullDoc =
      "<!doctype html><html><head><style>:root{--bg:#F8F7F4;--fg:#0C1A3A;--muted:#706D66;--rule:#D8D5CC;--accent:#2DD4C8;}</style></head><body><h1>Sourcing Strategy Memo</h1><p>Real prose content that should be the visible summary.</p></body></html>";
    const truncatedThenStripped = fullDoc
      .slice(0, 90) // cuts off mid-<style>, before </style>
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Demonstrates the bug: raw CSS text leaks through when you slice first.
    expect(truncatedThenStripped).toContain("--bg:#F8F7F4");

    const strippedThenTruncated = htmlToPlainText(fullDoc).slice(0, 90);
    expect(strippedThenTruncated).not.toContain("--bg");
    expect(strippedThenTruncated).not.toContain("<style>");
    expect(strippedThenTruncated).toContain("Sourcing Strategy Memo");
  });

  it("strips script blocks and collapses entities/whitespace", () => {
    const html =
      "<html><body><script>var x = 1;</script><p>Hello&nbsp;world.</p>\n\n<p>Second   line.</p></body></html>";
    expect(htmlToPlainText(html)).toBe("Hello world. Second line.");
  });
});

describe("isFullHtmlDocument", () => {
  it("recognizes a doctype-prefixed document", () => {
    expect(isFullHtmlDocument("<!doctype html><html></html>")).toBe(true);
  });

  it("recognizes a bare <html> tag with leading whitespace", () => {
    expect(isFullHtmlDocument("  \n<html lang=\"en\">")).toBe(true);
  });

  it("rejects markdown and plain text", () => {
    expect(isFullHtmlDocument("# Heading\n\nSome body text.")).toBe(false);
    expect(isFullHtmlDocument("Plain prose, no markup at all.")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isFullHtmlDocument(null)).toBe(false);
    expect(isFullHtmlDocument(undefined)).toBe(false);
    expect(isFullHtmlDocument(42)).toBe(false);
  });
});
