// Canonical Program detail for a tenant. S9 slice.
//
// Replaces SeedProgramOverview on
// /tenant/[tenantSlug]/programs/[programSlug]. Reads only from the seed
// plan (no Supabase, no model calls). Renders a five-zone-inspired
// layout per the S8 readiness contract:
//
//   Zone A — program header
//   Zone B — context strip (code · name · phase · role · deliverable count)
//   Zone C — primary workspace
//     · Nexus deterministic editorial lead
//     · Six-phase canonical timeline
//     · Four hard-gate strip (informational only — gate state machine
//       is not yet wired; honest fallback labels)
//     · Deliverable summary list
//   Zone D — existing NexusProgramRail (kept verbatim; rewrite deferred
//             to S9b)
//   Zone E — none in this slice
//
// Honest fallbacks: gate state, value at stake, risk register, and
// decisions registry are not in seed today. The component labels these
// as informational placeholders rather than fabricating data.

import Link from 'next/link';
import { NexusProgramRail } from '@/components/deliverables/NexusProgramRail';
import {
  phaseMeta,
  tenantProgramPath,
  tenantProgramPhasePath,
  tenantProgramsPath,
  tenantDashboardPath,
  tenantDeliverablePath,
} from '@/lib/deliverables/seed-route-resolver';
import {
  CANONICAL_FOUR_GATES,
  CANONICAL_SIX_PHASES,
  HONEST_FALLBACK_LABELS,
  buildProgramEditorial,
  statusForCanonicalPhase,
  summarizeProgram,
} from '@/lib/programs/programs-canonical-view';
import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';
import type {
  DeliverableSeedPlan,
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

interface ProgramCanonicalDetailProps {
  tenant: TenantSeedPlan;
  program: ProgramSeedPlan;
}

const COLORS = {
  ink: '#1a1612',
  muted: '#5a5148',
  mutedSoft: '#8a7e72',
  border: 'rgba(26,22,18,0.08)',
  borderSoft: 'rgba(26,22,18,0.04)',
  card: '#FFFFFF',
  surface: '#F8F7F4',
  accent: '#0E9F8C',
  accentSoft: 'rgba(14,159,140,0.08)',
  amber: '#D97706',
  amberSoft: 'rgba(217,119,6,0.08)',
} as const;

export function ProgramCanonicalDetail({ tenant, program }: ProgramCanonicalDetailProps) {
  const view = summarizeProgram(program);
  const editorial = buildProgramEditorial(view);

  return (
    <main
      style={{
        background: COLORS.surface,
        color: COLORS.ink,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 28px 64px' }}>
        {/* Crumbs */}
        <nav
          aria-label="Breadcrumb"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: COLORS.mutedSoft,
            marginBottom: 14,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Link href={tenantDashboardPath(tenant)} style={{ color: COLORS.mutedSoft, textDecoration: 'none' }}>
            {tenant.displayName}
          </Link>
          <span>›</span>
          <Link href={tenantProgramsPath(tenant)} style={{ color: COLORS.mutedSoft, textDecoration: 'none' }}>
            Programs
          </Link>
          <span>›</span>
          <span style={{ color: COLORS.muted }}>{program.code}</span>
        </nav>

        {/* Zone A · Header */}
        <header style={{ marginBottom: 16 }}>
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
            {program.code} · {view.archetypeCode} · canonical program
          </div>
          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 28,
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {program.name}
          </h1>
        </header>

        {/* Zone B · Context strip */}
        <section
          aria-label="Program context strip"
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
          <ContextMetric label="Current phase" value={`P${view.currentCanonicalPhase.index} · ${view.currentCanonicalPhase.label}`} />
          <ContextMetric label="Spec phase" value={`P${view.currentPhaseSpec} · ${phaseMeta(view.currentPhaseSpec).name}`} />
          <ContextMetric label="Status" value={view.status} />
          <ContextMetric label="Deliverables" value={String(view.deliverableTiers.total)} />
          <ContextMetric label="Rich tier" value={String(view.deliverableTiers.rich)} />
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 22 }}>
          {/* Zone C · Primary workspace */}
          <section aria-label="Primary workspace" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Nexus editorial lead */}
            <article
              style={{
                padding: '18px 22px',
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
                Nexus · program editorial · deterministic
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: COLORS.ink,
                }}
              >
                {editorial}
              </p>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: COLORS.mutedSoft,
                  fontStyle: 'italic',
                }}
              >
                Editorial composed deterministically from seed state. Live agent binding lands in S9b.
              </div>
            </article>

            {/* Six-phase timeline */}
            <PhaseTimeline tenant={tenant} program={program} />

            {/* Four hard-gate strip */}
            <HardGateStrip program={program} />

            {/* Honest fallbacks: data not yet captured */}
            <DataPlaceholders />

            {/* Deliverable summary */}
            <DeliverableList tenant={tenant} program={program} />
          </section>

          {/* Zone D · Nexus rail (existing component, do not rewrite — S9b owns it) */}
          <NexusProgramRail tenant={tenant} program={program} />
        </div>

        <footer
          style={{
            marginTop: 28,
            fontSize: 11,
            color: COLORS.mutedSoft,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          Canonical route · <code>{tenantProgramPath(tenant, program)}</code>
        </footer>
      </div>
    </main>
  );
}

