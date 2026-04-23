import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TENANT_PORTFOLIOS, type validateProgramsSeedEnhancementSpec } from '@/lib/programs/enhancement-spec';
import type { FilteredProgramsSeedPlan, SeedWriteFilters, SeedWriteMode } from '@/lib/programs/enhancement-seed-writer';

export interface SeedIntegrityReportOptions {
  mode: SeedWriteMode;
  filters: SeedWriteFilters;
  timestamp?: string;
}

export interface SeedIntegrityMarkdownOptions {
  mode: SeedWriteMode;
  filters: SeedWriteFilters;
  timestamp: string;
}

export interface SeedIntegrityReportResult {
  path: string;
  markdown: string;
}

type SeedValidationResult = ReturnType<typeof validateProgramsSeedEnhancementSpec>;

export function writeSeedIntegrityReport(
  plan: FilteredProgramsSeedPlan,
  validation: SeedValidationResult,
  options: SeedIntegrityReportOptions,
): SeedIntegrityReportResult {
  const timestamp = options.timestamp ?? new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(process.cwd(), 'reports');
  const outputPath = join(outputDir, `seed-integrity-${timestamp}.md`);
  const markdown = buildSeedIntegrityMarkdown(plan, validation, { ...options, timestamp });

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${markdown}\n`);
  return { path: outputPath, markdown };
}

export function buildSeedIntegrityMarkdown(
  plan: FilteredProgramsSeedPlan,
  validation: SeedValidationResult,
  options: SeedIntegrityMarkdownOptions,
): string {
  const phaseRows = plan.tenants.map((tenant) => {
    const expected = TENANT_PORTFOLIOS.find((portfolio) => portfolio.tenantKey === tenant.tenantKey)?.expectedPhaseDistribution;
    const actual = [1, 2, 3, 4, 5].map((phase) => tenant.programs.filter((program) => program.currentPhaseSpec === phase).length);
    const expectedText = expected ? [1, 2, 3, 4, 5].map((phase) => expected[String(phase) as keyof typeof expected]).join(' / ') : 'n/a';
    return `| ${tenant.displayName} | ${actual.join(' / ')} | ${expectedText} | ${actual.reduce((sum, value) => sum + value, 0)} |`;
  });
  const archetypeRows = Object.entries(deliverableCountByArchetype(plan)).map(([archetype, count]) => `| ${archetype} | ${count.programs} | ${count.deliverables} |`);
  const warnings = validation.warnings.length ? validation.warnings.map((warning) => `- ${warning}`).join('\n') : '- none';
  const errors = validation.errors.length ? validation.errors.map((error) => `- ${error}`).join('\n') : '- none';
  const seedWarnings = buildSeedWarnings(plan, validation);
  const filterSummary = [
    options.filters.tenantKeys?.length ? `tenant=${options.filters.tenantKeys.join(',')}` : null,
    options.filters.programCodes?.length ? `program=${options.filters.programCodes.join(',')}` : null,
    options.filters.includeStubs === false ? 'no-stubs' : null,
  ].filter(Boolean).join(' · ') || 'none';

  return [
    `# Seed Integrity Report · ${options.timestamp}`,
    '',
    `- **Mode:** ${options.mode}`,
    `- **Filters:** ${filterSummary}`,
    `- **Schema validation:** ${validation.errors.length === 0 ? 'PASS' : 'FAIL'}`,
    '',
    '## Totals',
    '',
    `- Programs emitted: **${plan.summary.programs}**`,
    `- Deliverables emitted: **${plan.summary.deliverables}**`,
    `- Deliverable types: **${plan.summary.deliverableTypes}**`,
    `- Rich / Outline / Stub: **${plan.summary.richDeliverables} / ${plan.summary.outlineDeliverables} / ${plan.summary.stubDeliverables}**`,
    '',
    '## Per-Tenant Phase Distribution',
    '',
    '| Tenant | Actual P1 / P2 / P3 / P4 / P5 | Expected P1 / P2 / P3 / P4 / P5 | Programs |',
    '| --- | --- | --- | ---: |',
    ...phaseRows,
    '',
    '## Per-Archetype Deliverable Counts',
    '',
    '| Archetype | Programs | Deliverables |',
    '| --- | ---: | ---: |',
    ...archetypeRows,
    '',
    '## Schema Validation',
    '',
    '### Errors',
    errors,
    '',
    '### Warnings',
    warnings,
    '',
    '## Seed Warnings',
    '',
    seedWarnings.length ? seedWarnings.map((warning) => `- ${warning}`).join('\n') : '- none',
  ].join('\n');
}

function deliverableCountByArchetype(plan: FilteredProgramsSeedPlan): Record<string, { programs: number; deliverables: number }> {
  return plan.programs.reduce<Record<string, { programs: number; deliverables: number }>>((acc, program) => {
    const current = acc[program.archetypeCode] ?? { programs: 0, deliverables: 0 };
    current.programs += 1;
    current.deliverables += program.deliverables.length;
    acc[program.archetypeCode] = current;
    return acc;
  }, {});
}

function buildSeedWarnings(plan: FilteredProgramsSeedPlan, validation: SeedValidationResult): string[] {
  const warnings = [...validation.warnings];
  if (plan.summary.programs === 0) warnings.push('No programs emitted for the selected filters.');
  if (plan.summary.deliverables === 0) warnings.push('No deliverables emitted for the selected filters.');
  if (plan.summary.richDeliverables === 0) warnings.push('No Rich deliverables emitted; demo hero routes may not have print-ready content.');
  return warnings;
}
