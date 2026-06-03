export type PreIngestSensitiveEntityType =
  | "US_SSN"
  | "MEDICAL_RECORD_NUMBER"
  | "DATE_OF_BIRTH"
  | "BANK_ACCOUNT_NUMBER"
  | "CREDIT_CARD"
  | "EMAIL_ADDRESS"
  | "PHONE_NUMBER";

export type PreIngestSensitiveCategory = "phi" | "pii" | "financial";
export type PreIngestSensitiveSeverity = "low" | "medium" | "high";
export type PreIngestSensitiveAction = "flag" | "quarantine";
export type PreIngestSensitiveRecognizer =
  | "deterministic-pattern"
  | "presidio-compatible";

export interface PreIngestSensitiveFinding {
  readonly ruleId: string;
  readonly entityType: PreIngestSensitiveEntityType;
  readonly category: PreIngestSensitiveCategory;
  readonly label: string;
  readonly severity: PreIngestSensitiveSeverity;
  readonly count: number;
  readonly confidence: number;
  readonly action: PreIngestSensitiveAction;
  readonly recognizer: PreIngestSensitiveRecognizer;
}

export interface PreIngestSensitiveScanResult {
  readonly findings: ReadonlyArray<PreIngestSensitiveFinding>;
  readonly suspectedPhi: boolean;
  readonly suspectedPii: boolean;
  readonly suspectedFinancialIdentifiers: boolean;
  readonly requiresQuarantine: boolean;
}

interface DetectorDefinition {
  readonly ruleId: string;
  readonly entityType: PreIngestSensitiveEntityType;
  readonly category: PreIngestSensitiveCategory;
  readonly label: string;
  readonly severity: PreIngestSensitiveSeverity;
  readonly confidence: number;
  readonly pattern?: RegExp;
  readonly count?: (text: string) => number;
}

const DETECTORS: readonly DetectorDefinition[] = [
  {
    ruleId: "pii.ssn",
    entityType: "US_SSN",
    category: "pii",
    label: "US Social Security number pattern",
    severity: "high",
    confidence: 0.95,
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    ruleId: "phi.mrn",
    entityType: "MEDICAL_RECORD_NUMBER",
    category: "phi",
    label: "Medical record or patient identifier label",
    severity: "high",
    confidence: 0.9,
    pattern:
      /\b(?:MRN|medical record number|patient(?:\s+id)?|member(?:\s+id)?|subscriber(?:\s+id)?)\s*[:#-]?\s*[A-Z0-9][A-Z0-9-]{5,}\b/gi,
  },
  {
    ruleId: "phi.dob",
    entityType: "DATE_OF_BIRTH",
    category: "phi",
    label: "Date-of-birth label with date value",
    severity: "high",
    confidence: 0.9,
    pattern:
      /\b(?:DOB|date of birth)\s*[:#-]?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/gi,
  },
  {
    ruleId: "financial.routing_or_account",
    entityType: "BANK_ACCOUNT_NUMBER",
    category: "financial",
    label: "Bank routing/account number label",
    severity: "high",
    confidence: 0.9,
    pattern:
      /\b(?:routing number|account number|acct(?:\.|ount)?\s+#?)\s*[:#-]?\s*\d{6,17}\b/gi,
  },
  {
    ruleId: "financial.card",
    entityType: "CREDIT_CARD",
    category: "financial",
    label: "Likely payment card number",
    severity: "high",
    confidence: 0.92,
    count: countLikelyCardNumbers,
  },
  {
    ruleId: "pii.email",
    entityType: "EMAIL_ADDRESS",
    category: "pii",
    label: "Email address",
    severity: "medium",
    confidence: 0.75,
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    ruleId: "pii.phone",
    entityType: "PHONE_NUMBER",
    category: "pii",
    label: "US phone number",
    severity: "medium",
    confidence: 0.72,
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  },
];

export function scanPreIngestSensitiveText(
  text: string,
): PreIngestSensitiveScanResult {
  const findings = DETECTORS.flatMap((detector) => {
    const count = detector.count
      ? detector.count(text)
      : countPattern(text, detector.pattern!);
    if (count <= 0) return [];
    return [
      {
        ruleId: detector.ruleId,
        entityType: detector.entityType,
        category: detector.category,
        label: detector.label,
        severity: detector.severity,
        count,
        confidence: detector.confidence,
        action: detector.severity === "high" ? "quarantine" : "flag",
        recognizer: "deterministic-pattern",
      } satisfies PreIngestSensitiveFinding,
    ];
  });
  const suspectedPhi = findings.some((finding) => finding.category === "phi");
  const suspectedFinancialIdentifiers = findings.some(
    (finding) => finding.category === "financial",
  );
  const suspectedPii =
    findings.some((finding) => finding.category === "pii") ||
    suspectedPhi ||
    suspectedFinancialIdentifiers;
  const requiresQuarantine = findings.some(
    (finding) => finding.action === "quarantine",
  );

  return {
    findings,
    suspectedPhi,
    suspectedPii,
    suspectedFinancialIdentifiers,
    requiresQuarantine,
  };
}

export function toPresidioCompatibleEntities(
  result: PreIngestSensitiveScanResult,
): ReadonlyArray<{
  entity_type: PreIngestSensitiveEntityType;
  score: number;
  count: number;
}> {
  return result.findings.map((finding) => ({
    entity_type: finding.entityType,
    score: finding.confidence,
    count: finding.count,
  }));
}

function countPattern(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
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
