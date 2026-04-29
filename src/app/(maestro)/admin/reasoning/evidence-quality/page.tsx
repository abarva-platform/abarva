// /admin/reasoning/evidence-quality — Evidence Quality Report.
//
// Server component. Scores every evidence item across all fixture instances
// (source + programs) using the deterministic heuristic from
// `src/lib/reasoning/evidence-quality.ts` and renders:
//   1. Summary bar — average quality score + high/medium/low distribution
//   2. Per-instance sections — mini table of evidence items sorted by score asc
//   3. Stale evidence callout — items older than 90 days
//   4. Export link to /api/admin/evidence-quality-export

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  scoreEvidenceItem,
  summarizeEvidenceQuality,
  summaryGrade,
  type EvidenceLikeItem,
  type EvidenceQualityGrade,
  type EvidenceQualityScore,
  type EvidenceQualitySummary,
} from '@/lib/reasoning/evidence-quality';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { EvidenceItem } from '@/lib/source/source-event-instance';
import type { ProgramEvidenceItem } from '@/lib/programs/program-instance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence Quality Report · AbarVa Admin',
};

// ── Data model ────────────────────────────────────────────────────────────────

interface ScoredEvidenceRow {
  id: string;
  description: string;
  uploadedAt: string | undefined;
  qualityScore: EvidenceQualityScore;
}

interface InstanceReport {
  instanceId: string;
  instanceName: string;
  type: 'source' | 'program';
  rows: ScoredEvidenceRow[];
  summary: EvidenceQualitySummary;
}

const NOW_MS = Date.now();
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function sourceItemToLike(item: EvidenceItem): EvidenceLikeItem {
  return {
    text: [item.value, item.source].filter(Boolean).join(' — '),
    uploadedAt: item.recordedAt,
  };
}

function programItemToLike(item: ProgramEvidenceItem): EvidenceLikeItem {
  return {
    citation: item.citation,
    uploadedAt: item.uploadedAt,
    uploadedBy: item.uploadedBy,
  };
}

function buildInstanceReports(): InstanceReport[] {
  const reports: InstanceReport[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const items = inst.evidence;
    const liked = items.map(sourceItemToLike);
    const rows: ScoredEvidenceRow[] = items.map((item, i) => ({
      id: item.id,
      description: `[${item.kind}] ${item.field}: ${item.value}`,
      uploadedAt: item.recordedAt,
      qualityScore: scoreEvidenceItem(liked[i], NOW_MS),
    }));
    rows.sort((a, b) => a.qualityScore.score - b.qualityScore.score);
    reports.push({
      instanceId: inst.id,
      instanceName: inst.name,
      type: 'source',
      rows,
      summary: summarizeEvidenceQuality(liked, NOW_MS),
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const items = inst.evidence;
    const liked = items.map(programItemToLike);
    const rows: ScoredEvidenceRow[] = items.map((item, i) => ({
      id: item.id,
      description: item.citation,
      uploadedAt: item.uploadedAt,
      qualityScore: scoreEvidenceItem(liked[i], NOW_MS),
    }));
    rows.sort((a, b) => a.qualityScore.score - b.qualityScore.score);
    reports.push({
      instanceId: inst.id,
      instanceName: inst.name,
      type: 'program',
      rows,
      summary: summarizeEvidenceQuality(liked, NOW_MS),
    });
  }

  return reports;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, max = 80): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function formatAge(uploadedAt: string): string {
  const ts = Date.parse(uploadedAt);
  if (!Number.isFinite(ts)) return '—';
  const ageMs = NOW_MS - ts;
  if (ageMs < 0) return 'future';
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

function isStale(uploadedAt: string | undefined): boolean {
  if (!uploadedAt) return false;
  const ts = Date.parse(uploadedAt);
  if (!Number.isFinite(ts)) return false;
  return NOW_MS - ts > NINETY_DAYS_MS;
}

// ── Style constants ───────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ── Grade chip ────────────────────────────────────────────────────────────────

function GradeChip({ grade }: { grade: EvidenceQualityGrade }) {
  const palette =
    grade === 'strong'
      ? { bg: COLORS.mintSoft, fg: COLORS.mintInk }
      : grade === 'fair'
        ? { bg: COLORS.skyPale, fg: COLORS.navy }
        : { bg: COLORS.coralSoft, fg: COLORS.coralInk };
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
      }}
    >
      {grade}
    </span>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({
  global,
  instanceCount,
  staleCount,
}: {
  global: EvidenceQualitySummary;
  instanceCount: number;
  staleCount: number;
}) {
  const grade = summaryGrade(global);
  const palette =
    grade === 'strong'
      ? { bg: COLORS.mintSoft, fg: COLORS.mintInk }
      : grade === 'fair'
        ? { bg: COLORS.skyPale, fg: COLORS.navy }
        : { bg: COLORS.coralSoft, fg: COLORS.coralInk };

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.lg,
      }}
    >
      {/* Average quality */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
            fontWeight: 600,
          }}
        >
          Average quality score
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 40,
              color: palette.fg,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {(global.mean * 100).toFixed(0)}%
          </span>
          <span
            style={{
              display: 'inline-block',
              background: palette.bg,
              color: palette.fg,
              borderRadius: RADIUS.pill,
              padding: '3px 12px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {grade}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 56,
          background: `${COLORS.ink}18`,
          flexShrink: 0,
        }}
      />

      {/* Distribution */}
      <div style={{ display: 'flex', gap: SPACING.lg, flexWrap: 'wrap' }}>
        <DistCount label="Strong" count={global.strongCount} bg={COLORS.mintSoft} fg={COLORS.mintInk} />
        <DistCount label="Fair" count={global.fairCount} bg={COLORS.skyPale} fg={COLORS.navy} />
        <DistCount label="Weak" count={global.weakCount} bg={COLORS.coralSoft} fg={COLORS.coralInk} />
        <DistCount label="Total items" count={global.total} bg={`${COLORS.ink}08`} fg={`${COLORS.ink}cc`} />
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 56,
          background: `${COLORS.ink}18`,
          flexShrink: 0,
        }}
      />

      {/* Meta counts */}
      <div style={{ display: 'flex', gap: SPACING.lg, flexWrap: 'wrap' }}>
        <DistCount label="Instances" count={instanceCount} bg={`${COLORS.ink}08`} fg={`${COLORS.ink}cc`} />
        <DistCount label="Stale (>90 d)" count={staleCount} bg={COLORS.amberSoft} fg={COLORS.amberInk} />
      </div>

      {/* Export link */}
      <div style={{ marginLeft: 'auto' }}>
        <a
          href="/api/admin/evidence-quality-export"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: COLORS.skyPale,
            color: COLORS.navy,
            borderRadius: RADIUS.pill,
            padding: '7px 16px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.02em',
            textDecoration: 'none',
            border: `1px solid ${COLORS.navy}22`,
          }}
        >
          Export as CSV
          <span aria-hidden="true" style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 10, opacity: 0.7 }}>
            ↓
          </span>
        </a>
      </div>
    </div>
  );
}

