import fs from 'node:fs';
import path from 'node:path';
import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import { buildTowerBandMetrics } from '@/lib/tower/band-metrics-view';
import { buildTowerPressuresView } from '@/lib/tower/pressure-cards-view';
import { buildStrategicAlignment2x2View } from '@/lib/tower/strategic-alignment-2x2-view';
import { buildAtlasInterpretation } from '@/lib/tower/atlas-interpretation-view';
import { buildTowerRightRailReasoningTrace } from '@/lib/tower/atlas-reasoning-trace';
import { validateAtlasCitationList } from '@/lib/tower/atlas-citation-validator';

function initiative(partial: Partial<AIInitiative> & Pick<AIInitiative, 'initiativeId' | 'displayId' | 'name'>): AIInitiative {
  return {
    initiativeId: partial.initiativeId,
    displayId: partial.displayId,
    name: partial.name,
    description: partial.description ?? `${partial.name} description`,
    primaryCategoryId: partial.primaryCategoryId ?? 'CAT-01',
    primaryCategoryName: partial.primaryCategoryName ?? 'Productivity',
    secondaryCategoryId: partial.secondaryCategoryId ?? null,
    secondaryCategoryName: partial.secondaryCategoryName ?? null,
    primaryGoalId: partial.primaryGoalId ?? 'GOAL-01',
    primaryGoalName: partial.primaryGoalName ?? 'Margin',
    stage: partial.stage ?? 'pilot',
    stageDetail: partial.stageDetail ?? null,
    ownerName: partial.ownerName ?? 'Owner',
    ownerTitle: partial.ownerTitle ?? 'VP',
    ownerFunction: partial.ownerFunction ?? 'IT',
    committedAnnualUsd: partial.committedAnnualUsd ?? 1_000_000,
    committedTotalUsd: partial.committedTotalUsd ?? 1_000_000,
    measuredValueUsd: partial.measuredValueUsd ?? 0,
    statusFlag: partial.statusFlag ?? 'healthy',
    statusSummary: partial.statusSummary ?? 'On track',
    confidenceLevel: partial.confidenceLevel ?? 'HIGH',
    alignedCallout: partial.alignedCallout ?? false,
    alignedRationale: partial.alignedRationale ?? null,
    loadedViaTemplate: partial.loadedViaTemplate ?? 'test/full_load.json',
  };
}

function vendor(partial: Partial<AIInitiativeVendorRow> & Pick<AIInitiativeVendorRow, 'vendorId' | 'initiativeId' | 'vendorName'>): AIInitiativeVendorRow {
  return {
    vendorId: partial.vendorId,
    initiativeId: partial.initiativeId,
    initiativeDisplayId: partial.initiativeDisplayId ?? partial.initiativeId,
    initiativeName: partial.initiativeName ?? partial.initiativeId,
    vendorName: partial.vendorName,
    contractValueUsd: partial.contractValueUsd ?? 500_000,
    renewalDate: partial.renewalDate ?? null,
    financialHealth: partial.financialHealth ?? 'strong',
  };
}

describe('Atlas reasoning traces', () => {
  it('summarizes Tower right-rail reasoning without persisting full substrate', () => {
    const todayIso = '2026-05-12';
    const initiatives = [
      initiative({
        initiativeId: 'i1',
        displayId: 'APX-01',
        name: 'Contact Center AI',
        statusFlag: 'value_lag',
        statusSummary: 'Measured value is 400000 against 1000000 annual committed.',
        measuredValueUsd: 400_000,
      }),
      initiative({
        initiativeId: 'i2',
        displayId: 'APX-02',
        name: 'Merchandising Copilot',
        stage: 'scaled',
        measuredValueUsd: 1_500_000,
        alignedCallout: true,
      }),
    ];
    const vendors = [
      vendor({
        vendorId: 'v1',
        initiativeId: 'i1',
        initiativeDisplayId: 'APX-01',
        vendorName: 'Sierra',
        renewalDate: '2026-06-20',
      }),
    ];
    const reasoningInput = {
      tenant: { name: 'Apex Retail', clientId: 'client-1' },
      todayIso,
      lens: 'value' as const,
      bandMetrics: buildTowerBandMetrics(initiatives, vendors, todayIso, 'value'),
      pressuresView: buildTowerPressuresView(initiatives, vendors, todayIso, 'value'),
      alignment2x2View: buildStrategicAlignment2x2View(initiatives),
      initiatives,
      vendors,
    };
    const interpretation = buildAtlasInterpretation(reasoningInput);

    const trace = buildTowerRightRailReasoningTrace({
      ctx: { clientId: 'client-1', userId: 'user-1' },
      reasoningInput,
      interpretation,
      fallbackUsed: false,
      latencyMs: 12,
    });

    expect(trace.trigger).toBe('tower_right_rail_render');
    expect(trace.inputSummary).toEqual(expect.objectContaining({
      initiativesCount: 2,
      vendorsCount: 1,
      pressuresCount: 2,
      lens: 'value',
      todayIso,
    }));
    expect(trace.observations[0]).toEqual(expect.objectContaining({
      number: 1,
      citationsCount: expect.any(Number),
      actionsCount: expect.any(Number),
    }));
    expect(trace.patternsSkipped.length).toBeGreaterThan(0);
    expect(trace.citations.length).toBeGreaterThan(0);
    expect(validateAtlasCitationList(trace.citations)).toEqual([]);
  });

  it('defines the atlas_reasoning_traces table and indexes', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20260513140000_atlas_reasoning_traces.sql'),
      'utf8',
    );

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS atlas_reasoning_traces');
    expect(migration).toContain('idx_atlas_reasoning_traces_tenant_timestamp');
    expect(migration).toContain("trigger IN ('tower_right_rail_render','atlas_chat_turn','metric_explanation')");
    expect(migration).toContain('authenticated_read_atlas_reasoning_traces');
  });
});
