// INTEL4 · Intelligence Lens Tabs.
//
// Server component. Renders the blueprint-aligned five-mode lens surface
// (Summary · Evidence · Programs · Actions · Signals) and the content panel
// for the active tab. Tab switching is URL-param-driven: ?tab=<key>.
// No client state, no hydration.
//
// Allowed imports:
//   - @/lib/intelligence/intelligence-lens-tabs-view (INTEL4 view-model)
//   - @/lib/intelligence/intelligence-workflow-canvas-view
//   - @/lib/intelligence/sentinel-brief-evidence-view
//   - @/lib/intelligence/sentinel-pattern-view
//   - @/components/intelligence/IntelligenceWorkflowCanvas (re-used for Signals)
//   - next/link
//
// Forbidden:
//   - model calls, fetch, Date.now, Math.random, live runtime
//   - src/lib/source/**, src/lib/auth/**

import Link from 'next/link';
import {
  buildIntelligenceLensTabsView,
  type IntelligenceLensTab,
} from '@/lib/intelligence/intelligence-lens-tabs-view';
import {
  buildIntelligenceWorkflowCanvasView,
} from '@/lib/intelligence/intelligence-workflow-canvas-view';
import {
  buildSentinelEvidenceBriefView,
  type EvidenceItem,
} from '@/lib/intelligence/sentinel-brief-evidence-view';
import {
  buildSentinelIntelligenceView,
  type SentinelPatternCard,
} from '@/lib/intelligence/sentinel-pattern-view';
import type { SentinelPatternDetection } from '@/lib/intelligence/sentinel-pattern-detections';
import { IntelligenceWorkflowCanvas } from '@/components/intelligence/IntelligenceWorkflowCanvas';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (matches existing intelligence surface palette)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  surface: '#F8F7F4',
  card: '#FFFFFF',
  ink: '#0A0C12',
  muted: '#525866',
  mutedSoft: '#9AA3B2',
  border: '#E8E6E1',
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.08)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.08)',
  red: '#B91C1C',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface IntelligenceLensTabsProps {
  tenant: TenantSeedPlan;
  activeTab: IntelligenceLensTab;
  /** Base URL for tab links (e.g. /tenant/apex-retail/intelligence) */
  baseUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function IntelligenceLensTabs({
  tenant,
  activeTab,
  baseUrl,
}: IntelligenceLensTabsProps) {
  const view = buildIntelligenceLensTabsView(activeTab);

  return (
    <div
      data-testid="intelligence-lens-tabs"
      data-active-tab={activeTab}
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Tab bar */}
      <nav
        aria-label="Intelligence lens tabs"
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.card,
          padding: '0 24px',
        }}
      >
        {view.tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const href = tab.key === 'summary'
            ? baseUrl
            : `${baseUrl}?tab=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              data-tab={tab.key}
              data-active={String(isActive)}
              aria-current={isActive ? 'page' : undefined}
              title={tab.description}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? C.navy : C.muted,
                borderBottom: isActive
                  ? `2px solid ${C.navy}`
                  : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: isActive ? '0.01em' : undefined,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Content panel */}
      <div style={{ padding: '24px clamp(16px, 4vw, 40px)' }}>
        {activeTab === 'summary' && (
          <SummaryPanel tenant={tenant} />
        )}
        {activeTab === 'evidence' && (
          <EvidencePanel tenantSlug={tenant.routeSlug} />
        )}
        {activeTab === 'programs' && (
          <ProgramsPanel tenant={tenant} />
        )}
        {activeTab === 'actions' && (
          <ActionsPanel tenant={tenant} />
        )}
        {activeTab === 'signals' && (
          <SignalsPanel tenantSlug={tenant.routeSlug} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab panels
// ─────────────────────────────────────────────────────────────────────────────

/** Summary — Sentinel brief + active patterns + compact context framing */
function SummaryPanel({ tenant }: { tenant: TenantSeedPlan }) {
  const view = buildSentinelIntelligenceView(tenant);
  const topDetection = view.detections[0] ?? null;
  const contextUsed = topDetection
    ? [
        `${topDetection.sourceSignalIds.length} seeded control-tower signals across ${topDetection.affectedPrograms.length} affected program routes`,
        `${topDetection.evidenceSignals.length} evidence-linked signals inform the lead pattern`,
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
      {/* Sentinel Brief */}
      <section
        aria-label="Sentinel brief"
        style={{
          backgroundColor: '#0F1E3F',
          color: '#FFFFFF',
          padding: '18px 22px',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#9AA3B2',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          SENTINEL · SUMMARY · DETERMINISTIC SEED
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          {view.brief.topPattern}
        </div>
        <div style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>
          {view.brief.whatSentinelSees}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
            marginTop: 14,
          }}
        >
          <MetricChip label="Confidence" value={view.brief.topConfidence} />
          <MetricChip label="Severity" value={view.brief.topSeverity} />
          <MetricChip
            label="Patterns detected"
            value={String(view.cards.length)}
          />
          <MetricChip
            label="Affected programmes"
            value={view.brief.affectedPrograms}
          />
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 10,
            color: '#525866',
            borderTop: '1px solid #1F2F5A',
            paddingTop: 10,
          }}
        >
          {view.brief.interpretationBasis}
        </div>
      </section>

      {topDetection && (
        <section
          aria-label="Summary context used"
          style={{
            padding: '12px 16px',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            display: 'grid',
            gap: 10,
          }}
        >
          <SectionLabel>Context used</SectionLabel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {contextUsed.map((item) => (
              <li key={item} style={{ fontSize: 12, color: C.ink }}>
                <span style={{ color: C.navy, fontWeight: 600, marginRight: 6 }}>·</span>
                {item}
              </li>
            ))}
          </ul>
          {topDetection.missingInputs.length > 0 && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: C.amberSoft,
                border: `1px solid ${C.amber}44`,
                borderRadius: 6,
                fontSize: 12,
                color: C.ink,
              }}
            >
              Missing inputs: {topDetection.missingInputs.slice(0, 3).join(' · ')}
            </div>
          )}
        </section>
      )}

      {/* Recommended action */}
      <section
        aria-label="Recommended action"
        style={{
          padding: '12px 16px',
          backgroundColor: C.navySoft,
          border: `1px solid ${C.navy}22`,
          borderLeft: `3px solid ${C.navy}`,
          borderRadius: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
          Sentinel recommends:{' '}
        </span>
        <span style={{ fontSize: 12, color: C.ink }}>{view.brief.recommendedAction}</span>
      </section>

      {/* Active patterns (top 3) */}
      {view.cards.length > 0 ? (
        <section aria-label="Active pattern detections">
          <SectionLabel>Active pattern detections</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {view.cards.slice(0, 3).map((card) => (
              <PatternRow key={card.detection.patternKey} card={card} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState message="No pattern detections seeded for this tenant." />
      )}

      <Caveat>
        This Summary tab is deterministic and context-first. It does not open a live
        Sentinel chat session and it does not invent unseen evidence.
      </Caveat>
    </div>
  );
}

/** Programs — affected program map and deterministic cross-surface links */
function ProgramsPanel({ tenant }: { tenant: TenantSeedPlan }) {
  const view = buildSentinelIntelligenceView(tenant);
  const programs = buildProgramRows(view.cards);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
      <SectionMeta
        agent="SENTINEL"
        title="Programs affected"
        subtitle="Programs mapped from active pattern detections so operators can move from portfolio signal to program action without guessing."
      />

      {programs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {programs.map((program, idx) => (
            <article
              key={program.href}
              style={{
                padding: '14px 18px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.navy}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: C.mutedSoft,
                    fontWeight: 700,
                  }}
                >
                  PRG-{String(idx + 1).padStart(3, '0')} · {program.patterns.map((pattern) => pattern.patternKey.replace(/_/g, ' ')).join(' · ')}
                </span>
                <ConfidenceBadge level={program.highestConfidence} />
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <Link
                  href={program.href}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.ink,
                    textDecoration: 'none',
                  }}
                >
                  {program.programCode} · {program.programName}
                </Link>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {program.patterns.length} active patterns · {program.totalMissingInputs} open input gaps
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                {program.patterns.slice(0, 2).map((pattern) => pattern.patternName).join(' · ')}
              </div>
              {program.patterns.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '6px 10px',
                    backgroundColor: C.amberSoft,
                    border: `1px solid ${C.amber}44`,
                    borderRadius: 4,
                    fontSize: 11,
                    color: C.muted,
                  }}
                >
                  Recommended focus: {program.patterns[0].recommendedAction}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="No affected programs are currently mapped from deterministic pattern detections for this tenant." />
      )}

      <Caveat>
        Programs mode is deterministic and link-safe. It reuses canonical program routes and does not invent live portfolio telemetry.
      </Caveat>
    </div>
  );
}

/** Actions — priority-ordered operator follow-through from seeded pattern detections */
function ActionsPanel({ tenant }: { tenant: TenantSeedPlan }) {
  const view = buildSentinelIntelligenceView(tenant);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
      <SectionMeta
        agent="SENTINEL"
        title="Priority actions"
        subtitle="Context-first follow-through for each active pattern. Actions are deterministic guidance, not executable automations."
      />

      {view.cards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {view.cards.map((card, idx) => (
            <ActionRow key={card.detection.patternKey} card={card} order={idx + 1} />
          ))}
        </div>
      ) : (
        <EmptyState message="No active pattern actions are seeded for this tenant." />
      )}

      <section
        aria-label="Three choices plus custom"
        style={{
          padding: '12px 16px',
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          display: 'grid',
          gap: 10,
        }}
      >
        <SectionLabel>Three choices plus custom</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            'Show supporting evidence',
            'Open affected programs',
            'Explain confidence and blockers',
            'Ask a narrower Sentinel question',
          ].map((label) => (
            <span
              key={label}
              style={{
                fontSize: 12,
                color: C.navy,
                border: `1px solid ${C.border}`,
                backgroundColor: C.surface,
                borderRadius: 999,
                padding: '6px 10px',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <Caveat>
        Actions mode discloses what is missing instead of pretending the system can execute work on your behalf today.
      </Caveat>
    </div>
  );
}

/** Evidence — evidence manifest using existing SentinelEvidenceBrief view-model */
function EvidencePanel({ tenantSlug }: { tenantSlug: string }) {
  const brief = buildSentinelEvidenceBriefView(tenantSlug, 'intelligence');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
      <SectionMeta
        agent="SENTINEL"
        title="Evidence manifest"
        subtitle="Confirmed evidence, missing items, and deferred signals. Deterministic seed — not live evidence ingestion."
      />

      {/* Confidence summary */}
      <section
        aria-label="Evidence confidence summary"
        style={{
          padding: '14px 18px',
          backgroundColor: '#0F1E3F',
          borderRadius: 6,
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#9AA3B2',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          SENTINEL · EVIDENCE · DETERMINISTIC
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          {brief.topPatternSummary}
        </div>
        <div style={{ fontSize: 11, color: '#9AA3B2' }}>
          Confidence: {brief.evidenceConfidenceLevel} — {brief.evidenceConfidenceReason}
        </div>
      </section>

      {/* Context used */}
      {brief.contextUsed.length > 0 && (
        <section
          aria-label="Evidence context used"
          style={{
            padding: '12px 16px',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
          }}
        >
          <SectionLabel>Context used</SectionLabel>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {brief.contextUsed.map((ctx, i) => (
              <li key={i} style={{ fontSize: 12, color: C.ink }}>
                <span style={{ color: C.navy, fontWeight: 600, marginRight: 6 }}>·</span>
                {ctx}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Confirmed evidence */}
      {brief.confirmedEvidence.length > 0 && (
        <section aria-label="Confirmed evidence">
          <SectionLabel>Confirmed evidence</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {brief.confirmedEvidence.map((ev) => (
              <EvidenceRow key={ev.evidenceId} item={ev} variant="confirmed" />
            ))}
          </div>
        </section>
      )}

      {/* Missing evidence */}
      {brief.missingEvidence.length > 0 && (
        <section aria-label="Missing evidence">
          <SectionLabel>Missing evidence</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {brief.missingEvidence.map((ev) => (
              <EvidenceRow key={ev.evidenceId} item={ev} variant="missing" />
            ))}
          </div>
        </section>
      )}

      {/* Unsupported claims */}
      {brief.unsupportedClaims.length > 0 && (
        <section
          aria-label="Unsupported claims"
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(185,28,28,0.06)',
            border: '1px solid rgba(185,28,28,0.2)',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.red,
              marginBottom: 6,
            }}
          >
            Unsupported claims
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {brief.unsupportedClaims.map((claim, i) => (
              <li key={i} style={{ fontSize: 12, color: C.ink }}>
                <span style={{ color: C.red, marginRight: 6 }}>·</span>
                {claim}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended action */}
      <section
        aria-label="Recommended next action"
        style={{
          padding: '12px 16px',
          backgroundColor: C.navySoft,
          border: `1px solid ${C.navy}22`,
          borderLeft: `3px solid ${C.navy}`,
          borderRadius: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
          Sentinel recommends:{' '}
        </span>
        <span style={{ fontSize: 12, color: C.ink }}>{brief.recommendedNextAction}</span>
      </section>

      <Caveat>{brief.deterministicSeedCaveat}</Caveat>
    </div>
  );
}

/** Signals — IntelligenceWorkflowCanvas in summary mode */
function SignalsPanel({ tenantSlug }: { tenantSlug: string }) {
  const canvasView = buildIntelligenceWorkflowCanvasView(tenantSlug, 'signals');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
      <SectionMeta
        agent="SENTINEL"
        title="Signals"
        subtitle="Raw Sentinel signal modes and workflow canvas. Deterministic seed — not live signal ingestion."
      />
      <IntelligenceWorkflowCanvas view={canvasView} />
      <Caveat>{canvasView.deterministicSeedCaveat}</Caveat>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ProgramRowModel {
  programCode: string;
  programName: string;
  href: string;
  highestConfidence: string;
  totalMissingInputs: number;
  patterns: ReadonlyArray<SentinelPatternDetection>;
}

function buildProgramRows(
  cards: ReadonlyArray<SentinelPatternCard>,
): ReadonlyArray<ProgramRowModel> {
  const map = new Map<string, ProgramRowModel>();

  for (const card of cards) {
    for (const program of card.detection.affectedPrograms) {
      const existing = map.get(program.routeHref);
      if (existing) {
        const nextPatterns = [...existing.patterns, card.detection].sort(
          compareDetections,
        );
        map.set(program.routeHref, {
          ...existing,
          highestConfidence: strongerConfidence(
            existing.highestConfidence,
            card.confidenceLabel,
          ),
          totalMissingInputs:
            existing.totalMissingInputs + card.detection.missingInputs.length,
          patterns: nextPatterns,
        });
        continue;
      }

      map.set(program.routeHref, {
        programCode: program.programCode,
        programName: program.programName,
        href: program.routeHref,
        highestConfidence: card.confidenceLabel,
        totalMissingInputs: card.detection.missingInputs.length,
        patterns: [card.detection],
      });
    }
  }

  return [...map.values()].sort((a, b) => compareProgramRows(a, b));
}

function compareProgramRows(a: ProgramRowModel, b: ProgramRowModel): number {
  const byPatternCount = b.patterns.length - a.patterns.length;
  if (byPatternCount !== 0) return byPatternCount;
  const byConfidence = compareConfidence(a.highestConfidence, b.highestConfidence);
  if (byConfidence !== 0) return byConfidence;
  return a.programCode.localeCompare(b.programCode);
}

function compareDetections(a: SentinelPatternDetection, b: SentinelPatternDetection): number {
  const byConfidence = compareConfidence(a.confidence, b.confidence);
  if (byConfidence !== 0) return byConfidence;
  return a.patternName.localeCompare(b.patternName);
}

function compareConfidence(left: string, right: string): number {
  return confidenceRank(right) - confidenceRank(left);
}

function strongerConfidence(left: string, right: string): string {
  return confidenceRank(left) >= confidenceRank(right) ? left : right;
}

function confidenceRank(value: string): number {
  switch (value.toLowerCase()) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

function ActionRow({
  card,
  order,
}: {
  card: SentinelPatternCard;
  order: number;
}) {
  const evidenceBasis = card.detection.evidenceSignals.length > 0
    ? `${card.detection.evidenceSignals.length} evidence-linked signals`
    : `${card.sourceSignalCount} seeded portfolio signals`;

  return (
    <article
      style={{
        padding: '14px 18px',
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.navy}`,
        borderRadius: 6,
        display: 'grid',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.mutedSoft,
              fontWeight: 700,
            }}
          >
            ACT-{String(order).padStart(3, '0')} · {card.detection.patternKey.replace(/_/g, ' ')}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
            {card.detection.recommendedAction}
          </span>
        </div>
        <ConfidenceBadge level={card.confidenceLabel} />
      </div>

      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
        {card.detection.whyItMatters}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <ActionMeta label="Evidence basis" value={evidenceBasis} />
        <ActionMeta
          label="Affected programs"
          value={card.detection.affectedPrograms.map((program) => program.programCode).join(' · ')}
        />
        <ActionMeta
          label="Likely handoff"
          value={card.detection.handoffTargets.length > 0 ? card.detection.handoffTargets.join(' · ') : 'Sentinel'}
        />
      </div>

      {card.detection.missingInputs.length > 0 && (
        <div
          style={{
            padding: '8px 10px',
            backgroundColor: C.amberSoft,
            border: `1px solid ${C.amber}44`,
            borderRadius: 4,
            fontSize: 11,
            color: C.ink,
          }}
        >
          Missing before action is reliable: {card.detection.missingInputs.slice(0, 3).join(' · ')}
        </div>
      )}
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: C.mutedSoft,
        fontWeight: 700,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function SectionMeta({
  agent,
  title,
  subtitle,
}: {
  agent: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: C.navy,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {agent}
      </div>
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fontWeight: 600,
          color: C.ink,
          margin: '0 0 4px',
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{subtitle}</p>
    </header>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#9AA3B2',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
        {value}
      </span>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const color =
    level === 'high'
      ? '#16A34A'
      : level === 'medium'
        ? C.amber
        : level === 'low'
          ? C.red
          : C.mutedSoft;
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
        background: `${color}18`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {level}
    </span>
  );
}

