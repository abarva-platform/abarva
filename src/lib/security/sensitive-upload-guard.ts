// Sensitive upload guard
//
// Current-state enforcement for the product: AbarVa accepts aggregate,
// de-identified, and confidential business context. Suspected PHI/PII or
// regulated identifiers are stopped before storage, vector indexing, graph
// extraction, or evidence ingestion.

export type UploadDataClassification =
  | 'public'
  | 'internal'
  | 'confidential_business'
  | 'restricted_financial'
  | 'regulated_phi_pii_suspected';

export type UploadProtectionDecision = 'allow' | 'quarantine';
export type UploadProtectionSeverity = 'low' | 'medium' | 'high';

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

const DEFAULT_CLASSIFICATION: UploadDataClassification = 'confidential_business';
const SAMPLE_BYTES = 1024 * 1024;

const CLASSIFICATION_ALIASES: Record<string, UploadDataClassification> = {
  public: 'public',
  internal: 'internal',
  confidential: 'confidential_business',
  confidential_business: 'confidential_business',
  confidentialbusiness: 'confidential_business',
  restricted: 'restricted_financial',
  restricted_financial: 'restricted_financial',
  restrictedfinancial: 'restricted_financial',
  phi: 'regulated_phi_pii_suspected',
  pii: 'regulated_phi_pii_suspected',
  phi_pii: 'regulated_phi_pii_suspected',
  regulated: 'regulated_phi_pii_suspected',
  regulated_phi_pii_suspected: 'regulated_phi_pii_suspected',
  regulatedphipiisuspected: 'regulated_phi_pii_suspected',
};

function normalizeClassification(raw: FormDataEntryValue | string | null | undefined): UploadDataClassification {
  if (raw === null || raw === undefined) return DEFAULT_CLASSIFICATION;
  const value = String(raw).trim();
  if (!value) return DEFAULT_CLASSIFICATION;
  const normalized = value
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return CLASSIFICATION_ALIASES[normalized] ?? DEFAULT_CLASSIFICATION;
}

function byteSample(bytes: GuardInput['bytes']): Uint8Array {
  const normalized = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes);
  return normalized.slice(0, SAMPLE_BYTES);
}

function decodeSample(input: GuardInput): string {
  const sample = byteSample(input.bytes);
  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(sample);
  return `${input.filename}\n${input.mimeType ?? ''}\n${decoded}`.slice(0, SAMPLE_BYTES);
}

function countPattern(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function luhnPasses(raw: string): boolean {
  const digits = digitsOnly(raw);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (Number.isNaN(n)) return false;
    if (doubleDigit) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function countLikelyCardNumbers(text: string): number {
  const candidates = text.match(/\b(?:\d[ -]*?){13,19}\b/g) ?? [];
  return candidates.filter(luhnPasses).length;
}

function addMatch(
  matches: UploadProtectionRuleMatch[],
  ruleId: string,
  label: string,
  severity: UploadProtectionSeverity,
  count: number,
) {
  if (count <= 0) return;
  matches.push({ ruleId, label, severity, count });
}

export function evaluateSensitiveUpload(input: GuardInput): UploadProtectionResult {
  const declaredClassification = normalizeClassification(input.declaredClassification);
  const text = decodeSample(input);
  const matches: UploadProtectionRuleMatch[] = [];

  addMatch(matches, 'pii.ssn', 'US Social Security number pattern', 'high', countPattern(text, /\b\d{3}-\d{2}-\d{4}\b/g));
  addMatch(
    matches,
    'phi.mrn',
    'Medical record or patient identifier label',
    'high',
    countPattern(text, /\b(?:MRN|medical record number|patient(?:\s+id)?|member(?:\s+id)?|subscriber(?:\s+id)?)\s*[:#-]?\s*[A-Z0-9][A-Z0-9-]{5,}\b/gi),
  );
  addMatch(
    matches,
    'phi.dob',
    'Date-of-birth label with date value',
    'high',
    countPattern(text, /\b(?:DOB|date of birth)\s*[:#-]?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/gi),
  );
  addMatch(
    matches,
    'financial.routing_or_account',
    'Bank routing/account number label',
    'high',
    countPattern(text, /\b(?:routing number|account number|acct(?:\.|ount)?\s+#?)\s*[:#-]?\s*\d{6,17}\b/gi),
  );
  addMatch(matches, 'financial.card', 'Likely payment card number', 'high', countLikelyCardNumbers(text));
  addMatch(matches, 'pii.email', 'Email address', 'medium', countPattern(text, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi));
  addMatch(matches, 'pii.phone', 'US phone number', 'medium', countPattern(text, /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g));

  const highRisk = matches.some((match) => match.severity === 'high');
  const suspectedPhi = matches.some((match) => match.ruleId.startsWith('phi.'));
  const suspectedFinancialIdentifiers = matches.some((match) => match.ruleId.startsWith('financial.'));
  const suspectedPii = matches.some((match) => match.ruleId.startsWith('pii.')) || suspectedPhi || suspectedFinancialIdentifiers;
  const decision =
    declaredClassification === 'regulated_phi_pii_suspected' || highRisk ? 'quarantine' : 'allow';

  return {
    declaredClassification,
    decision,
    storageAllowed: decision === 'allow',
    indexingAllowed: decision === 'allow',
    evidenceExtractionAllowed: decision === 'allow',
    suspectedPhi,
    suspectedPii,
    suspectedFinancialIdentifiers,
    matchedRules: matches,
    message:
      decision === 'allow'
        ? 'Upload accepted as non-regulated business context. Store, index, and evidence extraction are allowed for this tenant.'
        : 'Upload quarantined before storage/indexing because regulated PHI/PII or high-risk identifiers were declared or detected. Remove direct identifiers or route through the private data-lane approval process.',
  };
}

export function sensitiveUploadRejectedResponse(result: UploadProtectionResult): Response {
  return Response.json(
    {
      ok: false,
      error: 'sensitive_data_quarantined',
      detail: result.message,
      dataProtection: result,
    },
    { status: 422 },
  );
}
