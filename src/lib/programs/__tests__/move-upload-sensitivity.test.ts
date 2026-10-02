import { describe, it, expect, jest } from "@jest/globals";
import { assessMoveUploadSensitivity } from "../current-state-doc-ingest";

// Synthetic content only. The identifiers below are fabricated test patterns.
const SENSITIVE_TEXT =
  "Fabricated record. Member ID SYN-M-0000000; date of birth 1900-01-01; SSN 000-00-0000.";
const CLEAN_TEXT =
  "Routine status inquiries follow five agent steps across four systems.";

const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Extract = NonNullable<Parameters<typeof assessMoveUploadSensitivity>[1]>;

function extractReturning(text: string) {
  return jest.fn(async () => ({
    extractedText: text,
    summary: "",
  })) as unknown as Extract & jest.Mock;
}

describe("assessMoveUploadSensitivity", () => {
  it("quarantines a text file on its raw bytes, without decoding it", async () => {
    const extract = extractReturning(CLEAN_TEXT);
    const result = await assessMoveUploadSensitivity(
      {
        filename: "note.md",
        mimeType: "text/markdown",
        buffer: Buffer.from(SENSITIVE_TEXT),
      },
      extract,
    );
    expect(result.decision).toBe("quarantine");
    expect(result.storageAllowed).toBe(false);
    expect(extract).not.toHaveBeenCalled();
  });

  it("quarantines an Office file whose decoded text carries identifiers the raw bytes hide", async () => {
    // The raw bytes of a ZIP container show nothing; only the decoded text does.
    const extract = extractReturning(SENSITIVE_TEXT);
    const result = await assessMoveUploadSensitivity(
      {
        filename: "notes.docx",
        mimeType: DOCX,
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]),
      },
      extract,
    );
    expect(extract).toHaveBeenCalledTimes(1);
    expect(result.decision).toBe("quarantine");
    expect(result.matchedRules.length).toBeGreaterThan(0);
  });

  it("allows a clean file in both layers", async () => {
    for (const [filename, mimeType] of [
      ["walkthrough.md", "text/markdown"],
      ["walkthrough.docx", DOCX],
    ]) {
      const result = await assessMoveUploadSensitivity(
        { filename, mimeType, buffer: Buffer.from(CLEAN_TEXT) },
        extractReturning(CLEAN_TEXT),
      );
      expect(result.decision).toBe("allow");
      expect(result.storageAllowed).toBe(true);
    }
  });

  it("quarantines on a declared regulated classification whatever the content", async () => {
    const result = await assessMoveUploadSensitivity(
      {
        filename: "walkthrough.md",
        mimeType: "text/markdown",
        buffer: Buffer.from(CLEAN_TEXT),
        declaredClassification: "phi",
      },
      extractReturning(CLEAN_TEXT),
    );
    expect(result.decision).toBe("quarantine");
  });

  it("keeps the raw-byte result when the parser cannot read the file", async () => {
    const failing = jest.fn(async () => {
      throw new Error("unreadable");
    }) as unknown as Extract;
    const result = await assessMoveUploadSensitivity(
      {
        filename: "scan.docx",
        mimeType: DOCX,
        buffer: Buffer.from([0x50, 0x4b]),
      },
      failing,
    );
    expect(result.decision).toBe("allow");
  });
});
