import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from '../../src/lib/data-plane/postgresCompat';

type SeedClient = PostgresCompatClient;

type ParsedPattern = {
  code: string;
  name: string;
  officeCategory?: string;
  office_category?: string;
  failureRatePct?: number;
  failure_rate_pct?: number;
  description: string;
  keywords?: string[];
  demoRelevant?: boolean;
  demo_relevant?: boolean;
  subTopic?: string;
  verticals?: string[];
  aiCapabilityType?: string;
  governanceHook?: string;
  movesApplicability?: string[];
  sourceApplicability?: string[];
  towerApplicability?: string[];
  startupEcosystemSignals?: string[];
  qualityTier?: string;
  qualityScore?: number;
  qualityNotes?: string[];
  curationStatus?: string;
  rewritePriority?: string;
  doctrine?: string;
  triggers?: string[];
  appliesWhen?: string;
  applies_when?: string;
  doesNotApplyWhen?: string;
  does_not_apply_when?: string;
  decisionOwner?: string;
  decision_owner?: string;
  supportingEvidence?: Array<Record<string, unknown>>;
  supporting_evidence?: Array<Record<string, unknown>>;
  antiPatterns?: string[];
  anti_patterns?: string[];
  failureModes?: string[];
  failure_modes?: string[];
  decisionArtifacts?: string[];
  decision_artifacts?: string[];
  graphRelationships?: Array<Record<string, unknown>>;
  graph_relationships?: Array<Record<string, unknown>>;
  personas?: string[];
  specificity?: string;
  confidence?: string;
};

type SeedFileSummary = {
  file: string;
  vertical: string;
  sourceKey: string;
  parsed: number;
  patternsUpserted: number;
  edgesUpserted: number;
};

function deterministicUuid(input: string): string {
  const hex = createHash('sha1').update(input).digest('hex').slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Expected ${label} to be a non-empty string`);
  }
  return value;
}

function loadCorpusSeedEnv(cwd = process.cwd()): void {
  const candidates = [path.resolve(cwd, '.env.local'), path.resolve(cwd, '.env')];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

function createCorpusSeedClient(): SeedClient {
  return getAzureWriteFluentClient();
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function literalValue(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => literalValue(element as ts.Expression));
  if (ts.isObjectLiteralExpression(node)) return objectValue(node);
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    return node.operator === ts.SyntaxKind.MinusToken ? -Number(node.operand.text) : Number(node.operand.text);
  }
  throw new Error(`Unsupported seed expression: ${node.getText().slice(0, 80)}`);
}

function propertyName(name: ts.PropertyName): string {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  throw new Error(`Unsupported property name: ${name.getText()}`);
}

function objectValue(node: ts.ObjectLiteralExpression): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    out[propertyName(property.name)] = literalValue(property.initializer);
  }
  return out;
}

function parseJsonlPatterns(filePath: string, sourceText: string): ParsedPattern[] {
  const patterns = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line) as ParsedPattern;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${filePath}:${index + 1}: invalid JSONL pattern: ${message}`);
      }
    });
  if (patterns.length === 0) throw new Error(`${filePath}: no JSONL patterns found`);
  return patterns;
}

