import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type TenantKey = 'apex' | 'meridian' | 'first_capital' | 'keystone';

export interface TenantConfig {
  key: TenantKey;
  shortName: string;
  canonicalName: string;
  legalName: string;
  industryCode: string;
  industryTag: string;
  vertical: string;
  domain: string;
  specPath: string;
  companyScale: Record<string, unknown>;
  parts: {
    initiatives: string;
    patterns: string;
    vendors: string;
    priorPrograms: string;
    benchmarks: string;
    dataRoom: string;
  };
}

export interface PersonSeed {
  name: string;
  role: string;
  reportsToName?: string | null;
  functionGroup?: string | null;
  profileBody?: string | null;
  abbreviatedSummary?: string | null;
}

export interface VipSeed {
  name: string;
  role: string;
  body: string;
}

export interface InitiativeSeed {
  title: string;
  sponsorLine?: string | null;
  scope?: string | null;
  currentPhase?: string | null;
  body: string;
}

export interface PatternSeed {
  title: string;
  summary?: string | null;
  severity?: string | null;
  evidence: string[];
  body: string;
}

export interface PriorProgramSeed {
  title: string;
  sponsor?: string | null;
  phases?: string | null;
  duration?: string | null;
  outcomes: string[];
  body: string;
}

export interface BenchmarkSeed {
  title: string;
  raw: string;
  clientValue: number | null;
  peerMedian: number | null;
  sourceAttribution: string[];
}

export interface SubsidiarySeed {
  name: string;
  abbreviation?: string | null;
  geography?: string | null;
  description: string;
}

export interface RegulatorSeed {
  name: string;
  jurisdiction?: string | null;
  scope: string;
}

export interface ParsedTenantSeed {
  tenant: TenantConfig;
  markdown: string;
  sections: Record<string, string>;
  people: PersonSeed[];
  vips: VipSeed[];
  priorities: string[];
  initiatives: InitiativeSeed[];
  patterns: PatternSeed[];
  vendors: Array<{ section: string; item: string }>;
  priorPrograms: PriorProgramSeed[];
  benchmarks: BenchmarkSeed[];
  subsidiaries: SubsidiarySeed[];
  regulators: RegulatorSeed[];
  externalDataSources: string[];
}

export const TENANTS: Record<TenantKey, TenantConfig> = {
  apex: {
    key: 'apex',
    shortName: 'Apex Retail',
    canonicalName: 'Apex Retail Group',
    legalName: 'Apex Retail Group LLC',
    industryCode: 'RETAIL',
    industryTag: 'RETAIL',
    vertical: 'retail',
    domain: 'apexretail.example',
    specPath: 'docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md',
    companyScale: {
      revenue_usd: 108_000_000_000,
      stores: 1_976,
      employees: 180_000,
      headquarters: 'Chicago, IL',
    },
    parts: {
      initiatives: 'Part 6',
      patterns: 'Part 7',
      vendors: 'Part 8',
      priorPrograms: 'Part 9',
      benchmarks: 'Part 10',
      dataRoom: 'Part 11',
    },
  },
  meridian: {
    key: 'meridian',
    shortName: 'Meridian Health',
    canonicalName: 'Meridian Health System',
    legalName: 'Meridian Health System, Inc.',
    industryCode: 'HEALTHCARE_IDN',
    industryTag: 'HEALTHCARE_IDN',
    vertical: 'healthcare',
    domain: 'meridian-health.example',
    specPath: 'docs/specs/_meta/seed-data/meridian-health-system-comprehensive-seed.md',
    companyScale: {
      revenue_usd: 14_800_000_000,
      hospitals: 44,
      employees: 68_000,
      health_plan_lives: 1_400_000,
      headquarters: 'Salt Lake City, UT',
    },
    parts: {
      initiatives: 'Part 5',
      patterns: 'Part 6',
      vendors: 'Part 7',
      priorPrograms: 'Part 8',
      benchmarks: 'Part 9',
      dataRoom: 'Part 10',
    },
  },
  first_capital: {
    key: 'first_capital',
    shortName: 'First Capital',
    canonicalName: 'First Capital Financial',
    legalName: 'First Capital Financial Corporation',
    industryCode: 'FINSERV',
    industryTag: 'FINSERV',
    vertical: 'financial_services',
    domain: 'firstcapital.example',
    specPath: 'docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md',
    companyScale: {
      assets_usd: 362_000_000_000,
      revenue_usd: 18_200_000_000,
      employees: 46_000,
      branches: 1_200,
      headquarters: 'Charlotte, NC',
    },
    parts: {
      initiatives: 'Part 5',
      patterns: 'Part 6',
      vendors: 'Part 7',
      priorPrograms: 'Part 8',
      benchmarks: 'Part 9',
      dataRoom: 'Part 10',
    },
  },
  keystone: {
    key: 'keystone',
    shortName: 'Keystone Energy Holdings',
    canonicalName: 'Keystone Energy Holdings',
    legalName: 'Keystone Energy Holdings, Inc.',
    industryCode: 'UTILITIES',
    industryTag: 'UTILITIES',
    vertical: 'utilities',
    domain: 'keystone-energy.example',
    specPath: 'docs/specs/_meta/seed-data/keystone-energy-holdings-comprehensive-seed.md',
    companyScale: {
      revenue_usd: 22_600_000_000,
      assets_usd: 78_400_000_000,
      market_cap_usd: 41_000_000_000,
      customers: 10_400_000,
      employees: 19_800,
      headquarters: 'Cleveland, OH',
    },
    parts: {
      initiatives: 'Part 6',
      patterns: 'Part 7',
      vendors: 'Part 8',
      priorPrograms: 'Part 9',
      benchmarks: 'Part 10',
      dataRoom: 'Part 11',
    },
  },
};

