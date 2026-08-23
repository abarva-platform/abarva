// The contract: return real text, or say the document could not be read.
// Never return scannable-looking noise.
//
// The first test is the one that matters: binary Office files must be extracted
// as Office documents, not treated like plain text or HTML. Unreadable bytes
// must fail loudly rather than becoming scannable-looking noise.

import JSZip from "jszip";
import {
  extractOfficeText,
  looksLikeOfficeFile,
  officeXmlToText,
} from "../office-text-extract";
import { scanClientReadiness } from "../client-readiness-scan";

async function makeDocx(paragraphs: string[]): Promise<Uint8Array> {
  const zip = new JSZip();
  const body = paragraphs
    .map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`)
    .join("");
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file(
    "word/document.xml",
    `<w:document><w:body>${body}</w:body></w:document>`,
  );
  return zip.generateAsync({ type: "uint8array" });
}

async function makePptx(slides: string[][]): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", "<Types/>");
  slides.forEach((lines, index) => {
    const body = lines
      .map((line) => `<a:p><a:r><a:t>${line}</a:t></a:r></a:p>`)
      .join("");
    zip.file(`ppt/slides/slide${index + 1}.xml`, `<p:sld>${body}</p:sld>`);
  });
  return zip.generateAsync({ type: "uint8array" });
}

const HTML_ERROR_PAGE = new TextEncoder().encode(
  '<!DOCTYPE html><html id="__next_error__"><head><meta charSet="utf-8"/></head><body>404</body></html>',
);

describe("refusing to scan what it could not read", () => {
  it("rejects an HTML error page instead of decoding it into noise", async () => {
    const result = await extractOfficeText(HTML_ERROR_PAGE, "docx");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.reason).toBe("not_a_zip");
    expect(result.detail).toMatch(/NOT scanned/);
  });

  it("rejects arbitrary binary noise", async () => {
    const noise = new Uint8Array(512).map((_v, i) => (i * 37) % 256);
    expect((await extractOfficeText(noise, "docx")).ok).toBe(false);
  });

  it("rejects an empty buffer", async () => {
    expect((await extractOfficeText(new Uint8Array(0), "docx")).ok).toBe(false);
  });

  it("reports a zip with no document parts rather than calling it clean", async () => {
    const zip = new JSZip();
    zip.file("readme.txt", "not an office document");
    const result = await extractOfficeText(
      await zip.generateAsync({ type: "uint8array" }),
      "docx",
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.reason).toBe("no_readable_parts");
  });

  it("reports a parsed-but-empty document as unreadable, not clean", async () => {
    const result = await extractOfficeText(await makeDocx([]), "docx");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.reason).toBe("empty_document");
    expect(result.detail).toMatch(/unreviewed rather than clean/);
  });

  it("rejects a format it does not support", async () => {
    const result = await extractOfficeText(
      await makeDocx(["x"]),
      "xlsx" as unknown as "docx",
    );
    expect(result.ok).toBe(false);
  });
});

describe("the guard that prevents binary-noise scans", () => {
  it("an HTML page is not mistaken for an office file", () => {
    expect(looksLikeOfficeFile(HTML_ERROR_PAGE)).toBe(false);
  });

  it("a real docx is recognised", async () => {
    expect(looksLikeOfficeFile(await makeDocx(["hello"]))).toBe(true);
  });

  it("scanning a rejected download yields no findings, because it is never scanned", async () => {
    // End to end: the caller must not be able to produce a finding from a
    // document that failed extraction.
    const result = await extractOfficeText(HTML_ERROR_PAGE, "docx");
    expect(result.ok).toBe(false);
    // There is no `text` to hand the scanner — the type system enforces it.
    expect("text" in result).toBe(false);
  });
});

describe("reading a real document", () => {
  it("extracts paragraphs in order, one per line", async () => {
    const result = await extractOfficeText(
      await makeDocx([
        "Sponsor commitment",
        "The SVP Flight Operations chairs the weekly review.",
      ]),
      "docx",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.text).toBe(
      "Sponsor commitment\nThe SVP Flight Operations chairs the weekly review.",
    );
  });

  it("reads slides in natural order, so slide 10 follows slide 9", async () => {
    const slides = Array.from({ length: 11 }, (_v, i) => [`Slide ${i + 1}`]);
    const result = await extractOfficeText(await makePptx(slides), "pptx");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.partCount).toBe(11);
    expect(result.text.indexOf("Slide 9")).toBeLessThan(
      result.text.indexOf("Slide 10"),
    );
  });

  it("finds a leak that is only present in a docx footer", async () => {
    // Footers are client-visible and are exactly where a build stamp hides.
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      "<w:document><w:body><w:p><w:r><w:t>Body copy.</w:t></w:r></w:p></w:body></w:document>",
    );
    zip.file(
      "word/footer1.xml",
      "<w:ftr><w:p><w:r><w:t>engagement_id 4471</w:t></w:r></w:p></w:ftr>",
    );
    const result = await extractOfficeText(
      await zip.generateAsync({ type: "uint8array" }),
      "docx",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(
      scanClientReadiness(result.text).findings.map((f) => f.kind),
    ).toContain("schema_identifier");
  });
});

describe("xml to text", () => {
  it("keeps words apart across paragraphs so phrase rules still match", () => {
    // Without paragraph breaks "today's" and "rapidly" would fuse and the
    // filler rule would silently stop firing.
    const xml =
      "<w:p><w:r><w:t>In today's</w:t></w:r></w:p>" +
      "<w:p><w:r><w:t>rapidly evolving market</w:t></w:r></w:p>";
    expect(officeXmlToText(xml)).toBe("In today's\nrapidly evolving market");
  });

  it("decodes escaped characters", () => {
    expect(
      officeXmlToText(
        "<w:t>Ops &amp; Maintenance &quot;turnaround&quot;</w:t>",
      ),
    ).toBe('Ops & Maintenance "turnaround"');
  });

  it("does not double-decode an escaped ampersand", () => {
    expect(officeXmlToText("<w:t>A &amp;amp; B</w:t>")).toBe("A &amp; B");
  });

  it("separates table cells", () => {
    const xml =
      "<w:tc><w:p><w:r><w:t>Risk</w:t></w:r></w:p></w:tc>" +
      "<w:tc><w:p><w:r><w:t>Owner</w:t></w:r></w:p></w:tc>";
    expect(officeXmlToText(xml)).toMatch(/Risk[\s\t]+Owner/);
  });
});
