// AIR-4 · Per-initiative detail page with 7 tabs.
//
// Per docs/build/intelligence/ai-initiatives-package/SETUP_UI_SPEC.md
// "Initiative detail page". Tabs (URL-param driven):
//   Overview · KPIs · Stakeholders · Decisions · Vendors · Scenarios · Provenance
//
// Default tab: Overview.

import Link from 'next/link';
import { COLORS, SPACING, RADIUS, BORDER, FONT } from '@/lib/design/abarva-theme';
import {
  STAGE_LABELS,
  STATUS_LABELS,
  formatUsd,
  type AIInitiative,
} from '@/lib/admin/ai-initiatives/queries';
import type {
  AIInitiativeKpi,
  AIInitiativeStakeholderNote,
  AIInitiativeDecision,
  AIInitiativeVendor,
  AIInitiativeScenario,
  InitiativeDetail,
} from '@/lib/admin/ai-initiatives/detail-queries';

export type DetailTab =
  | 'overview'
  | 'kpis'
  | 'stakeholders'
  | 'decisions'
  | 'vendors'
  | 'scenarios'
  | 'provenance';

const TABS: ReadonlyArray<{ key: DetailTab; label: string; counter?: 'kpis' | 'notes' | 'decisions' | 'vendors' | 'scenarios' }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'kpis', label: 'KPIs', counter: 'kpis' },
  { key: 'stakeholders', label: 'Stakeholders', counter: 'notes' },
  { key: 'decisions', label: 'Decisions', counter: 'decisions' },
  { key: 'vendors', label: 'Vendors', counter: 'vendors' },
  { key: 'scenarios', label: 'Scenarios', counter: 'scenarios' },
  { key: 'provenance', label: 'Provenance' },
];