export function loadSeedEnv(cwd = process.cwd()): void {
  const candidates = [
    path.resolve(cwd, '.env.local'),
    path.resolve(cwd, '.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      if (process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

export function createSeedClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function parseTenantSeed(config: TenantConfig, cwd = process.cwd()): ParsedTenantSeed {
  const filePath = path.resolve(cwd, config.specPath);
  const markdown = fs.readFileSync(filePath, 'utf8');
  const sections = collectSections(markdown);

  const people = dedupePeople([
    ...parseRoster(config, sections['Part 2'] ?? ''),
    ...parseOperatingLeadership(sections['Part 2'] ?? ''),
    ...parseExtendedPeople(config, sections['Part 4'] ?? '', sections['Part 5'] ?? ''),
  ]);
  const vips = parseVipSections(sections['Part 4'] ?? '');
  const priorities = parsePriorityBullets(sections['Part 3'] ?? '');
  const initiatives = parseInitiatives(sections[config.parts.initiatives] ?? '');
  const patterns = parsePatterns(config, sections[config.parts.patterns] ?? '');
  const vendors = parseVendorLandscape(sections[config.parts.vendors] ?? '');
  const priorPrograms = parsePriorPrograms(config, sections[config.parts.priorPrograms] ?? '');
  const benchmarks = parseBenchmarks(config, sections[config.parts.benchmarks] ?? '');
  const subsidiaries = parseSubsidiaries(sections['Part 1'] ?? '');
  const regulators = parseRegulators(sections['Part 1'] ?? '');
  const externalDataSources = parseExternalDataSources(sections[config.parts.benchmarks] ?? '');

  return {
    tenant: config,
    markdown,
    sections,
    people,
    vips,
    priorities,
    initiatives,
    patterns,
    vendors,
    priorPrograms,
    benchmarks,
    subsidiaries,
    regulators,
    externalDataSources,
  };
}

function collectSections(markdown: string): Record<string, string> {
  const parts: Record<string, string> = {};
  const regex = /^## (Part \d+ · .+)$/gm;
  const matches = [...markdown.matchAll(regex)];
  for (let i = 0; i < matches.length; i += 1) {
    const title = matches[i][1];
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? markdown.length) : markdown.length;
    const key = title.split(' · ')[0];
    parts[key] = markdown.slice(start, end).trim();
  }
  return parts;
}

function parseRoster(config: TenantConfig, partTwo: string): PersonSeed[] {
  const out: PersonSeed[] = [];
  const section = blockBetween(partTwo, '### 2.1', '### 2.2');
  for (const line of section.split('\n')) {
    const match = line.match(/^- \*\*(.+?)\*\* — (.+)$/);
    if (!match) continue;
    const name = match[1].trim();
    const role = match[2].split('(')[0].trim();
    out.push({
      name,
      role,
      reportsToName: isChiefExecutiveRole(role) ? null : extractChiefExecutiveName(config, partTwo),
      functionGroup: role,
    });
  }
  return out;
}

function parseOperatingLeadership(partTwo: string): PersonSeed[] {
  const out: PersonSeed[] = [];
  const section = blockBetween(partTwo, '### 2.2', '### 2.3');
  for (const line of section.split('\n')) {
    const match = line.match(/^- (.+?) — (.+)$/);
    if (!match) continue;
    out.push({
      name: match[1].trim(),
      role: match[2].trim(),
      reportsToName: 'Nicole Hargrave-Park',
      functionGroup: 'Operating subsidiary leadership',
    });
  }
  return out;
}

function parseExtendedPeople(config: TenantConfig, partFour: string, partFive: string): PersonSeed[] {
  const people: PersonSeed[] = [];

  const vipBlocks = parseHeadingBlocks(partFour);
  for (const block of vipBlocks) {
    if (block.title.includes('through')) {
      for (const line of block.body.split('\n')) {
        const match = line.match(/^- \*\*(.+?)\*\* \((.+?)\) — (.+)$/);
        if (!match) continue;
        people.push({
          name: match[1].trim(),
          role: match[2].trim(),
          reportsToName: extractChiefExecutiveName(config, partFour),
          abbreviatedSummary: match[3].trim(),
          functionGroup: match[2].trim(),
        });
      }
      continue;
    }

    const [name, role] = splitNameRole(block.title);
    if (!name || !role) continue;
    const reportsToName = isChiefExecutiveRole(role) ? null : extractChiefExecutiveName(config, partFour);
    people.push({
      name,
      role,
      reportsToName,
      functionGroup: role,
      profileBody: block.body,
    });
  }

  for (const section of parseHeadingBlocks(partFive)) {
    const manager = inferManagerForExtendedSection(config, section.title);
    for (const line of section.body.split('\n')) {
      const match = line.match(/^- \*\*(.+?)\*\*(?: \([^)]+\))? — (.+)$/);
      if (!match) continue;
      const name = match[1].trim();
      const role = match[2].split('(reports to')[0].trim().replace(/\.$/, '');
      const reportsTo = line.match(/\(reports to ([^)]+)\)/i)?.[1]?.trim() ?? manager;
      people.push({
        name,
        role,
        reportsToName: reportsTo ?? null,
        functionGroup: section.title,
      });
    }
  }

  return people;
}

