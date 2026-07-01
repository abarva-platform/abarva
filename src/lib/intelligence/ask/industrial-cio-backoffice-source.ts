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

export function buildIndustrialCioBackofficeNativeCanvasBlock(
  query: string,
  tenantKeys: Array<string | null | undefined>,
): string {
  if (
    !tenantKeys.some(isIndustrialTenantKey) ||
    !isIndustrialCioBackofficeQuestion(query)
  ) {
    return "";
  }
  const packet = buildIndustrialCioBackofficePacket();
  const [treasury, finance, serviceDesk, hrLegal] = packet.lighthouseUseCases;
  const canvasIntent = industrialCanvasIntent(query);
  if (canvasIntent === "valueReadinessMatrix") {
    return wrapIndustrialCanvasPayload({
      canvasType: "valueReadinessMatrix",
      title: "Shared Services AI Value / Readiness Map — Industrial Demo",
      items: [
        {
          label: treasury?.name ?? "Kyriba cash and payment-control proof",
          value: 9,
          readiness: 7,
          risk: 7,
          action: "Scale after control gates close",
          owner: "Treasurer + CFO",
          gate: "Critical-bank certification and SOX signer evidence complete",
          note:
            treasury?.why ??
            "Treasury has the strongest loaded system, control, and value evidence.",
        },
        {
          label: finance?.name ?? "Finance close and reporting semantic layer",
          value: 8,
          readiness: 6,
          risk: 6,
          action: "Certify then scale",
          owner: "Controller + CFO",
          gate: "Finance-approved close baseline and GL definitions",
          note:
            finance?.why ??
            "Finance automation depends on certified reporting definitions.",
        },
        {
          label:
            serviceDesk?.name ??
            "ServiceNow finance support and knowledge automation",
          value: 6,
          readiness: 6,
          risk: 4,
          action: "Expand pilot after evidence",
          owner: "VP IT Operations",
          gate: "Ticket-volume baseline and resolution-quality evidence",
          note:
            serviceDesk?.why ??
            "Support automation needs service-volume and knowledge-quality proof.",
        },
        {
          label: hrLegal?.name ?? "HR and Legal AI operating model discovery",
          value: 5,
          readiness: 2,
          risk: 4,
          action: "Hold for discovery",
          owner: "CHRO + General Counsel",
          gate: "Workday, CLM/eBilling, matter, policy, and service-volume evidence loaded",
          note:
            hrLegal?.why ??
            "HR and Legal belong in the roadmap after source evidence is loaded.",
        },
      ],
      proofBoundary: {
        known: [
          "Treasury and Finance have the strongest loaded Industrial Demo evidence.",
          "HR and Legal do not yet have enough source evidence for scale claims.",
        ],
        missing: packet.missingEvidenceChecklist.slice(0, 3),
        decisionRequired:
          "Use the map to pick Phase 1 scale candidates and assign evidence owners for HR/Legal discovery.",
      },
    });
  }
  if (canvasIntent === "gateToValueRoadmap") {
    return wrapIndustrialCanvasPayload({
      canvasType: "gateToValueRoadmap",
      title: "Shared Services AI Gate-to-Value Roadmap — Industrial Demo",
      gates: [
        {
          label: "Close Treasury control evidence",
          owner: "Treasurer + CFO",
          dependency:
            "Critical-bank certification, payment-format evidence, signer controls, and SOX support",
          valueUnlocked:
            "Kyriba and cash-visibility automation becomes board-ready",
          status: "Gate 1",
        },
        {
          label: "Certify Finance semantic ownership",
          owner: "Controller + CFO",
          dependency:
            "Close baseline, GL definitions, AP/AR feed quality, and reporting ownership",
          valueUnlocked:
            "Finance close and reporting AI can move from pilot to scale",
          status: "Gate 2",
        },
        {
          label: "Prove support automation quality",
          owner: "VP IT Operations",
          dependency:
            "Ticket-volume baseline, deflection quality, knowledge ownership, and escalation rules",
          valueUnlocked: "Shared-services automation pattern can be reused",
          status: "Gate 3",
        },
        {
          label: "Load HR and Legal evidence",
          owner: "CHRO + General Counsel",
          dependency:
            "Workday process volumes, CLM/eBilling evidence, matter taxonomy, policy corpus, and service demand",
          valueUnlocked:
            "HR and Legal become candidates for the next Value Office wave",
          status: "Discovery",
        },
      ],
      proofBoundary: {
        known: [
          "Treasury and Finance are the Phase 1 proof areas in the loaded Industrial Demo packet.",
          "The operating model should not scale claims without function-owner signoff.",
        ],
        missing: packet.missingEvidenceChecklist.slice(0, 4),
        decisionRequired:
          "CIO and CFO name gate owners and approve the first 30-day evidence sprint.",
      },
    });
  }
  if (canvasIntent === "proofBoundary") {
    return wrapIndustrialCanvasPayload({
      canvasType: "proofBoundary",
      title: "Shared Services AI Proof Boundary — Industrial Demo",
      proofBoundary: {
        known: [
          "Treasury and Finance carry the strongest loaded source evidence.",
          "The Value Office should distinguish evidence-backed claims from planning assumptions.",
        ],
        assumed: packet.planningAssumptions.slice(0, 3),
        missing: packet.missingEvidenceChecklist.slice(0, 5),
        decisionRequired:
          "Ask the CIO/CFO whether to use planning assumptions now or collect signed-off current values first.",
      },
    });
  }
  const payload = {
    canvasType: "investmentSequencingMap",
    title: "CIO AI & Automation Sequencing — Industrial Demo",
    columns: [
      {
        label: "Scale now",
        items: [
          {
            label: treasury?.name ?? "Kyriba cash and payment-control proof",
            value: 9,
            readiness: 7,
            risk: 7,
            action: "Close control evidence gates, then scale as Phase 1",
            owner: "Treasurer + CFO",
            gate: "Critical-bank certification and SOX signer evidence complete",
            note:
              treasury?.why ??
              "Treasury has the strongest loaded system, control, and value evidence.",
          },
        ],
      },
      {
        label: "Certify then scale",
        items: [
          {
            label:
              finance?.name ?? "Finance close and reporting semantic layer",
            value: 8,
            readiness: 6,
            risk: 6,
            action:
              "Fund semantic ownership and certification before broad AI scale",
            owner: "Controller + CFO",
            gate: "Finance-approved close baseline and GL definitions",
            note:
              finance?.why ??
              "Finance automation depends on certified reporting definitions.",
          },
          {
            label:
              serviceDesk?.name ??
              "ServiceNow finance support and knowledge automation",
            value: 6,
            readiness: 6,
            risk: 4,
            action:
              "Expand pilot after deflection and quality metrics are certified",
            owner: "VP IT Operations",
            gate: "Ticket-volume baseline and resolution-quality evidence",
            note:
              serviceDesk?.why ??
              "Support automation needs service-volume and knowledge-quality proof.",
          },
        ],
      },
      {
        label: "Fund readiness",
        items: [
          {
            label: "Liquidity forecasting and working-capital analytics",
            value: 8,
            readiness: 4,
            risk: 6,
            action:
              "Sequence after cash, AP/AR, S&OP, and GL data products are certified",
            owner: "CFO",
            gate: "Cash positioning gold table plus AP/AR and S&OP readiness",
            note: "Use Finance/Treasury data-product certification as the reusable Value Office pattern.",
          },
        ],
      },
      {
        label: "Hold / discovery",
        items: [
          {
            label: hrLegal?.name ?? "HR and Legal AI operating model discovery",
            value: 5,
            readiness: 2,
            risk: 4,
            action: "Open discovery; do not claim scale readiness yet",
            owner: "CHRO + General Counsel",
            gate: "Workday, CLM/eBilling, matter, policy, and service-volume evidence loaded",
            note:
              hrLegal?.why ??
              "HR and Legal belong in the roadmap after source evidence is loaded.",
          },
        ],
      },
    ],
    proofBoundary: {
      known: [
        "Treasury and Finance have the strongest loaded Industrial Demo evidence.",
        "The Value Office pattern should prove Finance-attested outcomes before broad reuse.",
      ],
      missing: packet.missingEvidenceChecklist.slice(0, 3),
      decisionRequired:
        "CIO and CFO approve Treasury + Finance as Phase 1 and designate HR/Legal as discovery branches until source evidence is signed off.",
    },
  };
  return wrapIndustrialCanvasPayload(payload);
}

function industrialCanvasIntent(
  query: string,
):
  | "investmentSequencingMap"
  | "valueReadinessMatrix"
  | "gateToValueRoadmap"
  | "proofBoundary" {
  if (
    /\b(?:what\s+has\s+to\s+happen\s+first|before|prerequisite|dependency|gate|roadmap|unlock)\b/i.test(
      query,
    )
  ) {
    return "gateToValueRoadmap";
  }
  if (
    /\b(?:portfolio|tradeoff|trade-off|value\s*(?:\/|vs\.?|versus)\s*readiness|readiness|high\s+value|not\s+ready)\b/i.test(
      query,
    )
  ) {
    return "valueReadinessMatrix";
  }
  if (
    /\b(?:trust|governance|proof|evidence\s+quality|assumption|missing|signoff|sign-off|validate|validated)\b/i.test(
      query,
    )
  ) {
    return "proofBoundary";
  }
  return "investmentSequencingMap";
}

function wrapIndustrialCanvasPayload(payload: object): string {
  return ["```abarva-canvas", JSON.stringify(payload), "```"].join("\n");
}