// --- Phase timeline ---------------------------------------------------

function PhaseTimeline({
  tenant,
  program,
}: {
  tenant: TenantSeedPlan;
  program: ProgramSeedPlan;
}) {
  return (
    <section
      aria-label="Canonical six-phase timeline"
      style={{
        padding: '16px 18px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        Canonical six-phase model
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 6,
        }}
      >
        {CANONICAL_SIX_PHASES.map((phase) => {
          const status = statusForCanonicalPhase(program, phase.index);
          const tile = phaseTileColors(status);
          // Origination has no spec phase; other canonical phases map
          // to a spec phase the deliverable seed knows about.
          const specPhaseForLink = canonicalToSpecPhase(phase.index);
          const tileBody = (
            <div
              style={{
                padding: '10px 12px',
                background: tile.bg,
                border: `1px solid ${tile.border}`,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minHeight: 96,
              }}
              title={phase.summary}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: tile.accent,
                  fontWeight: 700,
                }}
              >
                P{phase.index} · {statusLabel(status)}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
                {phase.label}
              </span>
              <span style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.4 }}>
                {phase.summary}
              </span>
            </div>
          );
          return specPhaseForLink ? (
            <Link
              key={phase.key}
              href={tenantProgramPhasePath(tenant, program, specPhaseForLink)}
              style={{ textDecoration: 'none' }}
            >
              {tileBody}
            </Link>
          ) : (
            <div key={phase.key}>{tileBody}</div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
        }}
      >
        {HONEST_FALLBACK_LABELS.origination}
      </div>
    </section>
  );
}

function canonicalToSpecPhase(index: 1 | 2 | 3 | 4 | 5 | 6): SpecPhaseNumber | null {
  // Inverse of mapSpecPhaseToCanonicalIndex. Origination (canonical 1)
  // has no spec-phase route today.
  if (index === 1) return null;
  return (index - 1) as SpecPhaseNumber;
}

function phaseTileColors(status: ReturnType<typeof statusForCanonicalPhase>) {
  switch (status) {
    case 'active':
      return { bg: COLORS.accentSoft, border: 'rgba(14,159,140,0.3)', accent: COLORS.accent };
    case 'complete':
      return { bg: 'rgba(26,22,18,0.04)', border: COLORS.border, accent: COLORS.muted };
    case 'pending':
      return { bg: 'rgba(26,22,18,0.02)', border: COLORS.borderSoft, accent: COLORS.mutedSoft };
    case 'origination_pre_seed':
      return { bg: 'rgba(26,22,18,0.02)', border: COLORS.borderSoft, accent: COLORS.mutedSoft };
  }
}

function statusLabel(status: ReturnType<typeof statusForCanonicalPhase>): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'complete':
      return 'Complete';
    case 'pending':
      return 'Pending';
    case 'origination_pre_seed':
      return 'Pre-seed';
  }
}

// --- Hard-gate strip --------------------------------------------------

function HardGateStrip({ program }: { program: ProgramSeedPlan }) {
  return (
    <section
      aria-label="Canonical four hard gates"
      style={{
        padding: '16px 18px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        Canonical four hard gates
      </div>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CANONICAL_FOUR_GATES.map((gate) => {
          const status = inferInformationalGateStatus(program, gate.exitsPhase);
          const tone = gateTone(status);
          return (
            <li
              key={gate.index}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: tone.bg,
                border: `1px solid ${tone.border}`,
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  color: tone.accent,
                  letterSpacing: '0.1em',
                }}
              >
                G{gate.index}
              </span>
              <span style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.5 }}>
                {gate.label}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: tone.accent,
                  fontWeight: 700,
                }}
              >
                {status}
              </span>
            </li>
          );
        })}
      </ol>
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
        }}
      >
        {HONEST_FALLBACK_LABELS.gateState}
      </div>
    </section>
  );
}

