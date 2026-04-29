// /admin/reasoning/contradiction-network — Co-occurrence network of contradiction
// templates. If two contradictions are both active in the same instance they are
// "linked" in a network.
//
// Pure server component, force-dynamic. Runs the contradiction detector against
// every source and program instance, then:
//   1. Builds a per-instance set of active template IDs.
//   2. Counts co-occurrences for every (A, B) template pair.
//   3. Ranks pairs by co-occurrence count and renders two tables.

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
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction network · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

type CoOccurrenceRow = {
  idA: string;
  labelA: string;
  idB: string;
  labelB: string;
  count: number;
  instances: string[];
};

type FrequencyRow = {
  templateId: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  activeCount: number;
  instances: string[];
};

type NetworkData = {
  coOccurrenceRows: CoOccurrenceRow[];
  frequencyRows: FrequencyRow[];
  totalTemplates: number;
  totalInstances: number;
  strongestLink: CoOccurrenceRow | null;
};

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildNetworkData(): NetworkData {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

  // Build a template label lookup from all patterns (deduped)
  const templateMeta = new Map<
    string,
    { label: string; severity: 'low' | 'medium' | 'high' }
  >();
  for (const pattern of ALL_PATTERNS) {
    for (const tmpl of pattern.contradictionTemplates as ContradictionTemplate[]) {
      if (!templateMeta.has(tmpl.id)) {
        templateMeta.set(tmpl.id, { label: tmpl.label, severity: tmpl.severity });
      }
    }
  }

  // Collect all instances with their evidence maps
  const allInstances: Array<{
    id: string;
    name: string;
    patternId: string;
    evidenceMap: Record<string, unknown>;
  }> = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    allInstances.push({
      id: inst.id,
      name: inst.name,
      patternId: inst.patternId,
      evidenceMap: buildEvidenceMap(inst),
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    allInstances.push({
      id: inst.id,
      name: inst.name,
      patternId: inst.patternId,
      evidenceMap: buildProgramEvidenceMap(inst),
    });
  }

  // Per-instance active template IDs
  const instanceActiveMap = new Map<string, { name: string; activeIds: Set<string> }>();

  for (const { id, name, patternId, evidenceMap } of allInstances) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === patternId);
    if (!pattern) continue;

    const detector = createContradictionDetector(pattern);
    const firedDetections = detector.detect(evidenceMap);
    const activeIds = new Set(firedDetections.map((d) => d.templateId));
    instanceActiveMap.set(id, { name, activeIds });
  }

  // Frequency table: per template, how many instances have it active
  const freqAcc = new Map<string, { count: number; instances: string[] }>();
  for (const { name, activeIds } of instanceActiveMap.values()) {
    for (const tid of activeIds) {
      const existing = freqAcc.get(tid) ?? { count: 0, instances: [] };
      existing.count += 1;
      existing.instances.push(name);
      freqAcc.set(tid, existing);
    }
  }

  const frequencyRows: FrequencyRow[] = Array.from(freqAcc.entries())
    .map(([templateId, { count, instances }]) => {
      const meta = templateMeta.get(templateId);
      return {
        templateId,
        label: meta?.label ?? templateId,
        severity: meta?.severity ?? 'low',
        activeCount: count,
        instances,
      };
    })
    .sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return a.templateId.localeCompare(b.templateId);
    });

  // Co-occurrence matrix: for each instance with ≥2 active templates, count pairs
  // Use a sorted canonical key "idA::idB" (idA < idB alphabetically) for dedup
  const coAcc = new Map<
    string,
    { idA: string; idB: string; count: number; instances: string[] }
  >();

  for (const { name, activeIds } of instanceActiveMap.values()) {
    const ids = Array.from(activeIds).sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const idA = ids[i];
        const idB = ids[j];
        const key = `${idA}::${idB}`;
        const existing = coAcc.get(key) ?? { idA, idB, count: 0, instances: [] };
        existing.count += 1;
        existing.instances.push(name);
        coAcc.set(key, existing);
      }
    }
  }

  const coOccurrenceRows: CoOccurrenceRow[] = Array.from(coAcc.values())
    .map(({ idA, idB, count, instances }) => ({
      idA,
      labelA: templateMeta.get(idA)?.label ?? idA,
      idB,
      labelB: templateMeta.get(idB)?.label ?? idB,
      count,
      instances,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.idA.localeCompare(b.idA);
    });

  const strongestLink = coOccurrenceRows.length > 0 ? coOccurrenceRows[0] : null;

  return {
    coOccurrenceRows,
    frequencyRows,
    totalTemplates: freqAcc.size,
    totalInstances: instanceActiveMap.size,
    strongestLink,
  };
}

