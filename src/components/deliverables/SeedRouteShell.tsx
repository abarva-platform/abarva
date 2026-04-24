import Link from 'next/link';
import type { ReactNode } from 'react';
import { DeliverablePageStyles } from './DeliverableTierRenderer';
import { NexusProgramRail } from './NexusProgramRail';
import { SentinelPatternRail } from '@/components/intelligence/SentinelPatternRail';
import {
  getSeedPlan,
  phaseMeta,
  tenantDashboardPath,
  tenantDeliverablePath,
  tenantProgramPath,
  tenantProgramPhasePath,
  tenantProgramsPath,
} from '@/lib/deliverables/seed-route-resolver';
import {
  getPatternBrowsableEvidence,
  getPatternApplicableProgramsForTenant,
  getPatternManifestEntryWithMetrics,
  patternRouteFor,
} from '@/lib/intelligence/pattern-manifest';
import {
  TOWER_SUBSURFACE_DEFINITIONS,
  tenantTowerPath,
  tenantTowerSubsurfacePath,
  type TowerSubsurfaceSlug,
} from '@/lib/integrity/route-catalog';
import { COMPOSITE_DISCLAIMER, PATTERN_OBSERVATION_AUTHORSHIP_DISCLAIMER } from '@/lib/integrity/disclaimers';
import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';
import type { DeliverableSeedPlan, ProgramSeedPlan, TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

export function SeedTenantDashboard({ tenant }: { tenant: TenantSeedPlan }) {
  const counts = summarizeTenant(tenant);
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · tenant route`} title="Seeded program surface" summary="Every canonical tenant route resolves to a scoped page before the final production UI is layered on top.">
      <MetricGrid metrics={[['Programs', tenant.programs.length.toString(), 'tenant scoped'], ['Deliverables', counts.deliverables.toString(), 'routes resolve'], ['Rich', counts.rich.toString(), 'demo-ready tier'], ['Stub', counts.stub.toString(), 'scheduled honestly']]} />
      <CardGrid>
        <LinkCard href={tenantProgramsPath(tenant)} label="Programs" title={`${tenant.displayName} programs`} description="Tenant-scoped program index and deliverable paths." />
        <LinkCard href={`/tenant/${tenant.routeSlug}/tower`} label="Tower" title="Control Tower placeholder" description="Canonical tower URL for this tenant." />
      </CardGrid>
    </SeedPageFrame>
  );
}

export function SeedProgramsIndex({ tenant }: { tenant: TenantSeedPlan }) {
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · programs`} title="Programs" summary={`${tenant.programs.length} seeded programs with canonical phase and deliverable routes.`}>
      <CardGrid>
        {tenant.programs.map((program) => (
          <LinkCard key={program.code} href={tenantProgramPath(tenant, program)} label={`${program.code} · ${program.archetypeCode}`} title={program.name} description={`Phase ${program.currentPhaseSpec} · ${program.deliverables.length} deliverables · ${program.roleInDemo}`} />
        ))}
      </CardGrid>
    </SeedPageFrame>
  );
}

export function SeedProgramOverview({ tenant, program }: { tenant: TenantSeedPlan; program: ProgramSeedPlan }) {
  const phases = [1, 2, 3, 4, 5] as SpecPhaseNumber[];
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · ${program.code}`} title={program.name} summary={`${program.roleInDemo}. Canonical program route is wired with phase, deliverable, and source-pattern links.`}>
      <MetricGrid metrics={[['Current phase', `P${program.currentPhaseSpec}`, phaseMeta(program.currentPhaseSpec).name], ['Deliverables', program.deliverables.length.toString(), 'all tiers'], ['Rich', countTier(program, 'rich').toString(), 'full render'], ['Outline', countTier(program, 'outline').toString(), 'draft render'], ['Stub', countTier(program, 'stub').toString(), 'future-safe']]} />
      <SectionTitle label="Phase routes" />
      <CardGrid>
        {phases.map((phase) => (
          <LinkCard key={phase} href={tenantProgramPhasePath(tenant, program, phase)} label={`Phase ${phase}`} title={phaseMeta(phase).name} description={phaseMeta(phase).gateCriterion} />
        ))}
      </CardGrid>
      <SectionTitle label="Deliverables" />
      {/* C2-13 · surface all deliverables, not a silently-truncated 12. The
          metrics row above advertises the full count; the card grid must
          match or the counter reads as dishonest. */}
      <DeliverableList tenant={tenant} program={program} deliverables={program.deliverables} />
      {/* C2-05 · Nexus chat rail discoverable from every tenant program
          detail surface. The rail is collapsed by default; opens to a
          guided-choice conversation anchored to this program\u2019s phase. */}
      <NexusProgramRail tenant={tenant} program={program} />
    </SeedPageFrame>
  );
}

export function SeedPhaseOverview({ tenant, program, phase }: { tenant: TenantSeedPlan; program: ProgramSeedPlan; phase: SpecPhaseNumber }) {
  const deliverables = program.deliverables.filter((deliverable) => deliverable.phaseSpec === phase);
  const meta = phaseMeta(phase);
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · ${program.code} · phase ${phase}`} title={meta.name} summary={meta.gateCriterion}>
      <MetricGrid metrics={[['Deliverables', deliverables.length.toString(), 'in this phase'], ['Rich', deliverables.filter((d) => d.renderTier === 'rich').length.toString(), 'full render'], ['Outline', deliverables.filter((d) => d.renderTier === 'outline').length.toString(), 'draft render'], ['Stub', deliverables.filter((d) => d.renderTier === 'stub').length.toString(), 'scheduled']]} />
      <DeliverableList tenant={tenant} program={program} deliverables={deliverables} />
    </SeedPageFrame>
  );
}

