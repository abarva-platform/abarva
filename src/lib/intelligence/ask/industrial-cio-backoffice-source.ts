import {
  buildIndustrialCioBackofficePacket,
  type ClaimMaturityEntry,
  type IndustrialCioBackofficePacket,
  type LighthouseUseCase,
} from "@/lib/intelligence/industrial-cio-backoffice-readiness";
import type { AskSource } from "./types";

const INDUSTRIAL_KEYS = new Set([
  "lakeshore",
  "lakeshore-industries",
  "lakeshore holdings",
  "industrial-demo",
  "industrial demo",
  "morgan street",
  "morganstreet",
]);

const INDUSTRIAL_BACKOFFICE_TERMS = [
  /\bmorgan\s+street\b/i,
  /\bvalue\s+office\b/i,
  /\binnovation\s+office\b/i,
  /\bai\s+enablement\b/i,
  /\bshared\s+services\b/i,
  /\bback[-\s]?office\b/i,
  /\bprocess\s+(?:transformation|redesign|reengineering)\b/i,
  /\btreasury\b/i,
  /\bkyriba\b/i,
  /\bfinance\b/i,
  /\bfp&a\b/i,
  /\bcontroller\b/i,
  /\bclose\b/i,
  /\bpayments?\b/i,
  /\bbank\s+connectivity\b/i,
  /\bsox\b/i,
  /\bservicenow\b/i,
  /\bworkday\b/i,
  /\bhr\b/i,
  /\blegal\b/i,
  /\bcontract\b/i,
  /\bcopilot\b/i,
  /\bautomation\b/i,
  /\bcio\b/i,
  /\bvp,\s*innovation\b/i,
];

