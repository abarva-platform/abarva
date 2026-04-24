import {
  getPatternManifestEntry,
  getPatternManifestEntriesWithMetrics,
  getPatternManifestEntryWithMetrics,
  patternIdToSlug,
  patternRouteFor,
} from '@/lib/intelligence/pattern-manifest';
import { getGraphDriver } from '@/lib/graph/driver';
import {
  buildAllProgramsSeedPlan,
  deliverableRouteSegmentFor,
  type DeliverableSeedPlan,
  type ProgramSeedPlan,
  type TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

export type CitationRelationSource = 'graph' | 'seed_manifest';

export interface CitationQuerySource {
  mode: CitationRelationSource;
  graphAttempted: boolean;
  fallbackUsed: boolean;
  detail: string;
}

export interface CitationTenantSummary {
  key: string;
  slug: string;
  name: string;
}

export interface CitationProgramSummary {
  code: string;
  slug: string;
  name: string;
  routePath: string;
  currentPhaseSpec: number;
  roleInDemo: string;
}

export interface DeliverableCitationSummary {
  id: string;
  code: string;
  slug: string;
  routeSegment: string;
  title: string;
  routePath: string;
  phaseSpec: number;
  renderTier: DeliverableSeedPlan['renderTier'];
  lifecycleState: DeliverableSeedPlan['lifecycleState'];
  status: DeliverableSeedPlan['status'];
  requirement: DeliverableSeedPlan['requirement'];
  tenant: CitationTenantSummary;
  program: CitationProgramSummary;
  citedPatternCount: number;
  relationSource: CitationRelationSource;
}

export interface PatternCitationSummary {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  routePath: string;
  demoCritical: boolean;
  evidenceCount: number;
  lastUpdatedAt: string | null;
  citedDeliverableCount: number;
  relationSource: CitationRelationSource;
}

export interface PatternDeliverablesQueryResult {
  pattern: PatternCitationSummary;
  deliverables: DeliverableCitationSummary[];
  citationCount: number;
  source: CitationQuerySource;
}

export interface DeliverablePatternsQueryResult {
  deliverable: DeliverableCitationSummary;
  patterns: PatternCitationSummary[];
  citationCount: number;
  source: CitationQuerySource;
}

export type DeliverablePatternLookupResult =
  | { kind: 'resolved'; data: DeliverablePatternsQueryResult }
  | { kind: 'not_found' }
  | { kind: 'ambiguous'; matches: DeliverableCitationSummary[] };

interface SeedCitationIndex {
  deliverables: DeliverableCitationSummary[];
  deliverableById: Map<string, DeliverableCitationSummary>;
  deliverablesByPatternSlug: Map<string, DeliverableCitationSummary[]>;
  patternSlugsByDeliverableId: Map<string, string[]>;
  patternsBySlug: Map<string, PatternCitationSummary>;
}

export async function getPatternDeliverablesQuery(
  patternKey: string,
): Promise<PatternDeliverablesQueryResult | null> {
  const index = buildSeedCitationIndex();
  const pattern = resolvePatternSummary(index, patternKey, 'seed_manifest');
  if (!pattern) return null;

  const graphDeliverables = await queryGraphDeliverablesForPattern(patternKey, index);
  const deliverables = graphDeliverables ?? cloneDeliverables(index.deliverablesByPatternSlug.get(pattern.slug) ?? []);
  const source = graphDeliverables
    ? graphCitationSource('Graph CITES/CITED_BY edges resolved to browsable deliverables.')
    : seedCitationSource('Pattern-deliverable links are coming from the seed/manifest fallback.');

  return {
    pattern: {
      ...pattern,
      citedDeliverableCount: deliverables.length,
      relationSource: source.mode,
    },
    deliverables: deliverables.map((deliverable) => ({
      ...deliverable,
      relationSource: source.mode,
    })),
    citationCount: deliverables.length,
    source,
  };
}

export async function getDeliverablePatternsQuery(
  deliverableId: string,
): Promise<DeliverablePatternLookupResult> {
  const index = buildSeedCitationIndex();
  const matches = resolveDeliverableMatches(index, deliverableId);
  if (matches.length === 0) return { kind: 'not_found' };
  if (matches.length > 1) return { kind: 'ambiguous', matches };

  const deliverable = cloneDeliverable(matches[0]);
  const graphPatterns = await queryGraphPatternsForDeliverable(deliverable, index);
  const patterns = graphPatterns ?? resolveSeedPatternsForDeliverable(index, deliverable.id);
  const source = graphPatterns
    ? graphCitationSource('Graph CITES/CITED_BY edges resolved to browsable patterns.')
    : seedCitationSource('Deliverable-pattern links are coming from the seed/manifest fallback.');

  return {
    kind: 'resolved',
    data: {
      deliverable: {
        ...deliverable,
        citedPatternCount: patterns.length,
        relationSource: source.mode,
      },
      patterns: patterns.map((pattern) => ({
        ...pattern,
        relationSource: source.mode,
      })),
      citationCount: patterns.length,
      source,
    },
  };
}

function buildSeedCitationIndex(): SeedCitationIndex {
  const plan = buildAllProgramsSeedPlan();
  const patternsBySlug = new Map<string, PatternCitationSummary>();
  const deliverablesByPatternSlug = new Map<string, DeliverableCitationSummary[]>();
  const patternSlugsByDeliverableId = new Map<string, string[]>();
  const deliverableById = new Map<string, DeliverableCitationSummary>();
  const deliverables: DeliverableCitationSummary[] = [];

  for (const pattern of getPatternManifestEntriesWithMetrics()) {
    patternsBySlug.set(pattern.slug, buildPatternSummary(pattern.slug, 'seed_manifest'));
  }

  for (const tenant of plan.tenants) {
    for (const program of tenant.programs) {
      const patternSlugs = program.patternSlug ? [normalizePatternKey(program.patternSlug)] : [];
      for (const deliverable of program.deliverables) {
        const summary = buildDeliverableSummary(tenant, program, deliverable, 'seed_manifest');
        summary.citedPatternCount = patternSlugs.length;

        deliverables.push(summary);
        deliverableById.set(summary.id, summary);
        patternSlugsByDeliverableId.set(summary.id, patternSlugs);

        for (const patternSlug of patternSlugs) {
          if (!patternsBySlug.has(patternSlug)) {
            patternsBySlug.set(patternSlug, buildPatternSummary(patternSlug, 'seed_manifest'));
          }
          const current = deliverablesByPatternSlug.get(patternSlug) ?? [];
          current.push(summary);
          deliverablesByPatternSlug.set(patternSlug, current);
        }
      }
    }
  }

  for (const list of deliverablesByPatternSlug.values()) {
    list.sort(compareDeliverables);
  }

  for (const [patternSlug, list] of deliverablesByPatternSlug.entries()) {
    const pattern = patternsBySlug.get(patternSlug);
    if (pattern) pattern.citedDeliverableCount = list.length;
  }

  deliverables.sort(compareDeliverables);

  return {
    deliverables,
    deliverableById,
    deliverablesByPatternSlug,
    patternSlugsByDeliverableId,
    patternsBySlug,
  };
}

function buildDeliverableSummary(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  deliverable: DeliverableSeedPlan,
  relationSource: CitationRelationSource,
): DeliverableCitationSummary {
  return {
    id: deliverable.instanceKey,
    code: deliverable.deliverableCode,
    slug: deliverable.deliverableSlug,
    routeSegment: deliverableRouteSegmentFor(deliverable),
    title: deliverable.title,
    routePath: deliverable.routePath,
    phaseSpec: deliverable.phaseSpec,
    renderTier: deliverable.renderTier,
    lifecycleState: deliverable.lifecycleState,
    status: deliverable.status,
    requirement: deliverable.requirement,
    tenant: {
      key: tenant.tenantKey,
      slug: tenant.routeSlug,
      name: tenant.displayName,
    },
    program: {
      code: program.code,
      slug: program.programSlug,
      name: program.name,
      routePath: program.routePath,
      currentPhaseSpec: program.currentPhaseSpec,
      roleInDemo: program.roleInDemo,
    },
    citedPatternCount: 0,
    relationSource,
  };
}

function buildPatternSummary(
  patternKey: string,
  relationSource: CitationRelationSource,
): PatternCitationSummary {
  const pattern = getPatternManifestEntryWithMetrics(patternKey);
  const slug = pattern?.slug ?? normalizePatternKey(patternKey);
  return {
    id: pattern?.id ?? `pattern_${slug.replace(/-/g, '_')}`,
    slug,
    name: pattern?.name ?? titleizeSlug(slug),
    category: pattern?.category ?? null,
    routePath: patternRouteFor(slug),
    demoCritical: pattern?.demoCritical ?? false,
    evidenceCount: pattern?.evidenceCount ?? 0,
    lastUpdatedAt: pattern?.lastUpdatedAt ?? null,
    citedDeliverableCount: 0,
    relationSource,
  };
}

function resolvePatternSummary(
  index: SeedCitationIndex,
  patternKey: string,
  relationSource: CitationRelationSource,
): PatternCitationSummary | null {
  const manifest = getPatternManifestEntryWithMetrics(patternKey);
  const slug = manifest?.slug ?? normalizePatternKey(patternKey);
  const existing = index.patternsBySlug.get(slug);
  if (existing) return { ...existing, relationSource };
  if (!manifest) return null;
  return {
    ...buildPatternSummary(manifest.slug, relationSource),
    citedDeliverableCount: index.deliverablesByPatternSlug.get(manifest.slug)?.length ?? 0,
  };
}

function resolveSeedPatternsForDeliverable(
  index: SeedCitationIndex,
  deliverableId: string,
): PatternCitationSummary[] {
  return (index.patternSlugsByDeliverableId.get(deliverableId) ?? [])
    .map((patternSlug) => resolvePatternSummary(index, patternSlug, 'seed_manifest'))
    .filter((pattern): pattern is PatternCitationSummary => pattern !== null)
    .sort(comparePatterns)
    .map((pattern) => ({ ...pattern }));
}

function resolveDeliverableMatches(index: SeedCitationIndex, deliverableId: string): DeliverableCitationSummary[] {
  const normalized = normalizeKey(deliverableId);
  if (!normalized) return [];

  return index.deliverables
    .filter((deliverable) => {
      return [
        deliverable.id,
        deliverable.routePath,
        deliverable.routeSegment,
        deliverable.code,
        deliverable.slug,
        `${deliverable.program.code}:${deliverable.code}`,
        `${deliverable.program.slug}:${deliverable.code}`,
        `${deliverable.tenant.slug}:${deliverable.program.slug}:${deliverable.code}`,
      ].some((candidate) => normalizeKey(candidate) === normalized);
    })
    .map((deliverable) => ({ ...deliverable }));
}

async function queryGraphDeliverablesForPattern(
  patternKey: string,
  index: SeedCitationIndex,
): Promise<DeliverableCitationSummary[] | null> {
  if (!hasGraphConfig()) return null;

  const session = getGraphDriver().session();
  try {
    const result = await session.run(
      `
        MATCH (p)
        WHERE any(key IN $patternKeys WHERE toLower(coalesce(p.slug, p.pattern_slug, p.code, p.id, '')) = key)
        MATCH (p)-[:CITES|CITED_BY]-(d)
        RETURN DISTINCT coalesce(
          d.id,
          d.instance_key,
          d.instanceKey,
          d.route_path,
          d.routePath,
          d.deliverable_id,
          d.slug,
          d.code
        ) AS deliverableKey
      `,
      { patternKeys: graphPatternKeys(patternKey) },
    );

    const mapped = dedupeDeliverables(
      result.records
        .map((record) => record.get('deliverableKey'))
        .map((value) => resolveGraphDeliverable(index, value))
        .filter((deliverable): deliverable is DeliverableCitationSummary => deliverable !== null),
    );

    return mapped.length > 0 ? mapped : null;
  } catch {
    return null;
  } finally {
    await session.close().catch(() => undefined);
  }
}

async function queryGraphPatternsForDeliverable(
  deliverable: DeliverableCitationSummary,
  index: SeedCitationIndex,
): Promise<PatternCitationSummary[] | null> {
  if (!hasGraphConfig()) return null;

  const session = getGraphDriver().session();
  try {
    const result = await session.run(
      `
        MATCH (d)
        WHERE any(key IN $deliverableKeys WHERE
          toLower(coalesce(d.id, '')) = key OR
          toLower(coalesce(d.instance_key, '')) = key OR
          toLower(coalesce(d.instanceKey, '')) = key OR
          toLower(coalesce(d.route_path, '')) = key OR
          toLower(coalesce(d.routePath, '')) = key OR
          toLower(coalesce(d.slug, '')) = key OR
          toLower(coalesce(d.code, '')) = key
        )
        MATCH (d)-[:CITES|CITED_BY]-(p)
        RETURN DISTINCT coalesce(p.slug, p.pattern_slug, p.code, p.id) AS patternKey
      `,
      { deliverableKeys: graphDeliverableKeys(deliverable) },
    );

    const mapped = dedupePatterns(
      result.records
        .map((record) => record.get('patternKey'))
        .map((value) => resolveGraphPattern(index, value))
        .filter((pattern): pattern is PatternCitationSummary => pattern !== null),
    );

    return mapped.length > 0 ? mapped : null;
  } catch {
    return null;
  } finally {
    await session.close().catch(() => undefined);
  }
}

function resolveGraphDeliverable(index: SeedCitationIndex, value: unknown): DeliverableCitationSummary | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const matches = resolveDeliverableMatches(index, value);
  if (matches.length !== 1) return null;
  return {
    ...matches[0],
    relationSource: 'graph',
  };
}

