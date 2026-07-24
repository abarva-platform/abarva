/**
 * Nexus Pricing Engine — PR5 estimate-workflow persistence.
 *
 * Draft CRUD for `pricing_estimates` / `pricing_estimate_inputs` (mutable —
 * a save-after-each-step upsert, see the PR5 migration's header for why no
 * version-bump machinery is needed) and the replace-on-rerun write path for
 * `pricing_estimate_line_items`. Follows the same direct-`azureRead`-import
 * + injectable-store-port pattern as `../rate-card-repository.ts` (see that
 * file's header for the precedent this copies) so the full contract is
 * unit-testable without a live database.
 */
import { randomUUID } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import type { PricingEstimateInputRow, PricingEstimateLineItemRow, PricingEstimateRow } from "../types";
import type { CreateEstimateDraftInput, UpdateEstimateHeaderInput, UpsertEstimateInputRecord } from "./types";

// ---------------------------------------------------------------------------
// Store port — narrow seam so tests can exercise the full contract in-memory.
// ---------------------------------------------------------------------------

export interface EstimateWorkflowStorePort {
  insertEstimate(row: PricingEstimateRow): Promise<void>;
  getEstimateById(estimateId: string): Promise<PricingEstimateRow | null>;
  updateEstimateHeader(estimateId: string, patch: Record<string, unknown>): Promise<void>;
  listEstimateInputs(estimateId: string): Promise<PricingEstimateInputRow[]>;
  upsertEstimateInputs(estimateId: string, rows: PricingEstimateInputRow[]): Promise<void>;
  listLineItems(estimateId: string): Promise<PricingEstimateLineItemRow[]>;
  /** Deletes every existing pricing_estimate_line_items row for `estimateId`, then inserts `rows` — one transaction, never a partial replace. */
  replaceLineItems(estimateId: string, rows: PricingEstimateLineItemRow[], runId: string, ranAt: string): Promise<void>;
}

