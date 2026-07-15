import {
  checkCapabilityClaims,
} from "@/lib/agent/product-truth/capability-claim-guard";
import type {
  AvaAnswerPacket,
  AvaClaimValidationFinding,
  AvaClaimValidationReport,
  AvaClaimType,
} from "@/lib/ava-answer/contract";

const DOLLAR_RE =
  /\$\s?[\d,]+(?:\.\d+)?\s?(?:k|m|b|thousand|million|billion)?\b/gi;
const PERCENT_RE = /\b\d+(?:\.\d+)?\s?%/g;
const DATE_RE =
  /\b(?:Q[1-4]\s+20\d{2}|20\d{2}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20\d{2}|20\d{2})\b/g;
const COUNT_RE =
  /\b\d[\d,]*(?:\.\d+)?\s+(?:users?|employees?|records?|rows?|integrations?|applications?|systems?|vendors?|contracts?|initiatives?|controls?|feeds?)\b/gi;
const CONTROL_STATUS_RE =
  /\b(?:status|control|evidence)\s*(?:=|is|:)?\s*(?:blocked|open|closed|approved|pending|missing|complete|incomplete|critical|high|medium|low)\b/gi;
const VENDOR_OR_SYSTEM_RE =
  /\b(?:SAP|SAP GRC|SAP BW|SAP MM|Kyriba|ServiceNow|BofA CashPro|Quantum TMS|Coupa|Workday|Oracle|Salesforce|Snowflake|Databricks|Tableau|Power BI|Teradata|SAS)\b/g;
const ASSERTS_SOURCE_RE =
  /\b(?:loaded|source|evidence|confirmed|shows|proves|certified|recorded|model-visible|known)\b/i;
