/**
 * The Moves upload route refuses on two bounds — a MIME allowlist and a size
 * cap — and its control used to declare neither. A reviewer learned both only
 * by picking a file, waiting out the whole upload and reading the refusal.
 *
 * These cases pin that the picker's `accept` and the control's sentence are
 * DERIVED from the values the route enforces, and specifically that the
 * derivation agrees with the route's own predicates at the bound and one step
 * over it. A picker that disagreed in the permissive direction would promise an
 * upload the route refuses; one that disagreed in the strict direction would
 * hide a file the route takes.
 */

import {
  ATTACHMENT_MIME_ALLOWLIST,
  MAX_ATTACHMENT_SIZE_BYTES,
  isAllowedMimeType,
  isWithinSizeLimit,
} from "../mime";
import {
  ACCEPTED_UPLOAD_EXTENSIONS,
  ACCEPTED_UPLOAD_FORMATS,
  UPLOAD_ACCEPT_ATTRIBUTE,
  describeUploadBounds,
  describeUploadSizeLimit,
} from "../upload-control-bounds";

const acceptEntries = UPLOAD_ACCEPT_ATTRIBUTE.split(",");

describe("the picker offers exactly the types the route accepts", () => {
  it("names every allowlisted MIME type", () => {
    for (const mime of ATTACHMENT_MIME_ALLOWLIST) {
      expect(acceptEntries).toContain(mime);
    }
  });

  // The permissive direction: a MIME type in the picker that the route would
  // refuse is a promise the upload cannot keep.
  it("offers no MIME type the route refuses", () => {
    const mimes = acceptEntries.filter((entry) => !entry.startsWith("."));
    expect(mimes.length).toBeGreaterThan(0);
    for (const mime of mimes) {
      expect(isAllowedMimeType(mime)).toBe(true);
    }
  });

  it("offers a MIME type for nothing the allowlist leaves out", () => {
    // One step over the bound on the type side: archives and octet-stream are
    // the two the allowlist deliberately excludes.
    for (const refused of [
      "application/zip",
      "application/x-tar",
      "application/octet-stream",
      "image/svg+xml",
      "image/gif",
    ]) {
      expect(isAllowedMimeType(refused)).toBe(false);
      expect(acceptEntries).not.toContain(refused);
    }
  });

  // The strict direction. The route's check is `if (file.type && !allowed)`,
  // so a file the browser cannot type is ACCEPTED — and a MIME-only `accept`
  // would hide exactly those files from the picker.
  it("also offers extensions, so an untypeable file stays pickable", () => {
    const extensions = acceptEntries.filter((entry) => entry.startsWith("."));
    expect(extensions.length).toBeGreaterThan(0);
    for (const expected of [".pdf", ".docx", ".xlsx", ".csv", ".md", ".txt"]) {
      expect(extensions).toContain(expected);
    }
  });

  it("offers no extension for a format the allowlist excludes", () => {
    for (const refused of [".zip", ".tar", ".gz", ".svg", ".gif", ".exe"]) {
      expect(ACCEPTED_UPLOAD_EXTENSIONS).not.toContain(refused);
    }
  });

  it("lists each accept entry once", () => {
    expect(new Set(acceptEntries).size).toBe(acceptEntries.length);
  });

  it("covers every allowlisted type with at least one extension", () => {
    // The extension map is keyed by the allowlist's union, so the compiler
    // requires an entry per type; this pins that no entry is empty.
    expect(ACCEPTED_UPLOAD_EXTENSIONS.length).toBeGreaterThanOrEqual(
      ATTACHMENT_MIME_ALLOWLIST.length,
    );
    for (const extension of ACCEPTED_UPLOAD_EXTENSIONS) {
      expect(extension.startsWith(".")).toBe(true);
    }
  });
});

describe("the control states the size cap the route enforces", () => {
  it("states the cap the route refuses above", () => {
    expect(describeUploadSizeLimit()).toBe("100 MB");
    expect(describeUploadSizeLimit(MAX_ATTACHMENT_SIZE_BYTES)).toBe("100 MB");
  });

  // At the bound and one byte over it, measured against the route's own
  // predicate rather than a retyped number.
  it("names a cap the route accepts AT and refuses ONE OVER", () => {
    expect(isWithinSizeLimit(MAX_ATTACHMENT_SIZE_BYTES)).toBe(true);
    expect(isWithinSizeLimit(MAX_ATTACHMENT_SIZE_BYTES + 1)).toBe(false);
  });

  it("formats a fractional cap without losing the fraction", () => {
    expect(describeUploadSizeLimit(1024 * 1024)).toBe("1 MB");
    expect(describeUploadSizeLimit(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });
});

describe("the sentence shown before a file is chosen", () => {
  it("states both bounds in one sentence", () => {
    const sentence = describeUploadBounds();
    expect(sentence).toContain(ACCEPTED_UPLOAD_FORMATS);
    expect(sentence).toContain(describeUploadSizeLimit());
  });

  it("is written for a reviewer, not from the MIME list", () => {
    const sentence = describeUploadBounds();
    expect(sentence).not.toMatch(/application\//);
    expect(sentence).not.toMatch(/openxmlformats/);
    expect(sentence).toMatch(/PDF/);
    expect(sentence).toMatch(/Word/);
  });

  it("names every format family the allowlist carries", () => {
    const sentence = describeUploadBounds();
    for (const family of [
      "PDF",
      "Word",
      "Excel",
      "PowerPoint",
      "CSV",
      "JSON",
      "Markdown",
      "plain text",
      "PNG",
      "JPEG",
      "MP3",
    ]) {
      expect(sentence).toContain(family);
    }
  });
});
