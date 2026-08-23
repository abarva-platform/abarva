// Extracting readable text from DOCX and PPTX.
//
// The contract here is: either return real text, or say plainly that the
// document could not be read. Never return something scannable-looking that is
// actually binary or error-page noise. `ok: false` is a useful answer; garbage
// is not.

import JSZip from "jszip";

export type OfficeFormat = "docx" | "pptx";

export type ExtractResult =
  | { ok: true; format: OfficeFormat; text: string; partCount: number }
  | { ok: false; reason: ExtractFailure; detail: string };

export type ExtractFailure =
  | "not_a_zip"
  | "no_readable_parts"
  | "unsupported_format"
  | "empty_document";

/** ZIP local file header. Every DOCX and PPTX starts with it. */
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

/**
 * True when the buffer really is a ZIP container.
 *
 * Checked before handing anything to the unzipper so an HTML error page or
 * truncated download fails loudly here rather than being decoded into nonsense.
 */
export function looksLikeOfficeFile(bytes: Uint8Array): boolean {
  if (bytes.length < ZIP_SIGNATURE.length) return false;
  return ZIP_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

/**
 * Strip Office Open XML to readable text.
 *
 * Paragraph and slide-break elements become newlines before tags are removed,
 * otherwise every word in the document runs together and phrase-level rules
 * (filler, pipeline vocabulary) silently stop matching.
 */
export function officeXmlToText(xml: string): string {
  return (
    xml
      // Explicit line and paragraph breaks.
      .replace(/<w:br\b[^>]*\/?>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<\/a:p>/g, "\n")
      // Table cells should not glue their contents to the next cell.
      .replace(/<\/w:tc>/g, "\t")
      .replace(/<\/a:tr>/g, "\n")
      .replace(/<[^>]+>/g, "")
      // Office XML escapes these; a reader wants the characters.
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
      // Ampersand last, so an escaped entity is not double-decoded.
      .replace(/&amp;/g, "&")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Parts holding user-visible prose, in reading order where it matters. */
function readablePartsFor(format: OfficeFormat): (path: string) => boolean {
  if (format === "docx") {
    // Headers and footers carry client-visible text too — a leaked build id
    // in a footer is exactly the kind of thing this is meant to catch.
    return (path) =>
      /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(
        path,
      );
  }
  return (path) =>
    /^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/.test(path);
}

/** Slide2 must not sort before slide10 — reviewers read in order. */
function naturalCompare(a: string, b: string): number {
  const na = Number((a.match(/(\d+)\.xml$/) ?? [])[1] ?? 0);
  const nb = Number((b.match(/(\d+)\.xml$/) ?? [])[1] ?? 0);
  if (na !== nb) return na - nb;
  return a.localeCompare(b);
}

export async function extractOfficeText(
  bytes: Uint8Array,
  format: OfficeFormat,
): Promise<ExtractResult> {
  if (format !== "docx" && format !== "pptx") {
    return {
      ok: false,
      reason: "unsupported_format",
      detail: `Only docx and pptx are supported, received ${String(format)}.`,
    };
  }
  if (!looksLikeOfficeFile(bytes)) {
    return {
      ok: false,
      reason: "not_a_zip",
      detail:
        "Not a ZIP container — an HTML error page or a truncated download would look like this. The document was NOT scanned.",
    };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (err) {
    return {
      ok: false,
      reason: "not_a_zip",
      detail: `Could not open the archive: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  const isReadable = readablePartsFor(format);
  const paths = Object.keys(zip.files)
    .filter((path) => isReadable(path))
    .sort(naturalCompare);

  if (paths.length === 0) {
    return {
      ok: false,
      reason: "no_readable_parts",
      detail: `No ${format} text parts found. The file may be corrupt or a different format than its extension claims.`,
    };
  }

  const chunks: string[] = [];
  for (const path of paths) {
    const file = zip.file(path);
    if (!file) continue;
    chunks.push(officeXmlToText(await file.async("string")));
  }

  const text = chunks.filter(Boolean).join("\n\n").trim();
  if (text.length === 0) {
    return {
      ok: false,
      reason: "empty_document",
      detail:
        "The document parsed but contains no text. Treat as unreviewed rather than clean.",
    };
  }

  return { ok: true, format, text, partCount: paths.length };
}
