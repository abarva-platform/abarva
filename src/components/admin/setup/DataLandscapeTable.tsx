// DataLandscapeTable · /admin data landscape section
//
// Shows the complete client data landscape — all 14 inventory
// segments grouped by category — with record counts, chunk stats,
// coverage score, health, and last-ingested time. Each row links
// to /admin/segments/[id] for drill-down.
//
// Pure presentational component; all data arrives as props from
// the /admin server component.

import Link from 'next/link';
import type { InventorySegmentRollup } from '@/lib/admin/setup-acts-registry';
import type { SegmentChunkStat } from '@/lib/admin/setup-data-broker';
import { SHELL } from '@/lib/shell/shell-tokens';

// ── Category groupings ────────────────────────────────────────────────────────

interface Category {
  label: string;
  color: string; // accent swatch
  segmentIds: string[];
}

const CATEGORIES: Category[] = [
  {
    label: 'Foundations',
    color: '#3B82F6',
    segmentIds: ['enterprise_profile', 'org_structure', 'it_landscape'],
  },
  {
    label: 'Financials & KPIs',
    color: '#8B5CF6',
    segmentIds: ['it_financials', 'kpi_dictionary'],
  },
  {
    label: 'Programs',
    color: '#0E9F8C',
    segmentIds: ['program_inventory', 'sourcing_artifacts', 'program_deliverables'],
  },
  {
    label: 'Evidence & Operations',
    color: '#F59E0B',
    segmentIds: ['evidence_ledger', 'operating_telemetry', 'vendor_contracts'],
  },
  {
    label: 'Compliance & Context',
    color: '#EF4444',
    segmentIds: ['compliance', 'industry_context'],
  },
  {
    label: 'Intelligence',
    color: '#6366F1',
    segmentIds: ['cross_program_signals'],
  },
];

// ── Health badge ──────────────────────────────────────────────────────────────

const HEALTH_STYLES: Record<string, { bg: string; ink: string; label: string }> = {
  complete:     { bg: '#d1fae5', ink: '#065f46', label: 'Complete' },
  partial:      { bg: '#fef9c3', ink: '#854d0e', label: 'Partial' },
  sparse:       { bg: '#ffedd5', ink: '#9a3412', label: 'Sparse' },
  attention:    { bg: '#fee2e2', ink: '#991b1b', label: 'Attention' },
  critical:     { bg: '#fee2e2', ink: '#7f1d1d', label: 'Critical' },
  not_started:  { bg: '#f1f5f9', ink: '#64748b', label: 'Not loaded' },
};

function HealthBadge({ state }: { state: string }) {
  const style = HEALTH_STYLES[state] ?? HEALTH_STYLES['not_started'];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 999,
      background: style.bg,
      color: style.ink,
      fontFamily: SHELL.MONO,
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {style.label}
    </span>
  );
}

// ── Coverage bar ─────────────────────────────────────────────────────────────

function CoverageBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct > 0 ? '#ef4444' : '#e2e8f0';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
      <div style={{
        flex: 1, height: 4, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{
        fontFamily: SHELL.MONO, fontSize: 10.5, color: SHELL.INK_MUTED,
        minWidth: 28, textAlign: 'right',
      }}>
        {pct > 0 ? `${Math.round(pct)}%` : '—'}
      </span>
    </div>
  );
}

// ── Prop types ────────────────────────────────────────────────────────────────