export function InitiativeDetailView({
  detail,
  tab,
}: {
  detail: InitiativeDetail;
  tab: DetailTab;
}) {
  const counts = {
    kpis: detail.kpis.length,
    notes: detail.stakeholderNotes.length,
    decisions: detail.decisions.length,
    vendors: detail.vendors.length,
    scenarios: detail.scenarios.length,
  };

  return (
    <div
      data-testid="initiative-detail-page"
      style={{
        padding: `${SPACING.xl}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Breadcrumb initiative={detail.initiative} />
      <DetailHeader initiative={detail.initiative} />
      <TabNav initiativeId={detail.initiative.initiativeId} active={tab} counts={counts} />

      <div data-detail-tab={tab}>
        {tab === 'overview' && <OverviewTab initiative={detail.initiative} />}
        {tab === 'kpis' && <KpisTab kpis={detail.kpis} />}
        {tab === 'stakeholders' && <StakeholdersTab notes={detail.stakeholderNotes} />}
        {tab === 'decisions' && <DecisionsTab decisions={detail.decisions} />}
        {tab === 'vendors' && <VendorsTab vendors={detail.vendors} />}
        {tab === 'scenarios' && <ScenariosTab scenarios={detail.scenarios} />}
        {tab === 'provenance' && <ProvenanceTab detail={detail} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Breadcrumb + header
// ---------------------------------------------------------------------

function Breadcrumb({ initiative }: { initiative: AIInitiative }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        fontFamily: FONT.mono,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        marginBottom: SPACING.lg,
      }}
    >
      <Link
        href="/admin/ai-initiatives"
        style={{ color: COLORS.muted, textDecoration: 'none' }}
      >
        ← AI Initiatives
      </Link>
      <span style={{ margin: `0 ${SPACING.xs}px`, opacity: 0.5 }}>/</span>
      <span style={{ color: COLORS.body }}>{initiative.displayId}</span>
    </nav>
  );
}

function DetailHeader({ initiative }: { initiative: AIInitiative }) {
  return (
    <header style={{ marginBottom: SPACING.lg }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
          flexWrap: 'wrap',
          marginBottom: SPACING.xs,
        }}
      >
        {initiative.alignedCallout && (
          <span aria-hidden="true" style={{ color: COLORS.amber, fontSize: 18 }}>
            ⭐
          </span>
        )}
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {initiative.displayId}
        </span>
      </div>
      <h1
        style={{
          fontFamily: FONT.body,
          fontSize: 24,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          margin: 0,
          marginBottom: SPACING.xs,
        }}
      >
        {initiative.name}
      </h1>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.muted,
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.md,
        }}
      >
        <span>{initiative.primaryCategoryName}</span>
        <span>·</span>
        <span>{STAGE_LABELS[initiative.stage]}{initiative.stageDetail ? ` (${initiative.stageDetail})` : ''}</span>
        <span>·</span>
        <span>
          {initiative.ownerName} · {initiative.ownerTitle}
        </span>
      </div>
    </header>
  );
}

function TabNav({
  initiativeId,
  active,
  counts,
}: {
  initiativeId: string;
  active: DetailTab;
  counts: { kpis: number; notes: number; decisions: number; vendors: number; scenarios: number };
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: SPACING.xs,
        flexWrap: 'wrap',
        borderBottom: BORDER.hairline,
        marginBottom: SPACING.xl,
        paddingBottom: SPACING.sm,
      }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        const count = t.counter ? counts[t.counter] : undefined;
        const href =
          t.key === 'overview'
            ? `/admin/ai-initiatives/${initiativeId}`
            : `/admin/ai-initiatives/${initiativeId}?tab=${t.key}`;
        return (
          <Link
            key={t.key}
            href={href}
            role="tab"
            aria-selected={isActive}
            style={{
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.pill,
              background: isActive ? COLORS.navy : COLORS.surface,
              color: isActive ? COLORS.surface : COLORS.body,
              border: isActive ? `1px solid ${COLORS.navy}` : `1px solid ${COLORS.border}`,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
            }}
          >
            <span>{t.label}</span>
            {count !== undefined && count > 0 && (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  fontWeight: 600,
                  opacity: 0.7,
                }}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------

function OverviewTab({ initiative }: { initiative: AIInitiative }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {initiative.alignedCallout && initiative.alignedRationale && (
        <Block
          label="Aligned with business goal"
          tone="amber"
        >
          <strong style={{ color: COLORS.amber }}>⭐ </strong>
          {initiative.alignedRationale}
        </Block>
      )}

      <Block label="Description">{initiative.description}</Block>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: SPACING.lg }}>
        <KvBlock
          rows={[
            ['Category', initiative.primaryCategoryName],
            ['Goal', initiative.primaryGoalName],
            ['Stage', STAGE_LABELS[initiative.stage] + (initiative.stageDetail ? ` (${initiative.stageDetail})` : '')],
            ['Owner', `${initiative.ownerName} · ${initiative.ownerTitle}${initiative.ownerFunction ? ` · ${initiative.ownerFunction}` : ''}`],
          ]}
        />
        <KvBlock
          rows={[
            ['Annual run-rate', formatUsd(initiative.committedAnnualUsd)],
            ['Total committed', formatUsd(initiative.committedTotalUsd)],
            ['Measured value', formatUsd(initiative.measuredValueUsd)],
            ['Confidence', initiative.confidenceLevel],
          ]}
        />
      </div>

      <Block label="Status">
        <StatusChip flag={initiative.statusFlag} />
        <span style={{ marginLeft: SPACING.sm }}>{initiative.statusSummary}</span>
      </Block>
    </div>
  );
}

// ---------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------

function KpisTab({ kpis }: { kpis: ReadonlyArray<AIInitiativeKpi> }) {
  if (kpis.length === 0) return <EmptyTab>No KPIs loaded for this initiative.</EmptyTab>;

  // Pivot: rows = KPI name, columns = quarters (sorted chronologically).
  // Quarters are stored as strings like "Q1-2025"; alphabetical sort puts
  // Q1-2026 before Q3-2025 which is wrong. Parse and sort by year then
  // quarter number.
  const quarters = Array.from(new Set(kpis.map((k) => k.quarter))).sort(
    (a, b) => {
      const pa = parseQuarter(a);
      const pb = parseQuarter(b);
      return pa.year - pb.year || pa.q - pb.q;
    },
  );
  const byKpi = new Map<string, Map<string, AIInitiativeKpi>>();
  for (const k of kpis) {
    const inner = byKpi.get(k.kpiName) ?? new Map<string, AIInitiativeKpi>();
    inner.set(k.quarter, k);
    byKpi.set(k.kpiName, inner);
  }

  return (
    <div
      style={{
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        background: COLORS.card,
        overflowX: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT.body }}>
        <thead>
          <tr style={{ background: COLORS.surface2, textAlign: 'left' }}>
            <th
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: COLORS.muted,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
              }}
            >
              KPI
            </th>
            {quarters.map((q) => (
              <th
                key={q}
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: COLORS.muted,
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  textAlign: 'right',
                }}
              >
                {q}
              </th>
            ))}
            <th
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: COLORS.muted,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                textAlign: 'right',
              }}
            >
              Target
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(byKpi.entries()).map(([kpiName, perQuarter]) => {
            const sample = Array.from(perQuarter.values())[0];
            return (
              <tr key={kpiName} style={{ borderTop: BORDER.hairlineSoft }}>
                <td style={{ fontSize: 13, padding: `${SPACING.sm}px ${SPACING.md}px`, fontWeight: 600 }}>
                  {kpiName}
                  <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 400 }}>
                    {sample.kpiUnit ?? ''}
                  </div>
                </td>
                {quarters.map((q) => {
                  const cell = perQuarter.get(q);
                  return (
                    <td
                      key={q}
                      style={{
                        fontFamily: FONT.mono,
                        fontSize: 12,
                        padding: `${SPACING.sm}px ${SPACING.md}px`,
                        textAlign: 'right',
                        color: cell ? COLORS.body : COLORS.mutedSoft,
                      }}
                    >
                      {cell ? cell.kpiValue.toLocaleString() : '—'}
                      {cell && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 9,
                            color: confidenceColor(cell.confidenceLevel),
                          }}
                          title={`Confidence ${cell.confidenceLevel}`}
                        >
                          ●
                        </span>
                      )}
                    </td>
                  );
                })}
                <td
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    textAlign: 'right',
                    color: COLORS.muted,
                  }}
                >
                  {sample.targetValue !== null ? sample.targetValue.toLocaleString() : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function parseQuarter(q: string): { year: number; q: number } {
  // Accept "Q1-2025" / "Q4-2026" / "2025-Q1" forms; fall back to alpha
  // ordering for anything we don't recognize.
  const m1 = q.match(/^Q([1-4])-(\d{4})$/);
  if (m1) return { year: Number(m1[2]), q: Number(m1[1]) };
  const m2 = q.match(/^(\d{4})-Q([1-4])$/);
  if (m2) return { year: Number(m2[1]), q: Number(m2[2]) };
  return { year: 0, q: 0 };
}

function confidenceColor(level: 'HIGH' | 'MED' | 'LOW'): string {
  switch (level) {
    case 'HIGH':
      return '#0F6E56';
    case 'MED':
      return COLORS.amber;
    case 'LOW':
      return COLORS.red;
  }
}

// ---------------------------------------------------------------------
// Stakeholders
// ---------------------------------------------------------------------

function StakeholdersTab({ notes }: { notes: ReadonlyArray<AIInitiativeStakeholderNote> }) {
  if (notes.length === 0) return <EmptyTab>No stakeholder notes loaded.</EmptyTab>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {notes.map((n) => (
        <article
          key={n.noteId}
          style={{
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            background: COLORS.card,
            padding: SPACING.lg,
          }}
        >
          <header style={{ marginBottom: SPACING.sm }}>
            <div style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
              {n.stakeholderName}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: FONT.body }}>
              {n.stakeholderTitle} · {n.interviewDate}
              {n.attributionConsent ? '' : ' · attribution: not confirmed'}
            </div>
          </header>
          <blockquote
            style={{
              fontFamily: FONT.body,
              fontSize: 14,
              color: COLORS.body,
              lineHeight: 1.55,
              borderLeft: `3px solid ${COLORS.navy}`,
              paddingLeft: SPACING.md,
              margin: 0,
              marginBottom: SPACING.sm,
            }}
          >
            “{n.quote}”
          </blockquote>
          {n.themes.length > 0 && (
            <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
              {n.themes.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 9,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: COLORS.muted,
                    background: COLORS.surface2,
                    padding: `2px ${SPACING.xs}px`,
                    borderRadius: RADIUS.sm,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------

function DecisionsTab({ decisions }: { decisions: ReadonlyArray<AIInitiativeDecision> }) {
  if (decisions.length === 0) return <EmptyTab>No decision traces loaded.</EmptyTab>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {decisions.map((d) => (
        <article
          key={d.decisionId}
          style={{
            border: d.dissentRecorded
              ? `1px solid ${COLORS.red}`
              : BORDER.hairline,
            borderRadius: RADIUS.md,
            background: d.dissentRecorded ? COLORS.redSoft : COLORS.card,
            padding: SPACING.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: SPACING.sm }}>
            <h3 style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: COLORS.ink, margin: 0 }}>
              {d.decisionName}
            </h3>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: decisionStatusColor(d.decisionStatus),
                fontWeight: 700,
              }}
            >
              {d.decisionStatus}
            </span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: FONT.body, marginTop: 2 }}>
            {d.decisionDate ?? 'pending'}
            {d.sponsorName ? ` · sponsor ${d.sponsorName}` : ''}
            {d.outcomeStatus ? ` · ${d.outcomeStatus}` : ''}
          </div>
          {d.dissentRecorded && d.dissentSummary && (
            <div
              style={{
                marginTop: SPACING.sm,
                fontSize: 13,
                color: COLORS.red,
                fontFamily: FONT.body,
              }}
            >
              <strong>Dissent recorded:</strong> {d.dissentSummary}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function decisionStatusColor(status: 'decided' | 'pending' | 'stalled' | 'reversed'): string {
  switch (status) {
    case 'decided':
      return '#0F6E56';
    case 'pending':
      return COLORS.amber;
    case 'stalled':
    case 'reversed':
      return COLORS.red;
  }
}

// ---------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------

function VendorsTab({ vendors }: { vendors: ReadonlyArray<AIInitiativeVendor> }) {
  if (vendors.length === 0) return <EmptyTab>No vendors recorded for this initiative.</EmptyTab>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {vendors.map((v) => (
        <article
          key={v.vendorId}
          style={{
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            background: COLORS.card,
            padding: SPACING.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: SPACING.sm }}>
            <h3 style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: COLORS.ink, margin: 0 }}>
              {v.vendorName}
            </h3>
            {v.financialHealth && (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: vendorHealthColor(v.financialHealth),
                  fontWeight: 700,
                }}
              >
                {v.financialHealth}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: FONT.body, marginTop: 2 }}>
            {v.contractValueUsd !== null ? `${formatUsd(v.contractValueUsd)} contract` : 'value not set'}
            {v.renewalDate ? ` · renewal ${v.renewalDate}` : ''}
          </div>
          {v.notes && (
            <div style={{ marginTop: SPACING.sm, fontSize: 13, color: COLORS.body, fontFamily: FONT.body }}>
              {v.notes}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function vendorHealthColor(health: 'strong' | 'moderate' | 'watch' | 'at_risk'): string {
  switch (health) {
    case 'strong':
      return '#0F6E56';
    case 'moderate':
      return COLORS.body;
    case 'watch':
      return COLORS.amber;
    case 'at_risk':
      return COLORS.red;
  }
}

// ---------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------

function ScenariosTab({ scenarios }: { scenarios: ReadonlyArray<AIInitiativeScenario> }) {
  if (scenarios.length === 0) return <EmptyTab>No scenarios loaded.</EmptyTab>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {scenarios.map((s) => (
        <article
          key={s.scenarioId}
          style={{
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            background: COLORS.card,
            padding: SPACING.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: SPACING.sm }}>
            <h3 style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: COLORS.ink, margin: 0 }}>
              {s.scenarioName}
            </h3>
            {s.probabilityPct !== null && (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.muted,
                }}
              >
                {s.probabilityPct}% likely
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: FONT.body, marginTop: 2 }}>
            {s.triggerEvent ? `trigger: ${s.triggerEvent}` : ''}
            {s.timeHorizonMonths ? ` · within ${s.timeHorizonMonths} months` : ''}
          </div>
          <div style={{ marginTop: SPACING.sm, fontSize: 13, color: COLORS.body, fontFamily: FONT.body, lineHeight: 1.55 }}>
            {s.impactSummary}
          </div>
        </article>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------

function ProvenanceTab({ detail }: { detail: InitiativeDetail }) {
  const rows: Array<{ label: string; loaded_via_template: string; count?: number }> = [
    { label: 'Initiative record', loaded_via_template: detail.initiative.loadedViaTemplate },
    { label: 'KPI history', loaded_via_template: detail.kpis[0]?.loadedViaTemplate ?? '—', count: detail.kpis.length },
    { label: 'Stakeholder notes', loaded_via_template: detail.stakeholderNotes[0]?.loadedViaTemplate ?? '—', count: detail.stakeholderNotes.length },
    { label: 'Decisions', loaded_via_template: detail.decisions[0]?.loadedViaTemplate ?? '—', count: detail.decisions.length },
    { label: 'Vendors', loaded_via_template: detail.vendors[0]?.loadedViaTemplate ?? '—', count: detail.vendors.length },
    { label: 'Scenarios', loaded_via_template: detail.scenarios[0]?.loadedViaTemplate ?? '—', count: detail.scenarios.length },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      <Block label="Why this matters">
        Every record on this page carries a <code style={{ fontFamily: FONT.mono }}>loaded_via_template</code> marker —
        the day-1 manual-load source. Future integrations replace these markers with integration source IDs.
        This is the surface that stays honest about what is integrated vs. manually templated.
      </Block>

      <div
        style={{
          border: BORDER.hairline,
          borderRadius: RADIUS.md,
          background: COLORS.card,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT.body }}>
          <thead>
            <tr style={{ background: COLORS.surface2, textAlign: 'left' }}>
              <th style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.muted, padding: `${SPACING.sm}px ${SPACING.md}px` }}>
                Substrate
              </th>
              <th style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.muted, padding: `${SPACING.sm}px ${SPACING.md}px`, textAlign: 'right' }}>
                Records
              </th>
              <th style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.muted, padding: `${SPACING.sm}px ${SPACING.md}px` }}>
                Loaded from
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} style={{ borderTop: BORDER.hairlineSoft }}>
                <td style={{ fontSize: 13, padding: `${SPACING.sm}px ${SPACING.md}px`, fontWeight: 600, color: COLORS.body }}>
                  {r.label}
                </td>
                <td style={{ fontFamily: FONT.mono, fontSize: 12, padding: `${SPACING.sm}px ${SPACING.md}px`, textAlign: 'right', color: COLORS.muted }}>
                  {r.count !== undefined ? r.count : '—'}
                </td>
                <td style={{ fontFamily: FONT.mono, fontSize: 11, padding: `${SPACING.sm}px ${SPACING.md}px`, color: COLORS.body }}>
                  {r.loaded_via_template}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Reusable bits
// ---------------------------------------------------------------------

function Block({
  label,
  tone = 'default',
  children,
}: {
  label: string;
  tone?: 'default' | 'amber';
  children: React.ReactNode;
}) {
  const isAmber = tone === 'amber';
  return (
    <div
      style={{
        border: isAmber ? `1px solid ${COLORS.amber}` : BORDER.hairline,
        background: isAmber ? 'rgba(180, 83, 9, 0.04)' : COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: isAmber ? COLORS.amber : COLORS.muted,
          marginBottom: SPACING.sm,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: FONT.body, fontSize: 14, color: COLORS.body, lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
  );
}

function KvBlock({ rows }: { rows: ReadonlyArray<[string, string]> }) {
  return (
    <div
      style={{
        border: BORDER.hairline,
        background: COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT.body }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.muted,
                  padding: `${SPACING.xs}px 0`,
                  width: '40%',
                  verticalAlign: 'top',
                }}
              >
                {k}
              </td>
              <td style={{ fontSize: 13, padding: `${SPACING.xs}px 0`, color: COLORS.body, verticalAlign: 'top' }}>
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusChip({ flag }: { flag: AIInitiative['statusFlag'] }) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.body,
        background: COLORS.surface2,
        padding: `2px ${SPACING.xs}px`,
        borderRadius: RADIUS.sm,
      }}
    >
      {STATUS_LABELS[flag]}
    </span>
  );
}

function EmptyTab({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.md,
        padding: SPACING.xxxl,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontSize: 13,
        color: COLORS.muted,
      }}
    >
      {children}
    </div>
  );
}