// ─── Table styles ─────────────────────────────────────────────────────────────

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

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: NetworkData }) {
  const { totalTemplates, coOccurrenceRows, strongestLink, totalInstances } = data;

  const items: Array<{ label: string; value: string }> = [
    {
      label: 'Contradiction templates',
      value: String(totalTemplates),
    },
    {
      label: 'Co-occurrence pairs',
      value: String(coOccurrenceRows.length),
    },
    {
      label: 'Instances scanned',
      value: String(totalInstances),
    },
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
        alignItems: 'flex-start',
        gap: `${SPACING.md} ${SPACING.xl}`,
      }}
    >
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 22,
              color: COLORS.ink,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </span>
        </div>
      ))}

      {strongestLink && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            Strongest link
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: COLORS.ink,
              lineHeight: 1.4,
              maxWidth: 420,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: SHELL.INK_SOFT,
              }}
            >
              {strongestLink.idA}
            </span>{' '}
            <span style={{ color: `${COLORS.ink}66` }}>↔</span>{' '}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: SHELL.INK_SOFT,
              }}
            >
              {strongestLink.idB}
            </span>{' '}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              ({strongestLink.count} instance{strongestLink.count === 1 ? '' : 's'})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function InstanceList({ instances }: { instances: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {instances.map((name) => (
        <span
          key={name}
          style={{
            display: 'inline-block',
            background: `${COLORS.ink}08`,
            color: `${COLORS.ink}cc`,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

function CoOccurrenceTable({ rows }: { rows: CoOccurrenceRow[] }) {
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
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Co-occurrence pairs
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Template pairs that are both active in the same instance · sorted by count
            descending
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} pair{rows.length === 1 ? '' : 's'}
        </span>
      </header>

      {rows.length === 0 ? (
        <div
          style={{
            padding: `${SPACING.xl} ${SPACING.lg}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
            textAlign: 'center',
          }}
        >
          No co-occurring contradictions found — no instance has two or more active
          templates simultaneously.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Contradiction A</th>
                <th style={HEADER_CELL}>Contradiction B</th>
                <th style={{ ...HEADER_CELL, textAlign: 'center', width: 120 }}>
                  Co-occurrences
                </th>
                <th style={HEADER_CELL}>Instances</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.idA}::${row.idB}`}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: SHELL.INK_MUTED,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {row.idA}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: COLORS.ink,
                          lineHeight: 1.3,
                        }}
                      >
                        {row.labelA}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: SHELL.INK_MUTED,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {row.idB}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: COLORS.ink,
                          lineHeight: 1.3,
                        }}
                      >
                        {row.labelB}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: COLORS.ink,
                    }}
                  >
                    {row.count}
                  </td>
                  <td style={BODY_CELL}>
                    <InstanceList instances={row.instances} />
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

function SeverityDot({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const color =
    severity === 'high'
      ? SHELL.RUST_TEXT
      : severity === 'medium'
        ? SHELL.AMBER_DOT
        : SHELL.GRAY_TEXT;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function FrequencyTable({ rows }: { rows: FrequencyRow[] }) {
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
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Template frequency
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Individual template instance counts — how many instances have each active ·
            sorted descending
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} template{rows.length === 1 ? '' : 's'}
        </span>
      </header>

      {rows.length === 0 ? (
        <div
          style={{
            padding: `${SPACING.xl} ${SPACING.lg}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
            textAlign: 'center',
          }}
        >
          No active contradiction templates found across any instance.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Template</th>
                <th style={HEADER_CELL}>Severity</th>
                <th style={{ ...HEADER_CELL, textAlign: 'center', width: 110 }}>
                  Instances active
                </th>
                <th style={HEADER_CELL}>Instances</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.templateId}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: SHELL.INK_MUTED,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {row.templateId}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: COLORS.ink,
                          lineHeight: 1.3,
                        }}
                      >
                        {row.label}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <SeverityDot severity={row.severity} />
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: COLORS.ink,
                          textTransform: 'capitalize',
                        }}
                      >
                        {row.severity}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: COLORS.ink,
                    }}
                  >
                    {row.activeCount}
                  </td>
                  <td style={BODY_CELL}>
                    <InstanceList instances={row.instances} />
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

function EmptyState() {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px dashed ${COLORS.ink}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}aa`,
        lineHeight: 1.5,
      }}
    >
      No contradictions detected across any instance — evidence maps do not trigger any
      template thresholds.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionNetworkPage() {
  const data = buildNetworkData();
  const hasAny = data.totalTemplates > 0;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Contradiction debug"
          primaryActionHref="/admin/reasoning/contradiction-debug"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Contradiction network"
        subtitle="Co-occurrence network of contradiction templates — which contradictions appear together across instances."
      >
        <SummaryStrip data={data} />

        {hasAny ? (
          <>
            <CoOccurrenceTable rows={data.coOccurrenceRows} />
            <FrequencyTable rows={data.frequencyRows} />
          </>
        ) : (
          <EmptyState />
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
