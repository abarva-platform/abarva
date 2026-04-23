import { createHash } from 'crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';

type ScalarValue = string | number | boolean | string[] | null;

interface ParsedPattern {
  id: string;
  slug: string;
  name: string;
  version: string | null;
  status: string;
  category: string | null;
  crossIndustry: boolean;
  sectorApplicability: string[];
  primarySector: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  confidenceFloor: number | null;
  nObservationsFloor: number | null;
  relatedPatternIds: string[];
  regulatoryFrameworkIds: string[];
  sourceFile: string;
  sourceSection: string | null;
  lastUpdatedAt: string;
  contentHash: string;
  evidenceCount: number;
  observationCount: number;
  observations: string[];
  demoCritical: boolean;
  sections: Array<{ id: string; title: string; body: string }>;
  triggerSymptoms: string[];
  detectionSignals: string[];
  diagnosticQuestions: string[];
  evidenceRequirements: string[];
  interventions: string[];
}

const DEFAULT_SOURCE_DIR = '/Users/anand/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Patterns';
const SOURCE_DIR = process.env.PATTERN_SOURCE_DIR ?? DEFAULT_SOURCE_DIR;
const OUTPUT_PATH = join(process.cwd(), 'src/lib/intelligence/generated/pattern-manifest.json');

const STANDALONE_PATTERN_FILES = [
  '02-ai-led-pdlc.md',
  '03-ai-governance-operating-model.md',
  '04-vendor-sprawl-ai-tool-rationalization.md',
  '05-ai-use-case-portfolio-management.md',
  '06-ambient-clinical-value-chain.md',
  '07-prior-authorization-automation.md',
  '08-owned-brand-margin-recovery.md',
  '09-demand-forecasting-inventory-ai.md',
  '10-fraud-detection-modernization.md',
  '11-customer-onboarding-kyc-ai.md',
  '12-predictive-maintenance-modernization.md',
  '13-commodity-trading-ai.md',
];

const DEMO_CRITICAL_SLUGS = new Set([
  'owned-brand-margin-recovery',
  'demand-forecasting-inventory-ai',
  'analytics-modernization',
  'ai-use-case-portfolio-management',
]);

