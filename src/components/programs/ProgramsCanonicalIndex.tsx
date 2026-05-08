// Canonical Programs index for a tenant. S9 slice.
//
// Replaces SeedProgramsIndex on /tenant/[tenantSlug]/programs. Reads
// only from the seed plan (no Supabase, no model calls). Renders a
// five-zone-inspired layout per the S8 readiness contract:
//
//   Zone A — header / tenant name / portfolio overview
//   Zone B — context strip (counts, phase mix, deliverable totals)
//   Zone C — program grid
//   Zone D — deterministic Nexus-style portfolio guidance panel
//   Zone E — none in this slice (drawer wiring deferred to S9d)
//
// Visual style follows the existing inline-style pattern used elsewhere
// in src/components/programs/* and src/components/deliverables/*. No
// new dependencies, no UI library.

import Link from 'next/link';
import {
  tenantProgramPath,
  tenantProgramsPath,
} from '@/lib/deliverables/seed-route-resolver';
import {
  CANONICAL_SIX_PHASES,
  buildPortfolioGuidance,
  summarizePortfolio,
  summarizeProgram,
} from '@/lib/programs/programs-canonical-view';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

interface ProgramsCanonicalIndexProps {
  tenant: TenantSeedPlan;
}

const COLORS = {
  ink: '#1a1612',
  muted: '#5a5148',
  mutedSoft: '#8a7e72',
  border: 'rgba(26,22,18,0.08)',
  card: '#FFFFFF',
  surface: '#F8F7F4',
  // WIRE2: replaced #0E9F8C (teal-adjacent banned token) with AbarVa canonical navy
  accent: '#1B2B5C',
  accentSoft: 'rgba(27,43,92,0.08)',
} as const;

export function ProgramsCanonicalIndex({ tenant }: ProgramsCanonicalIndexProps) {
  const summary = summarizePortfolio(tenant);
  const portfolioProse = buildPortfolioGuidance(tenant, summary);

  return (
    <main
      style={{
        background: COLORS.surface,
        color: COLORS.ink,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 28px 64px' }}>
        {/* Zone A · Header */}
        <header style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {tenant.displayName} · canonical programs surface
          </div>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 30,
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Programs
          </h1>
        </header>

        {/* Zone B · Context strip */}
        <section
          aria-label="Portfolio context strip"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 22,
            padding: '14px 18px',
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
          }}
        >
          <ContextStripMetric label="Programs" value={summary.programCount} />
          <ContextStripMetric label="Active" value={summary.activeProgramCount} />
          <ContextStripMetric label="Completed" value={summary.completedProgramCount} />
          <ContextStripMetric label="Deliverables" value={summary.deliverableTiers.total} />
          <ContextStripMetric label="Rich tier" value={summary.deliverableTiers.rich} />
        </section>

        {/* Phase distribution band */}
        <section
          aria-label="Canonical phase distribution"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 6,
            marginBottom: 26,
          }}
        >
          {CANONICAL_SIX_PHASES.map((phase) => {
            const count = summary.programsByCanonicalPhase[phase.index];
            const populated = count > 0;
            return (
              <div
                key={phase.key}
                style={{
                  background: populated ? COLORS.accentSoft : 'rgba(26,22,18,0.03)',
                  border: `1px solid ${populated ? 'rgba(27,43,92,0.2)' : COLORS.border}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
                title={phase.summary}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: COLORS.mutedSoft,
                    fontWeight: 700,
                  }}
                >
                  P{phase.index} · {phase.label}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: populated ? COLORS.accent : COLORS.muted,
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </section>

        {/* Zone C · Program grid */}
        <section aria-label="Programs">
          {tenant.programs.length === 0 ? (
            <EmptyPortfolio tenantSlug={tenant.routeSlug} />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 14,
              }}
            >
              {tenant.programs.map((program) => {
                const view = summarizeProgram(program);
                return (
                  <Link
                    key={program.programSlug}
                    href={tenantProgramPath(tenant, program)}
                    className="programs-canonical-card"
                    style={{
                      display: 'block',
                      padding: '16px 18px',
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: COLORS.ink,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: COLORS.mutedSoft,
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      {view.code} · {view.archetypeCode}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Fraunces, Georgia, serif',
                        fontSize: 18,
                        fontWeight: 600,
                        marginBottom: 6,
                        lineHeight: 1.3,
                      }}
                    >
                      {view.name}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8, lineHeight: 1.5 }}>
                      {view.roleInDemo}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginTop: 8,
                      }}
                    >
                      <Pill
                        accent={COLORS.accent}
                        background={COLORS.accentSoft}
                        text={`P${view.currentCanonicalPhase.index} · ${view.currentCanonicalPhase.label}`}
                      />
                      <Pill
                        accent={COLORS.muted}
                        background="rgba(26,22,18,0.04)"
                        text={view.status}
                      />
                      <Pill
                        accent={COLORS.muted}
                        background="rgba(26,22,18,0.04)"
                        text={`${view.deliverableTiers.total} deliverables`}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Zone D · Nexus-style portfolio guidance panel */}
        <aside
          aria-label="Nexus portfolio guidance"
          style={{
            marginTop: 28,
            padding: '16px 20px',
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderLeft: `3px solid ${COLORS.accent}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.accent,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Nexus · portfolio guidance · deterministic
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.65,
              color: COLORS.ink,
            }}
          >
            {portfolioProse}
          </p>
          {summary.recommendedFirstProgramSlug ? (
            <Link
              href={tenantProgramPath(tenant, {
                programSlug: summary.recommendedFirstProgramSlug,
              })}
              style={{
                display: 'inline-block',
                marginTop: 10,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.accent,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid rgba(27,43,92,0.3)`,
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Open recommended program →
            </Link>
          ) : null}
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: COLORS.mutedSoft,
              fontStyle: 'italic',
            }}
          >
            Guidance text is composed deterministically from seed state. Live agent binding lands in S9b.
          </div>
        </aside>

        {/* Footer · canonical route confirmation */}
        <footer style={{ marginTop: 28, fontSize: 11, color: COLORS.mutedSoft, fontFamily: 'JetBrains Mono, monospace' }}>
          Canonical route · <code>{tenantProgramsPath(tenant)}</code>
        </footer>
      </div>
    </main>
  );
}

function ContextStripMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.ink }}>{value}</div>
    </div>
  );
}

function Pill({
  text,
  accent,
  background,
}: {
  text: string;
  accent: string;
  background: string;
}) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        background,
        color: accent,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </span>
  );
}

function EmptyPortfolio({ tenantSlug }: { tenantSlug: string }) {
  return (
    <div
      style={{
        padding: '24px 20px',
        background: COLORS.card,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 10,
        color: COLORS.muted,
        fontSize: 14,
      }}
    >
      No canonical programs are seeded for this tenant yet. Tenant slug:{' '}
      <code>{tenantSlug}</code>.
    </div>
  );
}
