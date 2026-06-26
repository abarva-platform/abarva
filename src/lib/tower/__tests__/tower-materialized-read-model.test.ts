import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  listMaterializedTowerReadModelForClient,
  shapeTowerMaterializedReadModel,
} from '@/lib/tower/tower-materialized-read-model';
import type { AzureReadClient, AzureReadSelect } from '@/lib/data-plane/azureRead';

function makeDb(tables: Record<string, Array<Record<string, unknown>>>): AzureReadClient {
  return {
    async query() {
      return [];
    },
    async select<R = Record<string, unknown>>(request: AzureReadSelect) {
      return ((tables[request.table] ?? []) as R[]).slice(0, request.limit ?? undefined);
    },
    async maybeSingle<R = Record<string, unknown>>(request: AzureReadSelect) {
      const rows = ((tables[request.table] ?? []) as R[]).slice(0, 1);
      return rows[0] ?? null;
    },
    async count(request) {
      return tables[request.table]?.length ?? 0;
    },
    async withSession(fn) {
      return fn(async () => []);
    },
  };
}

describe('tower materialized read model', () => {
  it('shapes tower_read_model rows into existing Tower UI contracts', () => {
    const shaped = shapeTowerMaterializedReadModel({
      initiativeRows: [
        {
          initiative_id: 'tower:lak:copilot-finance',
          display_id: 'LAK-AI-001',
          name: 'M365 Copilot finance rollout',
          description: 'Finance pilot with measured adoption gap.',
          category_id: 'finance_ai',
          category_name: 'Finance AI',
          goal_id: 'tower_value',
          goal_name: 'Tower value proof',
          stage: 'pilot',
          stage_detail: 'pilot',
          owner_name: 'Finance transformation owner',
          owner_title: 'Finance transformation owner',
          owner_function: 'Finance',
          committed_annual_usd: '90000',
          committed_total_usd: '3000000',
          measured_value_usd: '400000',
          status_flag: 'value_lag',
          status_summary: 'Adoption and value proof lag the business case.',
          confidence_level: 'HIGH',
          aligned_callout: false,
          aligned_rationale: null,
          loaded_via_template: 'tower_materialized_read_model',
          gaps: [],
        },
      ],
      vendorRows: [
        {
          vendor_id: 'vendor:microsoft',
          vendor_name: 'Microsoft',
          initiative_id: 'tower:lak:copilot-finance',
          initiative_display_id: 'LAK-AI-001',
          initiative_name: 'M365 Copilot finance rollout',
          contract_value_usd: '90000',
          renewal_date: '2026-09-30',
          financial_health: 'watch',
        },
      ],
    });

    expect(shaped.source).toBe('tower_materialized_read_model');
    expect(shaped.initiatives[0]).toMatchObject({
      initiativeId: 'tower:lak:copilot-finance',
      displayId: 'LAK-AI-001',
      name: 'M365 Copilot finance rollout',
      primaryCategoryName: 'Finance AI',
      committedAnnualUsd: 90_000,
      committedTotalUsd: 3_000_000,
      measuredValueUsd: 400_000,
      statusFlag: 'value_lag',
      confidenceLevel: 'HIGH',
    });
    expect(shaped.vendors[0]).toMatchObject({
      vendorName: 'Microsoft',
      initiativeDisplayId: 'LAK-AI-001',
      contractValueUsd: 90_000,
      renewalDate: '2026-09-30',
      financialHealth: 'watch',
    });
  });

  it('reads only tower_read_model tables at runtime', async () => {
    const calls: string[] = [];
    const db = makeDb({
      tower_read_model_initiatives: [],
      tower_read_model_vendors: [],
    });
    const wrapped: AzureReadClient = {
      ...db,
      async select(request) {
        calls.push(request.table);
        return db.select(request);
      },
    };

    await listMaterializedTowerReadModelForClient({
      clientId: 'client-1',
      tenantKey: 'lakeshore-holdings',
      db: wrapped,
    });

    expect(calls).toEqual(['tower_read_model_initiatives', 'tower_read_model_vendors']);
  });

  it('keeps Tower current-state runtime off the enterprise-context projection fallback', () => {
    const file = readFileSync(
      path.join(process.cwd(), 'src/lib/atlas/tower-grounding.ts'),
      'utf8',
    );

    expect(file).toContain('tower-materialized-read-model');
    expect(file).not.toContain('tower-semantic-projection');
    expect(file).not.toContain('listProjectedTowerReadModelForClient');
    expect(file).not.toContain('enterprise_context_records');
  });
});