function defaultStore(session: TxSessionRunner = createTxSession("abarva-pricing-write")): EstimateWorkflowStorePort {
  return {
    async insertEstimate(row) {
      await session(async (run) => {
        await run(
          `INSERT INTO pricing_estimates
             (id, tenant_key, move_id, scenario_group_id, scenario_name, scenario_key,
              archetype_code, model_version, currency, target_start_date, target_duration_weeks,
              selected_rate_card_id, status, last_run_id, last_run_at, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            row.id,
            row.tenant_key,
            row.move_id,
            row.scenario_group_id,
            row.scenario_name,
            row.scenario_key,
            row.archetype_code,
            row.model_version,
            row.currency,
            row.target_start_date,
            row.target_duration_weeks,
            row.selected_rate_card_id,
            row.status,
            row.last_run_id,
            row.last_run_at,
            row.created_by,
            row.created_at,
            row.updated_at,
          ],
        );
      });
    },
    async getEstimateById(estimateId) {
      return azureRead.maybeSingle<PricingEstimateRow>({
        table: "pricing_estimates",
        where: { id: estimateId },
        missingTable: "empty",
      });
    },
    async updateEstimateHeader(estimateId, patch) {
      const columns = Object.keys(patch);
      if (columns.length === 0) return;
      await session(async (run) => {
        const setClauses = columns.map((c, i) => `${c} = $${i + 2}`).join(", ");
        await run(
          `UPDATE pricing_estimates SET ${setClauses}, updated_at = now() WHERE id = $1`,
          [estimateId, ...columns.map((c) => patch[c])],
        );
      });
    },
    async listEstimateInputs(estimateId) {
      return azureRead.select<PricingEstimateInputRow>({
        table: "pricing_estimate_inputs",
        where: { estimate_id: estimateId },
        missingTable: "empty",
      });
    },
    async upsertEstimateInputs(estimateId, rows) {
      await session(async (run) => {
        for (const row of rows) {
          await run(
            `INSERT INTO pricing_estimate_inputs
               (id, estimate_id, input_key, value, unit, required, source_type, source_ref,
                confidence, confirmed_by, confirmed_at, override_reason, model_version, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (estimate_id, input_key) DO UPDATE SET
               value = EXCLUDED.value,
               unit = EXCLUDED.unit,
               required = EXCLUDED.required,
               source_type = EXCLUDED.source_type,
               source_ref = EXCLUDED.source_ref,
               confidence = EXCLUDED.confidence,
               confirmed_by = EXCLUDED.confirmed_by,
               confirmed_at = EXCLUDED.confirmed_at,
               override_reason = EXCLUDED.override_reason,
               model_version = EXCLUDED.model_version,
               updated_at = now()`,
            [
              row.id,
              estimateId,
              row.input_key,
              JSON.stringify(row.value),
              row.unit,
              row.required,
              row.source_type,
              row.source_ref,
              row.confidence,
              row.confirmed_by,
              row.confirmed_at,
              row.override_reason,
              row.model_version,
              row.created_at,
              row.updated_at,
            ],
          );
        }
      });
    },
    async listLineItems(estimateId) {
      return azureRead.select<PricingEstimateLineItemRow>({
        table: "pricing_estimate_line_items",
        where: { estimate_id: estimateId },
        missingTable: "empty",
      });
    },
    async replaceLineItems(estimateId, rows, runId, ranAt) {
      await session(async (run) => {
        // Replace-on-rerun (see migration header): delete the estimate's
        // existing lines, then insert the new run's lines, in ONE
        // transaction — never a partial state where old and new rows coexist.
        await run(`DELETE FROM pricing_estimate_line_items WHERE estimate_id = $1`, [estimateId]);
        for (const row of rows) {
          await run(
            `INSERT INTO pricing_estimate_line_items
               (id, estimate_id, tenant_key, run_id, archetype_code, activity_pack_code, activity_pack_name,
                category, rule_code, operation, driver_code, driver_quantity, model_version, scenario_key,
                classification, shared_cost_ref, role_code, allocation_pct, raw_hours, complexity_factor,
                novelty_factor, assurance_factor, scenario_factor, expected_hours, role_hours,
                rate_resolved_from_scope, rate_hourly_cents, rate_currency, rate_card_version_id,
                labor_cost_cents, manual_cost_cents, gap_reason, override_rationale, formula_trace, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                     $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35)`,
            [
              row.id,
              estimateId,
              row.tenant_key,
              runId,
              row.archetype_code,
              row.activity_pack_code,
              row.activity_pack_name,
              row.category,
              row.rule_code,
              row.operation,
              row.driver_code,
              row.driver_quantity,
              row.model_version,
              row.scenario_key,
              row.classification,
              row.shared_cost_ref,
              row.role_code,
              row.allocation_pct,
              row.raw_hours,
              row.complexity_factor,
              row.novelty_factor,
              row.assurance_factor,
              row.scenario_factor,
              row.expected_hours,
              row.role_hours,
              row.rate_resolved_from_scope,
              row.rate_hourly_cents,
              row.rate_currency,
              row.rate_card_version_id,
              row.labor_cost_cents,
              row.manual_cost_cents,
              row.gap_reason,
              row.override_rationale,
              row.formula_trace,
              row.created_at,
            ],
          );
        }
        await run(
          `UPDATE pricing_estimates SET last_run_id = $2, last_run_at = $3, updated_at = now() WHERE id = $1`,
          [estimateId, runId, ranAt],
        );
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Draft CRUD service functions
// ---------------------------------------------------------------------------

export async function createDraftEstimate(
  input: CreateEstimateDraftInput,
  store: EstimateWorkflowStorePort = defaultStore(),
): Promise<PricingEstimateRow> {
  const now = new Date().toISOString();
  const row: PricingEstimateRow = {
    id: randomUUID(),
    tenant_key: input.tenantKey,
    move_id: input.moveId,
    scenario_group_id: input.scenarioGroupId ?? randomUUID(),
    scenario_name: input.scenarioName,
    scenario_key: input.scenarioKey ?? "traditional",
    archetype_code: input.archetypeCode,
    model_version: input.modelVersion,
    currency: input.currency ?? "USD",
    target_start_date: input.targetStartDate ?? null,
    target_duration_weeks: input.targetDurationWeeks ?? null,
    selected_rate_card_id: input.selectedRateCardId ?? null,
    status: "draft",
    last_run_id: null,
    last_run_at: null,
    created_by: input.createdBy ?? null,
    created_at: now,
    updated_at: now,
  };
  await store.insertEstimate(row);
  return row;
}

export async function getEstimate(
  estimateId: string,
  store: EstimateWorkflowStorePort = defaultStore(),
): Promise<PricingEstimateRow | null> {
  return store.getEstimateById(estimateId);
}

const HEADER_FIELD_MAP: Record<keyof UpdateEstimateHeaderInput, string> = {
  scenarioName: "scenario_name",
  scenarioKey: "scenario_key",
  archetypeCode: "archetype_code",
  currency: "currency",
  targetStartDate: "target_start_date",
  targetDurationWeeks: "target_duration_weeks",
  selectedRateCardId: "selected_rate_card_id",
  status: "status",
};

export async function updateEstimateHeader(
  estimateId: string,
  patch: UpdateEstimateHeaderInput,
  store: EstimateWorkflowStorePort = defaultStore(),
): Promise<void> {
  const columnPatch: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(HEADER_FIELD_MAP) as [keyof UpdateEstimateHeaderInput, string][]) {
    if (key in patch) columnPatch[column] = patch[key];
  }
  await store.updateEstimateHeader(estimateId, columnPatch);
}

export async function listEstimateInputs(
  estimateId: string,
  store: EstimateWorkflowStorePort = defaultStore(),
): Promise<PricingEstimateInputRow[]> {
  return store.listEstimateInputs(estimateId);
}

/**
 * Save-after-each-step (brief §9.3): upserts each input by `(estimate_id,
 * input_key)`. Passing `confirmedBy` marks the row confirmed as of now —
 * omitting it leaves a proposed/suggested value's confirmation state
 * untouched (never auto-confirmed by a mere save).
 */
export async function upsertEstimateInputs(
  estimateId: string,
  inputs: readonly UpsertEstimateInputRecord[],
  store: EstimateWorkflowStorePort = defaultStore(),
): Promise<PricingEstimateInputRow[]> {
  const existing = await store.listEstimateInputs(estimateId);
  const existingByKey = new Map(existing.map((r) => [r.input_key, r]));
  const now = new Date().toISOString();

  const rows: PricingEstimateInputRow[] = inputs.map((input) => {
    const prior = existingByKey.get(input.inputKey);
    return {
      id: prior?.id ?? randomUUID(),
      estimate_id: estimateId,
      input_key: input.inputKey,
      value: input.value,
      unit: input.unit ?? prior?.unit ?? null,
      required: input.required ?? prior?.required ?? false,
      source_type: input.sourceType,
      source_ref: input.sourceRef ?? prior?.source_ref ?? null,
      confidence: input.confidence ?? prior?.confidence ?? null,
      confirmed_by: input.confirmedBy !== undefined ? input.confirmedBy : (prior?.confirmed_by ?? null),
      confirmed_at: input.confirmedBy !== undefined ? (input.confirmedBy ? now : null) : (prior?.confirmed_at ?? null),
      override_reason: input.overrideReason ?? prior?.override_reason ?? null,
      model_version: input.modelVersion ?? prior?.model_version ?? null,
      created_at: prior?.created_at ?? now,
      updated_at: now,
    };
  });

  await store.upsertEstimateInputs(estimateId, rows);
  return rows;
}

export async function listLineItems(
  estimateId: string,
  store: EstimateWorkflowStorePort = defaultStore(),
): Promise<PricingEstimateLineItemRow[]> {
  return store.listLineItems(estimateId);
}

/**
 * Persist a fresh run's line items, replacing every prior line item for
 * `estimateId` (brief's explicit replace-on-rerun requirement — see the
 * migration header). Returns the run id/ranAt stamp so the caller can build
 * the results response.
 */
export async function replaceLineItems(
  estimateId: string,
  tenantKey: string,
  rows: readonly Omit<PricingEstimateLineItemRow, "id" | "estimate_id" | "tenant_key" | "run_id" | "created_at">[],
  store: EstimateWorkflowStorePort = defaultStore(),
): Promise<{ runId: string; ranAt: string }> {
  const runId = randomUUID();
  const ranAt = new Date().toISOString();
  const fullRows: PricingEstimateLineItemRow[] = rows.map((row) => ({
    ...row,
    id: randomUUID(),
    estimate_id: estimateId,
    tenant_key: tenantKey,
    run_id: runId,
    created_at: ranAt,
  }));
  await store.replaceLineItems(estimateId, fullRows, runId, ranAt);
  return { runId, ranAt };
}

export { defaultStore as defaultEstimateWorkflowStore };