const SAFE_UNSUPPORTED_CONTEXT_RE =
  /\b(?:not|no|without|missing|unconfirmed|unsupported|lacks?|lack of|absent|unavailable|incomplete|needs? proof|needs? evidence|requires? evidence)\b[\w\s,;:'"()/.-]{0,120}\b(?:loaded|available|proven|proved|confirmed|certified|grounded|validated|in evidence|source-backed|production|current)\b|\b(?:loaded|available|proven|proved|confirmed|certified|grounded|validated|in evidence|source-backed|production|current)\b[\w\s,;:'"()/.-]{0,120}\b(?:not|no|without|missing|unconfirmed|unsupported|lacks?|lack of|absent|unavailable|incomplete|needs? proof|needs? evidence|requires? evidence)\b/i;

interface ExtractedClaim {
  type: AvaClaimType;
  claim: string;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function visibleText(answer: AvaAnswerPacket): string {
  return [
    answer.directAnswer,
    answer.prose,
    answer.interpretation,
    answer.businessImplication,
    answer.recommendation,
  ]
    .filter((item): item is string => Boolean(item?.trim()))
    .join("\n\n");
}

function sourceText(answer: AvaAnswerPacket): string {
  return JSON.stringify({
    factsUsed: answer.factsUsed,
    metricsUsed: answer.metricsUsed,
    relationshipsUsed: answer.relationshipsUsed,
    artifacts: answer.artifacts,
    citations: answer.citations,
    gaps: answer.gaps,
    caveats: answer.caveats,
    nextSteps: answer.nextSteps,
  });
}

function extractClaims(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  for (const match of text.match(DOLLAR_RE) ?? []) {
    claims.push({ type: "dollar_amount", claim: match });
  }
  for (const match of text.match(PERCENT_RE) ?? []) {
    claims.push({ type: "percentage", claim: match });
  }
  for (const match of text.match(DATE_RE) ?? []) {
    claims.push({ type: "date", claim: match });
  }
  for (const match of text.match(COUNT_RE) ?? []) {
    claims.push({ type: "count", claim: match });
  }
  for (const match of text.match(CONTROL_STATUS_RE) ?? []) {
    claims.push({ type: "control_status", claim: match });
  }
  for (const match of text.match(VENDOR_OR_SYSTEM_RE) ?? []) {
    claims.push({ type: "vendor_or_system", claim: match });
  }
  return dedupeClaims(claims);
}

function dedupeClaims(claims: ExtractedClaim[]): ExtractedClaim[] {
  const seen = new Set<string>();
  return claims.filter((claim) => {
    const key = `${claim.type}:${normalize(claim.claim)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function numericVariants(claim: string): string[] {
  const compact = claim.replace(/[$,\s]/g, "").toLowerCase();
  const value = Number(compact.replace(/[kmb]$/, ""));
  if (!Number.isFinite(value)) return [normalize(claim)];
  const scale = compact.endsWith("b")
    ? 1_000_000_000
    : compact.endsWith("m")
      ? 1_000_000
      : compact.endsWith("k")
        ? 1_000
        : 1;
  const whole = Math.round(value * scale);
  return [normalize(claim), String(whole), whole.toLocaleString("en-US")];
}

function claimHasSupport(claim: ExtractedClaim, supportText: string): boolean {
  const support = normalize(supportText);
  if (claim.type === "dollar_amount" || claim.type === "percentage") {
    return numericVariants(claim.claim).some((variant) =>
      support.includes(variant),
    );
  }
  return support.includes(normalize(claim.claim));
}

function sourceIdsForClaim(answer: AvaAnswerPacket, claim: string): string[] {
  const needle = normalize(claim);
  return answer.citations
    .filter((citation) =>
      normalize(`${citation.label} ${citation.excerpt ?? ""}`).includes(
        needle,
      ),
    )
    .map((citation) => citation.id);
}

function localClaimContext(text: string, claim: string): string {
  const index = normalize(text).indexOf(normalize(claim));
  if (index < 0) return text.slice(0, 240);
  const start = Math.max(0, index - 160);
  const end = Math.min(text.length, index + claim.length + 160);
  return text.slice(start, end);
}

function isSafeUnsupportedClaimContext(context: string): boolean {
  return SAFE_UNSUPPORTED_CONTEXT_RE.test(context);
}

export function validateAvaAnswerClaims(
  answer: AvaAnswerPacket,
): AvaClaimValidationReport {
  const text = visibleText(answer);
  const support = sourceText(answer);
  const claims = extractClaims(text);
  const findings: AvaClaimValidationFinding[] = claims.map((claim, index) => {
    const supported = claimHasSupport(claim, support);
    const sourceIds = sourceIdsForClaim(answer, claim.claim);
    const context = localClaimContext(text, claim.claim);
    const safeUnsupportedContext = isSafeUnsupportedClaimContext(context);
    const sourceAsserted =
      ASSERTS_SOURCE_RE.test(context) && !safeUnsupportedContext;
    const severity = supported ? "pass" : sourceAsserted ? "fail" : "watch";
    return {
      id: `claim-${index + 1}`,
      type: claim.type,
      claim: claim.claim,
      support: supported
        ? "exact_source_fact"
        : safeUnsupportedContext
          ? "caveated_gap"
        : sourceAsserted
          ? "unsupported"
          : "assumption",
      severity: safeUnsupportedContext ? "pass" : severity,
      sourceIds,
      detail: supported
        ? "Claim appears in the answer packet support material."
        : safeUnsupportedContext
          ? "Claim is framed as missing, unavailable, or unproven rather than asserted as tenant fact."
        : sourceAsserted
          ? "Claim is presented with source/evidence language but is not present in packet support material."
          : "Claim is not traceable inside the packet and should stay caveated as an assumption.",
    };
  });

  for (const violation of checkCapabilityClaims(text, answer.tenantKey)) {
    findings.push({
      id: `capability-${findings.length + 1}`,
      type: "product_capability",
      claim: violation.matchedText,
      support: "unsupported",
      severity: "fail",
      sourceIds: [],
      detail: violation.detail,
    });
  }

  const unsupportedMaterialClaims = findings.filter(
    (finding) => finding.severity === "fail",
  ).length;
  const productCapabilityViolations = findings.filter(
    (finding) =>
      finding.type === "product_capability" && finding.severity === "fail",
  ).length;

  return {
    passed: unsupportedMaterialClaims === 0,
    findings,
    unsupportedMaterialClaims,
    productCapabilityViolations,
  };
}
