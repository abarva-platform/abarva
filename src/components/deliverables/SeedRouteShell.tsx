import Link from 'next/link';
import { DeliverablePageStyles } from './DeliverableTierRenderer';
import {
  getSeedPlan,
  phaseMeta,
  tenantDeliverablePath,
  tenantProgramPath,
  tenantProgramPhasePath,
  tenantProgramsPath,
  tenantDashboardPath,
} from '@/lib/deliverables/seed-route-resolver';
import type { DeliverableSeedPlan, ProgramSeedPlan, TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';

export function SeedTenantDashboard({ tenant }: { tenant: TenantSeedPlan }) {
  const counts = summarizeTenant(tenant);
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · tenant route`} title="Seeded program surface" summary="Every canonical tenant route now resolves to a scoped page before the final production UI is layered on top.">
      <MetricGrid
        metrics={[
          ['Programs', tenant.programs.length.toString(), 'tenant scoped'],
          ['Deliverables', counts.deliverables.toString(), 'routes resolve'],
          ['Rich', counts.rich.toString(), 'demo-ready tier'],
          ['Stub', counts.stub.toString(), 'scheduled honestly'],
        ]}
      />
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
          <LinkCard
            key={program.code}
            href={tenantProgramPath(tenant, program)}
            label={`${program.code} · ${program.archetypeCode}`}
            title={program.name}
            description={`Phase ${program.currentPhaseSpec} · ${program.deliverables.length} deliverables · ${program.roleInDemo}`}
          />
        ))}
      </CardGrid>
    </SeedPageFrame>
  );
}

export function SeedProgramOverview({ tenant, program }: { tenant: TenantSeedPlan; program: ProgramSeedPlan }) {
  const phases = [1, 2, 3, 4, 5] as SpecPhaseNumber[];
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · ${program.code}`} title={program.name} summary={`${program.roleInDemo}. Canonical program route is wired with phase, deliverable, and source-pattern links.`}>
      <MetricGrid
        metrics={[
          ['Current phase', `P${program.currentPhaseSpec}`, phaseMeta(program.currentPhaseSpec).name],
          ['Deliverables', program.deliverables.length.toString(), 'all tiers'],
          ['Rich', program.deliverables.filter((d) => d.renderTier === 'rich').length.toString(), 'full render'],
          ['Outline', program.deliverables.filter((d) => d.renderTier === 'outline').length.toString(), 'draft render'],
          ['Stub', program.deliverables.filter((d) => d.renderTier === 'stub').length.toString(), 'future-safe'],
        ]}
      />
      <SectionTitle label="Phase routes" />
      <CardGrid>
        {phases.map((phase) => (
          <LinkCard
            key={phase}
            href={tenantProgramPhasePath(tenant, program, phase)}
            label={`Phase ${phase}`}
            title={phaseMeta(phase).name}
            description={phaseMeta(phase).gateCriterion}
          />
        ))}
      </CardGrid>
      <SectionTitle label="Deliverables" />
      <DeliverableList tenant={tenant} program={program} deliverables={program.deliverables.slice(0, 12)} />
    </SeedPageFrame>
  );
}

export function SeedPhaseOverview({ tenant, program, phase }: { tenant: TenantSeedPlan; program: ProgramSeedPlan; phase: SpecPhaseNumber }) {
  const deliverables = program.deliverables.filter((deliverable) => deliverable.phaseSpec === phase);
  const meta = phaseMeta(phase);
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · ${program.code} · phase ${phase}`} title={meta.name} summary={meta.gateCriterion}>
      <MetricGrid
        metrics={[
          ['Deliverables', deliverables.length.toString(), 'in this phase'],
          ['Rich', deliverables.filter((d) => d.renderTier === 'rich').length.toString(), 'full render'],
          ['Outline', deliverables.filter((d) => d.renderTier === 'outline').length.toString(), 'draft render'],
          ['Stub', deliverables.filter((d) => d.renderTier === 'stub').length.toString(), 'scheduled'],
        ]}
      />
      <DeliverableList tenant={tenant} program={program} deliverables={deliverables} />
    </SeedPageFrame>
  );
}

export function SeedTenantPattern({ tenant, patternSlug }: { tenant: TenantSeedPlan; patternSlug: string }) {
  const matchingPrograms = tenant.programs.filter((program) => program.patternSlug === patternSlug);
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · source pattern`} title={patternSlug.replace(/-/g, ' ')} summary="Canonical tenant-scoped pattern route. It exists so source-pattern cross-links never leak to localhost or 404.">
      {matchingPrograms.length > 0 ? (
        <CardGrid>
          {matchingPrograms.map((program) => (
            <LinkCard
              key={program.code}
              href={tenantProgramPath(tenant, program)}
              label={program.code}
              title={program.name}
              description={`${program.deliverables.length} deliverables apply this pattern.`}
            />
          ))}
        </CardGrid>
      ) : (
        <div className="del-panel">
          <div className="del-eyebrow">Pattern placeholder</div>
          <p style={{ color: 'var(--del-muted)', lineHeight: 1.65 }}>
            No seeded program currently applies this pattern for {tenant.displayName}. The route still renders to preserve link integrity.
          </p>
        </div>
      )}
    </SeedPageFrame>
  );
}