function PatternRow({ card }: { card: SentinelPatternCard }) {
  return (
    <article
      style={{
        padding: '12px 16px',
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.navy}`,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{card.detection.patternName}</span>
        <ConfidenceBadge level={card.confidenceLabel} />
      </div>
      <span style={{ fontSize: 12, color: C.muted }}>{card.detection.whyItMatters}</span>
    </article>
  );
}

function ActionMeta({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        backgroundColor: C.surface,
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        display: 'grid',
        gap: 2,
      }}
    >
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: C.mutedSoft,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12, color: C.ink }}>{value}</span>
    </div>
  );
}

function EvidenceRow({
  item,
  variant,
}: {
  item: EvidenceItem;
  variant: 'confirmed' | 'missing';
}) {
  const accent =
    variant === 'confirmed' ? '#16A34A' : C.amber;
  return (
    <div
      style={{
        padding: '10px 14px',
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{item.label}</span>
      {item.source && (
        <span style={{ fontSize: 11, color: C.muted }}>Source: {item.source}</span>
      )}
      <span style={{ fontSize: 11, color: C.mutedSoft, fontStyle: 'italic' }}>
        {item.note}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        backgroundColor: C.card,
        border: `1px dashed ${C.border}`,
        borderRadius: 6,
        fontSize: 13,
        color: C.muted,
        fontStyle: 'italic',
      }}
    >
      {message}
    </div>
  );
}

function Caveat({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: C.mutedSoft, fontStyle: 'italic', margin: 0 }}>
      {children}
    </p>
  );
}