type GateStatusLabel = 'cleared' | 'in flight' | 'pending';

function inferInformationalGateStatus(
  program: ProgramSeedPlan,
  exitsPhase: (typeof CANONICAL_FOUR_GATES)[number]['exitsPhase'],
): GateStatusLabel {
  // Informational only — derived from canonical phase index. The real
  // gate state machine lands in S9c.
  const programIndex = canonicalIndexForProgram(program);
  const gatePhaseIndex = CANONICAL_SIX_PHASES.find((p) => p.key === exitsPhase)!.index;
  if (programIndex > gatePhaseIndex) return 'cleared';
  if (programIndex === gatePhaseIndex) return 'in flight';
  return 'pending';
}

function canonicalIndexForProgram(program: ProgramSeedPlan): number {
  const view = summarizeProgram(program);
  return view.currentCanonicalPhase.index;
}

function gateTone(status: GateStatusLabel) {
  switch (status) {
    case 'cleared':
      return { bg: COLORS.accentSoft, border: 'rgba(14,159,140,0.2)', accent: COLORS.accent };
    case 'in flight':
      return { bg: COLORS.amberSoft, border: 'rgba(217,119,6,0.2)', accent: COLORS.amber };
    case 'pending':
      return { bg: 'rgba(26,22,18,0.03)', border: COLORS.border, accent: COLORS.mutedSoft };
  }
}

// --- Honest data placeholders ----------------------------------------

function DataPlaceholders() {
  const items: Array<{ label: string; body: string }> = [
    { label: 'Value at stake', body: HONEST_FALLBACK_LABELS.valueAtStake },
    { label: 'Risk register', body: HONEST_FALLBACK_LABELS.riskRegister },
    { label: 'Decisions pending', body: HONEST_FALLBACK_LABELS.decisionsPending },
  ];
  return (
    <section
      aria-label="Data not yet seeded"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 10,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            padding: '12px 14px',
            background: COLORS.card,
            border: `1px dashed ${COLORS.border}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {item.label}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5, fontStyle: 'italic' }}>
            {item.body}
          </div>
        </div>
      ))}
    </section>
  );
}

// --- Deliverable list -------------------------------------------------

function DeliverableList({
  tenant,
  program,
}: {
  tenant: TenantSeedPlan;
  program: ProgramSeedPlan;
}) {
  if (program.deliverables.length === 0) {
    return (
      <section
        style={{
          padding: '14px 18px',
          background: COLORS.card,
          border: `1px dashed ${COLORS.border}`,
          borderRadius: 10,
          fontSize: 13,
          color: COLORS.muted,
        }}
      >
        No deliverables seeded for this program yet.
      </section>
    );
  }

  // Group by phaseSpec for readability; preserve original ordering inside groups.
  const byPhase = new Map<SpecPhaseNumber, DeliverableSeedPlan[]>();
  for (const d of program.deliverables) {
    const list = byPhase.get(d.phaseSpec) ?? [];
    list.push(d);
    byPhase.set(d.phaseSpec, list);
  }

  return (
    <section
      aria-label="Deliverables"
      style={{
        padding: '16px 18px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        Deliverables · {program.deliverables.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from(byPhase.entries()).sort(([a], [b]) => a - b).map(([spec, list]) => (
          <div key={spec}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.muted,
                marginBottom: 6,
              }}
            >
              Spec phase P{spec} · {phaseMeta(spec).name}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.map((deliverable) => (
                <li key={deliverable.deliverableCode}>
                  <Link
                    href={tenantDeliverablePath(tenant, program, deliverable)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr auto',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      background: COLORS.borderSoft,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      textDecoration: 'none',
                      color: COLORS.ink,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.muted,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {deliverable.deliverableCode}
                    </span>
                    <span style={{ fontSize: 13, color: COLORS.ink }}>
                      {deliverable.title}
                    </span>
                    <TierBadge tier={deliverable.renderTier} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function TierBadge({ tier }: { tier: DeliverableSeedPlan['renderTier'] }) {
  const tone = (() => {
    switch (tier) {
      case 'rich':
        return { bg: COLORS.accentSoft, color: COLORS.accent, label: 'Rich' };
      case 'outline':
        return { bg: COLORS.amberSoft, color: COLORS.amber, label: 'Outline' };
      case 'stub':
        return { bg: 'rgba(26,22,18,0.04)', color: COLORS.muted, label: 'Stub' };
    }
  })();
  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
      }}
    >
      {tone.label}
    </span>
  );
}

function ContextMetric({ label, value }: { label: string; value: string }) {
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
      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{value}</div>
    </div>
  );
}