export function SeedTenantPattern({ tenant, patternSlug }: { tenant: TenantSeedPlan; patternSlug: string }) {
  const matchingPrograms = tenant.programs.filter((program) => program.patternSlug === patternSlug);
  const pattern = getPatternManifestEntryWithMetrics(patternSlug, tenant.routeSlug);
  const evidenceSources = getPatternBrowsableEvidence(patternSlug, tenant.routeSlug).slice(0, 6);
  const applicablePrograms = getPatternApplicableProgramsForTenant(patternSlug, tenant.routeSlug);
  const highestPhase = applicablePrograms.reduce((max, program) => Math.max(max, program.currentPhaseSpec), 0);
  const overlayState = applicablePrograms.length === 0 ? 'Not started' : highestPhase >= 3 ? 'Active' : 'Partial';
  const traceableDeliverables = applicablePrograms
    .flatMap((program) => program.deliverables
      .filter((deliverable) => deliverable.renderTier !== 'stub')
      .map((deliverable) => ({ ...deliverable, program })))
    .sort((a, b) => Number(b.renderTier === 'rich') - Number(a.renderTier === 'rich') || a.code.localeCompare(b.code))
    .slice(0, 8);

  return (
    <SeedPageFrame
      eyebrow={`${tenant.displayName} · tenant-scoped source pattern`}
      title={pattern?.name ?? patternSlug.replace(/-/g, ' ')}
      summary={pattern?.shortDescription ?? 'Canonical tenant-scoped pattern route. It exists so source-pattern cross-links never leak to localhost or 404.'}
    >
      <MetricGrid
        metrics={[
          ['Tenant overlay', overlayState, highestPhase ? `highest phase P${highestPhase}` : 'no active program'],
          ['Programs', applicablePrograms.length.toString(), 'tenant scoped'],
          ['Evidence', String(pattern?.evidenceCount ?? 0), 'source-counted'],
          ['Freshness', pattern ? formatSeedFreshness(pattern.lastUpdatedAt) : 'unknown', 'from source file'],
        ]}
      />
      <div className="del-panel" style={{ borderColor: 'rgba(169, 111, 0, 0.35)', background: 'rgba(169, 111, 0, 0.08)' }}>
        <div className="del-eyebrow" style={{ color: 'var(--del-amber)' }}>Observation authorship</div>
        <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: '10px 0 0' }}>
          {PATTERN_OBSERVATION_AUTHORSHIP_DISCLAIMER}
        </p>
      </div>
      {pattern ? (
        <CardGrid>
          <LinkCard href={patternRouteFor(pattern.slug)} label="Global pattern" title="Open full pattern page" description={`${pattern.sections.length} authored sections · ${pattern.diagnosticQuestions.length} diagnostic probes`} />
        </CardGrid>
      ) : null}
      {applicablePrograms.length > 0 ? (
        <>
          <SectionTitle label="Applicable programs in this tenant" />
          <CardGrid>
            {applicablePrograms.map((program) => (
              <LinkCard
                key={program.code}
                href={program.routePath}
                label={`${program.code} · phase ${program.currentPhaseSpec}`}
                title={program.name}
                description={`${program.deliverables.length} deliverables apply this pattern · ${program.roleInDemo}`}
              />
            ))}
          </CardGrid>
        </>
      ) : matchingPrograms.length > 0 ? (
        <CardGrid>{matchingPrograms.map((program) => <LinkCard key={program.code} href={tenantProgramPath(tenant, program)} label={program.code} title={program.name} description={`${program.deliverables.length} deliverables apply this pattern.`} />)}</CardGrid>
      ) : (
        <div className="del-panel"><div className="del-eyebrow">Pattern placeholder</div><p style={{ color: 'var(--del-muted)', lineHeight: 1.65 }}>No seeded program currently applies this pattern for {tenant.displayName}. The route still renders to preserve link integrity.</p></div>
      )}
      {traceableDeliverables.length > 0 ? (
        <>
          <SectionTitle label="Traceable deliverables" />
          <CardGrid>
            {traceableDeliverables.map((deliverable) => (
              <LinkCard
                key={`${deliverable.program.code}-${deliverable.code}`}
                href={deliverable.routePath}
                label={`${deliverable.program.code} · ${deliverable.code} · ${deliverable.renderTier}`}
                title={deliverable.title}
                description={`Phase ${deliverable.phaseSpec} · source-pattern backlink resolves here.`}
              />
            ))}
          </CardGrid>
        </>
      ) : null}
      {evidenceSources.length > 0 ? (
        <>
          <SectionTitle label="Browsable evidence" />
          <CardGrid>
            {evidenceSources.map((source) => (
              <LinkCard
                key={source.href}
                href={source.href}
                label={`${source.programCode} · ${source.id}`}
                title={source.label}
                description={source.reference}
              />
            ))}
          </CardGrid>
        </>
      ) : null}
      <PatternObservationsPipelinePanel />
      {/* F04 Z4-A · Sentinel anchored on every tenant pattern page · rail
          opens guided-choice prompts bound to this pattern + tenant. */}
      <SentinelPatternRail
        tenant={tenant}
        patternSlug={patternSlug}
        patternName={pattern?.name ?? patternSlug.replace(/-/g, ' ')}
        evidenceCount={pattern?.evidenceCount ?? 0}
        applicableProgramCount={applicablePrograms.length}
      />
      {pattern?.observations.length ? (
        <>
          <SectionTitle label="Composite observations" />
          <CardGrid>
            {pattern.observations.slice(0, 4).map((observation, index) => (
              <div key={`${observation}-${index}`} className="del-panel">
                <div className="del-eyebrow">Obs {index + 1} · Composite</div>
                <p style={{ color: 'var(--del-text)', lineHeight: 1.6, margin: '10px 0 0' }}>{observation}</p>
              </div>
            ))}
          </CardGrid>
        </>
      ) : null}
      <div className="del-panel">
        <div className="del-eyebrow">Integrity disclaimer</div>
        <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: '10px 0 0' }}>
          {COMPOSITE_DISCLAIMER} Demo rendering: tenant-specific pattern state is generated from seeded program and deliverable links and must be sponsor-validated before production use.
        </p>
      </div>
    </SeedPageFrame>
  );
}