function resolveGraphPattern(index: SeedCitationIndex, value: unknown): PatternCitationSummary | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const summary = resolvePatternSummary(index, value, 'graph');
  return summary ? { ...summary, relationSource: 'graph' } : null;
}

function graphPatternKeys(patternKey: string): string[] {
  const manifest = getPatternManifestEntry(patternKey);
  const keys = [
    patternKey,
    manifest?.slug ?? null,
    manifest?.id ?? null,
    manifest?.id ? patternIdToSlug(manifest.id) : null,
  ];

  return Array.from(new Set(
    keys
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => normalizePatternKey(value)),
  ));
}

function graphDeliverableKeys(deliverable: DeliverableCitationSummary): string[] {
  return Array.from(new Set(
    [
      deliverable.id,
      deliverable.routePath,
      deliverable.routeSegment,
      deliverable.code,
      deliverable.slug,
      `${deliverable.program.code}:${deliverable.code}`,
      `${deliverable.program.slug}:${deliverable.code}`,
      `${deliverable.tenant.slug}:${deliverable.program.slug}:${deliverable.code}`,
    ].map(normalizeKey),
  ));
}

function graphCitationSource(detail: string): CitationQuerySource {
  return {
    mode: 'graph',
    graphAttempted: true,
    fallbackUsed: false,
    detail,
  };
}

