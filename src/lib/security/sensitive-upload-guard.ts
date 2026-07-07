// Sensitive upload guard
//
// Current-state enforcement for the product: AbarVa accepts aggregate,
// de-identified, and confidential business context. Suspected PHI/PII or
// regulated identifiers are stopped before storage, vector indexing, graph
// extraction, or evidence ingestion.

import { scanPreIngestSensitiveText } from "./preingest-sensitive-scanner";

export type UploadDataClassification =
  | "public"
  | "internal"
  | "confidential_business"
  | "restricted_financial"
  | "regulated_phi_pii_suspected";

export type UploadProtectionDecision = "allow" | "quarantine";
export type UploadProtectionSeverity = "low" | "medium" | "high";

export interface UploadProtectionRuleMatch {
  ruleId: string;
  label: string;
  severity: UploadProtectionSeverity;
  count: number;
}

export interface UploadProtectionResult {
  declaredClassification: UploadDataClassification;
  decision: UploadProtectionDecision;
  storageAllowed: boolean;
  indexingAllowed: boolean;
  evidenceExtractionAllowed: boolean;
  suspectedPhi: boolean;
  suspectedPii: boolean;
  suspectedFinancialIdentifiers: boolean;
  matchedRules: UploadProtectionRuleMatch[];
  message: string;
}

type GuardInput = {
  filename: string;
  mimeType?: string | null;
  bytes: ArrayBuffer | Uint8Array;
  declaredClassification?: FormDataEntryValue | string | null;
};

const DEFAULT_CLASSIFICATION: UploadDataClassification =
  "confidential_business";
const SAMPLE_BYTES = 1024 * 1024;
const PDF_TEXT_SAMPLE_BYTES = 2 * 1024 * 1024;

const PLAIN_TEXT_SCAN_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

const PDF_MIME_TYPE = "application/pdf";

const CLASSIFICATION_ALIASES: Record<string, UploadDataClassification> = {
  public: "public",
  internal: "internal",
  confidential: "confidential_business",
  confidential_business: "confidential_business",
  confidentialbusiness: "confidential_business",
  restricted: "restricted_financial",
  restricted_financial: "restricted_financial",
  restrictedfinancial: "restricted_financial",
  phi: "regulated_phi_pii_suspected",
  pii: "regulated_phi_pii_suspected",
  phi_pii: "regulated_phi_pii_suspected",
  regulated: "regulated_phi_pii_suspected",
  regulated_phi_pii_suspected: "regulated_phi_pii_suspected",
  regulatedphipiisuspected: "regulated_phi_pii_suspected",
};

function normalizeClassification(
  raw: FormDataEntryValue | string | null | undefined,
): UploadDataClassification {
  if (raw === null || raw === undefined) return DEFAULT_CLASSIFICATION;
  const value = String(raw).trim();
  if (!value) return DEFAULT_CLASSIFICATION;
  const normalized = value
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return CLASSIFICATION_ALIASES[normalized] ?? DEFAULT_CLASSIFICATION;
}

function byteSample(bytes: GuardInput["bytes"]): Uint8Array {
  const normalized =
    bytes instanceof ArrayBuffer
      ? new Uint8Array(bytes)
      : new Uint8Array(bytes);
  return normalized.slice(0, SAMPLE_BYTES);
}

function byteSampleWithLimit(
  bytes: GuardInput["bytes"],
  limit: number,
): Uint8Array {
  const normalized =
    bytes instanceof ArrayBuffer
      ? new Uint8Array(bytes)
      : new Uint8Array(bytes);
  return normalized.slice(0, limit);
}

function normalizeMimeType(mimeType: string | null | undefined): string {
  return (mimeType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

function decodeBytes(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function unescapePdfString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractLikelyPdfText(input: GuardInput): string {
  const sample = byteSampleWithLimit(input.bytes, PDF_TEXT_SAMPLE_BYTES);
  const decoded = decodeBytes(sample);
  if (!decoded.includes("%PDF")) return "";

  const matches = [...decoded.matchAll(/\(([^()\r\n]{3,240})\)\s*(?:Tj|'|"|TJ)?/g)]
    .map((match) => unescapePdfString(match[1] ?? "").trim())
    .filter((value) => /[A-Za-z0-9]/.test(value));

  return matches.join("\n").slice(0, SAMPLE_BYTES);
}

function decodeSample(input: GuardInput): string {
  const mimeType = normalizeMimeType(input.mimeType);
  if (PLAIN_TEXT_SCAN_MIME_TYPES.has(mimeType)) {
    return `${input.filename}\n${input.mimeType ?? ""}\n${decodeBytes(byteSample(input.bytes))}`.slice(
      0,
      SAMPLE_BYTES,
    );
  }

  if (mimeType === PDF_MIME_TYPE) {
    const extractedPdfText = extractLikelyPdfText(input);
    return `${input.filename}\n${input.mimeType ?? ""}\n${extractedPdfText}`.slice(
      0,
      SAMPLE_BYTES,
    );
  }

  // Known Office, image, audio, and video uploads are binary or archive-like.
  // Regex-scanning their raw bytes creates false positives because compressed
  // payloads can accidentally resemble phone/card/account patterns. Deep
  // document inspection belongs to the parser/evidence pipeline; this
  // synchronous guard scans declared classification plus safe text surfaces.
  return `${input.filename}\n${input.mimeType ?? ""}`.slice(0, SAMPLE_BYTES);
}

export function evaluateSensitiveUpload(
  input: GuardInput,
): UploadProtectionResult {
  const declaredClassification = normalizeClassification(
    input.declaredClassification,
  );
  const text = decodeSample(input);
  const scan = scanPreIngestSensitiveText(text);
  const matches: UploadProtectionRuleMatch[] = scan.findings.map((finding) => ({
    ruleId: finding.ruleId,
    label: finding.label,
    severity: finding.severity,
    count: finding.count,
  }));
  const decision =
    declaredClassification === "regulated_phi_pii_suspected" ||
    scan.requiresQuarantine
      ? "quarantine"
      : "allow";

  return {
    declaredClassification,
    decision,
    storageAllowed: decision === "allow",
    indexingAllowed: decision === "allow",
    evidenceExtractionAllowed: decision === "allow",
    suspectedPhi: scan.suspectedPhi,
    suspectedPii: scan.suspectedPii,
    suspectedFinancialIdentifiers: scan.suspectedFinancialIdentifiers,
    matchedRules: matches,
    message:
      decision === "allow"
        ? "Upload accepted as non-regulated business context. Store, index, and evidence extraction are allowed for this tenant."
        : "Upload quarantined before storage/indexing because regulated PHI/PII or high-risk identifiers were declared or detected. Remove direct identifiers or route through the private data-lane approval process.",
  };
}

export function sensitiveUploadRejectedResponse(
  result: UploadProtectionResult,
): Response {
  return Response.json(
    {
      ok: false,
      error: "sensitive_data_quarantined",
      detail: result.message,
      dataProtection: result,
    },
    { status: 422 },
  );
}
