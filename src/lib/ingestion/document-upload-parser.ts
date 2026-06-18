export interface IngestionDocumentDescriptor {
  readonly filename: string;
  readonly mimeType?: string | null;
}

export interface ParseIngestionDocumentInput extends IngestionDocumentDescriptor {
  readonly bytes: Uint8Array;
  readonly cacheScope?: string;
}

export interface ParsedIngestionDocument {
  readonly filename: string;
  readonly mimeType: string;
  readonly parseMethod: string;
  readonly text: string;
  readonly warnings: readonly string[];
  readonly metadata: {
    readonly cacheScope?: string;
    readonly bytes: number;
    readonly extension: string;
    readonly parser: string;
  };
}

const TEXT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".jsonl",
  ".md",
  ".txt",
  ".tsv",
  ".yaml",
  ".yml",
  ".svg",
]);

const BINARY_DOCUMENT_EXTENSIONS = new Set([".pdf", ".docx", ".xlsx", ".pptx"]);

const TEXT_MIME_PREFIXES = ["text/"];

const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/jsonl",
  "application/x-ndjson",
  "application/yaml",
  "image/svg+xml",
]);

const BINARY_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function extensionFor(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

function normalizeMimeType(mimeType?: string | null): string {
  return mimeType?.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function isSupportedIngestionDocument(input: IngestionDocumentDescriptor): boolean {
  const extension = extensionFor(input.filename);
  const mimeType = normalizeMimeType(input.mimeType);
  return (
    TEXT_EXTENSIONS.has(extension) ||
    BINARY_DOCUMENT_EXTENSIONS.has(extension) ||
    TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    TEXT_MIME_TYPES.has(mimeType) ||
    BINARY_DOCUMENT_MIME_TYPES.has(mimeType)
  );
}

export async function parseIngestionDocument(
  input: ParseIngestionDocumentInput,
): Promise<ParsedIngestionDocument> {
  const extension = extensionFor(input.filename);
  const mimeType = normalizeMimeType(input.mimeType);
  const warnings: string[] = [];
  let text = "";
  let parseMethod = "utf8-text";

  if (
    TEXT_EXTENSIONS.has(extension) ||
    TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    TEXT_MIME_TYPES.has(mimeType)
  ) {
    text = decodeUtf8(input.bytes);
    if (!text.trim()) warnings.push("No extractable text found in text-like document.");
  } else if (BINARY_DOCUMENT_EXTENSIONS.has(extension) || BINARY_DOCUMENT_MIME_TYPES.has(mimeType)) {
    parseMethod = "binary-document-placeholder";
    text = [
      `Document ${input.filename} was staged as a binary source artifact.`,
      "Template-specific extraction is required before committing row-level facts.",
    ].join("\n");
    warnings.push(
      "Binary document parser is conservative: staged source is represented, but deterministic fact extraction requires a template-specific parser.",
    );
  } else {
    parseMethod = "unsupported";
    warnings.push("Unsupported document type.");
  }

  return {
    filename: input.filename,
    mimeType,
    parseMethod,
    text,
    warnings,
    metadata: {
      cacheScope: input.cacheScope,
      bytes: input.bytes.byteLength,
      extension,
      parser: "document-upload-parser",
    },
  };
}
