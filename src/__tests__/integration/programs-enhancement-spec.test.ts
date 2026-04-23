import {
  SPEC_PHASE_TO_APP_PHASE,
  TENANT_PORTFOLIOS,
  buildDeliverablePlanForProgram,
  getMatrixEntry,
  summarizeProgramsSeedEnhancementSpec,
  validateProgramsSeedEnhancementSpec,
} from '@/lib/programs/enhancement-spec';

describe('Programs seed & deliverable generation enhancement spec', () => {
  it('encodes the phase mapping needed for the current app model', () => {
    expect(SPEC_PHASE_TO_APP_PHASE).toEqual({
      1: 0,
      2: 1,
      3: 2,
      4: 3,
      5: 4,
    });
  });

  it('returns the expected required and optional matrix entries for representative archetype-phase pairs', () => {
    expect(getMatrixEntry('OO', 3)).toEqual({
      required: ['D12', 'D14', 'D15', 'D16', 'D17', 'D18'],
      optional: ['D11'],
    });

    expect(getMatrixEntry('PM', 4)).toEqual({
      required: ['D19', 'D20', 'D21', 'D23', 'D24'],
      optional: ['D18', 'D22'],
    });
  });

  it('builds the Morrison hero program with rich current-phase deliverables and future-phase stubs', () => {
    const apex = TENANT_PORTFOLIOS.find((portfolio) => portfolio.tenantKey === 'apexretail');
    const morrison = apex?.programs.find((program) => program.code === 'APX-01');

    expect(morrison).toBeDefined();

    const deliverables = buildDeliverablePlanForProgram(morrison!);
    const richCodes = deliverables.filter((entry) => entry.renderTier === 'rich').map((entry) => entry.code);
    const stubCodes = deliverables.filter((entry) => entry.renderTier === 'stub').map((entry) => entry.code);

    expect(richCodes).toEqual([
      'D01', 'D02', 'D03', 'D04',
      'D07', 'D08', 'D09', 'D10', 'D11',
      'D12', 'D14', 'D15', 'D16', 'D17', 'D18',
      'D19', 'D20', 'D22', 'D24',
    ]);
    expect(stubCodes).toEqual(['D24', 'D25', 'D26', 'D27', 'D28']);
  });

  it('summarizes the seeded contract at the expected scale', () => {
    const summary = summarizeProgramsSeedEnhancementSpec();

    expect(summary.totalPrograms).toBe(19);
    expect(summary.totalRichDeliverables).toBe(44);
    expect(summary.totalSeededNonStubDeliverables).toBe(283);
    expect(summary.totalOutlineDeliverables).toBe(239);
    expect(summary.totalStubDeliverables).toBe(174);
    expect(summary.phaseCoverageByTenantCount).toEqual({
      1: 3,
      2: 4,
      3: 4,
      4: 4,
      5: 3,
    });
  });

  it('passes structural validation and surfaces narrative mismatches as warnings', () => {
    const result = validateProgramsSeedEnhancementSpec();

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      'Part 2 says every archetype appears in at least 3 tenants, but encoded portfolios produce ST=1 and OO=2.',
      'Part 2 cross-tenant totals claim 2 Rich programs / 17 Outline programs, but the explicit program tables mark 3 programs as Rich-capable.',
    ]);
  });
});
