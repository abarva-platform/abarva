import { NextResponse } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { selectSourceEventsReadAdapter } from "@/lib/data-plane/read-adapters/sourceEventsReadAdapter";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  getContract360,
  getContractOptimizationOpportunitySet,
  listContractFinancialExposure,
} from "@/lib/source/data-model/read-adapter";
import type { ContractOptimizationOpportunity } from "@/lib/source/data-model/contract-optimization-opportunity";
import { factSpecByKey } from "@/lib/source/facts/fact-catalog";
import type { SourceEventFactInsert } from "@/lib/source/facts/fact-types";
import { createSourcingEvent, type SourceEventRow } from "@/lib/source/queries";
import { resolveArchetypeForEvent } from "@/lib/source/archetypes/event-archetype-resolver";
import type { SourceCategoryId } from "@/lib/source/taxonomy/category-taxonomy";
import { readEventFactMap } from "@/lib/source/door1/facts-reader";
import { runSourceOptimization } from "@/lib/source/door1/optimize";
import { withGovernedOpportunityFinding } from "@/lib/source/door1/governed-opportunity-diagnosis";
import {
  SOURCE_JOURNEYS,
  sourceJourneyStageHref,
} from "@/lib/source/sourcing-motion-journeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ contractId: string }>;
};

const MOTION = "contract_optimization" as const;

type SelectedOptimizationOpportunityContext = Pick<
  ContractOptimizationOpportunity,
  | "opportunityId"
  | "label"
  | "shortLabel"
  | "amountUsd"
  | "stage"
  | "evidenceGrade"
  | "blockingGap"
  | "nextAction"
> & {
  readonly calculation: Pick<
    NonNullable<ContractOptimizationOpportunity["calculation"]>,
    | "ruleId"
    | "ruleVersion"
    | "includedLineCount"
    | "pendingLineCount"
    | "excludedLineCount"
  > | null;
};

