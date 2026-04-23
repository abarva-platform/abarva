import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  buildSeedDeliverableRenderModel,
  getSeedPlan,
} from '@/lib/deliverables/seed-route-resolver';

export interface EvidenceCitationReference {
  tenantSlug: string;
  programCode: string;
  programSlug: string;
  source: string;
  citationId: string;
  sourceKind: 'render_model' | 'authored_content';
}

export interface EvidenceCitationIssue extends EvidenceCitationReference {
  reason: 'missing_evidence_base' | 'unresolved_citation';
}

export interface EvidenceCitationReport {
  generatedAt: string;
  summary: {
    evidenceBaseCount: number;
    referenceCount: number;
    renderModelReferenceCount: number;
    authoredContentReferenceCount: number;
    unresolvedCount: number;
    resolutionRate: number;
  };
  evidenceBases: Array<{
    tenantSlug: string;
    programCode: string;
    programSlug: string;
    path: string;
    entryCount: number;
  }>;
  unresolved: EvidenceCitationIssue[];
}

interface EvidenceBaseRecord {
  programCode: string;
  tenantSlug: string;
  programSlug: string;
  path: string;
  entryIds: Set<string>;
}

interface RawEvidenceBase {
  program_code?: string;
  entries?: Record<string, unknown>;
}

const CONTENT_ROOT = join(process.cwd(), 'src/content/deliverables');
const CITATION_CHIP_PATTERNS = [
  /data-citation(?:-id)?=["'](E\d+)["']/g,
  /<(?:Citation|CitationChip|EvidenceChip)\b[^>]*(?:id|evidenceId)=["'](E\d+)["']/g,
  /className=["'][^"']*(?:citation|evidence)[^"']*["'][^>]*>\s*(E\d+)/g,
];

export function validateEvidenceCitations(now = new Date()): EvidenceCitationReport {
  const evidenceBases = discoverEvidenceBases();
  const references = evidenceBases.flatMap((base) => [
    ...referencesFromRenderModels(base),
    ...referencesFromAuthoredContent(base),
  ]);
  const unresolved = references.flatMap((reference): EvidenceCitationIssue[] => {
    const base = evidenceBases.find((entry) => entry.programCode === reference.programCode && entry.tenantSlug === reference.tenantSlug);
    if (!base) return [{ ...reference, reason: 'missing_evidence_base' }];
    if (!base.entryIds.has(reference.citationId)) return [{ ...reference, reason: 'unresolved_citation' }];
    return [];
  });
  const referenceCount = references.length;
  const renderModelReferenceCount = references.filter((reference) => reference.sourceKind === 'render_model').length;
  const authoredContentReferenceCount = references.filter((reference) => reference.sourceKind === 'authored_content').length;
  const resolutionRate = referenceCount === 0 ? 1 : (referenceCount - unresolved.length) / referenceCount;

  return {
    generatedAt: now.toISOString(),
    summary: {
      evidenceBaseCount: evidenceBases.length,
      referenceCount,
      renderModelReferenceCount,
      authoredContentReferenceCount,
      unresolvedCount: unresolved.length,
      resolutionRate,
    },
    evidenceBases: evidenceBases.map((base) => ({
      tenantSlug: base.tenantSlug,
      programCode: base.programCode,
      programSlug: base.programSlug,
      path: base.path,
      entryCount: base.entryIds.size,
    })),
    unresolved,
  };
}

function discoverEvidenceBases(): EvidenceBaseRecord[] {
  if (!existsSync(CONTENT_ROOT)) return [];
  const plan = getSeedPlan();
  const records: EvidenceBaseRecord[] = [];

  for (const tenantDir of readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
    if (!tenantDir.isDirectory()) continue;
    const tenantPath = join(CONTENT_ROOT, tenantDir.name);
    for (const programDir of readdirSync(tenantPath, { withFileTypes: true })) {
      if (!programDir.isDirectory()) continue;
      const evidencePath = join(tenantPath, programDir.name, '_evidence-base.json');
      if (!existsSync(evidencePath)) continue;

      const raw = JSON.parse(readFileSync(evidencePath, 'utf8')) as RawEvidenceBase;
      const programCode = raw.program_code;
      const program = plan.programs.find((entry) => entry.code === programCode);
      if (!programCode || !program) continue;

      records.push({
        programCode,
        tenantSlug: program.tenantRouteSlug,
        programSlug: program.programSlug,
        path: evidencePath,
        entryIds: new Set(Object.keys(raw.entries ?? {})),
      });
    }
  }

  return records;
}

function referencesFromRenderModels(base: EvidenceBaseRecord): EvidenceCitationReference[] {
  const plan = getSeedPlan();
  const tenant = plan.tenants.find((entry) => entry.routeSlug === base.tenantSlug);
  const program = tenant?.programs.find((entry) => entry.code === base.programCode);
  if (!tenant || !program) return [];

  return program.deliverables
    .filter((deliverable) => deliverable.renderTier === 'rich')
    .flatMap((deliverable) => {
      const model = buildSeedDeliverableRenderModel({ tenant, program, deliverable });
      return model.evidence.map((ref) => ({
        tenantSlug: base.tenantSlug,
        programCode: base.programCode,
        programSlug: base.programSlug,
        source: `${deliverable.deliverableCode} render model`,
        citationId: ref.id,
        sourceKind: 'render_model' as const,
      }));
    });
}

function referencesFromAuthoredContent(base: EvidenceBaseRecord): EvidenceCitationReference[] {
  const programDir = base.path.replace(/\/_evidence-base\.json$/, '');
  const references: EvidenceCitationReference[] = [];

  for (const filename of readdirSync(programDir)) {
    if (!/\.(md|mdx|tsx?)$/.test(filename)) continue;
    if (filename.startsWith('_')) continue;
    const source = join(programDir, filename);
    const content = readFileSync(source, 'utf8');
    for (const pattern of CITATION_CHIP_PATTERNS) {
      for (const match of content.matchAll(pattern)) {
        references.push({
          tenantSlug: base.tenantSlug,
          programCode: base.programCode,
          programSlug: base.programSlug,
          source,
          citationId: match[1],
          sourceKind: 'authored_content',
        });
      }
    }
  }

  return references;
}