function normalizeTenantKey(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isIndustrialTenantKey(
  value: string | null | undefined,
): boolean {
  const normalized = normalizeTenantKey(value);
  if (INDUSTRIAL_KEYS.has(normalized)) return true;
  return (
    normalized.includes("lakeshore") || normalized.includes("industrial demo")
  );
}

export function isIndustrialCioBackofficeQuestion(query: string): boolean {
  const normalized = String(query ?? "").trim();
  if (!normalized) return false;
  return INDUSTRIAL_BACKOFFICE_TERMS.some((term) => term.test(normalized));
}

function listValues(
  rows: Array<Record<string, string>>,
  key: string,
  limit: number,
): string {
  return rows
    .map((row) => row[key])
    .filter(Boolean)
    .slice(0, limit)
    .join("; ");
}

function formatClaimMaturity(claims: ClaimMaturityEntry[]): string {
  return claims
    .map(
      (claim) =>
        `- ${claim.statement} Confidence: ${claim.confidence}. Signoff required: ${claim.signoffRequired ? "yes" : "no"}. Basis: ${claim.basis}`,
    )
    .join("\n");
}

function formatLighthouse(useCases: LighthouseUseCase[]): string {
  return useCases
    .map(
      (item) =>
        `- ${item.name} (${item.function}): ${item.posture.replace(/_/g, " ")}. Why: ${item.why} Evidence: ${item.tenantEvidence.join("; ") || "not shown in loaded sources"}. Missing to scale: ${item.missingToScale.join("; ")}`,
    )
    .join("\n");
}

export function formatIndustrialCioBackofficeSourceDetail(
  packet: IndustrialCioBackofficePacket,
): string {
  return [
    "Industrial Demo CIO / Morgan Street Value Office context for Shared Services AI, automation, and process transformation.",
    "",
    `Recommended decision posture: ${packet.decision.replace(/_/g, " ")}.`,
    `Morgan Street goal: ${packet.morganStreetGoal}`,
    `Value mechanism: ${packet.valueMechanism}`,
    "",
    "Known Industrial Demo context:",
    `- Back-office functions: ${listValues(packet.functions, "function_name", 10)}.`,
    `- Owner roles: ${listValues(packet.ownership, "leader_role", 10)}.`,
    `- Relevant systems: ${listValues(packet.systems, "system_name", 10)}.`,
    `- Data assets and integrations: ${listValues(packet.dataAssets, "data_asset_name", 10)}.`,
    `- Programs: ${listValues(packet.programs, "record_name", 10)}.`,
    `- AI and automation initiatives: ${listValues(packet.aiInitiatives, "use_case", 10)}.`,
    `- Risks and controls: ${listValues(packet.risksControls, "record_name", 10)}.`,
    `- Metrics: ${listValues(packet.metrics, "metric_name", 10)}.`,
    "",
    "Lighthouse use cases:",
    formatLighthouse(packet.lighthouseUseCases),
    "",
    "Missing evidence to make claims board-grade:",
    packet.missingEvidenceChecklist.map((item) => `- ${item}`).join("\n"),
    "",
    "Planning assumptions allowed only when clearly labeled:",
    packet.planningAssumptions.map((item) => `- ${item}`).join("\n"),
    "",
    "Claim maturity:",
    formatClaimMaturity(packet.claimMaturity),
  ].join("\n");
}

export function buildIndustrialCioBackofficeSource(
  query: string,
  tenantKeys: Array<string | null | undefined>,
): AskSource | null {
  if (!tenantKeys.some(isIndustrialTenantKey)) return null;
  if (!isIndustrialCioBackofficeQuestion(query)) return null;
  const packet = buildIndustrialCioBackofficePacket();
  return {
    type: "TENANT",
    id: "industrial-cio-backoffice-readiness",
    name: "Industrial Demo CIO Shared Services value-office context",
    detail: formatIndustrialCioBackofficeSourceDetail(packet),
    confidence: 0.91,
  };
}

export function buildIndustrialCioBackofficePromptAddendum(
  query: string,
  tenantKeys: Array<string | null | undefined>,
): string {
  if (
    !tenantKeys.some(isIndustrialTenantKey) ||
    !isIndustrialCioBackofficeQuestion(query)
  )
    return "";
  return [
    "INDUSTRIAL CIO / MORGAN STREET DEMO MODE:",
    "For Industrial Demo or Morgan Street questions about Shared Services, Finance, Treasury, HR, Legal, process transformation, AI enablement, automation, and the Value Office, act as a senior CIO transformation advisor.",
    "The user-visible advisor identity is aVa. Do not mention Sentinel or other legacy agent names.",
    "Lead with a direct point of view. Make the distinction between loaded Industrial Demo evidence, Morgan Street value-office framing, planning assumptions, industry/pattern context, and client-signoff-required claims in natural executive language.",
    "Use Treasury and Finance as the Phase 1 proof unless the user asks to explore HR or Legal. Explain that HR and Legal need source evidence before scale recommendations.",
    "Do not invent exact ROI, current cycle time, headcount reduction, dates, legal obligations, HR volumes, contract counts, or finance-approved value. If precision is missing, ask for values or permission to use planning assumptions.",
    "When useful, author right-canvas tabs using the current marker grammar: Decision, Industry Insights, Chart, Table, and Evidence. Put any governed native exhibit in the most relevant tab using the abarva-canvas fenced JSON contract; do not output raw JSON outside the fenced block and do not write HTML.",
    "Canvas selection for the Morgan Street demo: funding or prioritization questions should use investmentSequencingMap; portfolio tradeoff questions should use valueReadinessMatrix; 'what has to happen first' or dependency questions should use gateToValueRoadmap; trust, governance, signoff, or missing-evidence questions should use proofBoundary.",
    "For sequencing or matrix exhibits, include initiative owner and gate when known: CFO/Treasurer for Treasury and Kyriba evidence, Controller/Finance Ops for close and reporting evidence, CHRO or General Counsel only as discovery owners until HR/Legal source evidence is loaded.",
    "End with a branch choice only when it helps the user continue: use planning assumptions, enter current values, start Treasury + Finance, add HR/Legal discovery, or create the office blueprint.",
  ].join("\n");
}