function main() {
  const patterns: ParsedPattern[] = [];

  const assembly = readFileSync(join(SOURCE_DIR, 'intelligence-layer-pattern-design-pack.md'), 'utf8');
  const analyticsSection = sliceBetween(
    assembly,
    /^## 2\.1 · Analytics Modernization$/m,
    /^\*End of Part 2\.1 · Analytics Modernization\*$/m,
  );
  if (analyticsSection) {
    patterns.push(...parsePatternDocument(analyticsSection, 'intelligence-layer-pattern-design-pack.md', '2.1 Analytics Modernization'));
  }

  for (const file of STANDALONE_PATTERN_FILES) {
    const markdown = readFileSync(join(SOURCE_DIR, file), 'utf8');
    patterns.push(...parsePatternDocument(markdown, file, null));
  }

  const unique = normalizeRelatedPatternIds(Array.from(new Map(patterns.map((pattern) => [pattern.slug, pattern])).values()))
    .sort((a, b) => Number(b.demoCritical) - Number(a.demoCritical) || a.name.localeCompare(b.name));

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDir: basename(SOURCE_DIR),
    patternCount: unique.length,
    demoCriticalSlugs: Array.from(DEMO_CRITICAL_SLUGS),
    patterns: unique,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${unique.length} patterns to ${OUTPUT_PATH}`);
}

function normalizeRelatedPatternIds(patterns: ParsedPattern[]): ParsedPattern[] {
  const knownIds = new Set(patterns.map((pattern) => pattern.id));
  const normalized = patterns.map((pattern) => {
    const uniqueIds = Array.from(new Set(pattern.relatedPatternIds));
    const filteredIds = uniqueIds.filter((id) => {
      const isKnown = knownIds.has(id);
      if (!isKnown) {
        console.warn(`[pattern-manifest] dropping unknown related pattern id "${id}" from ${pattern.id}`);
      }
      return isKnown;
    });

    return {
      ...pattern,
      relatedPatternIds: filteredIds,
    };
  });

  const byId = new Map(normalized.map((pattern) => [pattern.id, pattern]));
  for (const pattern of normalized) {
    for (const targetId of pattern.relatedPatternIds) {
      const target = byId.get(targetId);
      if (!target) continue;
      if (!target.relatedPatternIds.includes(pattern.id)) {
        target.relatedPatternIds.push(pattern.id);
      }
    }
  }

  return normalized.map((pattern) => ({
    ...pattern,
    relatedPatternIds: pattern.relatedPatternIds
      .slice()
      .sort((left, right) => {
        const leftName = byId.get(left)?.name ?? left;
        const rightName = byId.get(right)?.name ?? right;
        return leftName.localeCompare(rightName);
      }),
  }));
}

function parsePatternDocument(markdown: string, sourceFile: string, sourceSection: string | null): ParsedPattern[] {
  const yamlBlocks = Array.from(markdown.matchAll(/```yaml\n([\s\S]*?)\n```/g));
  const parsed: ParsedPattern[] = [];
  const sourceMtime = statSync(join(SOURCE_DIR, sourceFile)).mtime.toISOString();

  for (const block of yamlBlocks) {
    const yaml = block[1] ?? '';
    const raw = parseYamlSubset(yaml);
    const id = stringValue(raw.pattern_id);
    const slug = stringValue(raw.slug);
    const name = stringValue(raw.name);
    if (!id || !slug || !name) continue;
    if (id.startsWith('prompt_') || slug.startsWith('prompt-')) continue;

    const bodyStart = block.index ?? 0;
    const nextBlock = yamlBlocks.find((candidate) => (candidate.index ?? 0) > bodyStart);
    const body = markdown.slice(bodyStart, nextBlock?.index ?? markdown.length);
    const sections = extractSections(body);
    const evidenceRequirements = extractListItems(body, /evidence requirements/i);
    const observations = extractObservations(body);
    const regulatoryFrameworkIds = extractIds(yaml, 'regulatory_frameworks');
    const observationCount = Math.max(observations.length, numberValue(raw.n_observations_floor) ?? 0);

    parsed.push({
      id,
      slug,
      name,
      version: stringValue(raw.version) ?? null,
      status: stringValue(raw.status) ?? 'active',
      category: stringValue(raw.category),
      crossIndustry: booleanValue(raw.cross_industry),
      sectorApplicability: stringArrayValue(raw.sector_applicability),
      primarySector: stringValue(raw.primary_sector),
      shortDescription: stringValue(raw.short_description),
      longDescription: stringValue(raw.long_description),
      confidenceFloor: numberValue(raw.confidence_floor),
      nObservationsFloor: numberValue(raw.n_observations_floor),
      relatedPatternIds: extractIds(yaml, 'related_patterns'),
      regulatoryFrameworkIds,
      sourceFile,
      sourceSection,
      lastUpdatedAt: sourceMtime,
      contentHash: createHash('sha256').update(body).digest('hex').slice(0, 16),
      evidenceCount: estimateEvidenceCount(body, evidenceRequirements, regulatoryFrameworkIds, observations),
      observationCount,
      observations,
      demoCritical: DEMO_CRITICAL_SLUGS.has(slug),
      sections,
      triggerSymptoms: extractListItems(body, /trigger symptoms/i),
      detectionSignals: extractBoldItems(body, /detection signals/i, /^Signal\s+\d+/i),
      diagnosticQuestions: extractNumberedItems(body, /diagnostic questions/i),
      evidenceRequirements,
      interventions: extractInterventions(body),
    });
  }

  return parsed;
}

function extractObservations(markdown: string): string[] {
  const observations = new Map<string, string>();
  const patterns = [
    /\*\*Obs\s+\d+\s*·\s*([^*]+)\*\*/g,
    /^Obs\s+\d+\s*·\s*([^.\n]+(?:\.[^\n]*)?)/gm,
  ];

  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      const text = cleanInline((match[1] ?? '').trim());
      if (text.length > 0) observations.set(text.toLowerCase(), text);
    }
  }

  return Array.from(observations.values()).slice(0, 12);
}

function estimateEvidenceCount(
  markdown: string,
  evidenceRequirements: string[],
  regulatoryFrameworkIds: string[],
  observations: string[],
): number {
  const explicitEvidence = (markdown.match(/^\s*-\s*Evidence:/gmi) ?? []).length;
  const evidenceHeadings = (markdown.match(/\bevidence\b/gi) ?? []).length;
  return Math.max(
    explicitEvidence,
    evidenceRequirements.length,
    regulatoryFrameworkIds.length,
    observations.length,
    Math.min(24, Math.ceil(evidenceHeadings / 2)),
  );
}

function parseYamlSubset(yaml: string): Record<string, ScalarValue> {
  const result: Record<string, ScalarValue> = {};
  const lines = yaml.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    const value = stripInlineComment(match[2].trim());

    if (value === '>') {
      const collected: string[] = [];
      i += 1;
      while (i < lines.length && /^( {2,}|\t)/.test(lines[i] ?? '')) {
        collected.push((lines[i] ?? '').trim());
        i += 1;
      }
      i -= 1;
      result[key] = collected.join(' ').replace(/\s+/g, ' ').trim();
      continue;
    }

    if (value === '') {
      const collected: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^( {2,}|\t)/.test(lines[j] ?? '')) {
        const item = (lines[j] ?? '').trim();
        if (item.startsWith('- ')) collected.push(item.slice(2).trim());
        j += 1;
      }
      if (collected.length > 0) {
        result[key] = collected;
        i = j - 1;
      }
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      result[key] = value
        .slice(1, -1)
        .split(',')
        .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      continue;
    }

    if (value === 'true' || value === 'false') {
      result[key] = value === 'true';
      continue;
    }

    const numeric = Number(value);
    result[key] = Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(value)
      ? numeric
      : value.replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function extractSections(markdown: string): Array<{ id: string; title: string; body: string }> {
  const matches = Array.from(markdown.matchAll(/^#{3,4}\s+(Part [A-Z][^\n]+)$/gm));
  return matches.slice(0, 12).map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? markdown.length;
    const title = (match[1] ?? `Part ${index + 1}`).trim();
    const body = markdown.slice(start + (match[0]?.length ?? 0), end).trim();
    return {
      id: slugify(title),
      title,
      body: truncateMarkdown(cleanMarkdown(body), 1800),
    };
  });
}

function extractListItems(markdown: string, headingPattern: RegExp): string[] {
  const section = sectionAfterHeading(markdown, headingPattern);
  if (!section) return [];
  return section
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line))
    .slice(0, 10);
}

function extractNumberedItems(markdown: string, headingPattern: RegExp): string[] {
  const section = sectionAfterHeading(markdown, headingPattern);
  if (!section) return [];
  return section
    .split('\n')
    .map((line) => line.match(/^\s*\d+\.\s+(.+)$/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line))
    .slice(0, 10);
}

function extractBoldItems(markdown: string, headingPattern: RegExp, titlePattern: RegExp): string[] {
  const section = sectionAfterHeading(markdown, headingPattern);
  if (!section) return [];
  return Array.from(section.matchAll(/\*\*([^*]+)\*\*/g))
    .map((match) => (match[1] ?? '').replace(/[.:]$/, '').trim())
    .filter((title) => titlePattern.test(title))
    .slice(0, 10);
}

function extractInterventions(markdown: string): string[] {
  const section = sectionAfterHeading(markdown, /intervention/i);
  if (!section) return [];
  const bold = Array.from(section.matchAll(/\*\*([^*]+)\*\*/g))
    .map((match) => (match[1] ?? '').replace(/[.:]$/, '').trim())
    .filter((title) => title.length > 4 && !/^Part\s+/i.test(title))
    .slice(0, 8);
  return bold.length > 0 ? bold : extractListItems(section, /^/).slice(0, 8);
}

function sectionAfterHeading(markdown: string, headingPattern: RegExp): string | null {
  const heading = Array.from(markdown.matchAll(/^#{3,5}\s+(.+)$/gm))
    .find((match) => headingPattern.test(match[1] ?? ''));
  if (!heading) return null;
  const start = (heading.index ?? 0) + (heading[0]?.length ?? 0);
  const rest = markdown.slice(start);
  const nextHeading = rest.search(/\n#{3,5}\s+/);
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function extractIds(yaml: string, key: string): string[] {
  const sectionMatch = yaml.match(new RegExp(`${key}:\\n([\\s\\S]*?)(?:\\n[A-Za-z0-9_]+:|$)`));
  if (!sectionMatch) return [];
  return Array.from(sectionMatch[1].matchAll(/\bid:\s*([A-Za-z0-9_-]+)/g)).map((match) => match[1]);
}

function sliceBetween(markdown: string, startPattern: RegExp, endPattern: RegExp): string | null {
  const start = markdown.search(startPattern);
  if (start < 0) return null;
  const endMatch = endPattern.exec(markdown.slice(start));
  const end = endMatch?.index === undefined ? markdown.length : start + endMatch.index + endMatch[0].length;
  return markdown.slice(start, end);
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanInline(value: string): string {
  return value
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateMarkdown(markdown: string, maxChars: number): string {
  return markdown.length <= maxChars ? markdown : `${markdown.slice(0, maxChars).trim()}...`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripInlineComment(value: string): string {
  return value.replace(/\s+#.*$/, '').trim();
}

function stringValue(value: ScalarValue | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function stringArrayValue(value: ScalarValue | undefined): string[] {
  if (Array.isArray(value)) return value;
  return typeof value === 'string' && value.length > 0 ? [value] : [];
}

function booleanValue(value: ScalarValue | undefined): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function numberValue(value: ScalarValue | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

main();
