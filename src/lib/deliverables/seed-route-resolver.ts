import {
  PROGRAMS_ENHANCEMENT_MATRIX,
  type SpecPhaseNumber,
} from '@/lib/programs/enhancement-spec';
import {
  buildAllProgramsSeedPlan,
  deliverableRouteSegmentFor,
  type DeliverableSeedPlan,
  type ProgramSeedPlan,
  type TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';
import { buildDeliverableVersionPayload, titleForDeliverableInstance } from '@/lib/programs/enhancement-seed-writer';
import { COMPOSITE_DISCLAIMER } from '@/lib/integrity/disclaimers';
import type {
  DeliverableDecision,
  DeliverableEvidenceRef,
  DeliverableKpi,
  DeliverableRenderModel,
  DeliverableRisk,
  DeliverableRouteLink,
  DeliverableSection,
  DeliverableTable,
  StubTriggerCondition,
} from './render-contract';

export interface SeedRouteContext {
  tenant: TenantSeedPlan;
  program: ProgramSeedPlan;
  deliverable?: DeliverableSeedPlan;
}

export function getSeedPlan() {
  return buildAllProgramsSeedPlan();
}

export function findTenantByRouteSlug(tenantSlug: string): TenantSeedPlan | null {
  return getSeedPlan().tenants.find((tenant) => tenant.routeSlug === tenantSlug || tenant.tenantKey === tenantSlug) ?? null;
}

export function findProgramByRoute(tenantSlug: string, programSlug: string): SeedRouteContext | null {
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) return null;
  const program = tenant.programs.find((entry) => entry.programSlug === programSlug || entry.graphNodeId === programSlug);
  return program ? { tenant, program } : null;
}

export function findDeliverableByRoute(tenantSlug: string, programSlug: string, deliverableSegment: string): SeedRouteContext | null {
  const context = findProgramByRoute(tenantSlug, programSlug);
  if (!context) return null;
  const deliverable = context.program.deliverables.find((entry) => {
    const canonical = deliverableRouteSegmentFor(entry);
    return canonical === deliverableSegment || entry.deliverableSlug === deliverableSegment || entry.deliverableCode.toLowerCase() === deliverableSegment;
  });
  return deliverable ? { ...context, deliverable } : null;
}

export function phaseMeta(phase: SpecPhaseNumber) {
  const meta = PROGRAMS_ENHANCEMENT_MATRIX.phaseModel.specPhases.find((entry) => entry.phase === phase);
  if (!meta) throw new Error(`Unknown spec phase ${phase}`);
  return meta;
}

export function tenantDashboardPath(tenant: Pick<TenantSeedPlan, 'routeSlug'>): string {
  return `/tenant/${tenant.routeSlug}`;
}

export function tenantProgramsPath(tenant: Pick<TenantSeedPlan, 'routeSlug'>): string {
  return `/tenant/${tenant.routeSlug}/programs`;
}

export function tenantProgramPath(tenant: Pick<TenantSeedPlan, 'routeSlug'>, program: Pick<ProgramSeedPlan, 'programSlug'>): string {
  return `/tenant/${tenant.routeSlug}/programs/${program.programSlug}`;
}

export function tenantProgramPhasePath(
  tenant: Pick<TenantSeedPlan, 'routeSlug'>,
  program: Pick<ProgramSeedPlan, 'programSlug'>,
  phase: SpecPhaseNumber,
): string {
  return `${tenantProgramPath(tenant, program)}/phase/${phase}`;
}

export function tenantDeliverablePath(
  tenant: Pick<TenantSeedPlan, 'routeSlug'>,
  program: Pick<ProgramSeedPlan, 'programSlug'>,
  deliverable: Pick<DeliverableSeedPlan, 'deliverableCode' | 'deliverableSlug'>,
): string {
  return `${tenantProgramPath(tenant, program)}/deliverables/${deliverableRouteSegmentFor(deliverable)}`;
}

export function tenantPatternPath(tenant: Pick<TenantSeedPlan, 'routeSlug'>, patternSlug: string): string {
  return `/tenant/${tenant.routeSlug}/intelligence/patterns/${patternSlug}`;
}

