import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_TEMPLATES, TEMPLATE_VERSION, type DimensionTemplate } from './schema';

function enumHint(t: DimensionTemplate): string[] {
  const hints: string[] = [];
  for (const col of t.columns) {
    if (col.type === 'enum' && col.enumValues) {
      hints.push(`# ${col.label}: ${col.enumValues.join(' | ')}`);
    }
    if (col.type === 'list' && col.listSeparator) {
      hints.push(`# ${col.label}: pipe-separated list (${col.listSeparator})`);
    }
  }
  return hints;
}

function buildCsv(t: DimensionTemplate): string {
  const banner = [
    `# AbarVa Control Tower · ${t.displayName} Template v${TEMPLATE_VERSION}`,
    `# ${t.description}`,
    `# Required columns marked with *.`,
    `# Update templates: npm run templates:build`,
    `# In-app catalog: /tower/onboard/${t.dimension}`,
  ];

  const enumHints = enumHint(t);
  if (enumHints.length > 0) {
    banner.push('#');
    banner.push(...enumHints);
  }

  const headerLine = t.columns.map((c) => (c.required ? `${c.label}*` : c.label)).join(',');
  const exampleValues = t.columns.map((c) => {
    const v = t.exampleRow[c.key] ?? '';
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  });
  const exampleLine = `# Example row (delete before uploading):`;
  const exampleRow = exampleValues.join(',');

  return [banner.join('\n'), '', headerLine, exampleLine, exampleRow, ''].join('\n');
}

export function generateCsvTemplates(outDir: string): string[] {
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const t of ALL_TEMPLATES) {
    const path = join(outDir, `${t.filenameBase}.csv`);
    writeFileSync(path, buildCsv(t), 'utf8');
    written.push(path);
  }
  return written;
}
