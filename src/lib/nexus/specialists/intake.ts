// Intake specialist · parse, extract entities, build retrieval plan.
// Runs every turn (spec §4.2). Deterministic parsing + optional Haiku
// entity extraction when heuristics fail.

import type { NexusMode, RetrievalPlan, TenancyCtx } from '@/lib/intelligence/types';

export interface IntakeOutput {
  entities: string[];
  layerHints: Array<'L1' | 'L2' | 'L3' | 'L4'>;
  dimensions: Array<'graph' | 'vector' | 'structured' | 'emergent'>;
  plan: RetrievalPlan;
}

const KNOWN_VENDORS = [
  'DAX', 'Abridge', 'Nuance', 'Epic', 'Cerner', 'Glean', 'Moveworks',
  'Snowflake', 'Databricks', 'Cohere', 'Olive', 'Notable', 'Salesforce',
  'ServiceNow', 'Glia', 'LivePerson', 'Observe.AI',
];

const KNOWN_PATTERNS = [
  /\bF0\d{2}\b/gi, // Genome pattern codes like F022, F031
  /\bP0\d{2}\b/gi,
];

function extractEntities(query: string): string[] {
  const found = new Set<string>();
  for (const v of KNOWN_VENDORS) {
    if (new RegExp(`\\b${v}\\b`, 'i').test(query)) found.add(v);
  }
  for (const pat of KNOWN_PATTERNS) {
    const matches = query.match(pat) ?? [];
    matches.forEach((m) => found.add(m.toUpperCase()));
  }
  // Capitalized multi-word proper nouns (heuristic — will miss plenty)
  const proper = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g) ?? [];
  for (const p of proper) {
    if (p.length >= 4 && !/^(The|A|An|Should|Which|How|What|Why|When|Where|I)/.test(p)) {
      found.add(p);
    }
  }
  return Array.from(found).slice(0, 10);
}

function planDimensions(mode: NexusMode, entities: string[]): IntakeOutput['dimensions'] {
  const base: IntakeOutput['dimensions'] = ['structured'];
  if (entities.length > 0) base.push('graph');
  base.push('vector');
  if (mode === 'grounded' || mode === 'pivot') base.push('emergent');
  return base;
}

function planLayers(mode: NexusMode): IntakeOutput['layerHints'] {
  if (mode === 'research') return ['L1', 'L2'];
  if (mode === 'grounded') return ['L1', 'L2', 'L3', 'L4'];
  return ['L1', 'L2', 'L3', 'L4'];
}

export function runIntake(query: string, mode: NexusMode, tenancy: TenancyCtx): IntakeOutput {
  const entities = extractEntities(query);
  const layerHints = planLayers(mode);
  const dimensions = planDimensions(mode, entities);
  return {
    entities,
    layerHints,
    dimensions,
    plan: { mode, entities, layerHints, dimensions, query, tenancy },
  };
}