export function buildSeedDeliverableRenderModel(context: Required<SeedRouteContext>): DeliverableRenderModel {
  const { tenant, program, deliverable } = context;
  const phase = phaseMeta(deliverable.phaseSpec);
  const version = buildDeliverableVersionPayload(tenant, program, deliverable, `seed:${deliverable.instanceKey}`);
  const sections = sectionsFromMarkdown(version.content, program, deliverable);
  const evidence = buildEvidenceRefs(program, deliverable);

  return {
    tenant: {
      key: tenant.tenantKey,
      slug: tenant.routeSlug,
      name: tenant.displayName,
    },
    program: {
      code: program.code,
      slug: program.programSlug,
      name: program.name,
      archetypeCode: program.archetypeCode,
      currentPhaseSpec: program.currentPhaseSpec,
      currentAppPhase: program.currentAppPhase,
      patternSlug: program.patternSlug,
      routePath: tenantProgramPath(tenant, program),
      roleInDemo: program.roleInDemo,
    },
    phase: {
      spec: deliverable.phaseSpec,
      app: deliverable.phaseApp,
      name: phase.name,
      gateCriterion: phase.gateCriterion,
    },
    deliverable: {
      code: deliverable.deliverableCode,
      slug: deliverable.deliverableSlug,
      routeSegment: deliverableRouteSegmentFor(deliverable),
      typeKey: deliverable.deliverableTypeKey,
      title: titleForDeliverableInstance(deliverable),
      status: deliverable.status,
      tier: deliverable.renderTier,
      lifecycleState: deliverable.lifecycleState,
      requirement: deliverable.requirement,
      qualityScore: typeof version.quality_score.total_score === 'number' ? version.quality_score.total_score : undefined,
      activationCriteria: deliverable.structuredData.activationCriteria,
      generatedAt: new Date().toISOString(),
      version: 1,
    },
    summary: summaryFor(program, deliverable),
    kpis: kpisFor(program, deliverable),
    sections,
    table: buildEvidenceTable(tenant, program, deliverable),
    decisions: decisionsFor(program, deliverable),
    risks: risksFor(deliverable),
    evidence,
    crossLinks: buildCrossLinks(tenant, program, deliverable, evidence),
    triggerConditions: triggerConditionsFor(program, deliverable),
    prerequisites: prerequisitesFor(tenant, program, deliverable),
    structurePreview: structurePreviewFor(deliverable),
    provenance: {
      seedSpecVersion: PROGRAMS_ENHANCEMENT_MATRIX.version,
      contentState:
        deliverable.renderTier === 'rich'
          ? 'seeded_detail'
          : deliverable.renderTier === 'outline'
            ? 'seeded_outline'
            : 'scheduled_stub',
      disclaimer: `${COMPOSITE_DISCLAIMER} Seeded render for demo validation; production use requires sponsor-approved evidence.`,
    },
  };
}

export function allSeedTenantProgramPaths(): string[] {
  return getSeedPlan().programs.map((program) => program.routePath);
}

export function allSeedDeliverablePaths(): string[] {
  const plan = getSeedPlan();
  return plan.tenants.flatMap((tenant) =>
    tenant.programs.flatMap((program) => program.deliverables.map((deliverable) => tenantDeliverablePath(tenant, program, deliverable))),
  );
}

