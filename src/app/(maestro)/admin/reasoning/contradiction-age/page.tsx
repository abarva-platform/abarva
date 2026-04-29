// /admin/reasoning/contradiction-age — How long active contradictions have been
// unresolved across all instances, flagging long-standing ones as chronic.
//
// Pure server component. No client JS. Age is derived deterministically from
// instanceId and contradictionId chars — demo variation without real timestamps.
//
// Categories: Fresh < 7 d (mint) · Ongoing 7–30 d (amber) · Chronic > 30 d (rust)

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction age · AbarVa Admin',
};

// ─── Age helpers ───────────────────────────────────────────────────────────────

type AgeCategory = 'fresh' | 'ongoing' | 'chronic';

/**
 * Derive a deterministic fake age in days using the instance ID and
 * contradiction template ID. Gives demo variation without real timestamps.
 */
function deriveAgeDays(instanceId: string, contradictionId: string): number {
  return Math.abs(instanceId.charCodeAt(0) + contradictionId.charCodeAt(3)) % 90;
}

function categorize(ageDays: number): AgeCategory {
  if (ageDays < 7) return 'fresh';
  if (ageDays <= 30) return 'ongoing';
  return 'chronic';
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface ContradictionAgeRow {
  instanceId: string;
  instanceName: string;
  templateId: string;
  templateLabel: string;
  severity: 'low' | 'medium' | 'high';
  resolutionPath: string;
  ageDays: number;
  category: AgeCategory;
}

// ─── Data assembly ─────────────────────────────────────────────────────────────

function buildAgeRows(): ContradictionAgeRow[] {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

  // Build resolved compound-id set for cross-check
  const resolvedCompoundIds = new Set<string>(
    getResolvedEntries().map((e) => e.id),
  );

  const rows: ContradictionAgeRow[] = [];

  // Source instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(buildEvidenceMap(inst));

    for (const d of detections) {
      // Skip if this specific instance::template pair has been resolved
      const compoundId = `${inst.id}::${d.templateId}`;
      if (resolvedCompoundIds.has(compoundId)) continue;

      const ageDays = deriveAgeDays(inst.id, d.templateId);
      rows.push({
        instanceId: inst.id,
        instanceName: inst.name,
        templateId: d.templateId,
        templateLabel: d.label,
        severity: d.severity,
        resolutionPath: d.resolutionPath,
        ageDays,
        category: categorize(ageDays),
      });
    }
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(buildProgramEvidenceMap(inst));

    for (const d of detections) {
      const compoundId = `${inst.id}::${d.templateId}`;
      if (resolvedCompoundIds.has(compoundId)) continue;

      const ageDays = deriveAgeDays(inst.id, d.templateId);
      rows.push({
        instanceId: inst.id,
        instanceName: inst.name,
        templateId: d.templateId,
        templateLabel: d.label,
        severity: d.severity,
        resolutionPath: d.resolutionPath,
        ageDays,
        category: categorize(ageDays),
      });
    }
  }

  // Sort oldest first
  rows.sort((a, b) => b.ageDays - a.ageDays);

  return rows;
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

function categoryPalette(cat: AgeCategory): { bg: string; fg: string; label: string } {
  switch (cat) {
    case 'chronic':
      return { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT, label: 'Chronic' };
    case 'ongoing':
      return { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT, label: 'Ongoing' };
    case 'fresh':
      return { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT, label: 'Fresh' };
  }
}

function severityColor(sev: 'low' | 'medium' | 'high'): string {
  if (sev === 'high') return SHELL.RUST_TEXT;
  if (sev === 'medium') return SHELL.AMBER_DOT;
  return SHELL.GRAY_TEXT;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  chronic,
  ongoing,
  fresh,
  oldestDays,
}: {
  total: number;
  chronic: number;
  ongoing: number;
  fresh: number;
  oldestDays: number;
}) {
  const items = [
    { label: 'Active', value: String(total) },
    { label: 'Chronic', value: String(chronic), color: SHELL.RUST_TEXT },
    { label: 'Ongoing', value: String(ongoing), color: SHELL.AMBER_DOT },
    { label: 'Fresh', value: String(fresh), color: SHELL.MINT_TEXT },
    { label: 'Oldest', value: `${oldestDays}d` },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 18,
              color: color ?? COLORS.ink,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function AgePill({ category }: { category: AgeCategory }) {
  const { bg, fg, label } = categoryPalette(category);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function SeverityDot({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: severityColor(severity),
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

function ChronicCard({ rows }: { rows: ContradictionAgeRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section
      style={{
        background: SHELL.RUST_BG,
        border: `1.5px solid ${SHELL.RUST_TEXT}44`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.RUST_TEXT}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: SHELL.RUST_TEXT,
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: SHELL.RUST_TEXT,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Chronic contradictions — immediate attention required
          </h2>
        </div>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 12,
            color: SHELL.RUST_TEXT,
            opacity: 0.7,
          }}
        >
          {rows.length} unresolved &gt;30 days
        </span>
      </header>
      <div style={{ padding: `${SPACING.sm} 0` }}>
        {rows.map((row) => (
          <div
            key={`${row.instanceId}-${row.templateId}`}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.RUST_TEXT}14`,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              flexWrap: 'wrap' as const,
            }}
          >
            <SeverityDot severity={row.severity} />
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.RUST_TEXT,
                opacity: 0.7,
                flexShrink: 0,
              }}
            >
              {row.ageDays}d
            </span>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                fontWeight: 700,
                color: SHELL.RUST_TEXT,
                flex: 1,
                minWidth: 160,
              }}
            >
              {row.templateLabel}
            </span>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.RUST_TEXT,
                opacity: 0.75,
              }}
            >
              {row.instanceName}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

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
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

function AgeTable({ rows }: { rows: ContradictionAgeRow[] }) {
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
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          All active contradictions by age
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} row{rows.length === 1 ? '' : 's'} · oldest first
        </span>
      </header>
      {rows.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: `${COLORS.ink}99`,
          }}
        >
          No active contradictions detected across the fixture corpus.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Instance</th>
                <th style={HEADER_CELL}>Contradiction template</th>
                <th style={HEADER_CELL}>Age (days)</th>
                <th style={HEADER_CELL}>Status</th>
                <th style={HEADER_CELL}>Severity</th>
                <th style={HEADER_CELL}>Resolution paths available</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.instanceId}-${row.templateId}`}>
                  <td style={MONO_CELL}>{row.instanceName}</td>
                  <td style={BODY_CELL}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{row.templateLabel}</span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        {row.templateId}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...MONO_CELL, fontWeight: 700 }}>{row.ageDays}</td>
                  <td style={BODY_CELL}>
                    <AgePill category={row.category} />
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <SeverityDot severity={row.severity} />
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: severityColor(row.severity),
                          fontWeight: 600,
                          textTransform: 'capitalize' as const,
                        }}
                      >
                        {row.severity}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      maxWidth: 280,
                      color: `${COLORS.ink}88`,
                      fontSize: 11,
                      lineHeight: 1.4,
                    }}
                  >
                    {row.resolutionPath}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionAgePage() {
  const rows = buildAgeRows();

  const chronic = rows.filter((r) => r.category === 'chronic');
  const ongoing = rows.filter((r) => r.category === 'ongoing');
  const fresh = rows.filter((r) => r.category === 'fresh');
  const oldestDays = rows.length > 0 ? rows[0].ageDays : 0;

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
        eyebrow="Reasoning · Admin"
        title="Contradiction age"
        subtitle="How long each active contradiction has been unresolved. Chronic (>30 d) items need immediate attention."
      >
        <SummaryStrip
          total={rows.length}
          chronic={chronic.length}
          ongoing={ongoing.length}
          fresh={fresh.length}
          oldestDays={oldestDays}
        />

        <ChronicCard rows={chronic} />

        <AgeTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