export function extractPatterns(filePath: string): ParsedPattern[] {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  if (/\.jsonl$/i.test(filePath)) return parseJsonlPatterns(filePath, sourceText);

  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const arrays: ParsedPattern[][] = [];

  function visit(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /PATTERNS$/.test(node.name.text)) {
      if (!node.initializer || !ts.isArrayLiteralExpression(node.initializer)) {
        throw new Error(`${filePath}: ${node.name.text} is not an array literal`);
      }
      arrays.push(node.initializer.elements.map((element) => objectValue(element as ts.ObjectLiteralExpression) as ParsedPattern));
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (arrays.length === 0) throw new Error(`${filePath}: no *PATTERNS array found`);
  return arrays.flat();
}

function seedMetadata(filePath: string) {
  const base = path.basename(filePath).replace(/\.(ts|js|mjs|jsonl)$/i, '');
  if (base.startsWith('seed-airline-')) {
    return { vertical: 'airline', sourceKey: 'skyharbor-air', capabilityType: 'airline_capability', seededBy: base };
  }
  if (base.startsWith('seed-healthcare-')) {
    return {
      vertical: 'healthcare_provider',
      sourceKey: 'meridian-health',
      capabilityType: 'healthcare_capability',
      seededBy: base,
    };
  }
  if (base.startsWith('seed-retail-')) {
    return {
      vertical: 'retail',
      sourceKey: 'apex-retail',
      capabilityType: 'retail_capability',
      seededBy: base,
    };
  }
  if (base.startsWith('seed-medtech-')) {
    return {
      vertical: 'medtech',
      sourceKey: 'northstar-clinical',
      capabilityType: 'medtech_capability',
      seededBy: base,
    };
  }
  if (base.startsWith('seed-banking-')) {
    return {
      vertical: 'banking',
      sourceKey: 'first-capital',
      capabilityType: 'banking_capability',
      seededBy: base,
    };
  }
  if (base.startsWith('seed-cross-industry-')) {
    return {
      vertical: 'cross_industry',
      sourceKey: 'cross-industry',
      capabilityType: 'cross_industry_capability',
      seededBy: base,
    };
  }
  throw new Error(`Unsupported seed file naming: ${filePath}. Supported prefixes: seed-airline-, seed-healthcare-, seed-retail-, seed-medtech-, seed-banking-, seed-cross-industry-`);
}

async function upsertRows(sb: SeedClient, table: string, rows: Array<Record<string, unknown>>, onConflict: string) {
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + batchSize), { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(String).map((item) => item.trim()).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function optionalObjectArray(value: unknown): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  return values.length > 0 ? values : undefined;
}

export function buildDoctrineContext(pattern: ParsedPattern): Record<string, unknown> {
  const entries: Array<[string, unknown]> = [
    ['doctrine', optionalString(pattern.doctrine)],
    ['triggers', optionalStringArray(pattern.triggers)],
    ['applies_when', optionalString(pattern.applies_when ?? pattern.appliesWhen)],
    ['does_not_apply_when', optionalString(pattern.does_not_apply_when ?? pattern.doesNotApplyWhen)],
    ['decision_owner', optionalString(pattern.decision_owner ?? pattern.decisionOwner)],
    ['supporting_evidence', optionalObjectArray(pattern.supporting_evidence ?? pattern.supportingEvidence)],
    ['anti_patterns', optionalStringArray(pattern.anti_patterns ?? pattern.antiPatterns)],
    ['failure_modes', optionalStringArray(pattern.failure_modes ?? pattern.failureModes)],
    ['decision_artifacts', optionalStringArray(pattern.decision_artifacts ?? pattern.decisionArtifacts)],
    ['graph_relationships', optionalObjectArray(pattern.graph_relationships ?? pattern.graphRelationships)],
    ['personas', optionalStringArray(pattern.personas)],
    ['specificity', optionalString(pattern.specificity)],
    ['confidence', optionalString(pattern.confidence)],
  ];

  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

export async function loadSeedFile(sb: SeedClient, filePath: string): Promise<SeedFileSummary> {
  const meta = seedMetadata(filePath);
  const patterns = extractPatterns(filePath);

  const patternRows = patterns.map((pattern) => {
    const code = assertString(pattern.code, `${filePath} code`);
    const name = assertString(pattern.name, `${filePath} ${code} name`);
    const description = assertString(pattern.description, `${filePath} ${code} description`);
    const officeCategory = String(pattern.officeCategory ?? pattern.office_category ?? 'middle_office');
    const keywords = Array.isArray(pattern.keywords) ? pattern.keywords.map(String) : [];
    const failureRatePct = Number(pattern.failureRatePct ?? pattern.failure_rate_pct ?? 50);
    const demoRelevant = Boolean(pattern.demoRelevant ?? pattern.demo_relevant ?? false);
    const movesApplicability = Array.isArray(pattern.movesApplicability)
      ? pattern.movesApplicability.map(String)
      : null;
    const sourceApplicability = Array.isArray(pattern.sourceApplicability)
      ? pattern.sourceApplicability.map(String)
      : null;
    const towerApplicability = Array.isArray(pattern.towerApplicability)
      ? pattern.towerApplicability.map(String)
      : null;
    const startupEcosystemSignals = Array.isArray(pattern.startupEcosystemSignals)
      ? pattern.startupEcosystemSignals.map(String)
      : null;
    const qualityNotes = Array.isArray(pattern.qualityNotes) ? pattern.qualityNotes.map(String) : null;
    const doctrineContext = buildDoctrineContext(pattern);
    const row: Record<string, unknown> = {
      id: deterministicUuid(`${meta.vertical}-genome-pattern:${code}`),
      pattern_type: 'failure_pattern',
      vertical: meta.vertical,
      sub_category: officeCategory,
      data: {
        code,
        name,
        description,
        office_category: officeCategory,
        keywords,
        demo_seed: true,
        demo_relevant: demoRelevant,
        source_key: meta.sourceKey,
        seeded_by: meta.seededBy,
        sub_topic: pattern.subTopic ?? null,
        verticals: Array.isArray(pattern.verticals) ? pattern.verticals.map(String) : null,
        ai_capability_type: pattern.aiCapabilityType ?? null,
        governance_hook: pattern.governanceHook ?? null,
        moves_applicability: movesApplicability,
        source_applicability: sourceApplicability,
        tower_applicability: towerApplicability,
        startup_ecosystem_signals: startupEcosystemSignals,
        quality_tier: pattern.qualityTier ?? null,
        quality_score: typeof pattern.qualityScore === 'number' ? pattern.qualityScore : null,
        quality_notes: qualityNotes,
        curation_status: pattern.curationStatus ?? null,
        rewrite_priority: pattern.rewritePriority ?? null,
      },
      source_count: 6,
      confidence: 84,
      is_active: true,
      code,
      name,
      description,
      summary: description,
      failure_rate_pct: failureRatePct,
      office_category: officeCategory,
      keywords,
    };
    if (Object.keys(doctrineContext).length > 0) {
      row.doctrine_context = doctrineContext;
    }
    return row;
  });

  const edgeRows = patterns.flatMap((pattern) => {
    const code = assertString(pattern.code, `${filePath} code`);
    const officeCategory = String(pattern.officeCategory ?? pattern.office_category ?? 'middle_office');
    const keywords = Array.isArray(pattern.keywords) ? pattern.keywords.map(String) : [];
    const officeNode = `${meta.vertical}:${officeCategory}`;
    const capabilityNode = `${meta.vertical}:${slugify(keywords[0] ?? pattern.name)}`;
    return [
      {
        id: deterministicUuid(`edge:${code}:belongs_to:${officeNode}`),
        from_node_type: 'genome_pattern',
        from_node_id: code,
        edge_type: 'belongs_to',
        to_node_type: 'office_category',
        to_node_id: officeNode,
        vertical: meta.vertical,
        weight: 1,
        evidence: { seeded_by: meta.seededBy, office_category: officeCategory },
        source_key: meta.sourceKey,
      },
      {
        id: deterministicUuid(`edge:${code}:applies_to:${capabilityNode}`),
        from_node_type: 'genome_pattern',
        from_node_id: code,
        edge_type: 'applies_to',
        to_node_type: meta.capabilityType,
        to_node_id: capabilityNode,
        vertical: meta.vertical,
        weight: 0.82,
        evidence: { seeded_by: meta.seededBy, keywords },
        source_key: meta.sourceKey,
      },
    ];
  });

  await upsertRows(sb, 'genome_patterns', patternRows, 'code');
  await upsertRows(sb, 'intelligence_graph_edges', edgeRows, 'from_node_type,from_node_id,edge_type,to_node_type,to_node_id');

  return {
    file: filePath,
    vertical: meta.vertical,
    sourceKey: meta.sourceKey,
    parsed: patterns.length,
    patternsUpserted: patternRows.length,
    edgesUpserted: edgeRows.length,
  };
}

async function main() {
  loadCorpusSeedEnv();
  const parseOnly = process.argv.includes('--parse-only');
  const files = process.argv.slice(2).filter((arg) => arg !== '--parse-only');
  if (files.length === 0) {
    throw new Error('Usage: npx tsx scripts/corpus/load-authored-genome-seeds.ts [--parse-only] <seed-file...>');
  }
  if (parseOnly) {
    const summaries = files.map((file) => {
      const meta = seedMetadata(file);
      const patterns = extractPatterns(file);
      return {
        file,
        vertical: meta.vertical,
        sourceKey: meta.sourceKey,
        parsed: patterns.length,
      };
    });
    console.log(JSON.stringify({ mode: 'parse-only', files: summaries.length, summaries }, null, 2));
    return;
  }
  const sb = createCorpusSeedClient();
  const summaries: SeedFileSummary[] = [];
  for (const file of files) {
    const summary = await loadSeedFile(sb, file);
    summaries.push(summary);
    console.log(`${summary.file}: upserted ${summary.patternsUpserted} patterns and ${summary.edgesUpserted} graph edges`);
  }
  console.log(JSON.stringify({ files: summaries.length, summaries }, null, 2));
}

const isDirect = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (isDirect) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
