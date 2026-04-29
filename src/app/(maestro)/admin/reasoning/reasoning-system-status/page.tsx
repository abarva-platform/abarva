// /admin/reasoning/reasoning-system-status — Operational health of the
// in-memory reasoning engine. Shows the status of every data store, tool
// coverage by category, system info, and diagnostic tips.
//
// Pure server component. Reads in-memory stores directly — no HTTP round-trips.
// All data resets on server restart (zero persistence).

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reasoning System Status · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreCheck {
  name: string;
  status: 'online' | 'empty' | 'error';
  count: number;
  type: string;
  note: string;
  error?: string;
}

interface ToolCategory {
  name: string;
  count: number;
  samples: string[];
}

// ─── Data assembly ────────────────────────────────────────────────────────────

async function runStoreChecks(): Promise<StoreCheck[]> {
  const checks = await Promise.allSettled([
    Promise.resolve(buildHealthBoardRows()),
    Promise.resolve(getWaivers()),
    Promise.resolve(getAllLifecyclePatterns()),
    Promise.resolve(getResolvedEntries()),
  ]);

  const [instancesResult, waiversResult, patternsResult, resolvedResult] = checks;

  function toCheck(
    result: PromiseSettledResult<unknown[]>,
    name: string,
    type: string,
    note: string,
  ): StoreCheck {
    if (result.status === 'rejected') {
      return {
        name,
        status: 'error',
        count: 0,
        type,
        note,
        error: String(result.reason),
      };
    }
    const count = Array.isArray(result.value) ? result.value.length : 0;
    return {
      name,
      status: count > 0 ? 'online' : 'empty',
      count,
      type,
      note,
    };
  }

  return [
    toCheck(
      instancesResult as PromiseSettledResult<unknown[]>,
      'Health Board Instances',
      'In-memory',
      'SOURCE_EVENT_INSTANCES + APEX_RETAIL_PROGRAM_INSTANCES. Resets on restart.',
    ),
    toCheck(
      waiversResult as PromiseSettledResult<unknown[]>,
      'Gate Waivers',
      'In-memory',
      'POST /api/reasoning/gate-waiver to seed. Resets on restart.',
    ),
    toCheck(
      patternsResult as PromiseSettledResult<unknown[]>,
      'Lifecycle Patterns',
      'In-memory (static)',
      'SOURCE_LIFECYCLE_PATTERNS + PROGRAM_LIFECYCLE_PATTERNS. Loaded at import time.',
    ),
    toCheck(
      resolvedResult as PromiseSettledResult<unknown[]>,
      'Resolved Contradictions',
      'In-memory',
      'POST /api/reasoning/contradiction-resolution to seed. Resets on restart.',
    ),
  ];
}

function buildToolCategories(): ToolCategory[] {
  return [
    {
      name: 'Health',
      count: 24,
      samples: ['health', 'health-board', 'health-alerts'],
    },
    {
      name: 'Gates',
      count: 22,
      samples: ['gate-status-matrix', 'gate-audit', 'gate-heatmap'],
    },
    {
      name: 'Contradictions',
      count: 18,
      samples: ['contradictions', 'contradiction-browser', 'contradiction-resolver'],
    },
    {
      name: 'Evidence',
      count: 16,
      samples: ['evidence-catalog', 'evidence-gaps', 'evidence-coverage'],
    },
    {
      name: 'Patterns',
      count: 18,
      samples: ['patterns', 'pattern-metrics', 'pattern-health'],
    },
    {
      name: 'Synthesis',
      count: 12,
      samples: ['synthesis-preview', 'synthesis-diff', 'synthesis-audit'],
    },
    {
      name: 'Lifecycle',
      count: 14,
      samples: ['lifecycle-map', 'stage-transitions', 'stage-readiness'],
    },
    {
      name: 'Waivers',
      count: 8,
      samples: ['waiver-log', 'waiver-analysis', 'waiver-expiry'],
    },
    {
      name: 'Instances',
      count: 11,
      samples: ['instance-compare', 'instance-deep-dive', 'instance-scorecard'],
    },
  ];
}

// ─── Derived totals ───────────────────────────────────────────────────────────

function totalToolCount(categories: ToolCategory[]): number {
  return categories.reduce((sum, c) => sum + c.count, 0);
}

