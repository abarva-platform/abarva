import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import {
  getDiscoveryBlueprint,
  type DiscoveryBlueprint,
  type EvidenceFamily,
} from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { getProgramById } from "@/lib/programs/queries";

export interface DiscoveryEvidenceReadinessItem {
  id: string;
  title: string;
  summary: string;
  evidenceType: string;
  phase: number | null;
  confidence: number | string | null;
  createdAt: string | null;
}

export interface DiscoveryFamilyCoverage {
  familyId: string;
  label: string;
  required: boolean;
  status: "covered" | "missing";
  evidenceIds: string[];
  evidenceTitles: string[];
}

export interface DiscoveryGapRegisterItem {
  familyId: string;
  label: string;
  required: boolean;
  likelySource: string;
  format: string;
  grounds: string;
  remediation: string;
}

export interface DiscoveryEvidenceReadiness {
  blueprintId: string;
  blueprintVersion: string;
  archetypeLabel: string;
  requiredTotal: number;
  requiredCovered: number;
  requiredMissing: number;
  optionalCovered: number;
  readinessScore: number;
  readyForP3: boolean;
  families: DiscoveryFamilyCoverage[];
  gapRegister: DiscoveryGapRegisterItem[];
}

const FAMILY_KEYWORDS: Record<string, string[]> = {
  disruption_ops_data: [
    "disruption",
    "irops",
    "recovery",
    "event",
    "delay",
    "cancellation",
    "ops",
    "volume",
    "cause",
  ],
  it_systems_landscape: [
    "system",
    "application",
    "cmdb",
    "architecture",
    "integration",
    "landscape",
    "platform",
  ],
  data_analytics_estate: [
    "data",
    "analytics",
    "warehouse",
    "lake",
    "databricks",
    "snowflake",
    "cdp",
    "profile",
    "batch",
    "real-time",
    "realtime",
  ],
  cost_pools: ["cost", "finance", "fp&a", "goodwill", "compensation", "roi"],
  contact_center_analytics: [
    "contact",
    "call",
    "aht",
    "ccaas",
    "speech",
    "deflect",
  ],
  segment_value_data: ["segment", "loyalty", "churn", "customer value", "tier"],
  inventory_rules: [
    "inventory",
    "fulfilment",
    "fulfillment",
    "fare",
    "rule",
    "guardrail",
  ],
  core_system_throughput: [
    "throughput",
    "transaction",
    "latency",
    "limit",
    "throttle",
    "queue",
  ],
  channel_consent: [
    "notification",
    "channel",
    "consent",
    "sms",
    "mobile",
    "email",
  ],
  policy_entitlement: [
    "policy",
    "entitlement",
    "legal",
    "regulatory",
    "jurisdiction",
    "compliance",
  ],
  current_state_runbook: [
    "runbook",
    "process",
    "current state",
    "as-is",
    "operating",
    "workflow",
  ],
  workforce_model: ["workforce", "role", "staff", "capacity", "change"],
  current_state_process: [
    "process",
    "current state",
    "as-is",
    "workflow",
    "operating",
  ],
  kpi_baseline: ["kpi", "metric", "baseline", "target", "success"],
  cost_baseline: ["cost", "finance", "budget", "run-rate", "baseline"],
  org_workforce: ["org", "workforce", "role", "raci", "capacity"],
  current_state_workflow_map: [
    "workflow",
    "process map",
    "current state",
    "member service",
    "agent journey",
    "call flow",
    "handoff",
  ],
  contact_center_kpis: [
    "aht",
    "average handle time",
    "first call resolution",
    "fcr",
    "transfer",
    "repeat contact",
    "after-call",
    "after call",
    "csat",
    "cost per contact",
    "metric",
    "kpi",
    "baseline",
  ],
  crm_contact_center_system_map: [
    "crm",
    "ccaas",
    "genesys",
    "nice",
    "servicenow",
    "contact center",
    "call center",
    "system map",
    "integration",
    "application",
  ],
  claims_eligibility_benefits_data_access: [
    "claim",
    "claims",
    "eligibility",
    "benefits",
    "prior auth",
    "authorization",
    "pharmacy",
    "data access",
    "source",
  ],
  knowledge_base_ownership_freshness: [
    "knowledge",
    "policy",
    "freshness",
    "owner",
    "content",
    "article",
    "knowledge base",
  ],
  call_recording_transcript_availability: [
    "transcript",
    "recording",
    "speech",
    "intent",
    "retention",
    "call sample",
  ],
  phi_privacy_security_controls: [
    "phi",
    "hipaa",
    "privacy",
    "security",
    "audit",
    "access",
    "control",
  ],
  human_in_loop_model: [
    "human",
    "approval",
    "review",
    "escalation",
    "decision rights",
    "clinical decision",
  ],
  model_risk_responsible_ai_controls: [
    "model risk",
    "responsible ai",
    "ai governance",
    "guardrail",
    "hallucination",
    "evaluation",
  ],
  measurement_owner_cadence: [
    "measurement",
    "owner",
    "cadence",
    "metric owner",
    "tower",
    "scorecard",
  ],
  finance_baseline_value_plan: [
    "finance",
    "baseline",
    "value",
    "cost",
    "business case",
    "savings",
  ],
  change_adoption_owner: [
    "training",
    "adoption",
    "change",
    "workforce",
    "supervisor",
    "raci",
  ],
};

