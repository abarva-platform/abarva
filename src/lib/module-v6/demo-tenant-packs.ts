import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type {
  EvidenceItem,
  SourceEventInstance,
  VendorParticipant,
  VendorResponse,
} from "@/lib/source/source-event-instance";
import type {
  ProgramDeliverable,
  ProgramEvidenceItem,
  ProgramInstance,
  ProgramPatternId,
  ProgramPhaseState,
} from "@/lib/programs/program-instance";

type V6Record = Record<string, string>;

const TENANT_DATASET_BY_KEY: Record<string, string> = {
  "skyharbor-air": "skyharbor-air-synthetic-v6",
  "lakeshore-industries": "lakeshore-industries-synthetic-v6",
  "lakeshore-holdings": "lakeshore-industries-synthetic-v6",
};

const TENANT_DISPLAY_BY_KEY: Record<string, string> = {
  "skyharbor-air": "Airline Demo",
  "lakeshore-industries": "Industrial Demo",
  "lakeshore-holdings": "Industrial Demo",
};

const PHASE_LABELS = [
  "Originate",
  "Discovery",
  "Synthesis",
  "Design",
  "Execution Roadmap",
  "Approval & Mobilization",
  "Tower Handoff",
] as const;

export function canonicalV6DemoTenantKey(
  value: string | null | undefined,
): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  if (
    [
      "skyharbor",
      "skyharborair",
      "skyharbor-air",
      "skyharborairlines",
      "airlinedemo",
      "airline-demo",
    ].includes(slug) ||
    compact === "airlinedemo"
  ) {
    return "skyharbor-air";
  }
  if (
    [
      "lakeshore",
      "lakeshoreholdings",
      "lakeshore-holdings",
      "lakeshoreindustries",
      "lakeshore-industries",
      "industrialdemo",
      "industrial-demo",
      "manufacturingdemo",
      "manufacturing-demo",
    ].includes(slug) ||
    compact === "industrialdemo"
  ) {
    return "lakeshore-industries";
  }
  if (
    [
      "apexretail",
      "apex-retail",
      "apex-retail-group",
      "retaildemo",
      "retail-demo",
    ].includes(slug) ||
    compact === "retaildemo"
  ) {
    return "apex-retail";
  }
  return slug || normalized;
}