function seedCitationSource(detail: string): CitationQuerySource {
  return {
    mode: 'seed_manifest',
    graphAttempted: hasGraphConfig(),
    fallbackUsed: true,
    detail: hasGraphConfig()
      ? `${detail} Graph edges were unavailable or did not reconcile to browsable seed routes.`
      : `${detail} Graph is not configured in this environment.`,
  };
}

function hasGraphConfig(): boolean {
  return Boolean(process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD);
}

function compareDeliverables(a: DeliverableCitationSummary, b: DeliverableCitationSummary): number {
  return a.tenant.name.localeCompare(b.tenant.name)
    || a.program.name.localeCompare(b.program.name)
    || a.phaseSpec - b.phaseSpec
    || a.code.localeCompare(b.code)
    || a.id.localeCompare(b.id);
}

function comparePatterns(a: PatternCitationSummary, b: PatternCitationSummary): number {
  return a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug);
}

function dedupeDeliverables(deliverables: DeliverableCitationSummary[]): DeliverableCitationSummary[] {
  const unique = new Map<string, DeliverableCitationSummary>();
  for (const deliverable of deliverables) {
    unique.set(deliverable.id, deliverable);
  }
  return Array.from(unique.values()).sort(compareDeliverables);
}

function dedupePatterns(patterns: PatternCitationSummary[]): PatternCitationSummary[] {
  const unique = new Map<string, PatternCitationSummary>();
  for (const pattern of patterns) {
    unique.set(pattern.slug, pattern);
  }
  return Array.from(unique.values()).sort(comparePatterns);
}

function cloneDeliverables(deliverables: DeliverableCitationSummary[]): DeliverableCitationSummary[] {
  return deliverables.map(cloneDeliverable);
}

function cloneDeliverable(deliverable: DeliverableCitationSummary): DeliverableCitationSummary {
  return {
    ...deliverable,
    tenant: { ...deliverable.tenant },
    program: { ...deliverable.program },
  };
}

function normalizeKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizePatternKey(value: string | null | undefined): string {
  return normalizeKey(value).replace(/^pattern[-_]/, '').replace(/_/g, '-');
}

function titleizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