export async function POST(request: Request, { params }: RouteContext) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError && err.code === "unauthenticated") {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "tenancy_unavailable" },
      { status: 503 },
    );
  }

  const { contractId: rawContractId } = await params;
  const contractId = decodeURIComponent(rawContractId);
  const requestedClient =
    new URL(request.url).searchParams.get("client")?.trim() || null;
  const tenant = await resolveTenant({
    requestedClient,
    allowFallback: !requestedClient,
  }).catch(() => null);
  const activeClient = tenant
    ? await getActiveClientRow(tenant.appClientKey).catch(() => null)
    : await getActiveClientRow().catch(() => null);
  const clientKey =
    activeClient?.key ??
    tenant?.appClientKey ??
    (!requestedClient ? tenancy.clientKey : "") ??
    "";
  if (!clientKey) {
    return NextResponse.json(
      { ok: false, error: "no_client" },
      { status: 403 },
    );
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: clientKey,
  }).catch(() => null);
  if (!accessPolicy?.canCreateSourceEvents) {
    return NextResponse.json(
      {
        ok: false,
        error: "forbidden_source_create_required",
        detail:
          "Source create access is required to start or refresh a contract optimization workflow.",
      },
      { status: 403 },
    );
  }

  const contract = await getContract360(clientKey, contractId).catch(
    () => null,
  );
  if (!contract) {
    return NextResponse.json(
      { ok: false, error: "contract_not_found" },
      { status: 404 },
    );
  }
  const requestOpportunityId = await readRequestedOpportunityId(request);
  const opportunitySet = await getContractOptimizationOpportunitySet(
    clientKey,
    contract.contract_id,
    contract,
  ).catch(() => null);
  const selectedOpportunity = resolveSelectedOpportunity(
    opportunitySet?.opportunities ?? [],
    requestOpportunityId,
  );
  if (requestOpportunityId && !selectedOpportunity) {
    return NextResponse.json(
      {
        ok: false,
        error: "opportunity_not_found",
        detail:
          "The requested optimization opportunity is not available for this contract.",
        contractId: contract.contract_id,
        opportunityId: requestOpportunityId,
      },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }

  const financialExposureRows = await listContractFinancialExposure(
    clientKey,
  ).catch(() => []);
  const financialExposure =
    financialExposureRows.find(
      (row) => row.contract_id === contract.contract_id,
    ) ?? null;

  const eventInput = {
    clientKey,
    userId: tenancy.userId,
    contractId: contract.contract_id,
    contractName: contract.contract_name,
    vendorName: contract.vendor_name,
    vendorCategory: contract.vendor_category,
    annualValue: contract.annual_value,
    actualAnnualSpend: contract.actual_annual_spend,
    renewalOwnerRef: contract.renewal_owner_ref,
    selectedOpportunity,
    baselineHeadline: opportunitySet?.baseline.headline ?? null,
    baselineDetail: opportunitySet?.baseline.detail ?? null,
  };
  const existing = await findExistingOptimizationEvent(
    clientKey,
    contract,
    selectedOpportunity?.opportunityId ?? null,
  );
  const event = existing
    ? await refreshExistingOptimizationEvent({
        event: existing,
        input: eventInput,
      })
    : await createOptimizationEvent(eventInput);
  if (
    !optimizationEventMatchesContract(
      event,
      contract,
      selectedOpportunity?.opportunityId ?? null,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "optimization_event_contract_mismatch",
        detail:
          "The existing or created contract optimization event does not match the selected contract and opportunity. No navigation was performed.",
        contractId: contract.contract_id,
        opportunityId: selectedOpportunity?.opportunityId ?? null,
        vendorName: contract.vendor_name,
        contractName: contract.contract_name,
      },
      { status: 409, headers: { "cache-control": "no-store" } },
    );
  }

  await persistBaselineFacts({
    event,
    contractId: contract.contract_id,
    actualAnnualSpend:
      financialExposure?.actual_annual_spend ?? contract.actual_annual_spend,
    annualValue:
      financialExposure?.contracted_annual_value ?? contract.annual_value,
    totalCommittedValue:
      financialExposure?.total_committed_value ??
      contract.total_committed_value,
  });

  const diagnosis = await diagnoseIfReady(
    event,
    clientKey,
    selectedOpportunity,
  );
  const eventUrl = optimizationEventUrl(event);

  return NextResponse.json(
    {
      ok: true,
      state: existing ? "existing" : "created",
      eventId: event.id,
      eventCode: event.event_code,
      eventName: event.event_name,
      contractId: contract.contract_id,
      vendorName: contract.vendor_name,
      contractName: contract.contract_name,
      opportunityId: selectedOpportunity?.opportunityId ?? null,
      opportunityLabel: selectedOpportunity?.label ?? null,
      opportunityStage: selectedOpportunity?.stage ?? null,
      opportunityAmountUsd: selectedOpportunity?.amountUsd ?? null,
      sourcingMotion: MOTION,
      approvalUrl: `/source/events/${event.id}/approval`,
      eventUrl,
      diagnosis,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

function optimizationEventUrl(event: SourceEventRow): string {
  return sourceJourneyStageHref({
    eventId: event.id,
    journey: SOURCE_JOURNEYS.contract_optimization,
    stageKey: event.current_stage_key,
    fallbackStageKey: "pricing",
  });
}

async function findExistingOptimizationEvent(
  clientKey: string,
  contract: OptimizationContractIdentity,
  opportunityId: string | null,
): Promise<SourceEventRow | null> {
  const rows = await selectSourceEventsReadAdapter(undefined, clientKey)
    .getActiveEventsForClient(clientKey)
    .catch(() => []);
  const event = rows.find((row) =>
    optimizationEventMatchesContract(
      row as SourceEventRow,
      contract,
      opportunityId,
    ),
  );
  return (event as SourceEventRow | undefined) ?? null;
}

interface OptimizationContractIdentity {
  readonly contract_id: string;
  readonly contract_name: string;
  readonly vendor_name: string;
}

function optimizationEventMatchesContract(
  event: SourceEventRow,
  contract: OptimizationContractIdentity,
  opportunityId: string | null = null,
): boolean {
  if (event.sourcing_motion !== MOTION) return false;
  const eventName = normalizeIdentityText(event.event_name);
  const triggerDescription = normalizeIdentityText(
    event.trigger_description ?? "",
  );
  const scopeDescription = normalizeIdentityText(event.scope_description ?? "");
  const matchesContract =
    hasIdentityPhrase(eventName, contract.vendor_name) &&
    hasIdentityPhrase(eventName, contract.contract_name) &&
    hasIdentityPhrase(triggerDescription, contract.contract_id) &&
    hasIdentityPhrase(triggerDescription, contract.vendor_name) &&
    hasIdentityPhrase(triggerDescription, contract.contract_name) &&
    hasIdentityPhrase(scopeDescription, contract.contract_id);
  if (!matchesContract) return false;
  if (!opportunityId) return true;
  return (
    hasIdentityPhrase(scopeDescription, opportunityId) ||
    hasIdentityPhrase(triggerDescription, opportunityId)
  );
}

async function createOptimizationEvent(input: {
  clientKey: string;
  userId: string | null | undefined;
  contractId: string;
  contractName: string;
  vendorName: string;
  vendorCategory: string | null;
  annualValue: number | null;
  actualAnnualSpend: number | null;
  renewalOwnerRef: string | null;
  selectedOpportunity: ContractOptimizationOpportunity | null;
  baselineHeadline: string | null;
  baselineDetail: string | null;
}): Promise<SourceEventRow> {
  const eventType = inferEventType(input.vendorCategory, input.contractName);
  const opportunity = input.selectedOpportunity;
  const event = await createSourcingEvent({
    clientKey: input.clientKey,
    eventName: optimizationEventName(input),
    eventType,
    sourcingMotion: MOTION,
    triggerDescription: optimizationTriggerDescription(input),
    decisionOwner: input.renewalOwnerRef ?? "Vendor Management / Sourcing Lead",
    scopeDescription: optimizationScopeDescription(input),
    estimatedValueUsd: opportunity?.amountUsd ?? undefined,
    createdByUserId: input.userId ?? undefined,
    creationRequestId: optimizationCreationRequestId(input),
  });

  if (input.userId) {
    const participantWrite = await selectSourceWriteAdapter(
      undefined,
      input.clientKey,
    ).insertParticipant({
      clientKey: input.clientKey,
      sourceEventId: event.id,
      userId: input.userId,
    });
    if (!participantWrite.ok) {
      throw new Error(
        participantWrite.error ?? "source participant assignment failed",
      );
    }
  }
  return event;
}

async function refreshExistingOptimizationEvent(input: {
  readonly event: SourceEventRow;
  readonly input: Parameters<typeof createOptimizationEvent>[0];
}): Promise<SourceEventRow> {
  const update = {
    event_name: optimizationEventName(input.input),
    trigger_description: optimizationTriggerDescription(input.input),
    decision_owner:
      input.input.renewalOwnerRef ?? "Vendor Management / Sourcing Lead",
    scope_description: optimizationScopeDescription(input.input),
    estimated_value_usd: input.input.selectedOpportunity?.amountUsd ?? null,
    updated_at: new Date().toISOString(),
  };
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_events")
    .update(update)
    .eq("id", input.event.id)
    .eq("client_key", input.event.client_key)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return ((data as SourceEventRow | null) ?? {
    ...input.event,
    ...update,
  }) as SourceEventRow;
}

async function readRequestedOpportunityId(
  request: Request,
): Promise<string | null> {
  const url = new URL(request.url);
  const queryValue = normalizeOptionalId(url.searchParams.get("opportunityId"));
  if (queryValue) return queryValue;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  const body = await request.json().catch(() => null);
  return normalizeOptionalId(
    (body as { opportunityId?: unknown } | null)?.opportunityId,
  );
}

function resolveSelectedOpportunity(
  opportunities: readonly ContractOptimizationOpportunity[],
  requestedOpportunityId: string | null,
): ContractOptimizationOpportunity | null {
  if (requestedOpportunityId) {
    return (
      opportunities.find(
        (opportunity) => opportunity.opportunityId === requestedOpportunityId,
      ) ?? null
    );
  }
  return (
    opportunities.find((opportunity) =>
      opportunity.opportunityId.endsWith(":rate-variance"),
    ) ??
    opportunities.find(
      (opportunity) =>
        opportunity.amountUsd != null &&
        opportunity.stage !== "baseline_conflict",
    ) ??
    opportunities[0] ??
    null
  );
}

function normalizeOptionalId(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function optimizationEventName(input: {
  readonly contractId: string;
  readonly contractName: string;
  readonly vendorName: string;
  readonly selectedOpportunity?: Pick<
    ContractOptimizationOpportunity,
    "shortLabel"
  > | null;
}): string {
  const suffix = input.selectedOpportunity?.shortLabel
    ? ` ${input.selectedOpportunity.shortLabel} Optimization`
    : " Contract Optimization";
  return `${input.vendorName} - ${input.contractName}${suffix}`;
}

function optimizationCreationRequestId(input: {
  readonly contractId: string;
  readonly vendorName: string;
  readonly selectedOpportunity?: Pick<
    ContractOptimizationOpportunity,
    "opportunityId"
  > | null;
}): string {
  const vendor = input.vendorName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 2);
  const contract = input.contractId
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  const opportunity = (input.selectedOpportunity?.opportunityId ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(-8);
  return [contract, vendor, opportunity].filter(Boolean).join("");
}

function optimizationTriggerDescription(input: {
  readonly contractId: string;
  readonly contractName: string;
  readonly vendorName: string;
  readonly selectedOpportunity: SelectedOptimizationOpportunityContext | null;
}): string {
  const base = `Optimize incumbent contract ${input.contractId}: ${input.vendorName} - ${input.contractName}.`;
  if (!input.selectedOpportunity) return base;
  return `${base} Selected opportunity ${input.selectedOpportunity.opportunityId}: ${input.selectedOpportunity.label}.`;
}

function optimizationScopeDescription(input: {
  readonly contractId: string;
  readonly selectedOpportunity: SelectedOptimizationOpportunityContext | null;
  readonly baselineHeadline: string | null;
  readonly baselineDetail: string | null;
}): string {
  const opportunity = input.selectedOpportunity;
  const lines = [
    `Contract ref: ${input.contractId}.`,
    input.baselineHeadline
      ? `Baseline: ${input.baselineHeadline} ${input.baselineDetail ?? ""}`.trim()
      : null,
    opportunity
      ? `Opportunity ref: ${opportunity.opportunityId}. Stage: ${opportunity.stage}. Evidence: ${opportunity.evidenceGrade}. Amount: ${opportunity.amountUsd == null ? "not sized" : `$${Math.round(opportunity.amountUsd).toLocaleString("en-US")}`}.`
      : null,
    opportunity?.calculation
      ? `Calculation rule: ${opportunity.calculation.ruleId} ${opportunity.calculation.ruleVersion}; included ${opportunity.calculation.includedLineCount}, pending ${opportunity.calculation.pendingLineCount}, excluded ${opportunity.calculation.excludedLineCount}.`
      : null,
    opportunity?.blockingGap
      ? `Blocking gap: ${opportunity.blockingGap}`
      : null,
    opportunity ? `Next action: ${opportunity.nextAction}` : null,
    "Use the governed Source opportunity, source.contract_360 row, financial exposure, document evidence, and Tower value claims as the starting evidence pack. Do not claim realized value until Tower/Finance confirms it.",
  ];
  return lines.filter((line): line is string => Boolean(line)).join(" ");
}

async function persistBaselineFacts(input: {
  event: SourceEventRow;
  contractId: string;
  annualValue: number | null;
  actualAnnualSpend: number | null;
  totalCommittedValue: number | null;
}): Promise<void> {
  const facts = buildBaselineFactRows(input);
  if (facts.length === 0) return;

  const supabase = getAzureWriteFluentClient();
  const factKeys = facts.map((fact) => fact.fact_key);
  const stale = await supabase
    .from("source_event_facts")
    .update({ is_stale: true })
    .eq("source_event_id", input.event.id)
    .eq("client_key", input.event.client_key)
    .in("fact_key", factKeys)
    .eq("source_method", "structured_map");
  if (stale.error) throw new Error(stale.error.message);

  const inserted = await supabase.from("source_event_facts").insert(facts);
  if (inserted.error) throw new Error(inserted.error.message);
}

function buildBaselineFactRows(input: {
  event: SourceEventRow;
  contractId: string;
  annualValue: number | null;
  actualAnnualSpend: number | null;
  totalCommittedValue: number | null;
}): SourceEventFactInsert[] {
  const rows: SourceEventFactInsert[] = [];
  const runCost = finiteOrNull(input.actualAnnualSpend ?? input.annualValue);
  const termYears = deriveTermYears(
    input.annualValue,
    input.totalCommittedValue,
  );

  pushNumericFact(rows, input, {
    factKey: "annual_run_cost",
    value: runCost,
    entityKind: "tower",
    entityRef: input.contractId,
    locator: "actual_annual_spend, fallback annual_value",
  });
  pushNumericFact(rows, input, {
    factKey: "term_years",
    value: termYears,
    entityKind: "event",
    entityRef: null,
    locator: "total_committed_value / annual_value",
  });

  return rows;
}

function pushNumericFact(
  rows: SourceEventFactInsert[],
  input: {
    event: SourceEventRow;
    contractId: string;
  },
  fact: {
    factKey: string;
    value: number | null;
    entityKind: SourceEventFactInsert["entity_kind"];
    entityRef: string | null;
    locator: string;
    confidence?: SourceEventFactInsert["confidence"];
  },
): void {
  if (fact.value == null) return;
  const spec = factSpecByKey(fact.factKey);
  if (!spec) return;
  rows.push({
    source_event_id: input.event.id,
    client_key: input.event.client_key,
    fact_key: fact.factKey,
    entity_kind: fact.entityKind,
    entity_ref: fact.entityRef,
    value_numeric: fact.value,
    value_text: null,
    unit: spec.unit,
    source_method: "structured_map",
    source_citation: {
      doc: "source.contract_360 / source.contract_operational_performance",
      locator: `${input.contractId}.${fact.locator}`,
    },
    confidence: fact.confidence ?? "med",
  });
}

async function diagnoseIfReady(
  event: SourceEventRow,
  clientKey: string,
  selectedOpportunity: ContractOptimizationOpportunity | null,
) {
  const resolution = resolveArchetypeForEvent({
    categoryId: (event.classified_category as SourceCategoryId | null) ?? null,
    eventType: event.event_type,
  });
  if (!resolution.resolved || !resolution.archetype) {
    return {
      ok: false,
      state: "archetype_unresolved",
      detail: resolution.reason,
    };
  }
  const facts = await readEventFactMap({ eventId: event.id, clientKey });
  const optimization = withGovernedOpportunityFinding({
    optimization: runSourceOptimization({
      eventId: event.id,
      archetype: resolution.archetype,
      facts,
    }),
    opportunity: selectedOpportunity,
  });
  const usedGovernedOpportunity =
    optimization.diagnosis.findings.length > 0 &&
    selectedOpportunity != null &&
    optimization.diagnosis.findings[0]?.ruleKey ===
      selectedOpportunity.opportunityId;
  return {
    ok: true,
    archetypeId: optimization.archetypeId,
    factCount: optimization.baseline.factCount,
    findingCount: optimization.diagnosis.findings.length,
    needsEvidenceCount: optimization.diagnosis.needsEvidence.length,
    recoverableLow: optimization.bridge.recoverableLow,
    recoverableHigh: optimization.bridge.recoverableHigh,
    playKind: optimization.play.kind,
    source: usedGovernedOpportunity
      ? "governed_source_opportunity"
      : "source_event_facts",
    selectedOpportunityFinding: usedGovernedOpportunity
      ? {
          opportunityId: selectedOpportunity.opportunityId,
          label: selectedOpportunity.label,
          amountUsd: selectedOpportunity.amountUsd,
          stage: selectedOpportunity.stage,
          evidenceGrade: selectedOpportunity.evidenceGrade,
        }
      : null,
  };
}

function inferEventType(
  vendorCategory: string | null,
  contractName: string,
):
  | "managed_service"
  | "software"
  | "staffing"
  | "infrastructure"
  | "consulting"
  | "other" {
  const text = `${vendorCategory ?? ""} ${contractName}`.toLowerCase();
  if (
    /\b(managed|ams|bpo|outsourc|implementation|professional service)\b/.test(
      text,
    )
  )
    return "managed_service";
  if (
    /\b(saas|software|license|subscription|cyber|security|salesforce|servicenow|workday)\b/.test(
      text,
    )
  )
    return "software";
  if (/\b(cloud|network|infrastructure|hosting)\b/.test(text))
    return "infrastructure";
  if (/\b(staff|contractor|contingent)\b/.test(text)) return "staffing";
  if (/\b(consult)\b/.test(text)) return "consulting";
  return "other";
}

function deriveTermYears(
  annualValue: number | null,
  totalCommittedValue: number | null,
): number | null {
  const annual = finiteOrNull(annualValue);
  const committed = finiteOrNull(totalCommittedValue);
  if (annual == null || committed == null || annual <= 0 || committed <= 0)
    return null;
  return Math.max(1, Math.round((committed / annual) * 10) / 10);
}

function finiteOrNull(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(n) ? n : null;
}

function hasIdentityPhrase(haystack: string, value: string): boolean {
  const needle = normalizeIdentityText(value);
  return needle.length > 0 && ` ${haystack} `.includes(` ${needle} `);
}

function normalizeIdentityText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export const __test__ = {
  optimizationCreationRequestId,
  optimizationEventMatchesContract,
  optimizationEventName,
  optimizationEventUrl,
  optimizationScopeDescription,
  optimizationTriggerDescription,
  resolveSelectedOpportunity,
};