function evidenceText(item: DiscoveryEvidenceReadinessItem): string {
  return `${item.title}\n${item.summary}\n${item.evidenceType}`.toLowerCase();
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = nonEmptyString(value);
    if (normalized) return normalized;
  }
  return null;
}

interface DiscoveryBlueprintProgramInput {
  functionPackKey?: string | null;
  archetype?: string | null;
  name?: string | null;
  problemStatement?: string | null;
  targetOutcome?: string | null;
  charter?: unknown;
}

export function buildDiscoveryBlueprintInputFromProgram(
  program: DiscoveryBlueprintProgramInput | null | undefined,
): string {
  const charter =
    typeof program?.charter === "object" && program.charter !== null
      ? (program.charter as Record<string, unknown>)
      : {};
  const charterClassification = charter.classification;
  const charterArchetype =
    typeof charterClassification === "object" && charterClassification !== null
      ? nonEmptyString((charterClassification as Record<string, unknown>).archetype)
      : null;
  const charterClassificationText =
    typeof charterClassification === "string" ? charterClassification : null;

  return [
    firstNonEmptyString(
      program?.functionPackKey,
      charterArchetype,
      program?.archetype,
      charterClassificationText,
    ) ?? "STRATEGIC_MOVE",
    program?.name,
    program?.problemStatement,
    program?.targetOutcome,
    charter.problem_statement,
    charter.value_hypothesis,
    charter.scope_boundary,
    charter.evidence_family,
  ]
    .map((value) => nonEmptyString(value))
    .filter(Boolean)
    .join(" ");
}

function familyScore(
  item: DiscoveryEvidenceReadinessItem,
  family: EvidenceFamily,
): number {
  const text = evidenceText(item);
  const keywords = FAMILY_KEYWORDS[family.id] ?? [
    family.id.replace(/_/g, " "),
    family.label.toLowerCase(),
  ];
  let score = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) score += 2;
  }
  if (text.includes(family.id.replace(/_/g, " "))) score += 3;
  if (text.includes(family.label.toLowerCase())) score += 3;

  if (item.evidenceType === "architecture_inventory") {
    if (
      family.id === "it_systems_landscape" ||
      family.id === "data_analytics_estate"
    ) {
      score += 2;
    }
  }
  if (item.evidenceType === "baseline_evidence") {
    if (
      family.id === "kpi_baseline" ||
      family.id === "cost_baseline" ||
      family.id === "cost_pools" ||
      family.id === "disruption_ops_data" ||
      family.id === "contact_center_analytics"
    ) {
      score += 2;
    }
  }
  if (item.evidenceType === "decision_log") {
    if (family.id === "policy_entitlement" || family.id === "inventory_rules") {
      score += 1;
    }
  }
  if (
    item.evidenceType === "meeting_notes" ||
    item.evidenceType === "workshop_output"
  ) {
    if (
      family.id === "current_state_process" ||
      family.id === "current_state_runbook" ||
      family.id === "org_workforce" ||
      family.id === "workforce_model"
    ) {
      score += 1;
    }
  }
  return score;
}

