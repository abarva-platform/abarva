import {
  buildSkyHarborCtoReadinessPacket,
  type ClaimMaturityEntry,
  type SkyHarborCtoReadinessPacket,
} from "@/lib/intelligence/skyharbor-cto-readiness";
import type { AskSource } from "./types";

const SKYHARBOR_KEYS = new Set([
  "skyharbor",
  "skyharbor-air",
  "skyharbor-air-group",
  "skyharbor air",
  "skyharbor air group",
  "airline-demo",
  "airline demo",
  "airline demo group",
]);

const CTO_READINESS_TERMS = [
  /\birops\b/i,
  /\birregular\s+ops\b/i,
  /\bdisruption\b/i,
  /\brecovery\b/i,
  /\bcrew\b/i,
  /\bpnr\b/i,
  /\bpassenger\s+re-?accommodation\b/i,
  /\bagentic\b/i,
  /\bautonomous\b/i,
  /\bcto\b/i,
  /\bai\s+(?:readiness|investment|investments|scale|portfolio|initiative|initiatives)\b/i,
  /\bmodel[-\s]?risk\b/i,
  /\bdata\s+(?:readiness|freshness|lineage|certification|certified)\b/i,
  /\bdata[-\s]?thin\b/i,
  /\bboard[-\s]?grade\b/i,
  /\bboard[-\s]?ready\b/i,
  /\bboard\s+decision\b/i,
  /\bboard\s+guidance\b/i,
  /\bevidence\s+gaps?\b/i,
  /\bbefore\s+(?:a\s+)?board\b/i,
];

