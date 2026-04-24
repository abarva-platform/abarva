import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';
import type { BuildProgressRoadmap } from '@/lib/build-progress/roadmap';
import { PageShell } from '@/components/shared/layout/PageShell';
import { CategoryProgressCard } from './CategoryProgressCard';
import { CriticalPathTracker } from './CriticalPathTracker';
import { ProductionReadinessPanel } from './ProductionReadinessPanel';
import { SliceQueueTable } from './SliceQueueTable';
import { ValidationStatusPanel } from './ValidationStatusPanel';

export function BuildProgressDashboard({ roadmap }: { roadmap: BuildProgressRoadmap }) {
  return (
    <PageShell width="wide" padding="comfortable">
      <div style={{ display: 'grid', gap: 22 }}>
        <header
          style={{
            ...COMPONENTS.card,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
            gap: 18,
            background:
              'radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 34%), #0D1520',
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={TEXT.productLabel}>Founder Build Control Tower</div>
            <h1
              style={{
                margin: 0,
                fontFamily: FONTS.serif,
                fontSize: 42,
                lineHeight: 1.05,
                fontWeight: 500,
                color: COLORS.textPrimary,
              }}
            >
              Build progress, risk, validation, and production readiness in one operating surface.
            </h1>
            <p style={{ ...TEXT.bodySecondary, margin: 0, maxWidth: 860 }}>
              Static mission-control dashboard for tracking AbarVa build execution by category, critical path,
              slice queue, validation status, blockers, and readiness signals. Update the source data in
              `src/lib/build-progress/roadmap.ts`.
            </p>
          </div>
          <div style={{ ...COMPONENTS.cardInset, alignSelf: 'stretch', display: 'grid', gap: 10 }}>
            <div style={TEXT.sectionLabel}>Operating posture</div>
            <div style={{ ...TEXT.cxoQuestion, fontSize: 24 }}>
              Code Complete is not Verified.
            </div>
            <p style={{ ...TEXT.bodySecondary, margin: 0 }}>
              This page separates implementation state from validation state so production risk cannot hide
              behind shipped PRs.
            </p>
            <div style={{ ...TEXT.small, color: COLORS.textMuted }}>Last updated - {roadmap.lastUpdated}</div>
          </div>
        </header>

        <ProductionReadinessPanel
          readiness={roadmap.productionReadiness}
          signals={roadmap.productionSignals}
        />

        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end' }}>
            <div>
              <div style={TEXT.sectionLabel}>Category Progress</div>
              <h2 style={{ margin: 0, fontFamily: FONTS.serif, fontSize: 28, fontWeight: 500 }}>
                A-K backlog health
              </h2>
            </div>
            <div style={{ ...TEXT.small, color: COLORS.textMuted }}>{roadmap.categories.length} categories tracked</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 14 }}>
            {roadmap.categories.map((category) => (
              <CategoryProgressCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        <CriticalPathTracker milestones={roadmap.criticalPath} />

        <SliceQueueTable slices={roadmap.sliceQueue} />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, 0.65fr)', gap: 16 }}>
          <ValidationStatusPanel commands={roadmap.validationCommands} />

          <section style={{ ...COMPONENTS.card, display: 'grid', gap: 12, alignSelf: 'start' }}>
            <div style={TEXT.sectionLabel}>Build Guidance</div>
            <h2 style={{ margin: 0, fontFamily: FONTS.serif, fontSize: 28, fontWeight: 500 }}>
              Rules for the next slice
            </h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {roadmap.guidance.map((item) => (
                <div key={item} style={{ ...COMPONENTS.cardInset, display: 'flex', gap: 10 }}>
                  <span style={{ color: COLORS.teal, fontFamily: FONTS.mono }}>#</span>
                  <span style={TEXT.bodySecondary}>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