export function mapEvidenceToDiscoveryFamily(
  item: DiscoveryEvidenceReadinessItem,
  blueprint: DiscoveryBlueprint,
): string | null {
  let best: { id: string; score: number } | null = null;
  for (const family of blueprint.evidenceFamilies) {
    const score = familyScore(item, family);
    if (!best || score > best.score) best = { id: family.id, score };
  }
  return best && best.score >= 2 ? best.id : null;
}

export function evaluateDiscoveryEvidenceReadiness(args: {
  blueprint: DiscoveryBlueprint;
  evidenceItems: DiscoveryEvidenceReadinessItem[];
}): DiscoveryEvidenceReadiness {
  const coverage = new Map<string, DiscoveryEvidenceReadinessItem[]>();
  for (const item of args.evidenceItems) {
    const familyId = mapEvidenceToDiscoveryFamily(item, args.blueprint);
    if (!familyId) continue;
    const items = coverage.get(familyId) ?? [];
    items.push(item);
    coverage.set(familyId, items);
  }

  const families = args.blueprint.evidenceFamilies.map((family) => {
    const items = coverage.get(family.id) ?? [];
    return {
      familyId: family.id,
      label: family.label,
      required: family.required,
      status: items.length > 0 ? "covered" : "missing",
      evidenceIds: items.map((item) => item.id),
      evidenceTitles: items.map((item) => item.title),
    } satisfies DiscoveryFamilyCoverage;
  });

  const requiredFamilies = families.filter((family) => family.required);
  const requiredCovered = requiredFamilies.filter(
    (family) => family.status === "covered",
  ).length;
  const gapRegister = args.blueprint.evidenceFamilies
    .filter((family) => family.required && !coverage.has(family.id))
    .map((family) => ({
      familyId: family.id,
      label: family.label,
      required: family.required,
      likelySource: family.likelySource,
      format: family.format,
      grounds: family.grounds,
      remediation: `Upload ${family.format} from ${family.likelySource} or record a human waiver before P3.`,
    }));

  return {
    blueprintId: args.blueprint.blueprintId,
    blueprintVersion: args.blueprint.blueprintVersion,
    archetypeLabel: args.blueprint.archetypeLabel,
    requiredTotal: requiredFamilies.length,
    requiredCovered,
    requiredMissing: gapRegister.length,
    optionalCovered: families.filter(
      (family) => !family.required && family.status === "covered",
    ).length,
    readinessScore:
      requiredFamilies.length === 0
        ? 100
        : Math.round((requiredCovered / requiredFamilies.length) * 100),
    readyForP3: gapRegister.length === 0,
    families,
    gapRegister,
  };
}

export async function loadDiscoveryEvidenceReadiness(
  ctx: TenancyCtx,
  programId: string,
): Promise<DiscoveryEvidenceReadiness> {
  const program = await getProgramById(ctx, programId);
  const blueprint = getDiscoveryBlueprint(
    buildDiscoveryBlueprintInputFromProgram(program),
  );
  const tenantKey = ctx.clientKey ?? "";
  const rows = await azureRead
    .query<{
      id: string;
      title: string | null;
      summary: string | null;
      evidence_type: string | null;
      phase: number | null;
      confidence: number | string | null;
      created_at: string | null;
    }>(
      `
        SELECT
          pei.id,
          pei.title,
          pei.summary,
          pei.evidence_type,
          pei.phase,
          pei.confidence,
          pei.created_at
        FROM program_evidence_reviews per
        INNER JOIN program_evidence_items pei
          ON pei.id = per.evidence_id
        WHERE per.program_id = $1
          AND per.tenant_key = $2
          AND per.decision = 'approved'
          AND pei.program_id = per.program_id
          AND pei.tenant_key = per.tenant_key
        ORDER BY COALESCE(per.reviewed_at, per.updated_at, per.created_at) DESC
        LIMIT 200
      `,
      [programId, tenantKey],
      { missingTable: "empty" },
    )
    .catch(() => []);
  return evaluateDiscoveryEvidenceReadiness({
    blueprint,
    evidenceItems: rows.map((row) => ({
      id: row.id,
      title: row.title ?? "Untitled evidence",
      summary: row.summary ?? "",
      evidenceType: row.evidence_type ?? "uploaded_artifact",
      phase: row.phase,
      confidence: row.confidence,
      createdAt: row.created_at,
    })),
  });
}