function normalizeTenantKey(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isSkyHarborTenantKey(
  value: string | null | undefined,
): boolean {
  const normalized = normalizeTenantKey(value);
  return (
    SKYHARBOR_KEYS.has(normalized) ||
    normalized.includes("skyharbor") ||
    normalized.includes("airline demo")
  );
}

export function isSkyHarborCtoReadinessQuestion(query: string): boolean {
  const normalized = String(query ?? "").trim();
  if (!normalized) return false;
  return CTO_READINESS_TERMS.some((term) => term.test(normalized));
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

export function formatSkyHarborCtoReadinessSourceDetail(
  packet: SkyHarborCtoReadinessPacket,
): string {
  return [
    "Airline Demo CTO readiness context for IROPS, disruption recovery, and agentic AI scaling.",
    "",
    `Recommended decision posture: ${packet.decision.replace(/_/g, " ")}.`,
    `Value mechanism: ${packet.valueMechanism}`,
    "",
    "Known Airline Demo context:",
    `- IROPS-critical systems: ${listValues(packet.systems, "system_name", 8)}.`,
    `- Critical data assets and integrations: ${listValues(packet.dataAssets, "data_asset_name", 10)}.`,
    `- AI initiatives: ${listValues(packet.aiInitiatives, "use_case", 8)}.`,
    `- Modernization programs: ${listValues(packet.programs, "record_name", 8)}.`,
    `- Open risks and controls: ${listValues(packet.risksControls, "risk_or_control", 8)}.`,
    "",
    "Board decision readiness spine:",
    "- Finance baseline: disruption-cost baseline and realized-value proof are required before board-grade value claims.",
    "- Data certification: crew legality, PNR/reservation events, flight status, operational event store, and recovery history need owner-signed freshness and lineage.",
    "- Control evidence: model-risk tiering, human-in-loop workflow, override logs, and accountable control owners must be explicit.",
    "- Vendor/system linkage: critical platform support, SLAs, and integration dependencies must be tied to the IROPS operating path.",
    "- Adoption/value proof: usage, decision latency, override rate, and realized operational value need measured evidence.",
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

export function buildSkyHarborCtoReadinessSource(
  query: string,
  tenantKeys: Array<string | null | undefined>,
): AskSource | null {
  if (!tenantKeys.some(isSkyHarborTenantKey)) return null;
  if (!isSkyHarborCtoReadinessQuestion(query)) return null;
  const packet = buildSkyHarborCtoReadinessPacket();
  return {
    type: "TENANT",
    id: "skyharbor-cto-readiness",
    name: "Airline Demo CTO IROPS readiness context",
    detail: formatSkyHarborCtoReadinessSourceDetail(packet),
    confidence: 0.92,
  };
}

export function buildSkyHarborCtoReadinessPromptAddendum(
  query: string,
  tenantKeys: Array<string | null | undefined>,
): string {
  if (
    !tenantKeys.some(isSkyHarborTenantKey) ||
    !isSkyHarborCtoReadinessQuestion(query)
  )
    return "";
  return [
    "AIRLINE DEMO CTO DEMO MODE:",
    "Visible tenant display name: Airline Demo.",
    'Start the first user-visible sentence with exactly "Airline Demo".',
    'Use "Airline Demo" for the tenant in user-visible prose. Do not use "SkyHarbor", "SkyHarbor Air", or other legacy customer names in visible output.',
    "For Airline Demo IROPS, disruption recovery, AI investment, autonomous recovery, data-readiness, and board-grade questions, act as a senior airline CTO advisor.",
    "The user-visible advisor identity is aVa. Do not mention Sentinel or other legacy agent names.",
    "Lead with a direct point of view. Make the distinction between known SkyHarbor context, planning assumptions, industry context, and client-signoff-required claims in natural executive language.",
    "Do not claim exact ROI or board-grade value unless Finance-approved value is provided. If precision is missing, ask for values or permission to use planning assumptions.",
    "Author all right-canvas tabs using the current marker grammar: Decision, Industry Insights, Chart, Table, and Evidence. Put the governed native exhibit in the Chart tab using the abarva-canvas fenced JSON contract; do not output raw JSON outside the fenced block and do not write HTML.",
    "Canvas selection for the Airline Demo CTO demo: funding, hold/scale, or prioritization questions should use executive-canvas-sequencing; portfolio tradeoff questions should use value-readiness-matrix; 'what has to happen first' or dependency questions should use gate-to-value-roadmap; trust, governance, signoff, or missing-evidence questions should use proof-boundary-card.",
    "For sequencing or matrix exhibits, include initiative owner and gate when known: EVP Operations for IROPS/OCC workflow, VP Crew Operations for crew recovery, VP Data Platforms for event-store and data certification, VP Digital Products for passenger recovery, and AI Governance Lead for model-risk gates.",
    "End with a branch choice only when it helps the user continue: use planning assumptions, enter missing values, generate the evidence checklist, continue readiness-only, or ask the accountable owner for evidence.",
  ].join("\n");
}

export function buildSkyHarborCtoReadinessNativeCanvasBlock(
  query: string,
  tenantKeys: Array<string | null | undefined>,
): string {
  if (
    !tenantKeys.some(isSkyHarborTenantKey) ||
    !isSkyHarborCtoReadinessQuestion(query)
  ) {
    return "";
  }
  const packet = buildSkyHarborCtoReadinessPacket();
  const canvasIntent = skyHarborCanvasIntent(query);
  if (canvasIntent === "value-readiness-matrix") {
    return wrapSkyHarborCanvasPayload({
      canvasType: "value-readiness-matrix",
      title: "AI Portfolio Value / Readiness Map — Airline Demo",
      items: [
        {
          label: "Flight Delay Root-Cause Assistant",
          value: 6,
          readiness: 8,
          risk: 3,
          action: "Scale with measurement",
          owner: "EVP Operations",
          gate: "Analyst adoption and correction-rate evidence",
          note: "Production internal use; measure decision quality before claiming enterprise value.",
        },
        {
          label: "Airport Turn Risk Predictor",
          value: 8,
          readiness: 6,
          risk: 5,
          action: "Scale station-by-station after gate-event certification",
          owner: "VP Airport Operations Technology",
          gate: "Top-hub station event automation and lineage",
          note: "Useful adjacent signal for IROPS recovery, but station variance still matters.",
        },
        {
          label: "Crew Recovery Copilot",
          value: 9,
          readiness: 5,
          risk: 8,
          action: "Certify then scale",
          owner: "VP Crew Operations",
          gate: "Crew legality and availability feeds certified under disruption load",
          note: "High-value operating lever, but legality and model-risk gates block autonomy.",
        },
        {
          label: "IROPS Decision Assistant",
          value: 10,
          readiness: 4,
          risk: 8,
          action: "Fund readiness before autonomous scale",
          owner: "EVP Operations + VP Data Platforms",
          gate: "Event-store coverage, model-risk tier, HITL workflow, Finance baseline",
          note: "Highest strategic value, but not board-grade until data/control evidence closes.",
        },
        {
          label: "Passenger Reaccommodation Agent",
          value: 8,
          readiness: 4,
          risk: 7,
          action: "Hold customer-facing autonomy",
          owner: "VP Digital Products",
          gate: "PNR latency, consent, privacy, and DOT communication controls",
          note: "Keep offer generation human-in-loop until customer-impact controls pass.",
        },
      ],
      proofBoundary: {
        known: [
          "The CTO packet includes IROPS-critical systems, data assets, AI initiatives, programs, and open controls.",
          "Crew legality, PNR events, event-store lineage, and model-risk gates are explicit blockers.",
        ],
        missing: packet.missingEvidenceChecklist.slice(0, 4),
        decisionRequired:
          "Use the matrix to decide which AI bets can scale now versus which require data/control certification first.",
      },
    });
  }
  if (canvasIntent === "gate-to-value-roadmap") {
    return wrapSkyHarborCanvasPayload({
      canvasType: "gate-to-value-roadmap",
      title: "IROPS AI Gate-to-Value Roadmap — Airline Demo",
      gates: [
        {
          label: "Approve disruption value baseline",
          owner: "CFO delegate + EVP Operations",
          dependency:
            "Finance-approved cost baseline by disruption event category",
          valueUnlocked:
            "Board-grade value claims for IROPS, crew, and passenger recovery",
          status: "Gate 1",
        },
        {
          label: "Certify operational data products",
          owner: "VP Data Platforms",
          dependency:
            "Crew legality, PNR events, flight status, event-store lineage, and recovery history freshness",
          valueUnlocked:
            "Recovery recommendations can be trusted during disruption load",
          status: "Gate 2",
        },
        {
          label: "Close model-risk and HITL controls",
          owner: "AI Governance Lead + EVP Operations",
          dependency:
            "Model-risk tier, validation standard, approver workflow, override logs, and accountable control owner",
          valueUnlocked:
            "Crew and IROPS copilots can move beyond advisory-only pilots",
          status: "Gate 3",
        },
        {
          label: "Approve customer-impact controls",
          owner: "VP Digital Products + Chief Compliance Officer",
          dependency:
            "PNR latency, consent, privacy, DOT communication boundaries, and customer message templates",
          valueUnlocked:
            "Passenger recovery and disruption communications can expand safely",
          status: "Gate 4",
        },
      ],
      proofBoundary: {
        known: [
          "The loaded packet identifies data, model-risk, HITL, and customer-impact gates.",
          "Autonomous scale should wait until operational controls are signed off.",
        ],
        missing: packet.missingEvidenceChecklist.slice(0, 5),
        decisionRequired:
          "CTO, CDAO, EVP Operations, and CFO approve a 30-day certification sprint before releasing autonomous AI capital.",
      },
    });
  }
  if (canvasIntent === "proof-boundary-card") {
    return wrapSkyHarborCanvasPayload({
      canvasType: "proof-boundary-card",
      title: "IROPS AI Proof Boundary — Airline Demo",
      proofBoundary: {
        known: [
          "The V6 CTO packet contains IROPS systems, data assets, AI initiatives, modernization programs, and risk/control rows.",
          "Current answer can be strong on readiness posture and gates.",
        ],
        assumed: packet.planningAssumptions.slice(0, 3),
        missing: packet.missingEvidenceChecklist.slice(0, 6),
        decisionRequired:
          "Ask whether to use planning assumptions for the demo, collect signed-off values first, or keep the answer readiness-only.",
      },
    });
  }
  return wrapSkyHarborCanvasPayload({
    canvasType: "executive-canvas-sequencing",
    title: "AI Investment Sequencing — Airline Demo",
    lanes: [
      {
        label: "Scale now",
        items: [
          {
            label: "Flight Delay Root-Cause Assistant",
            value: 6,
            readiness: 8,
            risk: 3,
            action: "Scale internal use with measurement",
            owner: "EVP Operations",
            gate: "Adoption and correction-rate evidence",
            note: "Production internal assistant; keep value claims tied to measured analyst adoption.",
          },
          {
            label: "Baggage Recovery Prediction",
            value: 5,
            readiness: 7,
            risk: 4,
            action: "Scale limited internal triage",
            owner: "VP Airport Operations Technology",
            gate: "Station coverage review",
            note: "Useful for bag-risk-aware recovery, not the primary IROPS value pool.",
          },
        ],
      },
      {
        label: "Certify then scale",
        items: [
          {
            label: "Crew Recovery Copilot",
            value: 9,
            readiness: 5,
            risk: 8,
            action: "Certify legality and availability feeds first",
            owner: "VP Crew Operations",
            gate: "Crew legality freshness, availability freshness, model-risk approval",
            note: "Do not cross into autonomous crew decisions until hard control gates close.",
          },
          {
            label: "Airport Turn Risk Predictor",
            value: 8,
            readiness: 6,
            risk: 5,
            action: "Scale after station event automation",
            owner: "VP Airport Operations Technology",
            gate: "Top-hub turn-event lineage and station adoption",
            note: "Good readiness candidate once station variance is reduced.",
          },
        ],
      },
      {
        label: "Fund readiness",
        items: [
          {
            label: "IROPS Decision Assistant",
            value: 10,
            readiness: 4,
            risk: 8,
            action: "Fund data/control readiness before autonomous scale",
            owner: "EVP Operations + VP Data Platforms",
            gate: "Event-store certification, HITL workflow, model-risk tier, Finance baseline",
            note: "Highest strategic lever; make the readiness sprint the capital decision.",
          },
          {
            label: "Passenger Reaccommodation Agent",
            value: 8,
            readiness: 4,
            risk: 7,
            action: "Fund PNR/consent readiness; keep human-in-loop",
            owner: "VP Digital Products",
            gate: "PNR latency, privacy/consent, DOT communication controls",
            note: "Customer-facing autonomy needs a higher proof bar than internal decision support.",
          },
        ],
      },
      {
        label: "Hold / control",
        items: [
          {
            label: "Customer Disruption Communication Agent",
            value: 7,
            readiness: 4,
            risk: 7,
            action: "Hold external send until compliance gate closes",
            owner: "Chief Compliance Officer + VP Digital Products",
            gate: "Approved templates, consent checks, legal boundaries, HITL workflow",
            note: "Let it draft; do not let it autonomously send customer-impacting messages yet.",
          },
          {
            label: "Maintenance Delay Prediction",
            value: 6,
            readiness: 3,
            risk: 5,
            action: "Hold until model validation and feed completeness",
            owner: "Maintenance Operations",
            gate: "MEL/CDL feed completeness and precision validation",
            note: "Potentially valuable, but less ready than the top IROPS recovery gates.",
          },
        ],
      },
    ],
    proofBoundary: {
      known: [
        "The loaded CTO packet identifies eight IROPS-adjacent AI initiatives and the readiness gates that constrain scale.",
        "High-impact initiatives are blocked by data certification, model-risk, human-in-loop, and Finance evidence rather than model capability alone.",
      ],
      missing: packet.missingEvidenceChecklist.slice(0, 4),
      decisionRequired:
        "CTO approves a readiness-first funding sequence: scale internal low-risk use, certify crew/turn data, fund IROPS readiness, and hold customer-impacting autonomy.",
    },
  });
}

function skyHarborCanvasIntent(
  query: string,
):
  | "executive-canvas-sequencing"
  | "value-readiness-matrix"
  | "gate-to-value-roadmap"
  | "proof-boundary-card" {
  if (
    /\b(?:what\s+has\s+to\s+happen\s+first|before|prerequisite|dependency|gate|roadmap|unlock)\b/i.test(
      query,
    )
  ) {
    return "gate-to-value-roadmap";
  }
  if (
    /\b(?:portfolio|tradeoff|trade-off|value\s*(?:\/|vs\.?|versus)\s*readiness|readiness|high\s+value|not\s+ready)\b/i.test(
      query,
    )
  ) {
    return "value-readiness-matrix";
  }
  if (
    /\b(?:trust|governance|proof|evidence\s+quality|assumption|missing|signoff|sign-off|validate|validated|board[-\s]?grade|board[-\s]?ready)\b/i.test(
      query,
    )
  ) {
    return "proof-boundary-card";
  }
  return "executive-canvas-sequencing";
}

function wrapSkyHarborCanvasPayload(payload: object): string {
  return ["```abarva-canvas", JSON.stringify(payload), "```"].join("\n");
}
