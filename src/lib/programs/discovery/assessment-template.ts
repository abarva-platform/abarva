// =============================================================================
// Discovery Intake — current-state assessment template generator (S8)
// -----------------------------------------------------------------------------
// Pure: turn a DiscoveryPlan (domains × dimensions, scoped to the use case) into
// a structured assessment-template spec — one sheet per data domain plus a
// maturity summary — that the client/maestro fills and uploads back (the
// extraction path in S3 routes the filled result into the shape). Breadth is
// already use-case-scoped upstream (dimensionsForShape), so the template only
// asks what this engagement needs.
//
// No file I/O here — the XLSX/DOCX render of this spec is S8b. This is the
// deterministic, testable shape.
// =============================================================================

import type { DiscoveryPlan } from './discovery-intake';

export interface TemplateColumn {
  key: string;
  label: string;
  /** a hint shown to the filler (e.g. "1–5"). */
  hint?: string;
}

export interface TemplateSheet {
  name: string;
  /** the data domain this sheet assesses (absent for the summary). */
  domain?: string;
  columns: TemplateColumn[];
  /** pre-seeded rows (one per dimension); blank cells for the filler. */
  rows: Record<string, string>[];
}

export interface AssessmentTemplate {
  title: string;
  generatedFor: string;
  sheets: TemplateSheet[];
}

const DOMAIN_COLUMNS: TemplateColumn[] = [
  { key: 'dimension', label: 'Dimension' },
  { key: 'current', label: 'Current level', hint: '1–5' },
  { key: 'target', label: 'Target level', hint: '1–5' },
  { key: 'volumetrics', label: 'Volumetrics / scale' },
  { key: 'tooling', label: 'Tooling in use' },
  { key: 'evidence', label: 'Evidence / link' },
  { key: 'owner', label: 'Owner' },
  { key: 'notes', label: 'Notes' },
];

const SUMMARY_COLUMNS: TemplateColumn[] = [
  { key: 'dimension', label: 'Dimension' },
  { key: 'current', label: 'Current', hint: '1–5' },
  { key: 'target', label: 'Target', hint: '1–5' },
  { key: 'industry', label: 'Industry benchmark', hint: '1–5' },
];

/** Build the current-state assessment template spec for a discovery plan. */
export function buildAssessmentTemplate(
  plan: DiscoveryPlan,
  opts: { moveLabel: string },
): AssessmentTemplate {
  // domains in scope, in first-seen order; dimensions per domain (in-scope only).
  const byDomain = new Map<string, string[]>();
  for (const cell of plan.domainsXDimensions) {
    if (!cell.inScope) continue;
    const list = byDomain.get(cell.domain) ?? [];
    if (!list.includes(cell.dimension)) list.push(cell.dimension);
    byDomain.set(cell.domain, list);
  }

  const targetFor = new Map(plan.maturityTargets.map((t) => [t.dimension, t]));

  const domainSheets: TemplateSheet[] = [...byDomain.entries()].map(([domain, dimensions]) => ({
    name: domain,
    domain,
    columns: DOMAIN_COLUMNS,
    rows: dimensions.map((dimension) => {
      const t = targetFor.get(dimension);
      return {
        dimension,
        current: t?.current != null ? String(t.current) : '',
        target: t?.target != null ? String(t.target) : '',
        volumetrics: '',
        tooling: '',
        evidence: '',
        owner: '',
        notes: '',
      };
    }),
  }));

  const summarySheet: TemplateSheet = {
    name: 'Maturity summary',
    columns: SUMMARY_COLUMNS,
    rows: plan.maturityTargets.map((t) => ({
      dimension: t.dimension,
      current: t.current != null ? String(t.current) : '',
      target: t.target != null ? String(t.target) : '',
      industry: '',
    })),
  };

  return {
    title: `Current-State Assessment — ${opts.moveLabel}`,
    generatedFor: opts.moveLabel,
    sheets: [summarySheet, ...domainSheets],
  };
}