export function buildV6SourceEventInstanceForTenant(
  tenantKeyInput: string,
  requestedInstanceId?: string | null,
): SourceEventInstance | null {
  const tenantKey = canonicalV6DemoTenantKey(tenantKeyInput);
  const datasetRoot = datasetRootForTenant(tenantKey);
  if (!datasetRoot) return null;

  const vendors = readV6Rows(datasetRoot, "V6_07_vendors_contracts.csv")
    .filter(hasBusinessName)
    .slice(0, 6);
  const programs = readV6Rows(datasetRoot, "V6_09_programs_initiatives.csv")
    .filter(hasBusinessName)
    .sort(byNumericDesc("budget_usd"))
    .slice(0, 5);

  if (vendors.length === 0 && programs.length === 0) return null;

  const focusProgram = programs[0] ?? null;
  const eventId = `${tenantKey}-v6-source-commercial-review`;
  if (
    requestedInstanceId &&
    ![eventId, "v6-source-commercial-review"].includes(requestedInstanceId)
  ) {
    return null;
  }

  const vendorParticipants = vendors.map((row, index): VendorParticipant => {
    const knownGaps = cleanGapList(row.known_gaps);
    const hasCommercialFacts =
      isUsable(row.annual_cost_usd) && isUsable(row.service);
    return {
      id: slug(`${tenantKey}-${row.record_id || row.vendor_name || index}`),
      name:
        cleanBusinessText(row.vendor_name) ||
        cleanBusinessText(row.record_name) ||
        `Vendor ${index + 1}`,
      status: index < 3 ? "shortlisted" : "active",
      invitedToStages: ["Plan", "RFI", "Shortlist", "RFP"],
      riskFlags: knownGaps.slice(0, 2).map((gap, gapIndex) => ({
        id: `${slug(row.record_id || row.vendor_name || `vendor-${index}`)}-gap-${gapIndex + 1}`,
        severity: hasCommercialFacts ? "medium" : "high",
        label: humanizeGap(gap),
        detail: hasCommercialFacts
          ? `${cleanBusinessText(row.vendor_name) || "This vendor"} has loaded commercial facts, but ${humanizeGap(gap).toLowerCase()} remains to be verified.`
          : `${cleanBusinessText(row.vendor_name) || "This vendor"} is loaded as a vendor record, but commercial scope, amount, owner, or pricing evidence is still thin.`,
        status: "open",
      })),
      differentiators: [
        isUsable(row.service)
          ? `Loaded service: ${cleanBusinessText(row.service)}`
          : "Service scope requires confirmation",
        isUsable(row.annual_cost_usd)
          ? `Annualized cost: ${formatMoney(row.annual_cost_usd)}`
          : "Annual cost not loaded",
        isUsable(row.renewal_date)
          ? `Renewal date: ${row.renewal_date}`
          : "Renewal date not loaded",
      ],
      pricingBand: priceBand(row.annual_cost_usd),
    };
  });

  const responses: VendorResponse[] = vendorParticipants
    .slice(0, 4)
    .map((vendor, index) => ({
      id: `${vendor.id}-rfi-response`,
      vendorId: vendor.id,
      stageId: "RFI",
      receivedAt: `2026-06-${String(10 + index).padStart(2, "0")}`,
      status: "received",
      claims: vendor.differentiators,
    }));

  const evidence: EvidenceItem[] = [
    {
      id: `${tenantKey}-v6-vendor-register`,
      kind: "document",
      field: "vendor-response-count",
      value: String(responses.length),
      source: "V6 vendor and contract rows",
      recordedAt: "2026-06-30",
    },
    {
      id: `${tenantKey}-v6-commercial-gap`,
      kind: "flag",
      field: "commercial-evidence-boundary",
      value: vendors.some((row) => cleanGapList(row.known_gaps).length > 0)
        ? "Some vendor records carry DATA-THIN gaps; Source may advise evidence requests, not claim final pricing or award readiness."
        : "Vendor records include service, annual cost, renewal date, and owner-ready commercial fields.",
      source: "V6 known_gaps",
      recordedAt: "2026-06-30",
    },
  ];

  return {
    id: eventId,
    displayId:
      tenantKey === "skyharbor-air" ? "SRC-AIR-V6-2026" : "SRC-IND-V6-2026",
    tenantSlug: tenantKey,
    tenantId: tenantKey,
    name: focusProgram
      ? `${cleanBusinessText(focusProgram.record_name)} vendor and commercial readiness`
      : `${TENANT_DISPLAY_BY_KEY[tenantKey] ?? tenantKey} vendor and commercial readiness`,
    patternId: "PAT-SRC-AMS-001",
    patternVersion: "1.0",
    currentStage: "RFP",
    stageHistory: [
      {
        stageId: "Plan",
        enteredAt: "2026-06-01",
        exitedAt: "2026-06-08",
        advancedBy: "v6-pack",
      },
      {
        stageId: "RFI",
        enteredAt: "2026-06-09",
        exitedAt: "2026-06-18",
        advancedBy: "v6-pack",
      },
      {
        stageId: "Shortlist",
        enteredAt: "2026-06-19",
        exitedAt: "2026-06-25",
        advancedBy: "v6-pack",
      },
      { stageId: "RFP", enteredAt: "2026-06-26", advancedBy: "v6-pack" },
    ],
    vendors: vendorParticipants,
    responses,
    artifacts: [
      {
        id: `${tenantKey}-source-event-charter`,
        label: "Source event charter",
        stageId: "Plan",
        expectedArtifactId: "ART-AMS-PLAN-001",
        status: "approved",
        createdAt: "2026-06-08",
      },
      {
        id: `${tenantKey}-vendor-register`,
        label: "Loaded vendor register",
        stageId: "RFI",
        expectedArtifactId: "ART-AMS-RFI-001",
        status: "approved",
        createdAt: "2026-06-18",
      },
    ],
    evidence,
    linkedPrograms: focusProgram
      ? [
          {
            programId: focusProgram.program_id || focusProgram.record_id,
            programName:
              cleanBusinessText(focusProgram.record_name) ||
              "Loaded V6 program",
            linkType: "depends-on",
            description:
              "Commercial readiness affects the program sequence and evidence trail.",
            blockedAtStage: "RFP",
          },
        ]
      : [],
    linkedSourceEvents: [],
    sponsor: {
      id: `${tenantKey}-cpo`,
      name: "Demo sourcing owner",
      title: "Commercial decision owner",
    },
    flags: vendors.some((row) => cleanGapList(row.known_gaps).length > 0)
      ? [
          {
            id: `${tenantKey}-commercial-data-thin`,
            kind: "risk",
            description:
              "Commercial packet has DATA-THIN fields; ask for service scope, annual cost, owner, linked systems, pricing basis, and risk evidence before award logic.",
            raisedBy: "aVa",
            raisedAt: "2026-06-30",
            status: "open",
          },
        ]
      : [],
    createdAt: "2026-06-01",
    lastModifiedAt: "2026-06-30",
    valueAtStakeUsd: programs.reduce(
      (sum, row) => sum + numeric(row.budget_usd),
      0,
    ),
  };
}