function sectionsFromMarkdown(content: string, program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): DeliverableSection[] {
  const chunks = content.split(/\n## /).slice(1);
  const parsed = chunks.map((chunk, index) => {
    const [rawTitle, ...bodyLines] = chunk.split('\n');
    const body = bodyLines.join('\n').trim();
    return {
      id: slugify(rawTitle || `section-${index + 1}`),
      label: String(index + 1).padStart(2, '0'),
      title: rawTitle?.trim() || `Section ${index + 1}`,
      body: body || 'This section is scheduled to populate as verified evidence is attached.',
      bullets: body
        .split('\n')
        .filter((line) => line.trim().startsWith('- '))
        .map((line) => line.trim().replace(/^- /, '')),
    };
  });

  if (parsed.length >= 3) return parsed;

  return [
    {
      id: 'executive-readout',
      label: '01',
      title: 'Executive readout',
      body: summaryFor(program, deliverable),
    },
    {
      id: 'evidence-basis',
      label: '02',
      title: 'Evidence basis',
      body: `Tenant profile, ${program.patternSlug ?? 'program evidence'}, and Phase ${deliverable.phaseSpec} gate data are the required evidence sources.`,
    },
    {
      id: 'next-action',
      label: '03',
      title: 'Recommended next action',
      body:
        deliverable.renderTier === 'stub'
          ? `Wait until ${deliverable.structuredData.activationCriteria ?? 'the future phase gate clears'} before generating conclusions.`
          : 'Review the open evidence gaps, attach sponsor-approved source material, and promote when ready.',
    },
  ];
}

function buildEvidenceRefs(program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): DeliverableEvidenceRef[] {
  const refs = [
    { id: 'E1', label: `${program.code} program charter`, kind: 'Program record' },
    { id: 'E2', label: `Phase ${deliverable.phaseSpec} gate criterion`, kind: 'Phase gate' },
    { id: 'E3', label: program.patternSlug ? `${program.patternSlug} pattern` : `${program.archetypeCode} archetype benchmark`, kind: 'Pattern evidence' },
  ];

  return refs.map((ref) => ({
    ...ref,
    href: `#evidence-${ref.id.toLowerCase()}`,
  }));
}

function buildEvidenceTable(tenant: TenantSeedPlan, program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): DeliverableTable {
  return {
    columns: ['Signal', 'Seeded value', 'Status'],
    rows: [
      ['Tenant', tenant.displayName, 'Scoped'],
      ['Program', program.name, program.roleInDemo],
      ['Phase', `Phase ${deliverable.phaseSpec}`, deliverable.lifecycleState === 'scheduled' ? 'Scheduled' : 'Active'],
      ['Pattern', program.patternSlug ?? 'No named pattern yet', program.patternSlug ? 'Linked' : 'Unlinked'],
    ],
    highlightedRows: deliverable.renderTier === 'rich' ? [1, 2] : [],
  };
}

function buildCrossLinks(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  deliverable: DeliverableSeedPlan,
  evidence: DeliverableEvidenceRef[],
): DeliverableRouteLink[] {
  const phaseDeliverables = program.deliverables
    .filter((entry) => entry.phaseSpec === deliverable.phaseSpec)
    .sort((a, b) => a.deliverableCode.localeCompare(b.deliverableCode));
  const currentIndex = phaseDeliverables.findIndex((entry) => entry.instanceKey === deliverable.instanceKey);
  const previous = currentIndex > 0 ? phaseDeliverables[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < phaseDeliverables.length - 1 ? phaseDeliverables[currentIndex + 1] : null;
  const analogues = getSeedPlan().programs
    .filter((entry) => entry.code !== program.code && (entry.patternSlug === program.patternSlug || entry.archetypeCode === program.archetypeCode))
    .slice(0, 3);

  const links: DeliverableRouteLink[] = [
    { className: 'breadcrumb', label: 'Tenant', title: tenant.displayName, href: tenantDashboardPath(tenant) },
    { className: 'breadcrumb', label: 'Programs', title: 'Programs index', href: tenantProgramsPath(tenant) },
    { className: 'breadcrumb', label: 'Program', title: program.name, href: tenantProgramPath(tenant, program) },
    { className: 'breadcrumb', label: 'Phase', title: `Phase ${deliverable.phaseSpec}`, href: tenantProgramPhasePath(tenant, program, deliverable.phaseSpec) },
    { className: 'phase_summary', label: 'Phase summary', title: `Phase ${deliverable.phaseSpec} · ${phaseMeta(deliverable.phaseSpec).name}`, href: tenantProgramPhasePath(tenant, program, deliverable.phaseSpec) },
    { className: 'program_overview', label: 'Program overview', title: program.name, href: tenantProgramPath(tenant, program) },
  ];

  if (previous) links.push({ className: 'previous_next', label: 'Previous in phase', title: previous.title, href: tenantDeliverablePath(tenant, program, previous) });
  if (next) links.push({ className: 'previous_next', label: 'Next in phase', title: next.title, href: tenantDeliverablePath(tenant, program, next) });

  for (const related of relatedDeliverablesFor(program, deliverable).slice(0, 5)) {
    links.push({ className: 'related_deliverable', label: related.deliverableCode, title: related.title, href: tenantDeliverablePath(tenant, program, related) });
  }

  if (program.patternSlug) {
    links.push({ className: 'source_pattern', label: 'Source pattern', title: program.patternSlug.replace(/-/g, ' '), href: tenantPatternPath(tenant, program.patternSlug) });
  }

  for (const analogue of analogues) {
    links.push({
      className: 'cross_program_analogue',
      label: analogue.code,
      title: analogue.name,
      href: tenantProgramPath({ routeSlug: analogue.tenantRouteSlug }, analogue),
      description: analogue.clientDisplayName,
    });
  }

  for (const ref of evidence) {
    links.push({ className: 'evidence', label: ref.id, title: ref.label, href: ref.href, description: ref.kind });
  }

  return links;
}

function relatedDeliverablesFor(program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): DeliverableSeedPlan[] {
  return program.deliverables
    .filter((entry) => entry.instanceKey !== deliverable.instanceKey && Math.abs(entry.phaseSpec - deliverable.phaseSpec) <= 1)
    .sort((a, b) => {
      const phaseDelta = Math.abs(a.phaseSpec - deliverable.phaseSpec) - Math.abs(b.phaseSpec - deliverable.phaseSpec);
      return phaseDelta || a.deliverableCode.localeCompare(b.deliverableCode);
    });
}

function prerequisitesFor(tenant: TenantSeedPlan, program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): DeliverableRouteLink[] {
  return program.deliverables
    .filter((entry) => entry.phaseSpec <= deliverable.phaseSpec && entry.instanceKey !== deliverable.instanceKey)
    .slice(0, 4)
    .map((entry) => ({
      className: 'related_deliverable',
      label: entry.deliverableCode,
      title: entry.title,
      href: tenantDeliverablePath(tenant, program, entry),
      description: entry.renderTier === 'stub' ? 'Scheduled' : 'Prerequisite artifact',
    }));
}

function kpisFor(program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): DeliverableKpi[] {
  return [
    { label: 'Render tier', value: deliverable.renderTier.toUpperCase(), detail: deliverable.lifecycleState.replace(/_/g, ' '), tone: deliverable.renderTier === 'stub' ? 'amber' : 'teal' },
    { label: 'Phase', value: `P${deliverable.phaseSpec}`, detail: phaseMeta(deliverable.phaseSpec).name, tone: 'neutral' },
    { label: 'Evidence state', value: deliverable.renderTier === 'rich' ? 'Demo-ready' : deliverable.renderTier === 'outline' ? 'Draft' : 'Scheduled', detail: program.roleInDemo, tone: deliverable.renderTier === 'rich' ? 'teal' : 'amber' },
    { label: 'Quality score', value: deliverable.renderTier === 'rich' ? '84' : deliverable.renderTier === 'outline' ? '62' : '25', detail: 'seed rubric', tone: deliverable.renderTier === 'stub' ? 'amber' : 'neutral' },
  ];
}

function decisionsFor(program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): DeliverableDecision[] {
  return [
    {
      date: 'Seed',
      summary: `${deliverable.deliverableCode} assigned to ${program.code}`,
      detail: `The enhancement spec places this artifact in Phase ${deliverable.phaseSpec} for the ${program.archetypeCode} archetype.`,
    },
    {
      date: 'Gate',
      summary: deliverable.lifecycleState === 'scheduled' ? 'Future-phase conclusions withheld' : 'Artifact eligible for review',
      detail:
        deliverable.lifecycleState === 'scheduled'
          ? 'The page renders as a scheduled state and does not invent future outcomes.'
          : 'The page can be promoted once real sponsor evidence replaces seeded assumptions.',
    },
  ];
}

function risksFor(deliverable: DeliverableSeedPlan): DeliverableRisk[] {
  return [
    {
      level: deliverable.renderTier === 'stub' ? 'Low' : 'Medium',
      title: 'Seed evidence is not sponsor-approved evidence',
      mitigation: 'Keep the composite disclaimer visible and require source promotion before sign-off.',
    },
    {
      level: 'Medium',
      title: 'Future-phase leakage',
      mitigation: 'Scheduled artifacts render trigger conditions and structure previews only.',
    },
  ];
}

function triggerConditionsFor(program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): StubTriggerCondition[] {
  const activePhase = program.currentPhaseSpec;
  return [
    {
      state: activePhase >= deliverable.phaseSpec ? 'complete' : 'in_progress',
      title: `Program reaches Phase ${deliverable.phaseSpec}`,
      detail: `Current program phase is ${activePhase}.`,
    },
    {
      state: deliverable.lifecycleState === 'scheduled' ? 'not_yet' : 'complete',
      title: 'Gate criterion clears',
      detail: deliverable.structuredData.activationCriteria ?? phaseMeta(deliverable.phaseSpec).gateCriterion,
    },
    {
      state: deliverable.renderTier === 'stub' ? 'not_yet' : 'in_progress',
      title: 'Sponsor evidence attached',
      detail: 'Real source material must replace seeded assumptions before sign-off.',
    },
  ];
}

function structurePreviewFor(deliverable: DeliverableSeedPlan): string[] {
  if (deliverable.renderTier === 'stub') {
    return [
      'Executive readout once the gate opens',
      'Evidence basis and source confidence',
      'Decision utility for sponsor review',
      'Risks, mitigations, and open decisions',
      'Cross-links to phase, program, source pattern, and evidence',
      'Composite provenance footer',
    ];
  }

  return ['Executive summary', 'KPI strip', 'Evidence table', 'Narrative sections', 'Decision log', 'Cross-links and provenance'];
}

function summaryFor(program: ProgramSeedPlan, deliverable: DeliverableSeedPlan): string {
  if (deliverable.lifecycleState === 'scheduled') {
    return `${deliverable.title} is scheduled for Phase ${deliverable.phaseSpec}. It will not state conclusions until the program clears the phase gate.`;
  }

  return `${deliverable.title} frames the next sponsor decision for ${program.name}. It is seeded at ${deliverable.renderTier} fidelity and must be promoted with verified evidence before client sign-off.`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}
