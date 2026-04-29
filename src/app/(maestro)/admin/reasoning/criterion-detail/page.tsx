// /admin/reasoning/criterion-detail — Full gate criterion catalog.
//
// Server component. Shows every gate criterion across all lifecycle patterns
// with its type, description, which stage it belongs to, and how many
// instances have met/failed it. Sorted by pass rate ascending (hardest first).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Criterion detail · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CriterionRecord {
  id: string;
  description: string;
  gateType: 'hard' | 'soft';
  stageId: string;
  patternId: string;
  patternTitle: string;
  metCount: number;
  totalCount: number;
}

// ─── Data computation ──────────────────────────────────────────────────────────

function buildCriterionData(): CriterionRecord[] {
  const patterns = getAllLifecyclePatterns();

  // Build a map of criterionId → record (dedup across patterns)
  const recordMap = new Map<string, CriterionRecord>();

  for (const pattern of patterns) {
    for (const criterion of pattern.gateCriteria) {
      if (!recordMap.has(criterion.id)) {
        recordMap.set(criterion.id, {
          id: criterion.id,
          description: criterion.description,
          gateType: criterion.gateType,
          stageId: criterion.stageId,
          patternId: pattern.patternId,
          patternTitle: pattern.title,
          metCount: 0,
          totalCount: 0,
        });
      }
    }
  }

  // Evaluate each source instance
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = patterns.find((p) => p.patternId === inst.patternId);
    if (pattern === undefined) continue;

    const evidenceMap = buildEvidenceMap(inst);
    const stageIds = [...new Set(pattern.stages.map((s) => s.id))];

    for (const stageId of stageIds) {
      const evaluations = evaluateStageGates(pattern, stageId, evidenceMap);
      for (const ev of evaluations) {
        const record = recordMap.get(ev.criterionId);
        if (record === undefined) continue;
        record.totalCount += 1;
        if (ev.status === 'met' || ev.status === 'waived') {
          record.metCount += 1;
        }
      }
    }
  }

  // Evaluate each program instance
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = patterns.find((p) => p.patternId === inst.patternId);
    if (pattern === undefined) continue;

    const evidenceMap = buildProgramEvidenceMap(inst);
    const stageIds = [...new Set(pattern.stages.map((s) => s.id))];

    for (const stageId of stageIds) {
      const evaluations = evaluateStageGates(pattern, stageId, evidenceMap);
      for (const ev of evaluations) {
        const record = recordMap.get(ev.criterionId);
        if (record === undefined) continue;
        record.totalCount += 1;
        if (ev.status === 'met' || ev.status === 'waived') {
          record.metCount += 1;
        }
      }
    }
  }

  // Convert to array, sort ascending by pass rate (hardest first)
  const records = Array.from(recordMap.values());
  records.sort((a, b) => {
    const rateA = a.totalCount === 0 ? 1 : a.metCount / a.totalCount;
    const rateB = b.totalCount === 0 ? 1 : b.metCount / b.totalCount;
    return rateA - rateB;
  });

  return records;
}

