// src/components/tower/DependencyManagerPanel.tsx
//
// TOWER-DEP · Source-to-program dependency matrix panel.
//
// Server component — no client state, no hydration.
// Renders a full cross-matrix of every SOURCE_EVENT_INSTANCES row ×
// APEX_RETAIL_PROGRAM_INSTANCES column, then a flat summary list of all links.
//
// Wired into TowerLensTabs as a new "Dependencies" collapsible section
// following the Linked Programs section in the Portfolio panel.
//
// Forbidden:
//   - model calls, fetch, Date.now, Math.random, live runtime
//   - any `any` type

import Link from 'next/link';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import type { LinkType } from '@/lib/reasoning';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (matches Tower surface palette)
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
  mint: 'rgba(16,163,74,0.10)',
  mintBorder: 'rgba(16,163,74,0.28)',
  mintText: '#15803D',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DependencyLink {
  sourceEvent: SourceEventInstance;
  program: ProgramInstance;
  linkType: LinkType;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data derivation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collect all source-event → program dependency links from both directions:
 * - Source events that declare `linkedPrograms`
 * - Programs that declare `linkedSourceEvents` (reverse direction — source is
 *   the upstream dependency)
 *
 * De-duplicates on (sourceEventId, programId) key, preferring the
 * source-event direction if both sides declare the same pair.
 */
function collectDependencyLinks(): DependencyLink[] {
  const seen = new Map<string, DependencyLink>();

  // Forward: SourceEventInstance.linkedPrograms
  for (const src of SOURCE_EVENT_INSTANCES) {
    for (const link of src.linkedPrograms) {
      const prog = APEX_RETAIL_PROGRAM_INSTANCES.find((p) => p.id === link.programId);
      if (!prog) continue;
      const key = `${src.id}::${prog.id}`;
      if (!seen.has(key)) {
        seen.set(key, {
          sourceEvent: src,
          program: prog,
          linkType: link.linkType,
          description: link.description,
        });
      }
    }
  }

  // Reverse: ProgramInstance.linkedSourceEvents — the program declares a
  // depends-on / feeds link from a source event. We add this as a link in
  // the same direction (source event → program) if not already captured.
  for (const prog of APEX_RETAIL_PROGRAM_INSTANCES) {
    for (const link of prog.linkedSourceEvents) {
      const src =
        SOURCE_EVENT_INSTANCES.find((s) => s.id === link.sourceEventId) ??
        SOURCE_EVENT_INSTANCES.find((s) => s.displayId === link.sourceEventId);
      if (!src) continue;
      const key = `${src.id}::${prog.id}`;
      if (!seen.has(key)) {
        seen.set(key, {
          sourceEvent: src,
          program: prog,
          linkType: link.linkType,
          description: link.description,
        });
      }
    }
  }

  // Sort: by source event name, then program name, for stable rendering.
  return Array.from(seen.values()).sort((a, b) => {
    const srcCmp = a.sourceEvent.name.localeCompare(b.sourceEvent.name);
    if (srcCmp !== 0) return srcCmp;
    return a.program.name.localeCompare(b.program.name);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Link type display helpers
// ─────────────────────────────────────────────────────────────────────────────

function linkTypeLabel(lt: LinkType): string {
  switch (lt) {
    case 'unblocks':    return 'unblocks';
    case 'depends-on':  return 'depends-on';
    case 'feeds':       return 'feeds';
    case 'shares-vendor': return 'shares-vendor';
    case 'contradicts': return 'contradicts';
    default:            return lt;
  }
}

function linkTypeBg(lt: LinkType): string {
  switch (lt) {
    case 'unblocks':    return 'rgba(16,163,74,0.12)';
    case 'depends-on':  return 'rgba(245,158,11,0.12)';
    case 'feeds':       return 'rgba(27,43,92,0.09)';
    case 'shares-vendor': return 'rgba(99,102,241,0.10)';
    case 'contradicts': return 'rgba(185,28,28,0.10)';
    default:            return C.navySoft;
  }
}

function linkTypeFg(lt: LinkType): string {
  switch (lt) {
    case 'unblocks':    return '#15803D';
    case 'depends-on':  return '#92400E';
    case 'feeds':       return C.navy;
    case 'shares-vendor': return '#4338CA';
    case 'contradicts': return '#B91C1C';
    default:            return C.muted;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Compact pill showing a link type badge */
function LinkTypePill({ lt }: { lt: LinkType }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        borderRadius: 3,
        background: linkTypeBg(lt),
        color: linkTypeFg(lt),
        whiteSpace: 'nowrap',
      }}
    >
      {linkTypeLabel(lt)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Matrix
// ─────────────────────────────────────────────────────────────────────────────

interface MatrixProps {
  sourceEvents: SourceEventInstance[];
  programs: ProgramInstance[];
  links: DependencyLink[];
}

function DependencyMatrix({ sourceEvents, programs, links }: MatrixProps) {
  // Build lookup: `${srcId}::${progId}` → DependencyLink
  const cellMap = new Map<string, DependencyLink>();
  for (const link of links) {
    cellMap.set(`${link.sourceEvent.id}::${link.program.id}`, link);
  }

  // Only include programs that appear in at least one link column to keep the
  // matrix focussed. If no links exist at all we show the first 4 programs.
  const linkedProgramIds = new Set(links.map((l) => l.program.id));
  const matrixPrograms =
    linkedProgramIds.size > 0
      ? programs.filter((p) => linkedProgramIds.has(p.id))
      : programs.slice(0, 4);

  // Only include source events that appear in at least one link row.
  const linkedSourceIds = new Set(links.map((l) => l.sourceEvent.id));
  const matrixSources =
    linkedSourceIds.size > 0
      ? sourceEvents.filter((s) => linkedSourceIds.has(s.id))
      : sourceEvents.slice(0, 4);

  const CELL_W = 130;
  const ROW_LABEL_W = 200;
  const ROW_H = 44;
  const COL_H = 72;

  return (
    <div
      data-testid="dependency-matrix"
      style={{
        overflowX: 'auto',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        backgroundColor: C.card,
      }}
    >
      <table
        style={{
          borderCollapse: 'collapse',
          minWidth: ROW_LABEL_W + matrixPrograms.length * CELL_W,
          width: '100%',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: ROW_LABEL_W }} />
          {matrixPrograms.map((p) => (
            <col key={p.id} style={{ width: CELL_W }} />
          ))}
        </colgroup>

        {/* Column headers */}
        <thead>
          <tr>
            {/* Top-left corner */}
            <th
              style={{
                padding: '10px 14px',
                textAlign: 'left',
                verticalAlign: 'bottom',
                height: COL_H,
                borderRight: `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: '#FAFAF8',
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: C.mutedSoft,
                  fontWeight: 700,
                }}
              >
                Source Event \ Program
              </span>
            </th>
            {matrixPrograms.map((prog) => (
              <th
                key={prog.id}
                style={{
                  padding: '8px 10px',
                  textAlign: 'center',
                  verticalAlign: 'bottom',
                  height: COL_H,
                  borderRight: `1px solid ${C.border}`,
                  borderBottom: `2px solid ${C.border}`,
                  backgroundColor: '#FAFAF8',
                }}
              >
                <Link
                  href={`/programs/${prog.id.toLowerCase()}`}
                  style={{ textDecoration: 'none', color: C.navy }}
                  title={prog.name}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      color: C.mutedSoft,
                      display: 'block',
                      marginBottom: 3,
                    }}
                  >
                    {prog.displayId}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.navy,
                      display: 'block',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                    }}
                  >
                    {prog.name.length > 28 ? prog.name.slice(0, 26) + '…' : prog.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      color: C.mutedSoft,
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    P{prog.currentPhase}
                  </span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>

        {/* Rows: one per source event */}
        <tbody>
          {matrixSources.map((src, rowIdx) => (
            <tr
              key={src.id}
              style={{
                backgroundColor: rowIdx % 2 === 0 ? C.card : '#FAFAF9',
              }}
            >
              {/* Row header: source event */}
              <td
                style={{
                  padding: '8px 14px',
                  height: ROW_H,
                  borderRight: `2px solid ${C.border}`,
                  borderBottom: `1px solid ${C.border}`,
                  verticalAlign: 'middle',
                }}
              >
                <Link
                  href={`/source/events/${src.id}`}
                  style={{ textDecoration: 'none', color: C.ink }}
                  title={src.name}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      letterSpacing: '0.07em',
                      color: C.mutedSoft,
                      display: 'block',
                    }}
                  >
                    {src.displayId}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.ink,
                      display: 'block',
                      lineHeight: 1.3,
                    }}
                  >
                    {src.name.length > 30 ? src.name.slice(0, 28) + '…' : src.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      color: C.mutedSoft,
                    }}
                  >
                    {src.currentStage}
                  </span>
                </Link>
              </td>

              {/* Cells: one per program column */}
              {matrixPrograms.map((prog) => {
                const link = cellMap.get(`${src.id}::${prog.id}`);
                return (
                  <td
                    key={prog.id}
                    style={{
                      padding: '6px 8px',
                      height: ROW_H,
                      borderRight: `1px solid ${C.border}`,
                      borderBottom: `1px solid ${C.border}`,
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      backgroundColor: link ? C.mint : undefined,
                    }}
                    title={link ? link.description : undefined}
                  >
                    {link ? (
                      <LinkTypePill lt={link.linkType} />
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 2,
                          backgroundColor: C.border,
                          borderRadius: 1,
                          verticalAlign: 'middle',
                        }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary list
// ─────────────────────────────────────────────────────────────────────────────

function DependencySummaryList({ links }: { links: DependencyLink[] }) {
  if (links.length === 0) {
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
        No source-to-program dependencies are currently declared. Dependencies will appear here once
        source events or programs declare cross-instance links.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {links.map((link, i) => (
        <div
          key={`${link.sourceEvent.id}::${link.program.id}`}
          data-testid={`dependency-link-row-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 14px',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${linkTypeFg(link.linkType)}`,
            borderRadius: 6,
          }}
        >
          {/* Source event */}
          <div style={{ flex: '0 0 220px', minWidth: 0 }}>
            <Link
              href={`/source/events/${link.sourceEvent.id}`}
              style={{ textDecoration: 'none', color: C.ink }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  letterSpacing: '0.07em',
                  color: C.mutedSoft,
                  display: 'block',
                }}
              >
                {link.sourceEvent.displayId}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>
                {link.sourceEvent.name}
              </span>
            </Link>
          </div>

          {/* Arrow + link type */}
          <div
            style={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              paddingTop: 2,
            }}
          >
            <span style={{ fontSize: 11, color: C.mutedSoft }}>→</span>
            <LinkTypePill lt={link.linkType} />
          </div>

          {/* Program */}
          <div style={{ flex: '0 0 220px', minWidth: 0 }}>
            <Link
              href={`/programs/${link.program.id.toLowerCase()}`}
              style={{ textDecoration: 'none', color: C.ink }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  letterSpacing: '0.07em',
                  color: C.mutedSoft,
                  display: 'block',
                }}
              >
                {link.program.displayId}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>
                {link.program.name}
              </span>
            </Link>
          </div>

          {/* Description + view link */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: C.muted,
                lineHeight: 1.5,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {link.description}
            </p>
          </div>

          {/* View link */}
          <div style={{ flex: '0 0 auto', paddingTop: 2 }}>
            <Link
              href={`/source/events/${link.sourceEvent.id}`}
              style={{
                fontSize: 11,
                color: C.navy,
                textDecoration: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              View →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DependencyManagerPanel — server component.
 *
 * Renders:
 * 1. A cross-matrix of source events × programs with linked cells highlighted
 *    in mint and labelled with the link type.
 * 2. A summary section with a count chip and a flat list of all dependency
 *    links, each showing: source event name → program name | link type | View →
 *
 * Pure — no fetch, no async, no model calls.
 */
export function DependencyManagerPanel() {
  const links = collectDependencyLinks();

  const linkedSourceCount = new Set(links.map((l) => l.sourceEvent.id)).size;
  const linkedProgramCount = new Set(links.map((l) => l.program.id)).size;

  return (
    <div
      data-testid="dependency-manager-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Matrix */}
      <section aria-label="Source-to-program dependency matrix" data-testid="dependency-matrix-section">
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.mutedSoft,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Dependency matrix · source events × programs
        </div>
        <DependencyMatrix
          sourceEvents={SOURCE_EVENT_INSTANCES}
          programs={APEX_RETAIL_PROGRAM_INSTANCES}
          links={links}
        />
        <p style={{ fontSize: 11, color: C.mutedSoft, margin: '6px 0 0', fontStyle: 'italic' }}>
          Mint cells indicate an active dependency link. Hover a cell to read the link description.
        </p>
      </section>

      {/* Summary */}
      <section aria-label="Dependency summary" data-testid="dependency-summary-section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
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
            All dependency links
          </span>
          {links.length > 0 ? (
            <span
              data-testid="dependency-count-badge"
              style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: 10,
                background: C.mint,
                color: C.mintText,
                border: `1px solid ${C.mintBorder}`,
              }}
            >
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </span>
          ) : (
            <span
              data-testid="dependency-empty-badge"
              style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: 10,
                background: C.navySoft,
                color: C.mutedSoft,
                border: `1px solid ${C.border}`,
              }}
            >
              None
            </span>
          )}
        </div>

        {links.length > 0 && (
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px' }}>
            {linkedSourceCount} source {linkedSourceCount === 1 ? 'event' : 'events'} linked to{' '}
            {linkedProgramCount} {linkedProgramCount === 1 ? 'program' : 'programs'}
          </p>
        )}

        <DependencySummaryList links={links} />
      </section>

      {/* Disclaimer */}
      <div
        data-testid="dependency-panel-disclaimer"
        data-honest-disclaimer="tower-dependency-manager"
        style={{ fontSize: 11, color: C.mutedSoft, fontStyle: 'italic' }}
      >
        Deterministic seed · Dependencies are derived from{' '}
        <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>linkedPrograms</code> /
        {' '}<code style={{ fontFamily: 'JetBrains Mono, monospace' }}>linkedSourceEvents</code>{' '}
        fixture fields on SourceEventInstance and ProgramInstance. Live dependency management is deferred.
      </div>
    </div>
  );
}
