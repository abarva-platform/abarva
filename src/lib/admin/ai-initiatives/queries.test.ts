import {
  getAIInitiativesPageData,
  listKpisForClient,
  listBusinessGoalsForClient,
  listCategories,
  listInitiativesForClient,
  listVendorsForClient,
} from './queries';
import { azureRead } from '@/lib/data-plane/azureRead';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: jest.fn(),
  },
}));

const selectMock = azureRead.select as jest.MockedFunction<typeof azureRead.select>;

const initiativeRow = {
  initiative_id: 'INIT-1',
  display_id: 'INIT-LOYALTY-RESET',
  name: 'Loyalty Reset',
  description: 'Rescope the loyalty AI wave.',
  primary_category_id: 'CAT-1',
  secondary_category_id: null,
  primary_goal_id: 'GOAL-1',
  stage: 'scale',
  stage_detail: 'Phase 2',
  owner_name: 'Priya Shah',
  owner_title: 'CIO',
  owner_function: 'Technology',
  committed_annual_usd: '12000000',
  committed_total_usd: 24000000,
  measured_value_usd: null,
  status_flag: 'yellow',
  status_summary: 'Scope pressure',
  confidence_level: 'medium',
  aligned_callout: true,
  aligned_rationale: 'Aligned to customer value.',
  loaded_via_template: 'packet-18',
};

const categoryRow = {
  category_id: 'CAT-1',
  name: 'Customer AI',
  definition: 'Customer-facing AI work.',
  display_order: 1,
};

const goalRow = {
  goal_id: 'GOAL-1',
  name: 'Margin expansion',
  strategic_context: 'Improve operating margin.',
  display_order: 1,
};

describe('AI initiatives admin queries', () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it('reads categories through azureRead', async () => {
    selectMock.mockResolvedValueOnce([
      {
        category_id: 'CAT-1',
        name: 'Customer AI',
        definition: 'Customer-facing AI work.',
        display_order: 1,
      },
    ]);

    await expect(listCategories()).resolves.toEqual([
      {
        categoryId: 'CAT-1',
        name: 'Customer AI',
        definition: 'Customer-facing AI work.',
        displayOrder: 1,
      },
    ]);
    expect(selectMock).toHaveBeenCalledWith({
      table: 'ai_categories',
      columns: ['category_id', 'name', 'definition', 'display_order'],
      orderBy: { column: 'display_order', direction: 'asc' },
    });
  });

  it('tenant-scopes business goals through azureRead', async () => {
    selectMock.mockResolvedValueOnce([
      {
        goal_id: 'GOAL-1',
        name: 'Margin expansion',
        strategic_context: 'Improve operating margin.',
        display_order: 2,
      },
    ]);

    await expect(listBusinessGoalsForClient('apexretail')).resolves.toEqual([
      {
        goalId: 'GOAL-1',
        name: 'Margin expansion',
        strategicContext: 'Improve operating margin.',
        displayOrder: 2,
      },
    ]);
    expect(selectMock).toHaveBeenCalledWith({
      table: 'ai_business_goals',
      columns: ['goal_id', 'name', 'strategic_context', 'display_order'],
      where: { client_id: 'apexretail' },
      orderBy: { column: 'display_order', direction: 'asc' },
    });
  });

  it('hydrates initiatives with category and goal labels', async () => {
    selectMock
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([categoryRow])
      .mockResolvedValueOnce([goalRow]);

    await expect(listInitiativesForClient('apexretail')).resolves.toMatchObject([
      {
        initiativeId: 'INIT-1',
        displayId: 'INIT-LOYALTY-RESET',
        primaryCategoryName: 'Customer AI',
        primaryGoalName: 'Margin expansion',
        committedAnnualUsd: 12000000,
        committedTotalUsd: 24000000,
      },
    ]);
    expect(selectMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      table: 'ai_initiatives',
      where: { client_id: 'apexretail' },
      orderBy: { column: 'display_id', direction: 'asc' },
    }));
  });

  it('reads initiative vendors through azureRead after tenant-scoped initiative lookup', async () => {
    selectMock
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([categoryRow])
      .mockResolvedValueOnce([goalRow])
      .mockResolvedValueOnce([
        {
          vendor_id: 'VEND-1',
          initiative_id: 'INIT-1',
          vendor_name: 'Wipro',
          contract_value_usd: '32000000',
          renewal_date: new Date('2026-11-30T00:00:00.000Z'),
          financial_health: 'watch',
        },
      ]);

    await expect(listVendorsForClient('apexretail')).resolves.toEqual([
      {
        vendorId: 'VEND-1',
        initiativeId: 'INIT-1',
        initiativeDisplayId: 'INIT-LOYALTY-RESET',
        initiativeName: 'Loyalty Reset',
        vendorName: 'Wipro',
        contractValueUsd: 32000000,
        renewalDate: '2026-11-30',
        financialHealth: 'watch',
      },
    ]);
    expect(selectMock).toHaveBeenLastCalledWith(expect.objectContaining({
      table: 'ai_initiative_vendors',
      where: { initiative_id: { op: 'in', value: ['INIT-1'] } },
      orderBy: { column: 'renewal_date', direction: 'asc', nulls: 'last' },
    }));
  });

  it('reads initiative KPIs through azureRead after tenant-scoped initiative lookup', async () => {
    selectMock
      .mockResolvedValueOnce([initiativeRow])
      .mockResolvedValueOnce([categoryRow])
      .mockResolvedValueOnce([goalRow])
      .mockResolvedValueOnce([
        {
          initiative_id: 'INIT-1',
          kpi_name: 'Adoption',
          kpi_unit: 'pct',
          quarter: '2026-Q1',
          kpi_value: '64',
          target_value: '70',
          peer_median: null,
          confidence_level: 'medium',
        },
      ]);

    await expect(listKpisForClient('apexretail')).resolves.toEqual([
      {
        initiativeId: 'INIT-1',
        initiativeDisplayId: 'INIT-LOYALTY-RESET',
        initiativeName: 'Loyalty Reset',
        kpiName: 'Adoption',
        kpiUnit: 'pct',
        quarter: '2026-Q1',
        kpiValue: 64,
        targetValue: 70,
        peerMedian: null,
        confidenceLevel: 'medium',
      },
    ]);
    expect(selectMock).toHaveBeenLastCalledWith(expect.objectContaining({
      table: 'ai_initiative_kpis',
      where: { initiative_id: { op: 'in', value: ['INIT-1'] } },
      orderBy: { column: 'quarter', direction: 'asc' },
    }));
  });

  it('loads the page data with tenant-scoped goals and initiatives', async () => {
    selectMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(getAIInitiativesPageData('apexretail')).resolves.toEqual({
      categories: [],
      goals: [],
      initiatives: [],
    });
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'ai_business_goals',
      where: { client_id: 'apexretail' },
    }));
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'ai_initiatives',
      where: { client_id: 'apexretail' },
    }));
  });
});