function dedupePeople(people: PersonSeed[]): PersonSeed[] {
  const byName = new Map<string, PersonSeed>();
  for (const person of people) {
    const key = person.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, person);
      continue;
    }
    byName.set(key, {
      ...existing,
      ...person,
      profileBody: person.profileBody ?? existing.profileBody,
      abbreviatedSummary: person.abbreviatedSummary ?? existing.abbreviatedSummary,
      reportsToName: person.reportsToName ?? existing.reportsToName,
    });
  }
  return [...byName.values()];
}

function parseVipSections(partFour: string): VipSeed[] {
  return parseHeadingBlocks(partFour)
    .filter((block) => !block.title.includes('through'))
    .map((block) => {
      const [name, role] = splitNameRole(block.title);
      return { name, role, body: block.body };
    })
    .filter((vip) => vip.name && vip.role);
}

function parsePriorityBullets(partThree: string): string[] {
  return partThree
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^- /, '').replace(/\*\*/g, '').trim());
}

function parseInitiatives(section: string): InitiativeSeed[] {
  const inlineInitiatives = parseInlineInitiatives(section);
  if (inlineInitiatives.length > 0) return inlineInitiatives;

  return parseHeadingBlocks(section)
    .filter((block) => !/\bThrough\b/i.test(block.title))
    .map((block) => ({
      title: block.title,
      sponsorLine: captureSimpleField(block.body, 'Sponsor'),
      scope: captureSimpleField(block.body, 'Scope'),
      currentPhase: captureSimpleField(block.body, 'Current phase'),
      body: block.body.trim(),
    }));
}

function parseInlineInitiatives(section: string): InitiativeSeed[] {
  const regex = /^\*\*Initiative [^\n]+?\*\*$/gm;
  const matches = [...section.matchAll(regex)];
  if (matches.length === 0) return [];

  const out: InitiativeSeed[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const rawHeading = matches[i][0];
    const start = (matches[i].index ?? 0) + rawHeading.length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? section.length) : section.length;
    const body = section.slice(start, end).trim();
    const title = rawHeading
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/^Initiative\s+\d+(?:\.\d+)*\s+·\s+/, '')
      .trim();

    out.push({
      title,
      sponsorLine:
        captureSimpleField(body, 'Executive sponsor') ??
        captureSimpleField(body, 'Sponsor') ??
        captureSimpleField(body, 'Owner'),
      scope: captureSimpleField(body, 'Scope'),
      currentPhase:
        captureSimpleField(body, 'Current phase') ??
        captureSimpleField(body, 'Current status') ??
        captureSimpleField(body, 'Timeline'),
      body,
    });
  }

  return out;
}

