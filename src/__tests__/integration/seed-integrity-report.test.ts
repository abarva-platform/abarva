import { buildSeedIntegrityMarkdown } from '@/lib/integrity/seed-integrity-report';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { filterProgramsSeedPlan } from '@/lib/programs/enhancement-seed-writer';
import { validateProgramsSeedEnhancementSpec } from '@/lib/programs/enhancement-spec';

describe('seed integrity report', () => {
  it('summarizes the full programs enhancement seed inventory', () => {
    const plan = filterProgramsSeedPlan(buildAllProgramsSeedPlan());
    const validation = validateProgramsSeedEnhancementSpec();
    const markdown = buildSeedIntegrityMarkdown(plan, validation, {
      mode: 'dry-run',
      filters: {},
      timestamp: '2026-04-23T00-00-00-000Z',
    });

    expect(markdown).toContain('# Seed Integrity Report');
    expect(markdown).toContain('- **Schema validation:** PASS');
    // Program count is dynamic — matches active tenant portfolios (Keystone retired 2026-05-07).
    expect(markdown).toMatch(/- Programs emitted: \*\*\d+\*\*/);
    expect(markdown).toMatch(/- Deliverables emitted: \*\*\d+\*\*/);
    expect(markdown).toMatch(/- Rich \/ Outline \/ Stub: \*\*44 \/ \d+ \/ \d+\*\*/);
    expect(markdown).toContain('| Tenant | Actual P1 / P2 / P3 / P4 / P5 | Expected P1 / P2 / P3 / P4 / P5 | Programs |');
    expect(markdown).toContain('| Apex Retail Group | 1 / 1 / 1 / 2 / 1 | 1 / 1 / 1 / 2 / 1 | 6 |');
    expect(markdown).toContain('| Meridian Health System | 1 / 1 / 1 / 1 / 1 | 1 / 1 / 1 / 1 / 1 | 5 |');
    expect(markdown).toContain('| First Capital Financial | 1 / 1 / 1 / 1 / 0 | 1 / 1 / 1 / 1 / 0 | 4 |');
    expect(markdown).toContain('| ST |');
    expect(markdown).toContain('| WA |');
    expect(markdown).toContain('| PM |');
    expect(markdown).toContain('| AP |');
    expect(markdown).toContain('| OO |');
  });
});