export function SeedGlobalPattern({ patternSlug }: { patternSlug: string }) {
  const plan = getSeedPlan();
  const matchingPrograms = plan.programs.filter((program) => program.patternSlug === patternSlug);
  const pattern = getPatternManifestEntryWithMetrics(patternSlug);
  const evidenceSources = getPatternBrowsableEvidence(patternSlug).slice(0, 6);
  return (
    <SeedPageFrame
      eyebrow="Global source pattern"
      title={pattern?.name ?? patternSlug.replace(/-/g, ' ')}
      summary={pattern?.shortDescription ?? 'Canonical global pattern route. Tenant-scoped variants are available for each applying program.'}
    >
      {matchingPrograms.length > 0 ? (
        <CardGrid>{matchingPrograms.map((program) => <LinkCard key={program.code} href={tenantProgramPath({ routeSlug: program.tenantRouteSlug }, program)} label={`${program.clientDisplayName} · ${program.code}`} title={program.name} description={`${program.deliverables.length} deliverables apply this pattern.`} />)}</CardGrid>
      ) : (
        <div className="del-panel"><div className="del-eyebrow">Pattern placeholder</div><p style={{ color: 'var(--del-muted)', lineHeight: 1.65 }}>This pattern route renders as a safe placeholder until detailed pattern content is authored.</p></div>
      )}
      {evidenceSources.length > 0 ? (
        <>
          <SectionTitle label="Browsable evidence" />
          <CardGrid>
            {evidenceSources.map((source) => (
              <LinkCard
                key={source.href}
                href={source.href}
                label={`${source.programCode} · ${source.id}`}
                title={source.label}
                description={source.reference}
              />
            ))}
          </CardGrid>
        </>
      ) : null}
      <div className="del-panel" style={{ borderColor: 'rgba(169, 111, 0, 0.35)', background: 'rgba(169, 111, 0, 0.08)' }}>
        <div className="del-eyebrow" style={{ color: 'var(--del-amber)' }}>Observation authorship</div>
        <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: '10px 0 0' }}>
          {PATTERN_OBSERVATION_AUTHORSHIP_DISCLAIMER}
        </p>
      </div>
      <PatternObservationsPipelinePanel />
    </SeedPageFrame>
  );
}

