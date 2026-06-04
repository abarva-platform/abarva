import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { recordEvidence } from "@/lib/evidence/ledger";
import { getSourceEventSeed } from "./mock-seed";
import { coerceUsdAmount, coerceUsdAmountOrZero } from "./usd-amount";
import { formatUsd } from "./value-ledger";

export type SourceValueStateLayer =
  | "baseline"
  | "intervention"
  | "negotiated"
  | "realized";
export type SourceValueStateSubtype =
  | "cost"
  | "risk_avoided"
  | "value_delivered"
  | "commercial_terms";
export type SourceValueAmountBasis = "projected" | "tracked" | "verified";
export type SourceValueDeltaClassification =
  | "cost_avoided"
  | "cost_saved"
  | "risk_reduced"
  | "value_increased";

export interface SourceValueStateRow {
  id: string;
  client_id: string;
  source_event_id: string;
  state_layer: SourceValueStateLayer;
  state_subtype: SourceValueStateSubtype | null;
  amount_usd: number | null;
  amount_basis: SourceValueAmountBasis;
  methodology: string;
  evidence_ledger_ids: string[];
  state_date: string;
  attested_by: string | null;
  attested_at: string | null;
  attestation_audit_id: string | null;
  superseded_by: string | null;
  created_at: string;
  created_by: string;
}

export interface SourceValueChainRow {
  id: string;
  source_event_id: string;
  chain_step: number;
  state_id: string;
  delta_from_prior_usd: number | null;
  delta_classification: SourceValueDeltaClassification | null;
  created_at: string;
}

export interface SourceValueChainView {
  states: SourceValueStateRow[];
  chain: SourceValueChainRow[];
  cumulativeSavingsUsd: number;
  complete: boolean;
}

interface SourceEventRowForValue {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
  estimated_value_usd: number | string | null;
  trigger_description: string | null;
  scope_description: string | null;
  decision_owner: string | null;
  updated_at: string;
}

function normalizeValueStateRow(row: SourceValueStateRow): SourceValueStateRow {
  return {
    ...row,
    amount_usd: coerceUsdAmount(row.amount_usd),
  };
}

function normalizeValueChainRow(row: SourceValueChainRow): SourceValueChainRow {
  return {
    ...row,
    delta_from_prior_usd: coerceUsdAmount(row.delta_from_prior_usd),
  };
}

function normalizeSourceEventRowForValue(
  row: SourceEventRowForValue,
): SourceEventRowForValue {
  return {
    ...row,
    estimated_value_usd: coerceUsdAmount(row.estimated_value_usd),
  } satisfies SourceEventRowForValue;
}

interface RecordStateInput {
  clientId: string;
  sourceEventId: string;
  stateLayer: SourceValueStateLayer;
  stateSubtype?: SourceValueStateSubtype | null;
  amountUsd?: number | null;
  amountBasis: SourceValueAmountBasis;
  methodology: string;
  evidenceLedgerIds: string[];
  stateDate?: string | Date;
  attestedBy?: string | null;
  attestedAt?: string | Date | null;
  attestationAuditId?: string | null;
  createdBy: string;
}

function chainStep(layer: SourceValueStateLayer): number {
  return layer === "baseline"
    ? 1
    : layer === "intervention"
      ? 2
      : layer === "negotiated"
        ? 3
        : 4;
}

function deltaClass(
  layer: SourceValueStateLayer,
): SourceValueDeltaClassification | null {
  if (layer === "intervention") return "risk_reduced";
  if (layer === "negotiated") return "cost_saved";
  if (layer === "realized") return "value_increased";
  return null;
}

function iso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

async function loadSourceEvent(
  sourceEventId: string,
): Promise<SourceEventRowForValue> {
  const resolvedEventId = await resolveSourceEventIdForValue(sourceEventId);
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_events")
    .select(
      "id,client_key,event_code,event_name,estimated_value_usd,trigger_description,scope_description,decision_owner,updated_at",
    )
    .eq("id", resolvedEventId)
    .maybeSingle();
  if (error)
    throw new Error(`source event value load failed: ${error.message}`);
  if (!data) throw new Error(`source event not found: ${sourceEventId}`);
  return normalizeSourceEventRowForValue(data as SourceEventRowForValue);
}

