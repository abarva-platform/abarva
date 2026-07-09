import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerClaims } from "@/lib/ava-answer/claim-source-validation";
import { assertRetrievalPolicy } from "@/lib/ava-answer/retrievalPolicy";
import { evaluateCxoAnswerQuality } from "@/lib/ava-answer/cxo-quality-gate";

export interface AvaAnswerValidationViolation {
  code: string;
  severity: "error" | "warning";
  message: string;
  field?: string;
}

export interface AvaAnswerValidationResult {
  passed: boolean;
  violations: AvaAnswerValidationViolation[];
  packet: AvaAnswerPacket;
}

const FORBIDDEN_RE =
  /\b(Read:|Evidence:|Evidence points|Current-state read|pattern family|P11|local env|read path|route used|runtime unavailable|source_record_id|read-model|home_know_lookup|debug|scaffold|Wave 0|Wave-0)\b/i;
const RAW_UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const RAW_TABLE_RE =
  /\b(?:enterprise_context|semantic2|source_event|ai_control|operational_evidence|mv_home)_[a-z0-9_]+\b/i;
const ROW_COUNT_LEAD_RE =
  /^\s*(?:there are|i found|home found|found|the response uses)\s+\d+[\w\s().,-]*(?:row|record|evidence point|source point)s?\b/i;
const DORA_HOME_RE = /\bDORA\b/i;

const PUBLIC_FIELDS = [
  "directAnswer",
  "interpretation",
  "businessImplication",
  "recommendation",
] as const;

export function validateAvaAnswerPacket(
  packet: AvaAnswerPacket,
): AvaAnswerValidationResult {
  const violations: AvaAnswerValidationViolation[] = [];
  const cxoQuality = evaluateCxoAnswerQuality(packet);
  const claimValidation = validateAvaAnswerClaims(packet);

  for (const field of PUBLIC_FIELDS) {
    const value = packet[field];
    if (!value) continue;
    collectLanguageViolations(value, field, violations);
  }

  if (packet.surface === "home") {
    if (packet.recommendation) {
      violations.push({
        code: "home-recommendation-forbidden",
        severity: "error",
        message: "Home cannot render strategic recommendations.",
        field: "recommendation",
      });
    }
    if ((packet.expertsUsed?.length ?? 0) > 0) {
      violations.push({
        code: "home-experts-forbidden",
        severity: "error",
        message: "Home cannot expose expert-pack participation.",
        field: "expertsUsed",
      });
    }
    if (
      DORA_HOME_RE.test(packet.directAnswer) &&
      !DORA_HOME_RE.test(packet.question)
    ) {
      violations.push({
        code: "home-dora-unrequested",
        severity: "error",
        message:
          "Home cannot introduce DORA unless the user asked for loaded DORA facts.",
        field: "directAnswer",
      });
    }
  }

  if (packet.status !== "blocked" && !packet.directAnswer.trim()) {
    violations.push({
      code: "missing-direct-answer",
      severity: "error",
      message: "Ava answers need a direct answer before proof.",
      field: "directAnswer",
    });
  }
  if (
    (packet.status === "partial" || packet.status === "no_data") &&
    packet.gaps.length === 0
  ) {
    violations.push({
      code: "missing-gap-for-thin-answer",
      severity: "error",
      message: "Partial and no-data answers must name the missing input.",
      field: "gaps",
    });
  }
  if (
    packet.surface === "home" &&
    packet.status !== "blocked" &&
    packet.status !== "handoff" &&
    !packet.interpretation?.trim()
  ) {
    violations.push({
      code: "missing-home-interpretation",
      severity: "warning",
      message: "Home answers should include a plain-English interpretation.",
      field: "interpretation",
    });
  }

  for (const message of assertRetrievalPolicy({
    surface: packet.surface,
    mode: packet.mode,
    corpusUsed: packet.corpusUsed,
    expertsUsed: packet.expertsUsed,
  })) {
    violations.push({
      code: "retrieval-policy",
      severity: "error",
      message,
    });
  }

  for (const finding of cxoQuality.findings) {
    violations.push({
      code: `cxo-${finding.code}`,
      severity: finding.severity,
      message: finding.message,
      field: finding.field,
    });
  }

  for (const finding of claimValidation.findings) {
    if (finding.severity === "pass") continue;
    violations.push({
      code: `claim-${finding.type}`,
      severity: finding.severity === "fail" ? "error" : "warning",
      message: `${finding.claim}: ${finding.detail}`,
      field: "directAnswer",
    });
  }

  const errorCount = violations.filter(
    (violation) => violation.severity === "error",
  ).length;
  return {
    passed: errorCount === 0,
    violations,
    packet: {
      ...packet,
      quality: {
        ...packet.quality,
        cxo: cxoQuality,
        claimValidation,
      },
      safety: {
        ...packet.safety,
        forbiddenLanguagePassed:
          errorCount === 0 &&
          violations.every(
            (violation) => violation.code !== "forbidden-language",
          ),
        rawIdsSuppressed:
          !RAW_UUID_RE.test(packet.directAnswer) &&
          !RAW_UUID_RE.test(packet.interpretation ?? "") &&
          !RAW_UUID_RE.test(packet.businessImplication ?? ""),
        unsupportedClaimsBlocked:
          errorCount === 0 && claimValidation.unsupportedMaterialClaims === 0,
      },
    },
  };
}

function collectLanguageViolations(
  value: string,
  field: string,
  violations: AvaAnswerValidationViolation[],
) {
  if (FORBIDDEN_RE.test(value)) {
    violations.push({
      code: "forbidden-language",
      severity: "error",
      message: "Answer contains internal or mechanical language.",
      field,
    });
  }
  if (RAW_UUID_RE.test(value)) {
    violations.push({
      code: "raw-uuid",
      severity: "error",
      message: "Answer contains a raw UUID.",
      field,
    });
  }
  if (RAW_TABLE_RE.test(value)) {
    violations.push({
      code: "raw-table-name",
      severity: "error",
      message: "Answer contains a raw table/view name.",
      field,
    });
  }
  if (ROW_COUNT_LEAD_RE.test(value)) {
    violations.push({
      code: "row-count-first",
      severity: "error",
      message: "Answer leads with a data-load count instead of meaning.",
      field,
    });
  }
}