export function SeedTenantTower({ tenant }: { tenant: TenantSeedPlan }) {
  const counts = summarizeTenant(tenant);
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · control tower`} title="Tenant tower route" summary="Canonical tower URL is ready for tenant-scoped cockpit integration.">
      <MetricGrid metrics={[['Programs', tenant.programs.length.toString(), 'scoped'], ['Deliverables', counts.deliverables.toString(), 'route-covered'], ['Rich artifacts', counts.rich.toString(), 'demo-ready'], ['Scheduled', counts.stub.toString(), 'future-safe']]} />
      <SectionTitle label="Scheduled Tower surfaces" />
      <CardGrid>
        {TOWER_SUBSURFACE_DEFINITIONS.map((surface) => (
          <LinkCard
            key={surface.slug}
            href={tenantTowerSubsurfacePath(tenant, surface.slug)}
            label="Scheduled"
            title={surface.label}
            description={surface.description}
          />
        ))}
      </CardGrid>
    </SeedPageFrame>
  );
}

export function SeedTenantTowerSubsurface({ tenant, surface }: { tenant: TenantSeedPlan; surface: TowerSubsurfaceSlug }) {
  const definition = TOWER_SUBSURFACE_DEFINITIONS.find((entry) => entry.slug === surface)!;

  return (
    <SeedPageFrame
      eyebrow={`${tenant.displayName} · control tower · ${definition.label}`}
      title={`${definition.label} surface`}
      summary={definition.description}
    >
      <div className="del-panel" style={{ borderColor: 'rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.08)' }}>
        <div className="del-eyebrow">Scheduled state</div>
        <h2 style={{ margin: '10px 0 8px', fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.02 }}>
          This surface ships in the next build cycle
        </h2>
        <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: 0 }}>
          The route intentionally renders a Stub-style scheduled state so demo navigation never dead-ends or invents unsupported Tower functionality.
        </p>
      </div>
      <CardGrid>
        <LinkCard
          href={tenantTowerPath(tenant)}
          label="Breadcrumb"
          title="Back to Control Tower"
          description="Return to the tenant-scoped Tower landing surface."
        />
      </CardGrid>
    </SeedPageFrame>
  );
}

export function SeedOperationsPortfolio() {
  const plan = getSeedPlan();
  return (
    <SeedPageFrame eyebrow="Operations · portfolio" title="Seed portfolio route" summary={`${plan.summary.programCount} programs across ${plan.summary.tenantCount} tenants, with ${plan.summary.deliverableCount} deliverable routes.`}>
      <MetricGrid metrics={[['Tenants', plan.summary.tenantCount.toString(), 'portfolio'], ['Programs', plan.summary.programCount.toString(), 'seeded'], ['Deliverables', plan.summary.deliverableCount.toString(), 'canonical routes'], ['Rich', plan.summary.richDeliverableCount.toString(), 'full render'], ['Outline', plan.summary.outlineDeliverableCount.toString(), 'draft render'], ['Stub', plan.summary.stubDeliverableCount.toString(), 'scheduled']]} />
      <CardGrid>{plan.tenants.map((tenant) => <LinkCard key={tenant.tenantKey} href={tenantDashboardPath(tenant)} label={tenant.tenantKey} title={tenant.displayName} description={`${tenant.programs.length} programs · ${summarizeTenant(tenant).deliverables} deliverables`} />)}</CardGrid>
    </SeedPageFrame>
  );
}

function PatternObservationsPipelinePanel() {
  return (
    <div className="del-panel" style={{ borderColor: 'rgba(14, 159, 140, 0.24)', background: 'rgba(14, 159, 140, 0.05)' }}>
      <div className="del-eyebrow">Observations pipeline</div>
      <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: '10px 0 0' }}>
        This pattern receives observations from completed Phase 5 programs. When Morrison reaches Phase 5 outcome attestation, observations will be anonymized, composite-tagged, and contributed back to this pattern.
      </p>
      <div
        style={{
          marginTop: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderRadius: 999,
          border: '1px solid rgba(14, 159, 140, 0.16)',
          background: 'rgba(255,255,255,0.56)',
        }}
      >
        <span className="del-eyebrow" style={{ color: 'var(--del-teal)' }}>Zero state</span>
        <span style={{ color: 'var(--del-ink)', fontSize: 13, lineHeight: 1.4 }}>0 observations contributed to date. Pipeline schema ready.</span>
      </div>
    </div>
  );
}

function SeedPageFrame({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children: ReactNode }) {
  return (
    <main className="del-page">
      <DeliverablePageStyles />
      <div className="del-shell">
        <nav className="del-breadcrumbs" aria-label="Route breadcrumbs" style={{ marginBottom: 24 }}>
          <Link href="/operations/portfolio">Portfolio</Link>
          <span className="del-pill">Canonical route</span>
        </nav>
        <header>
          <div className="del-topline">{eyebrow}</div>
          <h1 className="del-title">{title}</h1>
          <p className="del-summary">{summary}</p>
        </header>
        <div style={{ marginTop: 34, display: 'grid', gap: 28 }}>{children}</div>
        <footer className="del-footer">{COMPOSITE_DISCLAIMER} Canonical seed route scaffold for demo integrity.</footer>
      </div>
    </main>
  );
}

function MetricGrid({ metrics }: { metrics: Array<[string, string, string]> }) {
  return <section className="del-kpi-grid" aria-label="Route metrics">{metrics.map(([label, value, detail]) => <div className="del-kpi" key={label}><div className="del-eyebrow">{label}</div><strong>{value}</strong><div style={{ color: 'var(--del-muted)', fontSize: 14 }}>{detail}</div></div>)}</section>;
}

function CardGrid({ children }: { children: ReactNode }) {
  return <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>{children}</section>;
}

function LinkCard({ href, label, title, description }: { href: string; label: string; title: string; description: string }) {
  return <Link className="del-link-card" href={href} style={{ minHeight: 122 }}><span>{label}</span><strong style={{ display: 'block', fontSize: 19, lineHeight: 1.25 }}>{title}</strong><small>{description}</small></Link>;
}

function DeliverableList({ tenant, program, deliverables }: { tenant: TenantSeedPlan; program: ProgramSeedPlan; deliverables: DeliverableSeedPlan[] }) {
  return <CardGrid>{deliverables.map((deliverable) => <LinkCard key={deliverable.instanceKey} href={tenantDeliverablePath(tenant, program, deliverable)} label={`${deliverable.deliverableCode} · ${deliverable.renderTier}`} title={deliverable.title} description={`Phase ${deliverable.phaseSpec} · ${deliverable.lifecycleState.replace(/_/g, ' ')} · ${deliverable.requirement}`} />)}</CardGrid>;
}

function SectionTitle({ label }: { label: string }) {
  return <div className="del-eyebrow" style={{ marginTop: 10 }}>{label}</div>;
}

function summarizeTenant(tenant: TenantSeedPlan) {
  const deliverables = tenant.programs.flatMap((program) => program.deliverables);
  return {
    deliverables: deliverables.length,
    rich: deliverables.filter((deliverable) => deliverable.renderTier === 'rich').length,
    outline: deliverables.filter((deliverable) => deliverable.renderTier === 'outline').length,
    stub: deliverables.filter((deliverable) => deliverable.renderTier === 'stub').length,
  };
}

function countTier(program: ProgramSeedPlan, tier: DeliverableSeedPlan['renderTier']): number {
  return program.deliverables.filter((deliverable) => deliverable.renderTier === tier).length;
}

function formatSeedFreshness(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const deltaDays = Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000));
  if (deltaDays === 0) return 'today';
  if (deltaDays === 1) return '1d ago';
  if (deltaDays < 30) return `${deltaDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