function parsePatterns(config: TenantConfig, section: string): PatternSeed[] {
  return parseHeadingBlocks(section).map((block) => ({
    title: block.title,
    summary: captureLabeledParagraph(block.body, 'Summary') ?? captureLabeledParagraph(block.body, 'Narrative'),
    severity: captureLabeledParagraph(block.body, 'Severity'),
    evidence: extractEvidenceLines(config, block.body),
    body: block.body.trim(),
  }));
}

function parseVendorLandscape(section: string): Array<{ section: string; item: string }> {
  const items: Array<{ section: string; item: string }> = [];
  for (const block of parseHeadingBlocks(section)) {
    for (const line of block.body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ')) continue;
      items.push({
        section: block.title,
        item: trimmed.replace(/^- /, '').trim(),
      });
    }
  }
  return items;
}

function parsePriorPrograms(config: TenantConfig, section: string): PriorProgramSeed[] {
  const defaultSponsor = extractChiefExecutiveName(config, section);
  return parseHeadingBlocks(section).map((block) => ({
    title: block.title,
    sponsor: captureSimpleField(block.body, 'Sponsor') ?? defaultSponsor,
    phases: captureSimpleField(block.body, 'Phases'),
    duration: captureSimpleField(block.body, 'Duration'),
    outcomes: block.body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.replace(/^- /, '').trim()),
    body: block.body.trim(),
  }));
}

function parseBenchmarks(config: TenantConfig, section: string): BenchmarkSeed[] {
  const sourceAttribution = extractBenchmarkSources(section);
  const shortNameToken = config.shortName.split(' ')[0];
  const candidateSections = [
    blockBetween(section, '### 10.4', '## Part'),
    blockBetween(section, '### 10.3', '### 10.4'),
    blockBetween(section, '### 9.4', '### 10.'),
  ].filter(Boolean);

  const lines = [...new Set(
    candidateSections
      .flatMap((candidate) => candidate
        .split('\n')
        .map((line) => line.trim())
        .filter((line) =>
          line.startsWith('- ')
          && new RegExp(`\\b${escapeRegExp(shortNameToken)}\\b`, 'i').test(line)
          && /(peer|leaders?|quartile|%|\bat\b|:)/i.test(line),
        )),
  )];

  return lines
    .map((line) => {
    const boldTitleMatch = line.match(/^- \*\*(.+?)\*\*: (.+)$/);
    const parenTitleMatch = line.match(/^- (.+?)\s+\((.+)\)$/);
    const title = boldTitleMatch?.[1]?.trim() ?? parenTitleMatch?.[1]?.trim() ?? line.replace(/^- /, '');
    const raw = boldTitleMatch?.[2]?.trim() ?? parenTitleMatch?.[2]?.trim() ?? line.replace(/^- /, '');
    const peerMedian = parseFirstNumber(
      raw.match(/peer median[: ]+([\d.]+)/i)?.[1]
      ?? raw.match(/peer average[: ]+([\d.]+)/i)?.[1]
      ?? null,
    );
    const clientValue = parseFirstNumber(
      raw.match(new RegExp(`${escapeRegExp(shortNameToken)}(?: [A-Za-z]+)?(?: at|:)\\s*([\\d.]+)`, 'i'))?.[1]
      ?? null,
    );
    return { title, raw, clientValue, peerMedian, sourceAttribution };
    })
    .filter((benchmark) => benchmark.clientValue !== null || benchmark.peerMedian !== null || /top quartile|mid-pack/i.test(benchmark.raw));
}

function parseSubsidiaries(partOne: string): SubsidiarySeed[] {
  const section = blockBetween(partOne, '### 1.3', '### 1.4');
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- **'))
    .map((line) => {
      const match = line.match(/^- \*\*(.+?)\s+\(([^)]+)\)\*\*\s+—\s+(.+?)\s+—\s+(.+)$/);
      if (!match) {
        return {
          name: line.replace(/^- /, '').replace(/\*\*/g, '').trim(),
          description: line.replace(/^- /, '').replace(/\*\*/g, '').trim(),
        };
      }

      return {
        name: match[1].trim(),
        abbreviation: match[2].trim(),
        geography: match[3].trim(),
        description: match[4].trim(),
      };
    });
}

function parseRegulators(partOne: string): RegulatorSeed[] {
  const section = blockBetween(partOne, '### 1.4', '### 1.5');
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- **'))
    .map((line) => {
      const match = line.match(/^- \*\*(.+?)\*\*\s+\(([^)]+)\)\s+—\s+(.+)$/);
      if (!match) {
        return {
          name: line.replace(/^- /, '').replace(/\*\*/g, '').trim(),
          scope: line.replace(/^- /, '').replace(/\*\*/g, '').trim(),
        };
      }

      return {
        name: match[1].trim(),
        jurisdiction: match[2].trim(),
        scope: match[3].trim(),
      };
    });
}