export function buildV6ProgramInstanceForTenant(
  tenantKeyInput: string,
  requestedProgramId?: string | null,
): ProgramInstance | null {
  const tenantKey = canonicalV6DemoTenantKey(tenantKeyInput);
  const datasetRoot = datasetRootForTenant(tenantKey);
  if (!datasetRoot) return null;

  const rows = readV6Rows(datasetRoot, "V6_09_programs_initiatives.csv")
    .filter(hasBusinessName)
    .sort(byNumericDesc("budget_usd"));
  if (rows.length === 0) return null;

  const selected = requestedProgramId
    ? rows.find((row) =>
        [row.record_id, row.program_id, slug(row.record_name)].includes(
          requestedProgramId,
        ),
      )
    : rows[0];
  if (!selected) return null;

  const id =
    selected.program_id || selected.record_id || `${tenantKey}-v6-program`;
  const phase = phaseNumber(selected.phase, selected.status);
  const knownGaps = cleanGapList(selected.known_gaps);

  return {
    id,
    displayId: id,
    tenantSlug: tenantKey,
    tenantId: tenantKey,
    name:
      cleanBusinessText(selected.record_name) ||
      `${TENANT_DISPLAY_BY_KEY[tenantKey] ?? tenantKey} V6 program`,
    patternId: programPatternForTenant(tenantKey),
    patternVersion: "1.0.0",
    currentPhase: phase,
    phases: buildPhaseStates(phase),
    deliverables: buildDeliverables(selected, phase, knownGaps),
    evidence: buildProgramEvidence(selected, phase),
    linkedSourceEvents: [
      {
        sourceEventId: `${tenantKey}-v6-source-commercial-review`,
        sourceEventName: `${cleanBusinessText(selected.record_name) || "Loaded program"} vendor and commercial readiness`,
        linkType: "depends-on",
        description:
          "Source must validate vendor scope, commercial evidence, and renewal/contract readiness before the execution sequence becomes board-ready.",
        blockedAtPhase: Math.max(phase, 3),
      },
    ],
    linkedPrograms: [],
    sponsor: {
      id: `${tenantKey}-sponsor`,
      name:
        cleanBusinessText(selected.executive_sponsor) ||
        "Demo executive sponsor",
      title: "Executive sponsor",
    },
    flags: knownGaps.length
      ? [
          {
            id: `${slug(id)}-evidence-gap`,
            kind: "blocker",
            description: `${knownGaps.slice(0, 3).map(humanizeGap).join("; ")} must be closed before this Move is treated as board-ready.`,
            raisedBy: "aVa",
            raisedAt: "2026-06-30",
            status: "open",
          },
        ]
      : [],
    createdAt: "2026-06-01",
    lastModifiedAt: "2026-06-30",
    estimatedValueUsd: numeric(selected.expected_value_usd) || undefined,
  };
}

function datasetRootForTenant(tenantKey: string): string | null {
  const datasetName = TENANT_DATASET_BY_KEY[tenantKey];
  if (!datasetName) return null;
  const root = path.join(process.cwd(), "datasets", datasetName, "templates");
  return existsSync(root) ? root : null;
}

function buildPhaseStates(currentPhase: number): ProgramPhaseState[] {
  return PHASE_LABELS.map((phaseLabel, phaseId) => {
    const status: ProgramPhaseState["status"] =
      phaseId < currentPhase
        ? "done"
        : phaseId === currentPhase
          ? "current"
          : phaseId === currentPhase + 1
            ? "pending"
            : "locked";
    return {
      phaseId,
      phaseLabel,
      status,
      gateStatus:
        status === "done" ? "approved" : status === "current" ? "open" : "na",
      gateEvidence:
        status === "done" ? [`V6 evidence checkpoint for ${phaseLabel}`] : [],
      ...(status === "done" ? { exitedAt: "2026-06-30" } : {}),
      ...(status === "current" ? { enteredAt: "2026-06-30" } : {}),
    };
  });
}