export function SeedTenantTower({ tenant }: { tenant: TenantSeedPlan }) {
  const counts = summarizeTenant(tenant);
  return (
    <SeedPageFrame eyebrow={`${tenant.displayName} · control tower`} title="Tenant tower route" summary="Canonical tower URL is ready for tenant-scoped cockpit integration.">
      <MetricGrid
        metrics={[
          ['Programs', tenant.programs.length.toString(), 'scoped'],
          ['Deliverables', counts.deliverables.toString(), 'route-covered'],
          ['Rich artifacts', counts.rich.toString(), 'demo-ready'],
          ['Scheduled', counts.stub.toString(), 'future-safe'],
        ]}
      />
    </SeedPageFrame>
  );
}

export function SeedOperationsPortfolio() {
  const plan = getSeedPlan();
  return (
    <SeedPageFrame eyebrow="Operations · portfolio" title="Seed portfolio route" summary={`${plan.summary.programCount} programs across ${plan.summary.tenantCount} tenants, with ${plan.summary.deliverableCount} deliverable routes.`}>
      <MetricGrid
        metrics={[
          ['Tenants', plan.summary.tenantCount.toString(), 'portfolio'],
          ['Programs', plan.summary.programCount.toString(), 'seeded'],
          ['Deliverables', plan.summary.deliverableCount.toString(), 'canonical routes'],
          ['Rich', plan.summary.richDeliverableCount.toString(), 'full render'],
          ['Outline', plan.summary.outlineDeliverableCount.toString(), 'draft render'],
          ['Stub', plan.summary.stubDeliverableCount.toString(), 'scheduled'],
        ]}
      />
      <CardGrid>
        {plan.tenants.map((tenant) => (
          <LinkCard
            key={tenant.tenantKey}
            href={tenantDashboardPath(tenant)}
            label={tenant.tenantKey}
            title={tenant.displayName}
            description={`${tenant.programs.length} programs · ${summarizeTenant(tenant).deliverables} deliverables`}
          />
        ))}
      </CardGrid>
    </SeedPageFrame>
  );
}

function SeedPageFrame({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children: React.ReactNode }) {
  return (
    <main className="del-page">
      <DeliverablePageStyles />
      <div className="del-shell">
        <header>
          <div className="del-topline">{eyebrow}</div>
          <h1 className="del-title">{title}</h1>
          <p className="del-summary">{summary}</p>
        </header>
        <div style={{ marginTop: 34, display: 'grid', gap: 28 }}>{children}</div>
        <footer className="del-footer">Composite organization built from real-world data. Canonical seed route scaffold for demo integrity.</footer>
      </div>
    </main>
  );
}

function MetricGrid({ metrics }: { metrics: Array<[string, string, string]> }) {
  return (
    <section className="del-kpi-grid" aria-label="Route metrics">
      {metrics.map(([label, value, detail]) => (
        <div className="del-kpi" key={label}>
          <div className="del-eyebrow">{label}</div>
          <strong>{value}</strong>
          <div style={{ color: 'var(--del-muted)', fontSize: 14 }}>{detail}</div>
        </div>
      ))}
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>{children}</section>;
}

function LinkCard({ href, label, title, description }: { href: string; label: string; title: string; description: string }) {
  return (
    <Link className="del-link-card" href={href} style={{ minHeight: 122 }}>
      <span>{label}</span>
      <strong style={{ display: 'block', fontSize: 19, lineHeight: 1.25 }}>{title}</strong>
      <small>{description}</small>
    </Link>
  );
}

function DeliverableList({ tenant, program, deliverables }: { tenant: TenantSeedPlan; program: ProgramSeedPlan; deliverables: DeliverableSeedPlan[] }) {
  return (
    <CardGrid>
      {deliverables.map((deliverable) => (
        <LinkCard
          key={deliverable.instanceKey}
          href={tenantDeliverablePath(tenant, program, deliverable)}
          label={`${deliverable.deliverableCode} · ${deliverable.renderTier}`}
          title={deliverable.title}
          description={`Phase ${deliverable.phaseSpec} · ${deliverable.lifecycleState.replace(/_/g, ' ')} · ${deliverable.requirement}`}
        />
      ))}
    </CardGrid>
  );
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