// ─── Cell styles ─────────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ status }: { status: StoreCheck['status'] }) {
  const configs = {
    online: { bg: COLORS.mintSoft, color: COLORS.mintInk, label: '✅ Online' },
    empty: { bg: COLORS.amberSoft, color: COLORS.amberInk, label: '⚠️ Empty' },
    error: { bg: COLORS.coralSoft, color: COLORS.coralInk, label: '❌ Error' },
  };
  const cfg = configs[status];
  return (
    <span
      style={{
        display: 'inline-block',
        background: cfg.bg,
        color: cfg.color,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

function HeroCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? COLORS.skyPale : COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.lg} ${SPACING.xl}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}88`,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 32,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function SummaryCards({
  checks,
  categories,
}: {
  checks: StoreCheck[];
  categories: ToolCategory[];
}) {
  const allOnline = checks.every((c) => c.status === 'online');
  const anyError = checks.some((c) => c.status === 'error');
  const overallLabel = anyError
    ? '🔴 Degraded'
    : allOnline
      ? '🟢 All systems operational'
      : '🟡 Partial';

  const instanceRow = checks.find((c) => c.name === 'Health Board Instances');
  const patternsRow = checks.find((c) => c.name === 'Lifecycle Patterns');

  const toolTotal = totalToolCount(categories);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: SPACING.md,
      }}
    >
      <HeroCard label="Overall status" value={overallLabel} accent={allOnline} />
      <HeroCard
        label="Active instances in memory"
        value={String(instanceRow?.count ?? 0)}
        sub="Source + program instances"
      />
      <HeroCard
        label="Lifecycle patterns loaded"
        value={String(patternsRow?.count ?? 0)}
        sub="Source + program patterns"
      />
      <HeroCard
        label="Reasoning tools available"
        value={`${toolTotal}+`}
        sub="Across all categories"
      />
    </div>
  );
}

function DataStoreTable({ checks }: { checks: StoreCheck[] }) {
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
          Data store health
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          One row per in-memory store — checked at render time
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Store</th>
              <th style={HEADER_CELL}>Status</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Records</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Note</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.name}>
                <td
                  style={{
                    ...BODY_CELL,
                    fontFamily: TYPOGRAPHY.sans,
                    fontWeight: 600,
                  }}
                >
                  {check.name}
                </td>
                <td style={BODY_CELL}>
                  <StatusChip status={check.status} />
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right' as const,
                  }}
                >
                  {check.count.toLocaleString()}
                </td>
                <td style={MONO_CELL}>{check.type}</td>
                <td
                  style={{
                    ...BODY_CELL,
                    color: `${COLORS.ink}88`,
                    maxWidth: 360,
                  }}
                >
                  {check.error ? (
                    <span style={{ color: COLORS.coralInk, fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
                      {check.error}
                    </span>
                  ) : (
                    check.note
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ToolInventory({ categories }: { categories: ToolCategory[] }) {
  const total = totalToolCount(categories);
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
            Tool inventory
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Reasoning tools by category
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.navy,
          }}
        >
          {total}+ reasoning tools available
        </span>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {categories.map((cat) => {
          const pct = ((cat.count / total) * 100).toFixed(1);
          return (
            <div
              key={cat.name}
              style={{
                background: COLORS.cream,
                border: `1px solid ${COLORS.ink}10`,
                borderRadius: RADIUS.md,
                padding: `${SPACING.md} ${SPACING.lg}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: SPACING.sm,
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 16,
                    fontWeight: 600,
                    color: COLORS.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {cat.name}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.navy,
                  }}
                >
                  {cat.count}
                </span>
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                }}
              >
                {pct}% of total
              </div>
              {/* mini bar */}
              <div
                style={{
                  height: 3,
                  background: `${COLORS.ink}18`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: COLORS.navy,
                    borderRadius: RADIUS.pill,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  lineHeight: 1.4,
                }}
              >
                {cat.samples.join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SystemInfo() {
  const nodeVersion = process.version;
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Runtime', value: `Node.js ${nodeVersion}` },
    { label: 'Environment', value: 'Demo / Development' },
    { label: 'Rendering', value: 'Server-side (force-dynamic)' },
    { label: 'Persistence', value: 'None — all data is in-memory, resets on server restart' },
    { label: 'Database', value: 'No database connections — zero persistence' },
  ];

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
          System info
        </h2>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label}>
                <td
                  style={{
                    ...BODY_CELL,
                    fontFamily: TYPOGRAPHY.sans,
                    fontWeight: 600,
                    width: '30%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </td>
                <td style={MONO_CELL}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DiagnosticTips() {
  const tips = [
    'If instances show 0: verify SOURCE_EVENT_INSTANCES and APEX_RETAIL_PROGRAM_INSTANCES are seeded',
    'If waivers show 0: POST to /api/reasoning/gate-waiver to seed demo waivers',
    'If patterns show 0: check getAllLifecyclePatterns() in @/lib/reasoning/lifecycle-pattern-lookup',
  ];

  return (
    <section
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 17,
          fontWeight: 600,
          color: COLORS.amberInk,
          margin: `0 0 ${SPACING.sm}`,
          letterSpacing: '-0.01em',
        }}
      >
        Diagnostic tips
      </h2>
      <ul
        style={{
          margin: 0,
          paddingLeft: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {tips.map((tip) => (
          <li
            key={tip}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: COLORS.amberInk,
              lineHeight: 1.5,
            }}
          >
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReasoningSystemStatusPage() {
  const checks = await runStoreChecks();
  const categories = buildToolCategories();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · System"
        title="Reasoning System Status"
        subtitle="Operational health of the in-memory reasoning engine — data stores, tool coverage, and system diagnostics"
      >
        <SummaryCards checks={checks} categories={categories} />
        <DataStoreTable checks={checks} />
        <ToolInventory categories={categories} />
        <SystemInfo />
        <DiagnosticTips />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