function buildDeliverables(
  row: V6Record,
  currentPhase: number,
  knownGaps: string[],
): ProgramDeliverable[] {
  const base = [
    {
      id: `${row.record_id}-brief`,
      label: "Opportunity brief",
      phaseId: 0,
      status: "complete" as const,
      completedAt: "2026-06-10",
    },
    {
      id: `${row.record_id}-owner-map`,
      label: "Owner and decision map",
      phaseId: 1,
      status: cleanBusinessText(row.business_owner)
        ? ("complete" as const)
        : ("blocked" as const),
      owner: cleanBusinessText(row.business_owner) || "Business owner required",
    },
    {
      id: `${row.record_id}-evidence-plan`,
      label: "Evidence and value-proof plan",
      phaseId: 2,
      status: knownGaps.length
        ? ("blocked" as const)
        : ("in-progress" as const),
    },
    {
      id: `${row.record_id}-source-readiness`,
      label: "Source/commercial readiness check",
      phaseId: 3,
      status: "blocked" as const,
    },
  ];
  return base.map((deliverable) =>
    deliverable.phaseId < currentPhase && deliverable.status !== "blocked"
      ? {
          ...deliverable,
          status: "complete" as const,
          completedAt: deliverable.completedAt ?? "2026-06-30",
        }
      : deliverable,
  );
}

function buildProgramEvidence(
  row: V6Record,
  phase: number,
): ProgramEvidenceItem[] {
  return [
    {
      id: `${row.record_id}-v6-program-row`,
      citation: `V6 program row: ${cleanBusinessText(row.record_name) || row.record_id}`,
      phaseId: Math.max(0, phase - 1),
      uploadedAt: "2026-06-30",
      uploadedBy: "V6 loader",
      kind: "document",
    },
  ];
}

function programPatternForTenant(tenantKey: string): ProgramPatternId {
  return tenantKey === "skyharbor-air"
    ? "PAT-PRG-DATA-FAB-001"
    : "PAT-PRG-CDP-001";
}

function phaseNumber(
  phase: string | undefined,
  status: string | undefined,
): number {
  const text = `${phase ?? ""} ${status ?? ""}`.toLowerCase();
  if (/p[0-6]/.test(text)) return Number(text.match(/p([0-6])/)?.[1]);
  if (/design|in_flight|in flight|at risk|watch/.test(text)) return 3;
  if (/pilot|synthesis/.test(text)) return 2;
  if (/discover/.test(text)) return 1;
  return 2;
}

function readV6Rows(datasetRoot: string, fileName: string): V6Record[] {
  const file = path.join(datasetRoot, fileName);
  if (!existsSync(file)) return [];
  return parseCsv(readFileSync(file, "utf8"));
}

function parseCsv(text: string): V6Record[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ),
  );
}

function hasBusinessName(row: V6Record): boolean {
  return Boolean(
    cleanBusinessText(row.record_name) || cleanBusinessText(row.vendor_name),
  );
}

function isUsable(value: string | null | undefined): boolean {
  const text = String(value ?? "").trim();
  return Boolean(
    text &&
    !text.startsWith("data_thin:") &&
    text !== "not_applicable" &&
    text !== "unknown",
  );
}

function cleanBusinessText(value: string | null | undefined): string {
  return isUsable(value) ? String(value).trim() : "";
}

function cleanGapList(value: string | null | undefined): string[] {
  const text = String(value ?? "").trim();
  if (!text || text === "none" || text === "not_applicable") return [];
  return text
    .split("|")
    .map((gap) => gap.trim())
    .filter(Boolean);
}

function humanizeGap(gap: string): string {
  return gap
    .replace(/^data_thin:/, "")
    .replace(/^missing_evidence:/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function numeric(value: string | null | undefined): number {
  if (!isUsable(value)) return 0;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function byNumericDesc(
  field: string,
): (left: V6Record, right: V6Record) => number {
  return (left, right) => numeric(right[field]) - numeric(left[field]);
}

function priceBand(
  value: string | null | undefined,
): VendorParticipant["pricingBand"] {
  const amount = numeric(value);
  if (!amount) return null;
  if (amount >= 1_500_000) return "high";
  if (amount >= 750_000) return "medium";
  return "low";
}

function formatMoney(value: string | null | undefined): string {
  const amount = numeric(value);
  if (!amount) return "not loaded";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}

function slug(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "v6-record"
  );
}