function passRate(record: CriterionRecord): number {
  if (record.totalCount === 0) return 100;
  return Math.round((record.metCount / record.totalCount) * 100);
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ records }: { records: CriterionRecord[] }) {
  const hardCount = records.filter((r) => r.gateType === 'hard').length;
  const softCount = records.filter((r) => r.gateType === 'soft').length;
  const totalWithInstances = records.filter((r) => r.totalCount > 0);
  const avgPassRate =
    totalWithInstances.length === 0
      ? 0
      : Math.round(
          totalWithInstances.reduce((sum, r) => sum + passRate(r), 0) /
            totalWithInstances.length,
        );

  const items: Array<{ label: string; value: string; color: string }> = [
    { label: 'criteria', value: String(records.length), color: COLORS.ink },
    { label: 'hard', value: String(hardCount), color: SHELL.RUST_TEXT },
    { label: 'soft', value: String(softCount), color: '#2a56a6' },
    { label: 'avg pass rate', value: `${avgPassRate}%`, color: SHELL.MINT_TEXT },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: `${SPACING.sm} ${SPACING.lg}`,
      }}
    >
      {items.map((item, i) => (
        <span
          key={item.label}
          style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
        >
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}40`,
                marginRight: 4,
              }}
            >
              ·
            </span>
          )}
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: item.color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Type pill ─────────────────────────────────────────────────────────────────

function TypePill({ gateType }: { gateType: 'hard' | 'soft' }) {
  const isHard = gateType === 'hard';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: RADIUS.pill,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: isHard ? SHELL.RUST_BG : SHELL.BLUE_BG,
        color: isHard ? SHELL.RUST_TEXT : '#2a56a6',
        whiteSpace: 'nowrap',
      }}
    >
      {gateType}
    </span>
  );
}

// ─── Hardest criteria card ─────────────────────────────────────────────────────

function HardestCriteria({ records }: { records: CriterionRecord[] }) {
  const top10 = records.slice(0, 10);

  if (top10.length === 0) return null;

  return (
    <section
      style={{
        background: SHELL.PEACH_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.sm} 0`,
          letterSpacing: '-0.01em',
        }}
      >
        Hardest criteria — top 10 lowest pass rate
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginTop: SPACING.md,
        }}
      >
        {top10.map((record, i) => {
          const pct = passRate(record);
          return (
            <div
              key={record.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                background: COLORS.white,
                border: `1px solid ${SHELL.PEACH_LINE}`,
                borderRadius: RADIUS.md,
                padding: `${SPACING.sm} ${SPACING.md}`,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  color: `${COLORS.ink}44`,
                  minWidth: 20,
                  textAlign: 'right',
                }}
              >
                {i + 1}
              </span>
              <TypePill gateType={record.gateType} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: COLORS.navy,
                    fontWeight: 600,
                  }}
                >
                  {record.id}
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}99`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={record.description}
                >
                  {record.description}
                </div>
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  color: pct < 30 ? SHELL.RUST_TEXT : pct < 60 ? SHELL.PEACH_TEXT : SHELL.MINT_TEXT,
                  whiteSpace: 'nowrap',
                }}
              >
                {pct}%
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                  whiteSpace: 'nowrap',
                }}
              >
                {record.metCount}/{record.totalCount}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Criterion table ───────────────────────────────────────────────────────────

function CriterionTable({ records }: { records: CriterionRecord[] }) {
  const headerStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    padding: `${SPACING.sm} ${SPACING.md}`,
    textAlign: 'left',
    borderBottom: `2px solid ${COLORS.ink}14`,
    whiteSpace: 'nowrap',
  };

  const cellBase: React.CSSProperties = {
    padding: `8px ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}0d`,
    verticalAlign: 'middle',
  };

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
          All gate criteria
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          {records.length} criteria sorted by pass rate ascending (hardest first)
        </div>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: TYPOGRAPHY.sans,
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle}>Criterion ID</th>
              <th style={{ ...headerStyle, minWidth: 260 }}>Description</th>
              <th style={headerStyle}>Type</th>
              <th style={headerStyle}>Stage</th>
              <th style={headerStyle}>Pattern</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Met</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Total</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Pass%</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, rowIdx) => {
              const bg = rowIdx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
              const pct = passRate(record);
              const pctColor =
                pct < 30
                  ? SHELL.RUST_TEXT
                  : pct < 60
                  ? SHELL.PEACH_TEXT
                  : SHELL.MINT_TEXT;

              return (
                <tr key={record.id} style={{ background: bg }}>
                  <td style={cellBase}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        fontWeight: 600,
                        color: COLORS.navy,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {record.id}
                    </span>
                  </td>
                  <td style={{ ...cellBase, minWidth: 260 }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: `${COLORS.ink}cc`,
                        lineHeight: 1.4,
                      }}
                      title={record.description}
                    >
                      {record.description.length > 80
                        ? `${record.description.slice(0, 80)}…`
                        : record.description}
                    </span>
                  </td>
                  <td style={cellBase}>
                    <TypePill gateType={record.gateType} />
                  </td>
                  <td style={cellBase}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: `${COLORS.ink}bb`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {record.stageId}
                    </span>
                  </td>
                  <td style={cellBase}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: `${COLORS.ink}99`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        maxWidth: 180,
                      }}
                      title={record.patternTitle}
                    >
                      {record.patternTitle}
                    </span>
                  </td>
                  <td style={{ ...cellBase, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        color: SHELL.MINT_TEXT,
                        fontWeight: 600,
                      }}
                    >
                      {record.metCount}
                    </span>
                  </td>
                  <td style={{ ...cellBase, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        color: `${COLORS.ink}88`,
                      }}
                    >
                      {record.totalCount}
                    </span>
                  </td>
                  <td style={{ ...cellBase, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        fontWeight: 700,
                        color: pctColor,
                      }}
                    >
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CriterionDetailPage() {
  const records = buildCriterionData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Criterion detail"
        subtitle="Every gate criterion across all lifecycle patterns with per-instance pass rates. Sorted hardest first."
      >
        <SummaryStrip records={records} />
        <HardestCriteria records={records} />
        <CriterionTable records={records} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