function DistCount({
  label,
  count,
  bg,
  fg,
}: {
  label: string;
  count: number;
  bg: string;
  fg: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          color: fg,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <span
        style={{
          display: 'inline-block',
          background: bg,
          color: fg,
          borderRadius: RADIUS.pill,
          padding: '2px 8px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Per-instance section ──────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'source' | 'program' }) {
  const palette =
    type === 'source'
      ? { bg: COLORS.skyPale, fg: COLORS.navy }
      : { bg: `${COLORS.ink}10`, fg: `${COLORS.ink}aa` };
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {type}
    </span>
  );
}

function InstanceSection({ report }: { report: InstanceReport }) {
  const grade = summaryGrade(report.summary);
  const gradePalette =
    grade === 'strong'
      ? { bg: COLORS.mintSoft, fg: COLORS.mintInk }
      : grade === 'fair'
        ? { bg: COLORS.skyPale, fg: COLORS.navy }
        : { bg: COLORS.coralSoft, fg: COLORS.coralInk };

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <TypeBadge type={report.type} />
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 17,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
            flexGrow: 1,
          }}
        >
          {report.instanceName}
        </h3>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {report.instanceId}
        </span>
        {/* Instance average grade */}
        <span
          style={{
            background: gradePalette.bg,
            color: gradePalette.fg,
            borderRadius: RADIUS.pill,
            padding: '3px 12px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          avg {(report.summary.mean * 100).toFixed(0)}% &middot; {grade}
        </span>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {report.summary.total} item{report.summary.total === 1 ? '' : 's'}
        </span>
      </header>

      {report.rows.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
          }}
        >
          No evidence items.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Evidence item</th>
                <th style={{ ...HEADER_CELL, width: 80 }}>Grade</th>
                <th style={{ ...HEADER_CELL, width: 60 }}>Score</th>
                <th style={{ ...HEADER_CELL, width: 120 }}>Age</th>
                <th style={{ ...HEADER_CELL, width: 100 }}>Staleness</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => {
                const stale = isStale(row.uploadedAt);
                return (
                  <tr key={row.id} style={stale ? { background: COLORS.amberSoft } : undefined}>
                    <td style={BODY_CELL} title={row.description}>
                      {truncate(row.description)}
                    </td>
                    <td style={BODY_CELL}>
                      <GradeChip grade={row.qualityScore.grade} />
                    </td>
                    <td style={MONO_CELL}>{(row.qualityScore.score * 100).toFixed(0)}%</td>
                    <td style={MONO_CELL}>
                      {row.uploadedAt ? formatAge(row.uploadedAt) : '—'}
                    </td>
                    <td style={BODY_CELL}>
                      {stale ? (
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 11,
                            fontWeight: 600,
                            color: COLORS.amberInk,
                            background: COLORS.amberSoft,
                            borderRadius: RADIUS.pill,
                            padding: '2px 8px',
                            border: `1px solid ${COLORS.amberInk}44`,
                          }}
                        >
                          Stale
                        </span>
                      ) : (
                        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Stale evidence callout ────────────────────────────────────────────────────

interface StaleRow {
  instanceId: string;
  instanceName: string;
  type: 'source' | 'program';
  evidenceId: string;
  description: string;
  uploadedAt: string;
}

function StaleCallout({ staleRows }: { staleRows: StaleRow[] }) {
  if (staleRows.length === 0) {
    return (
      <section
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: COLORS.mintSoft,
            color: COLORS.mintInk,
            borderRadius: RADIUS.pill,
            padding: '4px 14px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          No stale evidence
        </span>
        <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
          All evidence items are within the 90-day freshness window.
        </span>
      </section>
    );
  }

  return (
    <section
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.amberInk}22`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.amberInk,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Stale Evidence
          </h2>
          <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: COLORS.amberInk, marginTop: 2, opacity: 0.8 }}>
            Items older than 90 days — consider refreshing or replacing
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: COLORS.amberInk }}>
          {staleRows.length} item{staleRows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, color: COLORS.amberInk }}>Evidence item</th>
              <th style={{ ...HEADER_CELL, color: COLORS.amberInk, width: 80 }}>Type</th>
              <th style={{ ...HEADER_CELL, color: COLORS.amberInk, width: 200 }}>Instance</th>
              <th style={{ ...HEADER_CELL, color: COLORS.amberInk, width: 120 }}>Age</th>
              <th style={{ ...HEADER_CELL, color: COLORS.amberInk, width: 80 }}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {staleRows.map((row) => (
              <tr key={`${row.instanceId}-${row.evidenceId}`}>
                <td style={{ ...BODY_CELL, background: 'transparent' }} title={row.description}>
                  {truncate(row.description)}
                </td>
                <td style={{ ...BODY_CELL, background: 'transparent' }}>
                  <TypeBadge type={row.type} />
                </td>
                <td style={{ ...MONO_CELL, background: 'transparent' }}>
                  {truncate(row.instanceName, 40)}
                </td>
                <td style={{ ...MONO_CELL, background: 'transparent' }}>
                  {formatAge(row.uploadedAt)}
                </td>
                <td style={{ ...BODY_CELL, background: 'transparent' }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      fontWeight: 600,
                      color: COLORS.amberInk,
                    }}
                  >
                    Stale
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EvidenceQualityPage() {
  const reports = buildInstanceReports();

  // Build global summary across all instances
  const allLikedItems: EvidenceLikeItem[] = [];
  const staleRows: StaleRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    for (const item of inst.evidence) {
      const liked = sourceItemToLike(item);
      allLikedItems.push(liked);
      if (isStale(item.recordedAt)) {
        staleRows.push({
          instanceId: inst.id,
          instanceName: inst.name,
          type: 'source',
          evidenceId: item.id,
          description: `[${item.kind}] ${item.field}: ${item.value}`,
          uploadedAt: item.recordedAt,
        });
      }
    }
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    for (const item of inst.evidence) {
      const liked = programItemToLike(item);
      allLikedItems.push(liked);
      if (isStale(item.uploadedAt)) {
        staleRows.push({
          instanceId: inst.id,
          instanceName: inst.name,
          type: 'program',
          evidenceId: item.id,
          description: item.citation,
          uploadedAt: item.uploadedAt,
        });
      }
    }
  }

  const globalSummary = summarizeEvidenceQuality(allLikedItems, NOW_MS);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence"
        title="Evidence Quality Report"
        subtitle="Deterministic quality scores for every evidence item across all fixture instances. Items are scored on citation presence, uploader identity, freshness, text body length, page count, and approval keywords. Worst-first within each instance."
      >
        <SummaryBar
          global={globalSummary}
          instanceCount={reports.length}
          staleCount={staleRows.length}
        />

        <StaleCallout staleRows={staleRows} />

        {reports.map((report) => (
          <InstanceSection key={report.instanceId} report={report} />
        ))}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
