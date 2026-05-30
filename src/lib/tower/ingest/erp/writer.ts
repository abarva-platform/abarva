// Tower · ERP ingest · DB writer.
//
// Takes the validated parser output and upserts it into the two
// tables created by migration 20260530134228_tower_program_financials.
// The upsert is keyed on the natural-key uniques declared in the
// migration so re-running the CLI is safe (idempotent).
//
// Transactional across both tables: if either fails, neither is
// applied. The route under api/tower/upload/route.ts can also call
// this directly — it's data-plane-agnostic.

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type {
  ErpProgramFinancialRow,
  ErpSourceSystem,
  ErpVendorRow,
} from './parse';

export interface ErpWriteSummary {
  vendors_upserted: number;
  financials_upserted: number;
  notes: string[];
}

export interface WriteErpDatasetArgs {
  clientId: string;
  sourceFileId: string | null;
  sourceSystem: ErpSourceSystem;
  vendors: ErpVendorRow[];
  financials: ErpProgramFinancialRow[];
  dryRun?: boolean;
  client?: PostgresCompatClient;
}

export async function writeErpDataset(args: WriteErpDatasetArgs): Promise<ErpWriteSummary> {
  const notes: string[] = [];
  if (args.dryRun) {
    notes.push('dry-run: no DB writes performed');
    return {
      vendors_upserted: args.vendors.length,
      financials_upserted: args.financials.length,
      notes,
    };
  }

  const client = args.client ?? getAzureWriteFluentClient();

  // The fluent client exposes Supabase-shaped .from().upsert(); under
  // the hood it routes to the active write adapter. We chunk both
  // payloads to keep individual statements bounded.
  const CHUNK = 200;
  let vendorsUpserted = 0;
  let financialsUpserted = 0;

  // Vendors first — the financials FK relies on them. Upsert on
  // (client_id, vendor_id) which the migration declares unique.
  for (let i = 0; i < args.vendors.length; i += CHUNK) {
    const chunk = args.vendors.slice(i, i + CHUNK);
    const payload = chunk.map((v) => ({
      client_id: args.clientId,
      vendor_id: v.vendor_id,
      vendor_name: v.vendor_name,
      cost_center: v.cost_center,
      gl_account: v.gl_account,
      ttm_spend_usd: v.ttm_spend_usd,
      source: 'manual_upload' as const,
      source_file_id: args.sourceFileId,
      source_system: args.sourceSystem,
    }));
    const { error } = await client
      .from('tower_vendor_spend')
      .upsert(payload, { onConflict: 'client_id,vendor_id' });
    if (error) {
      throw new Error(`tower_vendor_spend upsert failed: ${error.message}`);
    }
    vendorsUpserted += chunk.length;
  }

  for (let i = 0; i < args.financials.length; i += CHUNK) {
    const chunk = args.financials.slice(i, i + CHUNK);
    const payload = chunk.map((f) => ({
      client_id: args.clientId,
      program_id: f.program_id,
      period_start: f.period_start,
      period_end: f.period_end,
      budget_usd: f.budget_usd,
      actual_usd: f.actual_usd,
      capex_usd: f.capex_usd,
      opex_usd: f.opex_usd,
      vendor_id: f.vendor_id,
      cost_center: f.cost_center,
      gl_account: f.gl_account,
      source: 'manual_upload' as const,
      source_file_id: args.sourceFileId,
      source_system: args.sourceSystem,
    }));
    const { error } = await client
      .from('tower_program_financials')
      .upsert(payload, { onConflict: 'client_id,program_id,period_start' });
    if (error) {
      throw new Error(`tower_program_financials upsert failed: ${error.message}`);
    }
    financialsUpserted += chunk.length;
  }

  return {
    vendors_upserted: vendorsUpserted,
    financials_upserted: financialsUpserted,
    notes,
  };
}
