'use client';

// PROG-P2 · Programs Index page — canonical shell alignment.
// Catalog entries: PRG-IDX-DEFAULT, PRG-IDX-LINKED, PRG-IDX-EMPTY, PRG-IDX-FILTERED.
// Server component passes ProgramsIndexView to this client island.
// data-testid markers required for P-SMOKE-CDP assertions.
//
// PR-I (Surface 2 master canvas) — adds an <AgentCanvas> at the top of
// the page so /programs is agent-centric: Nexus chat dominant + reactive
// portfolio panel. The legacy filter-pills / stats / programs-grid
// content collapses into a "Programs portfolio · grid view" details
// element below. AgentColumn is deprecated for this surface — chat
// lives inside AgentCanvas now.

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentCanvas } from '@/components/programs/AgentCanvas';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ProgramRow, ProgramsIndexView as ProgramsIndexViewV2 } from '@/lib/programs/programs-types';
import {
  filterProgramRowsForIndex,
  getProgramsIndexEmptyStateCopy,
  getProgramsIndexEmptyStateTitle,
  getProgramsIndexFilterHref,
  getProgramsIndexFilterSummary,
  normalizeProgramsIndexFilter,
} from '@/lib/programs/programs-page-view';
import {
  buildPhaseFilterView,
  type ProgramPhase,
} from '@/lib/programs/phase-filter-view';
import { InstanceHealthBadge } from '@/components/_shared/InstanceHealthBadge';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { InstanceHealth } from '@/lib/reasoning/instance-health';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgramsIndexPageProps {
  view: ProgramsIndexViewV2;
  hasTenantKey?: boolean;
}

// ─── Health lookup ────────────────────────────────────────────────────────────

/**
 * Compute instance health for a program row by matching it against the
 * APEX_RETAIL_PROGRAM_INSTANCES fixture via displayId or id. Returns null
 * when the row has no corresponding reasoning instance (e.g. DB-only programs).
 */
function computeRowHealth(row: ProgramRow): InstanceHealth | null {
  const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
    (i) =>
      i.displayId === row.displayId ||
      i.id.toLowerCase() === row.id.toLowerCase(),
  );
  if (!instance) return null;
  const ctx = buildProgramSynthesisContext(instance);
  return computeInstanceHealth(ctx);
}

// ─── Mini phase dots ──────────────────────────────────────────────────────────

