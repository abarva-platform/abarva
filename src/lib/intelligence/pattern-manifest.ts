import manifestJson from './generated/pattern-manifest.json';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type { DeliverableSeedPlan, ProgramSeedPlan } from '@/lib/programs/enhancement-seed-planner';

export interface PatternManifestSection {
  id: string;
  title: string;
  body: string;
}

export interface PatternManifestEntry {
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
  sections: PatternManifestSection[];
  triggerSymptoms: string[];
  detectionSignals: string[];
  diagnosticQuestions: string[];
  evidenceRequirements: string[];
  interventions: string[];
}

interface PatternManifestPayload {
  generatedAt: string;
  sourceDir: string;
  patternCount: number;
  demoCriticalSlugs: string[];
  patterns: PatternManifestEntry[];
}

const manifest = manifestJson as PatternManifestPayload;

export interface PatternApplicableDeliverable {
  code: string;
  title: string;
  phaseSpec: number;
  renderTier: DeliverableSeedPlan['renderTier'];
  lifecycleState: DeliverableSeedPlan['lifecycleState'];
  routePath: string;
}

export interface PatternApplicableProgram {
  tenantKey: string;
  tenantRouteSlug: string;
  clientDisplayName: string;
  code: string;
  name: string;
  programSlug: string;
  currentPhaseSpec: number;
  status: ProgramSeedPlan['status'];
  roleInDemo: string;
  routePath: string;
  deliverables: PatternApplicableDeliverable[];
}

export function getPatternManifestPayload(): PatternManifestPayload {
  return manifest;
}

export function getPatternManifestEntries(): PatternManifestEntry[] {
  return manifest.patterns;
}

export function getPatternManifestEntry(key: string): PatternManifestEntry | null {
  const normalized = normalizePatternKey(key);
  return (
    manifest.patterns.find((pattern) => {
      return normalizePatternKey(pattern.slug) === normalized
        || normalizePatternKey(pattern.id) === normalized
        || normalizePatternKey(patternIdToSlug(pattern.id)) === normalized;
    }) ?? null
  );
}

export function patternIdToSlug(patternId: string): string {
  return patternId.replace(/^pattern_/, '').replace(/_/g, '-');
}

export function patternRouteFor(patternKey: string): string {
  const pattern = getPatternManifestEntry(patternKey);
  return `/intelligence/patterns/${encodeURIComponent(pattern?.slug ?? patternIdToSlug(patternKey))}`;
}

export function getPatternApplicablePrograms(patternKey: string): PatternApplicableProgram[] {
  const pattern = getPatternManifestEntry(patternKey);
  const normalized = normalizePatternKey(pattern?.slug ?? patternKey);
  return buildAllProgramsSeedPlan().programs
    .filter((program) => program.patternSlug && normalizePatternKey(program.patternSlug) === normalized)
    .map(mapApplicableProgram);
}

export function getPatternApplicableProgramsForTenant(
  patternKey: string,
  tenantRouteSlug: string,
): PatternApplicableProgram[] {
  const normalizedTenant = normalizePatternKey(tenantRouteSlug);
  return getPatternApplicablePrograms(patternKey)
    .filter((program) => normalizePatternKey(program.tenantRouteSlug) === normalizedTenant);
}

export function patternMatchesIndustry(pattern: PatternManifestEntry, industryCode: string | null | undefined): boolean {
  if (!industryCode) return true;
  if (pattern.crossIndustry) return true;
  const normalizedIndustry = normalizeIndustry(industryCode);
  const sectors = pattern.sectorApplicability.map(normalizeIndustry);
  return sectors.includes(normalizedIndustry) || sectors.includes('cross_sector');
}

function normalizeIndustry(value: string): string {
  return value.trim().toLowerCase().replace(/-/g, '_');
}

function normalizePatternKey(value: string): string {
  return value.trim().toLowerCase().replace(/^pattern[-_]/, '').replace(/_/g, '-');
}

function mapApplicableProgram(program: ProgramSeedPlan): PatternApplicableProgram {
  return {
    tenantKey: program.tenantKey,
    tenantRouteSlug: program.tenantRouteSlug,
    clientDisplayName: program.clientDisplayName,
    code: program.code,
    name: program.name,
    programSlug: program.programSlug,
    currentPhaseSpec: program.currentPhaseSpec,
    status: program.status,
    roleInDemo: program.roleInDemo,
    routePath: program.routePath,
    deliverables: program.deliverables.map((deliverable) => ({
      code: deliverable.deliverableCode,
      title: deliverable.title,
      phaseSpec: deliverable.phaseSpec,
      renderTier: deliverable.renderTier,
      lifecycleState: deliverable.lifecycleState,
      routePath: deliverable.routePath,
    })),
  };
}