function parseExternalDataSources(section: string): string[] {
  const sourceSection = blockBetween(section, '### 10.4', '## Part');
  return sourceSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^- /, '').trim());
}

function extractBenchmarkSources(section: string): string[] {
  const blocks = parseHeadingBlocks(section);
  const sourceBlock = blocks.find((block) => /Public data sources|Non-peer data sources seeded/i.test(block.title));
  if (!sourceBlock) return parseExternalDataSources(section);
  return sourceBlock.body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^- /, '').trim());
}

function parseHeadingBlocks(section: string): Array<{ title: string; body: string }> {
  const regex = /^### ([^\n]+)$/gm;
  const matches = [...section.matchAll(regex)];
  const blocks: Array<{ title: string; body: string }> = [];
  for (let i = 0; i < matches.length; i += 1) {
    const title = matches[i][1].trim();
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? section.length) : section.length;
    blocks.push({ title, body: section.slice(start, end).trim() });
  }
  return blocks;
}

function blockBetween(section: string, startMarker: string, endMarker: string): string {
  const start = section.indexOf(startMarker);
  if (start === -1) return '';
  const tail = section.slice(start);
  const end = tail.indexOf(endMarker, startMarker.length);
  return end === -1 ? tail : tail.slice(0, end);
}

function captureSimpleField(body: string, label: string): string | null {
  const match = body.match(new RegExp(`^${escapeRegExp(label)}:\\s*(.+)$`, 'im'));
  return match?.[1]?.trim() ?? null;
}

function captureLabeledParagraph(body: string, label: string): string | null {
  const match = body.match(new RegExp(`\\*\\*${escapeRegExp(label)}\\.?\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n### |\\n## |$)`));
  return match?.[1]?.replace(/\n+/g, ' ').trim() ?? null;
}

function extractEvidenceLines(config: TenantConfig, body: string): string[] {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const evidence = lines
    .filter((line) => line.startsWith('- ') || line.startsWith('> '))
    .map((line) => line.replace(/^[-*>]\s*/, '').replace(/\*\*/g, '').trim());
  if (evidence.length > 0) return evidence;

  const summary = captureLabeledParagraph(body, 'Summary');
  if (!summary) return [];

  const fallbacks: string[] = [summary];
  const clientValueHint = config.key === 'apex' ? '$2.3M across 14 tools' : null;
  if (clientValueHint && summary.includes('$2.3M')) fallbacks.push(clientValueHint);
  return fallbacks;
}

function splitNameRole(title: string): [string, string] {
  const normalized = title.replace(/^\d+(?:\.\d+)?\s+·\s+/, '').trim();
  if (normalized.includes(' — ')) {
    const [name, ...rest] = normalized.split(' — ');
    return [name?.trim() ?? '', rest.join(' — ').trim()];
  }

  const parts = normalized.split(' · ');
  if (parts.length < 2) return ['', ''];
  const name = parts[0]?.trim() ?? '';
  const role = parts.slice(1).join(' · ').trim();
  return [name, role];
}

function inferManagerForExtendedSection(config: TenantConfig, title: string): string | null {
  const explicit = title.match(/\(under ([^)]+)\)/i)?.[1]?.trim();
  if (explicit) return explicit;
  if (config.key === 'apex') {
    if (/Merchandising/i.test(title)) return 'Jordan Alkaev';
    if (/Supply Chain/i.test(title)) return 'Maria Delgado';
    if (/Stores/i.test(title)) return 'Raymond Teller';
    if (/Digital/i.test(title) || /Technology/i.test(title)) return 'Priya Sethi';
    if (/Finance/i.test(title)) return 'Daniel Kovač';
  }
  return extractChiefExecutiveName(config, title);
}

function extractChiefExecutiveName(config: TenantConfig, content: string): string {
  const explicit = content.match(/- \*\*(.+?)\*\* — (?:President and )?Chief Executive Officer/i)?.[1];
  if (explicit) return explicit.trim();
  if (config.key === 'apex') return 'Vincent Okafor';
  if (config.key === 'meridian') return 'Dr. Elena Vasquez';
  if (config.key === 'keystone') return 'Marcus W. Kittrell';
  return 'Robert "Bo" Hargrove III';
}

function isChiefExecutiveRole(role: string): boolean {
  return /Chief Executive Officer|President and Chief Executive Officer|CEO/i.test(role);
}

function parseFirstNumber(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