function MiniPhaseDots({ phases }: { phases: ProgramRow['phases'] }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {phases.map((phase) => {
        let bg: string;
        let border: string | undefined;
        switch (phase.state) {
          case 'done':
            bg = SHELL.MINT_TEXT;
            break;
          case 'current':
            bg = SHELL.INK;
            break;
          case 'pending':
            bg = 'transparent';
            border = `1px solid ${SHELL.PEACH_TEXT}`;
            break;
          default:
            bg = SHELL.GRAY_BG;
        }
        return (
          <div
            key={phase.id}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: bg,
              border: border ?? 'none',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Gate pill ────────────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramRow['gateStatus'] }) {
  let bg: string;
  let color: string;
  let label: string;

  switch (status) {
    case 'pending':
      bg = SHELL.PEACH_BG;
      color = SHELL.PEACH_TEXT;
      label = 'Gate pending';
      break;
    case 'open':
    case 'approved':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = status === 'approved' ? 'Approved' : 'Gate open';
      break;
    default:
      bg = SHELL.GRAY_BG;
      color = SHELL.GRAY_TEXT;
      label = status === 'idle' ? 'Idle' : '—';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Program row ──────────────────────────────────────────────────────────────

function ProgramTableRow({ row }: { row: ProgramRow }) {
  const actionHref = `/programs/${row.id}?phase=${row.currentPhase}`;
  const health = computeRowHealth(row);

  return (
    <Link
      href={`/programs/${row.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr 80px 108px 72px 80px',
        alignItems: 'center',
        minHeight: 44,
        padding: '6px 16px',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        textDecoration: 'none',
        color: SHELL.INK,
        gap: 8,
        transition: 'background 100ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = SHELL.PAPER_SOFT;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
      }}
    >
      {/* ID */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.06em',
        }}
      >
        {row.displayId}
      </span>

      {/* Name + health badge */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 14,
              fontWeight: 700,
              color: SHELL.INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            {row.name}
          </span>
          {health && <InstanceHealthBadge health={health} />}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontStyle: 'italic',
            color: SHELL.INK_MUTED,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
            marginTop: 1,
          }}
        >
          {row.nexusNote}
        </div>
      </div>

      {/* Mini phase dots */}
      <div>
        <MiniPhaseDots phases={row.phases} />
      </div>

      {/* Gate pill */}
      <div>
        <GatePill status={row.gateStatus} />
      </div>

      {/* Last active */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
        }}
      >
        {row.lastActiveLabel}
      </span>

      {/* Action button */}
      <div
        onClick={(e) => e.preventDefault()}
        style={{ display: 'flex' }}
      >
        <Link
          href={actionHref}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 999,
            border: `1px solid ${SHELL.INK}`,
            background: 'transparent',
            color: SHELL.INK,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          {row.actionLabel}
        </Link>
      </div>
    </Link>
  );
}

// ─── Programs table ───────────────────────────────────────────────────────────

function ProgramsTable({ programs }: { programs: ProgramRow[] }) {
  const colHeaderStyle = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    fontWeight: 700 as const,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: SHELL.INK_MUTED,
  };

  return (
    <div
      style={{
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        overflow: 'hidden',
      }}
    >
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 80px 108px 72px 80px',
          padding: '7px 16px',
          gap: 8,
          background: SHELL.PAPER_SOFT,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        }}
      >
        <span style={colHeaderStyle}>ID</span>
        <span style={colHeaderStyle}>Program</span>
        <span style={colHeaderStyle}>Journey</span>
        <span style={colHeaderStyle}>Gate</span>
        <span style={colHeaderStyle}>Last active</span>
        <span style={colHeaderStyle}>Action</span>
      </div>

      {/* Rows */}
      {programs.map((row) => (
        <ProgramTableRow key={row.id} row={row} />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProgramsIndexPage({ view, hasTenantKey = false }: ProgramsIndexPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // PR-I · live Nexus artifacts dispatched by the embedded chat in
  // AgentCanvas. Same pattern as ProgramDetailPage's nexusArtifacts.
  const [nexusArtifacts, setNexusArtifacts] = useState<Artifact[]>([]);
  const handleNexusArtifact = useCallback((artifact: Artifact) => {
    setNexusArtifacts((prev) => {
      const key = JSON.stringify(artifact);
      if (prev.some((a) => JSON.stringify(a) === key)) return prev;
      return [...prev, artifact];
    });
  }, []);
  const activeFilter = normalizeProgramsIndexFilter(searchParams?.get('filter') ?? null);
  const activePhase = (searchParams?.get('phase') ?? 'all') as ProgramPhase | 'all';
  const phaseView = buildPhaseFilterView(
    view.phaseFilterTenantSlug,
    activePhase === 'all' ? 'all' : activePhase as ProgramPhase,
  );
  const flagship = view.programs.find((program) => program.id === 'apx-cdp-2026') ?? view.programs[0];
  const filtered = filterProgramRowsForIndex(view.programs, activeFilter);
  const emptyStateCopy = getProgramsIndexEmptyStateCopy(activeFilter);
  const emptyStateTitle = getProgramsIndexEmptyStateTitle(activeFilter);
  const filteredSummary = getProgramsIndexFilterSummary(activeFilter, filtered.length, view.programs.length);

  const filterPills = [
    {
      key: 'all',
      label: 'All',
      active: activeFilter === 'all',
      count: view.programs.length,
      onClick: () => router.push(getProgramsIndexFilterHref('all'), { scroll: false }),
    },
    {
      key: 'active',
      label: 'Active',
      active: activeFilter === 'active',
      count: view.programs.filter((p) => !p.isIdle && !p.isCompleted).length,
      onClick: () => router.push(getProgramsIndexFilterHref('active'), { scroll: false }),
    },
    {
      key: 'idle',
      label: 'Idle',
      active: activeFilter === 'idle',
      count: view.programs.filter((p) => p.isIdle).length,
      onClick: () => router.push(getProgramsIndexFilterHref('idle'), { scroll: false }),
    },
    {
      key: 'gated',
      label: 'Gated',
      active: activeFilter === 'gated',
      count: view.gatesPending,
      onClick: () => router.push(getProgramsIndexFilterHref('gated'), { scroll: false }),
    },
  ];

  // Note: the fixture's `portfolioWorkbench.actions` (A/B/C quick
  // navigations) used to feed AgentColumn. PR-I dropped AgentColumn for
  // this surface, so those quick actions retire — Nexus chat is now
  // the navigation. (If we want them back as suggested-prompt chips,
  // add to AgentCanvas via a follow-up.)

  return (
    <AppShell
      surface="programs"
      topBarProps={{
        tenantName: view.tenant,
        showLocked: true,
        context: `Programs · ${view.totalActive} in flight`,
      }}
      middleStrip={<FilterPillStrip pills={filterPills} />}
      hasTenantKey={hasTenantKey}
      onArtifact={handleNexusArtifact}
    >
      {/* PR-I · agent-centric primary canvas. Nexus + reactive panel
          dominate the viewport; the legacy stats / program grid
          collapses into a details accordion below. AgentColumn (the
          legacy left-rail chat widget) is deprecated for this
          surface — chat lives inside AgentCanvas now. */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 28px 0' }}>
          <AgentCanvas
            surface="/programs"
            agent={{ initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' }}
            quote={view.portfolioWorkbench.prose}
            artifacts={nexusArtifacts}
            onArtifact={handleNexusArtifact}
          />
        </div>

        <details
          data-testid="programs-index-legacy"
          style={{
            margin: '0 28px 28px',
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            background: SHELL.PAPER,
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              fontFamily: SHELL.MONO,
              fontSize: 11,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: SHELL.GRAY_TEXT,
              fontWeight: 700,
              userSelect: 'none',
            }}
          >
            Programs portfolio · grid view ({view.totalActive} active · {view.gatesPending} gated · {view.idleCount} idle)
          </summary>

      {/* Work pane */}
      <div
        data-testid="programs-index-page"
        style={{
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px 32px',
        }}
      >
        {/* Stats row */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: SHELL.INK_SOFT,
            marginBottom: 18,
          }}
        >
          {view.totalActive} active
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          {view.gatesPending} gated
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          {view.idleCount} idle
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          <span style={{ color: SHELL.INK_MUTED }}>{view.capacityLabel}</span>
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          <span style={{ color: SHELL.INK_MUTED }}>{filteredSummary}</span>
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          <Link
            href="/programs/compare"
            style={{
              color: SHELL.INK_SOFT,
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              fontFamily: SHELL.MONO,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
            }}
          >
            Compare programs →
          </Link>
        </div>

        {/* Phase filter strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {/* "By phase" label */}
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginRight: 4,
            }}
          >
            Phase
          </span>

          {/* All pill */}
          <button
            onClick={() => router.push('/programs', { scroll: false })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: 14,
              border: `1px solid ${activePhase === 'all' ? SHELL.INK : SHELL.CARD_LINE}`,
              background: activePhase === 'all' ? SHELL.INK : 'transparent',
              color: activePhase === 'all' ? SHELL.PAPER : SHELL.INK_SOFT,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            All
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
              {phaseView.totalPrograms}
            </span>
          </button>

          {/* One pill per phase */}
          {phaseView.options.map((opt) => {
            const isActive = activePhase === opt.phase;
            return (
              <button
                key={opt.phase}
                title={opt.description}
                onClick={() =>
                  router.push(`/programs?phase=${opt.phase}`, { scroll: false })
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: 14,
                  border: `1px solid ${isActive ? SHELL.INK : SHELL.CARD_LINE}`,
                  background: isActive ? SHELL.INK : 'transparent',
                  color: isActive ? SHELL.PAPER : opt.programCount === 0 ? SHELL.INK_MUTED : SHELL.INK_SOFT,
                  cursor: opt.programCount === 0 ? 'default' : 'pointer',
                  lineHeight: 1,
                  opacity: opt.programCount === 0 && !isActive ? 0.55 : 1,
                }}
              >
                {opt.isCurrentPhase && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: isActive ? SHELL.PAPER : SHELL.MINT_TEXT,
                      flexShrink: 0,
                    }}
                  />
                )}
                {opt.label}
                {opt.programCount > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>
                    {opt.programCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {flagship ? (
          <div
            data-testid="programs-flagship-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '12px 14px',
              marginBottom: 16,
              borderRadius: 10,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: SHELL.INK_MUTED,
                  marginBottom: 4,
                }}
              >
                Spotlight · {flagship.displayId}
              </div>
              <div
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 17,
                  color: SHELL.INK,
                  marginBottom: 4,
                }}
              >
                {flagship.displayId} is the flagship path through P3 Design
              </div>
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK_SOFT,
                  lineHeight: 1.5,
                }}
              >
                {flagship.nexusNote} {flagship.linkedSourceEvent ? `${flagship.linkedSourceEventState ?? 'Source event linked'} · ${flagship.linkedSourceEvent}.` : 'No linked Source event is attached yet.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Link
                href={`/programs/${flagship.id}?phase=${flagship.currentPhase}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${SHELL.INK}`,
                  color: SHELL.INK,
                  textDecoration: 'none',
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Open flagship
              </Link>
              {flagship.linkedSourceEventHref ? (
                <Link
                  href={flagship.linkedSourceEventHref}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    color: SHELL.INK_SOFT,
                    textDecoration: 'none',
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    background: SHELL.PAPER_SOFT,
                  }}
                >
                  Open linked source
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Originate button row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 14,
          }}
        >
          <Link
            href="/programs/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 14px',
              borderRadius: 999,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              color: SHELL.INK_MID,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1, marginTop: -1 }}>+</span>
            Originate program
          </Link>
        </div>

        {/* Programs table or empty state */}
        {filtered.length === 0 ? (
          <div
            data-testid="programs-empty-state"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 40px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: SHELL.PAPER_DEEP,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ fontFamily: SHELL.SERIF, fontSize: 22, color: SHELL.INK_MUTED }}>∅</span>
            </div>
            <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, color: SHELL.INK, marginBottom: 8 }}>
              {emptyStateTitle}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_SOFT,
                marginBottom: 20,
                maxWidth: 320,
                lineHeight: 1.5,
              }}
            >
              {emptyStateCopy}
            </div>
            <button
              onClick={() => router.push('/programs', { scroll: false })}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_SOFT,
                background: 'none',
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                padding: '7px 16px',
                cursor: 'pointer',
              }}
            >
              Show all programs
            </button>
          </div>
        ) : (
          <div data-testid="programs-table">
            <ProgramsTable programs={filtered} />
          </div>
        )}

        {/* Originate new program link */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
          <Link
            href="/programs/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
            }}
          >
            <span>+</span>
            <span>Originate new program</span>
          </Link>
          <div
            data-honest-disclaimer="programs-index"
            style={{
              marginTop: 10,
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.06em',
            }}
          >
            Deterministic seed · {view.tenant}
          </div>
        </div>
      </div>
        </details>
      </div>

    </AppShell>
  );
}