async function resolveSourceEventIdForValue(
  sourceEventIdOrCode: string,
): Promise<string> {
  if (isUuid(sourceEventIdOrCode)) return sourceEventIdOrCode;
  const candidates = [
    sourceEventIdOrCode,
    getSourceEventSeed(sourceEventIdOrCode)?.code,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const { data, error } = await getAzureWriteFluentClient()
      .from("source_events")
      .select("id")
      .ilike("event_code", candidate)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error)
      throw new Error(`source event value lookup failed: ${error.message}`);
    const row = ((data ?? []) as Array<{ id?: string | null }>)[0];
    if (row?.id) return row.id;
  }

  return sourceEventIdOrCode;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function latestState(
  sourceEventId: string,
  layer: SourceValueStateLayer,
): Promise<SourceValueStateRow | null> {
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_value_states")
    .select("*")
    .eq("source_event_id", sourceEventId)
    .eq("state_layer", layer)
    .is("superseded_by", null)
    .order("state_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    throw new Error(`source value state lookup failed: ${error.message}`);
  return data ? normalizeValueStateRow(data as SourceValueStateRow) : null;
}

async function recordState(
  input: RecordStateInput,
): Promise<SourceValueStateRow> {
  if (input.stateLayer === "baseline" && input.evidenceLedgerIds.length < 2) {
    throw new Error(
      "Baseline cannot be recorded without at least 2 Evidence Ledger citations.",
    );
  }
  if (
    input.stateLayer === "realized" &&
    (!input.attestedBy || !input.attestedAt)
  ) {
    throw new Error(
      "Realized value cannot be recorded without CFO attestation.",
    );
  }

  const row = {
    client_id: input.clientId,
    source_event_id: input.sourceEventId,
    state_layer: input.stateLayer,
    state_subtype: input.stateSubtype ?? null,
    amount_usd: input.amountUsd ?? null,
    amount_basis: input.amountBasis,
    methodology: input.methodology,
    evidence_ledger_ids: input.evidenceLedgerIds,
    state_date: iso(input.stateDate) ?? new Date().toISOString(),
    attested_by: input.attestedBy ?? null,
    attested_at: iso(input.attestedAt),
    attestation_audit_id: input.attestationAuditId ?? null,
    created_by: input.createdBy,
  };

  const { data, error } = await getAzureWriteFluentClient()
    .from("source_value_states")
    .insert(row)
    .select("*")
    .single();
  if (error)
    throw new Error(`source value state insert failed: ${error.message}`);
  const state = normalizeValueStateRow(data as SourceValueStateRow);

  const priorStep =
    input.stateLayer === "baseline"
      ? null
      : await latestChainState(
          input.sourceEventId,
          chainStep(input.stateLayer) - 1,
        );
  const priorAmount = priorStep?.amount_usd ?? null;
  const delta =
    state.amount_usd !== null && priorAmount !== null
      ? state.amount_usd - priorAmount
      : null;
  const { error: chainError } = await getAzureWriteFluentClient()
    .from("source_value_chain")
    .upsert(
      {
        source_event_id: input.sourceEventId,
        chain_step: chainStep(input.stateLayer),
        state_id: state.id,
        delta_from_prior_usd: delta,
        delta_classification: deltaClass(input.stateLayer),
      },
      { onConflict: "source_event_id,chain_step" },
    );
  if (chainError)
    throw new Error(`source value chain upsert failed: ${chainError.message}`);
  return state;
}

async function latestChainState(
  sourceEventId: string,
  step: number,
): Promise<SourceValueStateRow | null> {
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_value_chain")
    .select("state_id")
    .eq("source_event_id", sourceEventId)
    .eq("chain_step", step)
    .maybeSingle();
  if (error)
    throw new Error(`source value chain state lookup failed: ${error.message}`);
  const stateId = (data as { state_id?: string } | null)?.state_id;
  if (!stateId) return null;
  const { data: state, error: stateError } = await getAzureWriteFluentClient()
    .from("source_value_states")
    .select("*")
    .eq("id", stateId)
    .maybeSingle();
  if (stateError)
    throw new Error(
      `source value chain state row lookup failed: ${stateError.message}`,
    );
  return state ? normalizeValueStateRow(state as SourceValueStateRow) : null;
}

export async function computeBaseline(
  sourceEventId: string,
): Promise<SourceValueStateRow> {
  const event = await loadSourceEvent(sourceEventId);
  const existing = await latestState(event.id, "baseline");
  if (existing) return existing;

  const now = new Date().toISOString();
  const amount = coerceUsdAmountOrZero(event.estimated_value_usd);
  const amountEvidenceId = await recordEvidence({
    clientId: event.client_key,
    surface: "source",
    artifactType: "value_state",
    artifactRef: event.id,
    claimText: `Baseline commercial exposure is ${formatUsd(amount)} for ${event.event_name}.`,
    sourceType: "tenant_record",
    sourceRef: {
      table: "source_events",
      row_id: event.id,
      field: "estimated_value_usd",
    },
    freshnessAt: event.updated_at ?? now,
    confidence: event.estimated_value_usd ? 0.86 : 0.55,
    confidenceBasis: "Persisted source_events.estimated_value_usd baseline.",
    ownerRole: event.decision_owner ?? "VP Procurement",
    createdBy: "source-value-chain",
  });
  const scopeEvidenceId = await recordEvidence({
    clientId: event.client_key,
    surface: "source",
    artifactType: "value_state",
    artifactRef: event.id,
    claimText: `Baseline methodology uses Source event scope for ${event.event_code}.`,
    sourceType: event.scope_description ? "tenant_record" : "no_evidence",
    sourceRef: {
      table: "source_events",
      row_id: event.id,
      field: "scope_description",
    },
    sourceQuote: event.scope_description,
    freshnessAt: event.updated_at ?? now,
    confidence: event.scope_description ? 0.82 : 0.3,
    confidenceBasis: event.scope_description
      ? "Persisted source_events.scope_description."
      : "Scope field is missing; baseline remains low confidence.",
    ownerRole: event.decision_owner ?? "VP Procurement",
    notEnoughData: !event.scope_description,
    notEnoughDataReason: event.scope_description
      ? null
      : "Source event scope is not populated.",
    createdBy: "source-value-chain",
  });

  return recordState({
    clientId: event.client_key,
    sourceEventId: event.id,
    stateLayer: "baseline",
    stateSubtype: "cost",
    amountUsd: amount,
    amountBasis: "projected",
    methodology:
      "Persisted source_events.estimated_value_usd plus scope boundary evidence.",
    evidenceLedgerIds: [amountEvidenceId, scopeEvidenceId],
    stateDate: now,
    createdBy: "source-value-chain",
  });
}

export async function recordIntervention(
  sourceEventId: string,
  interventions: string[],
): Promise<SourceValueStateRow> {
  const event = await loadSourceEvent(sourceEventId);
  const evidenceId = await recordEvidence({
    clientId: event.client_key,
    surface: "source",
    artifactType: "value_state",
    artifactRef: event.id,
    claimText: `AbarVa intervention recorded: ${interventions.join("; ") || "Source intervention logged"}.`,
    sourceType: "derived",
    sourceRef: {
      table: "source_events",
      row_id: event.id,
      field: "intervention_trace",
    },
    freshnessAt: new Date().toISOString(),
    confidence: 0.74,
    confidenceBasis: "Derived from Source workflow intervention trace.",
    ownerRole: event.decision_owner ?? "VP Procurement",
    createdBy: "source-value-chain",
  });
  const baseline = await computeBaseline(event.id);
  return recordState({
    clientId: event.client_key,
    sourceEventId: event.id,
    stateLayer: "intervention",
    stateSubtype: "risk_avoided",
    amountUsd: baseline.amount_usd,
    amountBasis: "tracked",
    methodology:
      "AbarVa intervention trace: scope refinement, leverage points, hard questions, or BAFO posture.",
    evidenceLedgerIds: [evidenceId],
    createdBy: "source-value-chain",
  });
}

export async function recordNegotiatedOutcome(
  sourceEventId: string,
  contractValueUsd: number | string | null,
  terms: string[],
): Promise<SourceValueStateRow> {
  const event = await loadSourceEvent(sourceEventId);
  const negotiatedAmount = coerceUsdAmountOrZero(contractValueUsd);
  const evidenceId = await recordEvidence({
    clientId: event.client_key,
    surface: "source",
    artifactType: "value_state",
    artifactRef: event.id,
    claimText: `Negotiated outcome is ${formatUsd(negotiatedAmount)} with terms: ${terms.join("; ") || "terms pending"}.`,
    sourceType: terms.length > 0 ? "document_extract" : "no_evidence",
    sourceRef: {
      table: "source_value_states",
      field: "manual_negotiated_entry",
    },
    sourceQuote: terms.join("; ") || null,
    freshnessAt: new Date().toISOString(),
    confidence: terms.length > 0 ? 0.8 : 0.45,
    confidenceBasis:
      terms.length > 0
        ? "Manual negotiated terms entered by operator."
        : "Manual entry lacks contract extract.",
    ownerRole: event.decision_owner ?? "VP Procurement",
    notEnoughData: terms.length === 0,
    notEnoughDataReason:
      terms.length === 0
        ? "Contract document extract or terms are required for high-confidence negotiated value."
        : null,
    createdBy: "source-value-chain",
  });
  return recordState({
    clientId: event.client_key,
    sourceEventId: event.id,
    stateLayer: "negotiated",
    stateSubtype: "commercial_terms",
    amountUsd: negotiatedAmount,
    amountBasis: "tracked",
    methodology:
      "Manual negotiated outcome entry compared to baseline exposure.",
    evidenceLedgerIds: [evidenceId],
    createdBy: "source-value-chain",
  });
}

export async function attestRealized(
  sourceEventId: string,
  period: string,
  actualUsd: number | string | null,
  attestor: string,
): Promise<SourceValueStateRow> {
  const event = await loadSourceEvent(sourceEventId);
  if (!attestor.trim())
    throw new Error("CFO attestor is required for realized value.");
  const realizedAmount = coerceUsdAmountOrZero(actualUsd);
  const evidenceId = await recordEvidence({
    clientId: event.client_key,
    surface: "source",
    artifactType: "value_state",
    artifactRef: event.id,
    claimText: `Realized Source value for ${period} is ${formatUsd(realizedAmount)}, attested by ${attestor}.`,
    sourceType: "tenant_record",
    sourceRef: {
      table: "source_value_states",
      field: "cfo_attestation",
      period,
    },
    freshnessAt: new Date().toISOString(),
    confidence: 0.9,
    confidenceBasis:
      "CFO attestation event recorded in Source value proof loop.",
    ownerRole: "CFO",
    createdBy: "source-value-chain",
  });
  return recordState({
    clientId: event.client_key,
    sourceEventId: event.id,
    stateLayer: "realized",
    stateSubtype: "value_delivered",
    amountUsd: realizedAmount,
    amountBasis: "verified",
    methodology: `CFO attestation for ${period}; reconciled against baseline and negotiated outcome.`,
    evidenceLedgerIds: [evidenceId],
    attestedBy: attestor,
    attestedAt: new Date(),
    createdBy: "source-value-chain",
  });
}

export async function getValueChain(
  sourceEventId: string,
): Promise<SourceValueChainView> {
  const resolvedEventId = await resolveSourceEventIdForValue(sourceEventId);
  const [statesResult, chainResult] = await Promise.all([
    getAzureWriteFluentClient()
      .from("source_value_states")
      .select("*")
      .eq("source_event_id", resolvedEventId)
      .order("state_date", { ascending: true }),
    getAzureWriteFluentClient()
      .from("source_value_chain")
      .select("*")
      .eq("source_event_id", resolvedEventId)
      .order("chain_step", { ascending: true }),
  ]);
  if (statesResult.error)
    throw new Error(
      `source value states load failed: ${statesResult.error.message}`,
    );
  if (chainResult.error)
    throw new Error(
      `source value chain load failed: ${chainResult.error.message}`,
    );
  const states = ((statesResult.data ?? []) as SourceValueStateRow[]).map(
    normalizeValueStateRow,
  );
  const chain = ((chainResult.data ?? []) as SourceValueChainRow[]).map(
    normalizeValueChainRow,
  );
  const baseline =
    states.find((state) => state.state_layer === "baseline")?.amount_usd ?? 0;
  const realized =
    states.find((state) => state.state_layer === "realized")?.amount_usd ??
    null;
  return {
    states,
    chain,
    cumulativeSavingsUsd: realized === null ? 0 : baseline - realized,
    complete: ["baseline", "intervention", "negotiated", "realized"].every(
      (layer) => states.some((state) => state.state_layer === layer),
    ),
  };
}

export async function computeCumulativeSavings(
  clientId: string,
  periodDays: number,
): Promise<number> {
  const since = new Date(Date.now() - periodDays * 86_400_000).toISOString();
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_value_states")
    .select("source_event_id,state_layer,amount_usd")
    .eq("client_id", clientId)
    .gte("state_date", since);
  if (error)
    throw new Error(
      `source value cumulative savings load failed: ${error.message}`,
    );
  const rows = (
    (data ?? []) as Array<
      Pick<
        SourceValueStateRow,
        "source_event_id" | "state_layer" | "amount_usd"
      >
    >
  ).map((row) => ({
    ...row,
    amount_usd: coerceUsdAmount(row.amount_usd),
  }));
  const byEvent = new Map<string, { baseline?: number; realized?: number }>();
  for (const row of rows) {
    const current = byEvent.get(row.source_event_id) ?? {};
    if (row.state_layer === "baseline" && row.amount_usd !== null)
      current.baseline = row.amount_usd;
    if (row.state_layer === "realized" && row.amount_usd !== null)
      current.realized = row.amount_usd;
    byEvent.set(row.source_event_id, current);
  }
  let total = 0;
  for (const value of byEvent.values()) {
    if (
      typeof value.baseline === "number" &&
      typeof value.realized === "number"
    ) {
      total += value.baseline - value.realized;
    }
  }
  return total;
}
