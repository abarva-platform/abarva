import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import {
  buildAllProgramsSeedPlan,
  type ProgramSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

const CONTENT_ROOT = join(process.cwd(), 'src/content/deliverables');

export interface EvidenceRegistryEntry {
  id: string;
  kind: string;
  label: string;
  source: string;
  reference: string;
  deliverableCode: string | null;
  firstCitedIn: string | null;
  confidence: string | null;
  href: string;
  tenantSlug: string;
  programSlug: string;
  programCode: string;
  programName: string;
}

export interface ProgramEvidenceRegistry {
  tenantKey: string;
  tenantSlug: string;
  programSlug: string;
  programCode: string;
  programName: string;
  contentDir: string;
  lastUpdatedAt: string | null;
  evidenceCount: number;
  entries: EvidenceRegistryEntry[];
  entriesById: Map<string, EvidenceRegistryEntry>;
  citationsByDeliverableCode: Record<string, string[]>;
}

export interface PatternEvidenceMetrics {
  evidenceCount: number;
  lastUpdatedAt: string | null;
  entries: EvidenceRegistryEntry[];
  programCount: number;
}

interface RawEvidenceBaseEntry {
  type?: string;
  source?: string;
  deliverable_code?: string;
  reference?: string;
  evidence_confidence?: string;
  first_cited_in?: string;
}

interface RawEvidenceBase {
  program_code?: string;
  program_name?: string;
  last_updated?: string;
  entries?: Record<string, RawEvidenceBaseEntry>;
}

interface RawTimelineDecision {
  date?: string;
}

interface RawTimeline {
  last_updated?: string;
  key_decisions?: RawTimelineDecision[];
}

let registryCache: ProgramEvidenceRegistry[] | null = null;

export function tenantProgramEvidencePath(
  tenantSlug: string,
  programSlug: string,
  evidenceId: string,
): string {
  return `/tenant/${encodeURIComponent(tenantSlug)}/programs/${encodeURIComponent(programSlug)}/evidence/${encodeURIComponent(evidenceId)}`;
}

export function getAllProgramEvidenceRegistries(): ProgramEvidenceRegistry[] {
  if (!registryCache) {
    registryCache = buildProgramEvidenceRegistries();
  }
  return registryCache;
}

export function getProgramEvidenceRegistry(
  tenantSlug: string,
  programSlug: string,
): ProgramEvidenceRegistry | null {
  const normalizedTenant = normalizeKey(tenantSlug);
  const normalizedProgram = normalizeKey(programSlug);

  return getAllProgramEvidenceRegistries().find((registry) => {
    return (
      normalizeKey(registry.tenantSlug) === normalizedTenant
      || normalizeKey(registry.tenantKey) === normalizedTenant
    )
      && normalizeKey(registry.programSlug) === normalizedProgram;
  }) ?? null;
}

export function getProgramEvidenceRegistryByCode(
  programCode: string,
): ProgramEvidenceRegistry | null {
  const normalizedCode = programCode.trim().toUpperCase();
  return getAllProgramEvidenceRegistries().find((registry) => registry.programCode === normalizedCode) ?? null;
}

export function getEvidenceDetail(
  tenantSlug: string,
  programSlug: string,
  evidenceId: string,
): EvidenceRegistryEntry | null {
  return getProgramEvidenceRegistry(tenantSlug, programSlug)?.entriesById.get(evidenceId.trim().toUpperCase()) ?? null;
}

export function getEvidenceEntriesForDeliverable(
  tenantSlug: string,
  programSlug: string,
  deliverableCode: string,
): EvidenceRegistryEntry[] {
  const registry = getProgramEvidenceRegistry(tenantSlug, programSlug);
  if (!registry) return [];

  const normalizedCode = deliverableCode.trim().toUpperCase();
  const evidenceIds = registry.citationsByDeliverableCode[normalizedCode] ?? [];
  const entries = evidenceIds
    .map((evidenceId) => registry.entriesById.get(evidenceId))
    .filter(Boolean) as EvidenceRegistryEntry[];

  if (entries.length > 0) return entries;

  return registry.entries
    .filter((entry) => entry.deliverableCode === normalizedCode || entry.firstCitedIn === normalizedCode)
    .sort(compareEvidenceEntries);
}

export function getPatternEvidenceMetrics(
  patternSlug: string,
  tenantScope?: string | null,
): PatternEvidenceMetrics {
  const normalizedPattern = normalizeKey(patternSlug);
  const normalizedTenant = tenantScope ? normalizeKey(tenantScope) : null;
  const programs = buildAllProgramsSeedPlan().programs.filter((program) => {
    if (normalizeKey(program.patternSlug ?? '') !== normalizedPattern) return false;
    if (!normalizedTenant) return true;
    return normalizeKey(program.tenantRouteSlug) === normalizedTenant
      || normalizeKey(program.tenantKey) === normalizedTenant;
  });

  const entriesByHref = new Map<string, EvidenceRegistryEntry>();
  let lastUpdatedAt: string | null = null;
  let programCount = 0;

  for (const program of programs) {
    const registry = getProgramEvidenceRegistryByCode(program.code);
    if (!registry) continue;
    programCount += 1;
    lastUpdatedAt = maxIso(lastUpdatedAt, registry.lastUpdatedAt);

    for (const entry of registry.entries) {
      entriesByHref.set(entry.href, entry);
    }
  }

  return {
    evidenceCount: entriesByHref.size,
    lastUpdatedAt,
    entries: Array.from(entriesByHref.values()).sort(compareEvidenceEntries),
    programCount,
  };
}

function buildProgramEvidenceRegistries(): ProgramEvidenceRegistry[] {
  if (!existsSync(CONTENT_ROOT)) return [];

  const plan = buildAllProgramsSeedPlan();
  const programsByCode = new Map(plan.programs.map((program) => [program.code, program]));
  const registries: ProgramEvidenceRegistry[] = [];

  for (const tenantDir of readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
    if (!tenantDir.isDirectory()) continue;
    const tenantPath = join(CONTENT_ROOT, tenantDir.name);

    for (const programDir of readdirSync(tenantPath, { withFileTypes: true })) {
      if (!programDir.isDirectory()) continue;

      const contentDir = join(tenantPath, programDir.name);
      const evidencePath = join(contentDir, '_evidence-base.json');
      if (!existsSync(evidencePath)) continue;

      const raw = JSON.parse(readFileSync(evidencePath, 'utf8')) as RawEvidenceBase;
      const program = raw.program_code ? programsByCode.get(raw.program_code) : undefined;
      if (!program) continue;

      const timelinePath = join(contentDir, '_timeline.json');
      const timeline = existsSync(timelinePath)
        ? (JSON.parse(readFileSync(timelinePath, 'utf8')) as RawTimeline)
        : null;

      const citationsByDeliverableCode = collectDeliverableEvidenceIds(contentDir, raw);
      const lastUpdatedAt = inferRegistryLastUpdatedAt(evidencePath, raw, timeline);
      const entries = Object.entries(raw.entries ?? {})
        .map(([id, entry]) => mapEvidenceEntry(id, entry, program))
        .sort(compareEvidenceEntries);

      registries.push({
        tenantKey: program.tenantKey,
        tenantSlug: program.tenantRouteSlug,
        programSlug: program.programSlug,
        programCode: program.code,
        programName: raw.program_name ?? program.name,
        contentDir,
        lastUpdatedAt,
        evidenceCount: entries.length,
        entries,
        entriesById: new Map(entries.map((entry) => [entry.id, entry])),
        citationsByDeliverableCode: Object.fromEntries(
          Object.entries(citationsByDeliverableCode).map(([deliverableCode, ids]) => [
            deliverableCode,
            ids.sort(compareEvidenceIds),
          ]),
        ),
      });
    }
  }

  return registries.sort((a, b) => {
    const tenantOrder = a.tenantSlug.localeCompare(b.tenantSlug);
    return tenantOrder || a.programCode.localeCompare(b.programCode);
  });
}

function mapEvidenceEntry(
  id: string,
  entry: RawEvidenceBaseEntry,
  program: ProgramSeedPlan,
): EvidenceRegistryEntry {
  const evidenceId = id.trim().toUpperCase();
  const source = entry.source?.trim() || `${program.name} evidence`;
  const reference = entry.reference?.trim() || 'Reference pending normalization.';

  return {
    id: evidenceId,
    kind: entry.type?.trim().replace(/_/g, ' ') || 'evidence',
    label: source,
    source,
    reference,
    deliverableCode: normalizeDeliverableCode(entry.deliverable_code),
    firstCitedIn: normalizeDeliverableCode(entry.first_cited_in),
    confidence: entry.evidence_confidence?.trim() || null,
    href: tenantProgramEvidencePath(program.tenantRouteSlug, program.programSlug, evidenceId),
    tenantSlug: program.tenantRouteSlug,
    programSlug: program.programSlug,
    programCode: program.code,
    programName: program.name,
  };
}

function collectDeliverableEvidenceIds(
  contentDir: string,
  raw: RawEvidenceBase,
): Record<string, string[]> {
  const byDeliverableCode = new Map<string, Set<string>>();

  for (const [id, entry] of Object.entries(raw.entries ?? {})) {
    const evidenceId = id.trim().toUpperCase();
    const candidates = [
      normalizeDeliverableCode(entry.deliverable_code),
      normalizeDeliverableCode(entry.first_cited_in),
    ].filter(Boolean) as string[];

    for (const deliverableCode of candidates) {
      addEvidenceId(byDeliverableCode, deliverableCode, evidenceId);
    }
  }

  for (const filename of readdirSync(contentDir)) {
    if (filename.startsWith('_') || filename === 'README.md') continue;
    if (!/\.(md|mdx)$/i.test(filename)) continue;

    const deliverableCode = inferDeliverableCodeFromFilename(filename);
    if (!deliverableCode) continue;

    const content = readFileSync(join(contentDir, filename), 'utf8');
    for (const evidenceId of collectEvidenceIdsFromContent(content)) {
      addEvidenceId(byDeliverableCode, deliverableCode, evidenceId);
    }
  }

  return Object.fromEntries(
    Array.from(byDeliverableCode.entries()).map(([deliverableCode, ids]) => [
      deliverableCode,
      Array.from(ids),
    ]),
  );
}

function inferRegistryLastUpdatedAt(
  evidencePath: string,
  raw: RawEvidenceBase,
  timeline: RawTimeline | null,
): string | null {
  const mtimeIso = statSync(evidencePath).mtime.toISOString();
  const decisionDates = (timeline?.key_decisions ?? [])
    .map((decision) => parseDateToken(decision.date))
    .filter(Boolean) as string[];

  return maxIso(
    mtimeIso,
    parseDateToken(raw.last_updated),
    parseDateToken(timeline?.last_updated),
    ...decisionDates,
  );
}

function collectEvidenceIdsFromContent(content: string): string[] {
  return Array.from(new Set(content.match(/\bE\d+\b/g)?.map((match) => match.toUpperCase()) ?? []));
}

function inferDeliverableCodeFromFilename(filename: string): string | null {
  const match = filename.match(/^(d\d{2})/i);
  return match ? match[1].toUpperCase() : null;
}

function normalizeDeliverableCode(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.trim().toUpperCase().match(/^D\d{2}$/);
  return match ? match[0] : null;
}

function addEvidenceId(
  byDeliverableCode: Map<string, Set<string>>,
  deliverableCode: string,
  evidenceId: string,
): void {
  const current = byDeliverableCode.get(deliverableCode) ?? new Set<string>();
  current.add(evidenceId);
  byDeliverableCode.set(deliverableCode, current);
}

function compareEvidenceIds(left: string, right: string): number {
  return numericEvidenceId(left) - numericEvidenceId(right) || left.localeCompare(right);
}

function compareEvidenceEntries(left: EvidenceRegistryEntry, right: EvidenceRegistryEntry): number {
  const deliverableOrder = (left.deliverableCode ?? 'ZZZ').localeCompare(right.deliverableCode ?? 'ZZZ');
  return deliverableOrder || compareEvidenceIds(left.id, right.id);
}

function numericEvidenceId(value: string): number {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function parseDateToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/-c\d+$/i, '');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function maxIso(...values: Array<string | null | undefined>): string | null {
  const valid = values.filter(Boolean) as string[];
  if (valid.length === 0) return null;
  return valid.sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-');
}