export interface DataLandscapeTableProps {
  segments: InventorySegmentRollup[];
  chunkStats: SegmentChunkStat[];
  totalRecords: number;
  totalChunks: number;
  totalNodes: number;
  totalEdges: number;
  lastIngestedRelative?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DataLandscapeTable({
  segments,
  chunkStats,
  totalRecords,
  totalChunks,
  totalNodes,
  totalEdges,
  lastIngestedRelative,
}: DataLandscapeTableProps) {
  const chunkMap = new Map(chunkStats.map((s) => [s.segmentId, s]));
  const HOVER_STYLE = `
    [data-segment-row]:hover { background: #faf7f2 !important; }
  `;
  const segMap = new Map(segments.map((s) => [s.segmentId, s]));

  // Collect all known segment IDs (union of DB + categories)
  const allSegmentIds = new Set([
    ...CATEGORIES.flatMap((c) => c.segmentIds),
    ...segments.map((s) => s.segmentId),
  ]);

  const loadedCount = segments.filter((s) => s.recordCount > 0).length;
  const totalPendingChunks = chunkStats.reduce((n, s) => n + s.pendingChunks, 0);
  const totalEmbeddedChunks = chunkStats.reduce((n, s) => n + s.embeddedChunks, 0);

  return (
    <section
      aria-label="Client data landscape"
      data-component="DataLandscapeTable"
      style={{ marginBottom: 32 }}
    >
      <style>{HOVER_STYLE}</style>
      {/* ── Section header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{
            fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 800,
            marginBottom: 4,
          }}>
            Data landscape · all segments
          </div>
          <h2 style={{
            margin: 0, fontFamily: SHELL.SERIF, fontSize: 22,
            color: SHELL.INK, fontWeight: 800, lineHeight: 1.15,
          }}>
            Client data landscape
          </h2>
          <p style={{
            margin: '4px 0 0', fontFamily: SHELL.SANS, fontSize: 12.5,
            color: SHELL.INK_SOFT, lineHeight: 1.5,
          }}>
            Every segment the AbarVa substrate tracks, grouped by category.
            Click a segment row to inspect its records.
          </p>
        </div>

        {/* Summary metrics */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Segments loaded', value: `${loadedCount} / ${allSegmentIds.size}` },
            { label: 'Records', value: totalRecords.toLocaleString() },
            { label: 'Chunks', value: totalChunks > 0 ? totalChunks.toLocaleString() : chunkStats.reduce((n, s) => n + s.totalChunks, 0).toLocaleString() },
            { label: 'Graph nodes', value: totalNodes.toLocaleString() },
            { label: 'Graph edges', value: totalEdges.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              background: SHELL.CARD_WHITE,
              padding: '8px 12px',
              minWidth: 90,
            }}>
              <div style={{
                fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 800,
                marginBottom: 3,
              }}>{label}</div>
              <div style={{
                fontFamily: SHELL.SERIF, fontSize: 20, color: SHELL.INK,
                fontWeight: 800, lineHeight: 1,
              }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: SHELL.CARD_WHITE,
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 80px 110px 110px 120px 120px',
          padding: '8px 16px',
          background: '#f4f0e7',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          gap: 8,
        }}>
          {['Category / Segment', 'Description', 'Records', 'Chunks', 'Embeddings', 'Coverage', 'Health'].map((col) => (
            <div key={col} style={{
              fontFamily: SHELL.MONO, fontSize: 8.5, fontWeight: 800,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
            }}>
              {col}
            </div>
          ))}
        </div>

        {/* Category groups */}
        {CATEGORIES.map((cat) => {
          const catSegments = cat.segmentIds;
          return (
            <div key={cat.label}>
              {/* Category header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr 80px 110px 110px 120px 120px',
                padding: '7px 16px',
                background: '#faf8f4',
                borderBottom: `1px solid ${SHELL.CARD_LINE}`,
                gap: 8,
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: cat.color, flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: SHELL.MONO, fontSize: 9, fontWeight: 800,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: cat.color,
                  }}>
                    {cat.label}
                  </span>
                </div>
                <div />
                {/* Category subtotals */}
                <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
                  {catSegments.reduce((n, id) => n + (segMap.get(id)?.recordCount ?? 0), 0).toLocaleString()}
                </div>
                <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
                  {catSegments.reduce((n, id) => n + (chunkMap.get(id)?.totalChunks ?? 0), 0).toLocaleString()}
                </div>
                <div />
                <div />
                <div />
              </div>

              {/* Segment rows */}
              {catSegments.map((segId, idx) => {
                const seg = segMap.get(segId);
                const chunks = chunkMap.get(segId);
                const isLast = idx === catSegments.length - 1;
                const isLoaded = (seg?.recordCount ?? 0) > 0;

                return (
                  <Link
                    key={segId}
                    href={`/admin/segments/${segId}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 1fr 80px 110px 110px 120px 120px',
                      padding: '10px 16px',
                      gap: 8,
                      alignItems: 'center',
                      borderBottom: isLast ? `1px solid ${SHELL.CARD_LINE}` : `1px solid #f0ece4`,
                      textDecoration: 'none',
                      background: SHELL.CARD_WHITE,
                      transition: 'background 0.1s',
                    }}
                    data-segment-row={segId}
                  >
                    {/* Segment name */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: isLoaded ? cat.color : '#d1d5db',
                      }} />
                      <span style={{
                        fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600,
                        color: isLoaded ? SHELL.INK : SHELL.INK_MUTED,
                        lineHeight: 1.3,
                      }}>
                        {seg?.segmentName ?? segId.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Description placeholder — use segment ID as slug label */}
                    <div style={{
                      fontFamily: SHELL.SANS, fontSize: 11.5, color: SHELL.INK_MUTED,
                      lineHeight: 1.4,
                    }}>
                      <SegmentDescription segmentId={segId} />
                    </div>

                    {/* Records */}
                    <div style={{
                      fontFamily: SHELL.MONO, fontSize: 12,
                      color: isLoaded ? SHELL.INK : SHELL.INK_MUTED,
                      fontWeight: isLoaded ? 700 : 400,
                    }}>
                      {seg ? seg.recordCount.toLocaleString() : '—'}
                    </div>

                    {/* Chunks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{
                        fontFamily: SHELL.MONO, fontSize: 12,
                        color: chunks ? SHELL.INK : SHELL.INK_MUTED,
                        fontWeight: chunks ? 700 : 400,
                      }}>
                        {chunks ? chunks.totalChunks.toLocaleString() : '—'}
                      </span>
                      {chunks && chunks.totalChunks > 0 && (
                        <span style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED }}>
                          {chunks.embeddedChunks} embedded
                        </span>
                      )}
                    </div>

                    {/* Embeddings */}
                    <div>
                      {chunks && chunks.totalChunks > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {chunks.embeddedChunks > 0 && (
                            <span style={{
                              fontFamily: SHELL.MONO, fontSize: 9.5,
                              color: '#065f46', background: '#d1fae5',
                              padding: '1px 5px', borderRadius: 4, display: 'inline-block',
                            }}>
                              {chunks.embeddedChunks} done
                            </span>
                          )}
                          {chunks.pendingChunks > 0 && (
                            <span style={{
                              fontFamily: SHELL.MONO, fontSize: 9.5,
                              color: '#854d0e', background: '#fef9c3',
                              padding: '1px 5px', borderRadius: 4, display: 'inline-block',
                            }}>
                              {chunks.pendingChunks} pending
                            </span>
                          )}
                          {chunks.failedChunks > 0 && (
                            <span style={{
                              fontFamily: SHELL.MONO, fontSize: 9.5,
                              color: '#991b1b', background: '#fee2e2',
                              padding: '1px 5px', borderRadius: 4, display: 'inline-block',
                            }}>
                              {chunks.failedChunks} failed
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: '#d1d5db' }}>—</span>
                      )}
                    </div>

                    {/* Coverage */}
                    <div>
                      {seg ? <CoverageBar score={seg.coverageScore} /> : (
                        <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: '#d1d5db' }}>—</span>
                      )}
                    </div>

                    {/* Health */}
                    <div>
                      {seg ? (
                        <HealthBadge state={seg.healthState} />
                      ) : (
                        <HealthBadge state="not_started" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* Footer */}
        {(totalPendingChunks > 0 || lastIngestedRelative) && (
          <div style={{
            padding: '10px 16px',
            background: '#faf8f4',
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            {lastIngestedRelative && (
              <span style={{ fontFamily: SHELL.SANS, fontSize: 11.5, color: SHELL.INK_MUTED }}>
                Last ingestion: <strong>{lastIngestedRelative}</strong>
              </span>
            )}
            {totalPendingChunks > 0 && (
              <span style={{ fontFamily: SHELL.SANS, fontSize: 11.5, color: '#92400e' }}>
                {totalPendingChunks.toLocaleString()} chunk{totalPendingChunks !== 1 ? 's' : ''} pending embedding
              </span>
            )}
            {totalEmbeddedChunks > 0 && (
              <span style={{ fontFamily: SHELL.SANS, fontSize: 11.5, color: '#065f46' }}>
                {totalEmbeddedChunks.toLocaleString()} chunk{totalEmbeddedChunks !== 1 ? 's' : ''} embedded
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Segment descriptions ──────────────────────────────────────────────────────

const SEGMENT_DESC: Record<string, string> = {
  enterprise_profile:    'Company overview, mission, strategic priorities, and key facts',
  org_structure:         'Executive bench, reporting lines, key decision-makers',
  it_landscape:          'Systems of record, integration map, infrastructure stack',
  it_financials:         'IT budget, spend by category, cost drivers',
  kpi_dictionary:        'KPI definitions, owners, baselines, and targets',
  program_inventory:     'Active and pipeline AI programs with phase, owner, and value',
  sourcing_artifacts:    'RFPs, vendor evaluations, contract documents',
  program_deliverables:  'Charters, OKRs, design briefs, build outputs',
  evidence_ledger:       'Field observations, interview notes, telemetry samples',
  operating_telemetry:   'Process metrics, SLA data, operational KPIs',
  vendor_contracts:      'Contract terms, SLAs, renewal dates, vendor risk',
  compliance:            'Policy posture, findings, audit trail, waivers',
  industry_context:      'Market signals, analyst reports, peer benchmarks',
  cross_program_signals: 'SME conflicts, shared dependencies, portfolio risks',
};

function SegmentDescription({ segmentId }: { segmentId: string }) {
  return <>{SEGMENT_DESC[segmentId] ?? segmentId.replace(/_/g, ' ')}</>;
}
