// /admin/reasoning/alerts-dashboard — Unified triage dashboard for all active alerts.
//
// Pure server component. Aggregates five alert types across all fixture instances:
//   1. Critical health  — score < 30
//   2. Warning health   — score 30–49
//   3. Stale waiver     — waiver age > 30 days
//   4. Chronic contradiction — contradiction age > 30 days
//   5. Long dwell       — current stage entry > 45 days ago
//
// Sorted by severity: critical first, warning second, then others.
// Today = 2026-04-29 (hardcoded for demo determinism).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { waiverAuditBuffer } from '@/app/api/reasoning/audit/route';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Alerts dashboard · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-29T00:00:00Z');
const TODAY_MS = TODAY.getTime();
const MS_PER_DAY = 86_400_000;

// Alert type codes
type AlertType = 'critical' | 'warning' | 'stale-waiver' | 'chronic-contradiction' | 'long-dwell';

// Severity order for sorting
const SEVERITY_ORDER: Record<AlertType, number> = {
  critical: 0,
  warning: 1,
  'stale-waiver': 2,
  'chronic-contradiction': 3,
  'long-dwell': 4,
};

// Alert severity bucket for header count
type SeverityBucket = 'critical' | 'warning' | 'informational';

function severityBucket(type: AlertType): SeverityBucket {
  if (type === 'critical') return 'critical';
  if (type === 'warning') return 'warning';
  return 'informational';
}

// ─── Alert interface ──────────────────────────────────────────────────────────

interface Alert {
  id: string;
  type: AlertType;
  instanceName: string;
  detail: string;
  action: string;
}

// ─── Inline palette ──────────────────────────────────────────────────────────

// Using SHELL tokens where appropriate, inline rust for stale
const RUST_BG = SHELL.RUST_BG;
const RUST_TEXT = SHELL.RUST_TEXT;
const RUST_LINE = '#d4a08a';

// ─── Data: health alerts ─────────────────────────────────────────────────────

function buildHealthAlerts(): Alert[] {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];
  const alerts: Alert[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const context = buildSourceSynthesisContext(inst, pattern as LifecyclePatternSeed);
    const health = computeInstanceHealth(context);

    if (health.score < 30) {
      alerts.push({
        id: `health-critical-${inst.id}`,
        type: 'critical',
        instanceName: inst.name,
        detail: `Health score ${health.score}/100 — ${health.summary}`,
        action: 'Review instance immediately',
      });
    } else if (health.score < 50) {
      alerts.push({
        id: `health-warning-${inst.id}`,
        type: 'warning',
        instanceName: inst.name,
        detail: `Health score ${health.score}/100 — ${health.summary}`,
        action: 'Monitor and address open gates',
      });
    }
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    const context = buildProgramSynthesisContext(inst, pattern as LifecyclePatternSeed | undefined);
    const health = computeInstanceHealth(context);

    if (health.score < 30) {
      alerts.push({
        id: `health-critical-${inst.id}`,
        type: 'critical',
        instanceName: inst.name,
        detail: `Health score ${health.score}/100 — ${health.summary}`,
        action: 'Review instance immediately',
      });
    } else if (health.score < 50) {
      alerts.push({
        id: `health-warning-${inst.id}`,
        type: 'warning',
        instanceName: inst.name,
        detail: `Health score ${health.score}/100 — ${health.summary}`,
        action: 'Monitor and address open gates',
      });
    }
  }

  return alerts;
}

// ─── Data: stale waiver alerts ────────────────────────────────────────────────

function buildInstanceNameIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) index.set(inst.id, inst.name);
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) index.set(inst.id, inst.name);
  return index;
}

function deriveFakeWaiverAgeDays(instanceId: string, criterionId: string): number {
  const seed = instanceId.charCodeAt(0) * 7 + criterionId.charCodeAt(0) * 3;
  return Math.abs(seed) % 60;
}

function buildStaleWaiverAlerts(): Alert[] {
  const nameIndex = buildInstanceNameIndex();

  const auditTimestamps = new Map<string, string>();
  for (const record of waiverAuditBuffer) {
    auditTimestamps.set(`${record.instanceId}::${record.criterionId}`, record.waivedAt);
  }

  const raw = getWaivers();
  const alerts: Alert[] = [];

  for (const w of raw) {
    const key = `${w.instanceId}::${w.criterionId}`;
    let ageDays: number;
    const ts = w.waivedAt || auditTimestamps.get(key);
    if (ts) {
      const grantedMs = new Date(ts).getTime();
      ageDays = Number.isNaN(grantedMs)
        ? deriveFakeWaiverAgeDays(w.instanceId, w.criterionId)
        : Math.round((TODAY_MS - grantedMs) / MS_PER_DAY);
    } else {
      ageDays = deriveFakeWaiverAgeDays(w.instanceId, w.criterionId);
    }

    if (ageDays > 30) {
      const instanceName = nameIndex.get(w.instanceId) ?? w.instanceId;
      alerts.push({
        id: `stale-waiver-${key}`,
        type: 'stale-waiver',
        instanceName,
        detail: `Gate waiver on ${w.criterionId} is ${ageDays} days old — ${w.reason}`,
        action: 'Renew or revoke waiver',
      });
    }
  }

  return alerts;
}

// ─── Data: chronic contradiction alerts ───────────────────────────────────────

function deriveContradictionAgeDays(instanceId: string, contradictionId: string): number {
  return Math.abs(instanceId.charCodeAt(0) + contradictionId.charCodeAt(3)) % 90;
}

function buildChronicContradictionAlerts(): Alert[] {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];
  const resolvedIds = new Set<string>(getResolvedEntries().map((e) => e.id));
  const alerts: Alert[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(buildEvidenceMap(inst));

    for (const d of detections) {
      const compoundId = `${inst.id}::${d.templateId}`;
      if (resolvedIds.has(compoundId)) continue;
      const ageDays = deriveContradictionAgeDays(inst.id, d.templateId);
      if (ageDays > 30) {
        alerts.push({
          id: `chronic-contradiction-${compoundId}`,
          type: 'chronic-contradiction',
          instanceName: inst.name,
          detail: `${d.label} — unresolved for ${ageDays} days (severity: ${d.severity})`,
          action: `Resolve via: ${d.resolutionPath}`,
        });
      }
    }
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(buildProgramEvidenceMap(inst));

    for (const d of detections) {
      const compoundId = `${inst.id}::${d.templateId}`;
      if (resolvedIds.has(compoundId)) continue;
      const ageDays = deriveContradictionAgeDays(inst.id, d.templateId);
      if (ageDays > 30) {
        alerts.push({
          id: `chronic-contradiction-${compoundId}`,
          type: 'chronic-contradiction',
          instanceName: inst.name,
          detail: `${d.label} — unresolved for ${ageDays} days (severity: ${d.severity})`,
          action: `Resolve via: ${d.resolutionPath}`,
        });
      }
    }
  }

  return alerts;
}

// ─── Data: long dwell alerts ──────────────────────────────────────────────────

const LONG_DWELL_THRESHOLD = 45; // days

function buildLongDwellAlerts(): Alert[] {
  const alerts: Alert[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const history = (inst.stageHistory as Array<{ stageId: string; enteredAt: string }> | undefined) ?? [];
    const currentEntry = history.length > 0 ? history[history.length - 1] : null;
    const enteredAt = currentEntry?.enteredAt ?? '';
    const stageId = currentEntry?.stageId ?? (inst.currentStage as string | undefined) ?? 'Unknown';

    if (!enteredAt) continue;
    const entered = new Date(enteredAt).getTime();
    if (Number.isNaN(entered)) continue;

    const dwellDays = Math.max(0, Math.floor((TODAY_MS - entered) / MS_PER_DAY));
    if (dwellDays > LONG_DWELL_THRESHOLD) {
      alerts.push({
        id: `long-dwell-${inst.id}`,
        type: 'long-dwell',
        instanceName: inst.name,
        detail: `${dwellDays} days in stage "${stageId}" — entered ${enteredAt.slice(0, 10)}`,
        action: 'Check gate blockers and advance readiness',
      });
    }
  }

  return alerts;
}

// ─── All alerts combined ──────────────────────────────────────────────────────

function buildAllAlerts(): Alert[] {
  const all = [
    ...buildHealthAlerts(),
    ...buildStaleWaiverAlerts(),
    ...buildChronicContradictionAlerts(),
    ...buildLongDwellAlerts(),
  ];

  // Sort by severity order
  all.sort((a, b) => SEVERITY_ORDER[a.type] - SEVERITY_ORDER[b.type]);

  return all;
}

// ─── Alert type metadata ──────────────────────────────────────────────────────

const ALERT_META: Record<AlertType, { label: string; badge: string; bgColor: string; textColor: string; lineColor: string }> = {
  critical: {
    label: 'Critical health',
    badge: 'CRITICAL',
    bgColor: COLORS.coralSoft,
    textColor: COLORS.coralInk,
    lineColor: `${COLORS.coralInk}44`,
  },
  warning: {
    label: 'Warning health',
    badge: 'WARNING',
    bgColor: COLORS.amberSoft,
    textColor: COLORS.amberInk,
    lineColor: `${COLORS.amberInk}44`,
  },
  'stale-waiver': {
    label: 'Stale waiver',
    badge: 'STALE WAIVER',
    bgColor: RUST_BG,
    textColor: RUST_TEXT,
    lineColor: RUST_LINE,
  },
  'chronic-contradiction': {
    label: 'Chronic contradiction',
    badge: 'CHRONIC',
    bgColor: COLORS.skyPale,
    textColor: COLORS.navy,
    lineColor: `${COLORS.navy}33`,
  },
  'long-dwell': {
    label: 'Long dwell',
    badge: 'LONG DWELL',
    bgColor: SHELL.GRAY_BG,
    textColor: SHELL.GRAY_TEXT,
    lineColor: SHELL.GRAY_LINE,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlertsHeader({
  total,
  critical,
  warning,
  informational,
}: {
  total: number;
  critical: number;
  warning: number;
  informational: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Alerts dashboard
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {total} active alert{total === 1 ? '' : 's'}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: COLORS.coralSoft,
            color: COLORS.coralInk,
            borderRadius: RADIUS.pill,
            padding: '4px 12px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {critical} critical
        </span>
        <span
          style={{
            display: 'inline-block',
            background: COLORS.amberSoft,
            color: COLORS.amberInk,
            borderRadius: RADIUS.pill,
            padding: '4px 12px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {warning} warning
        </span>
        <span
          style={{
            display: 'inline-block',
            background: SHELL.GRAY_BG,
            color: SHELL.GRAY_TEXT,
            borderRadius: RADIUS.pill,
            padding: '4px 12px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {informational} informational
        </span>
      </div>
    </div>
  );
}

function AlertsSummaryBar({ alerts }: { alerts: Alert[] }) {
  const counts: Record<AlertType, number> = {
    critical: 0,
    warning: 0,
    'stale-waiver': 0,
    'chronic-contradiction': 0,
    'long-dwell': 0,
  };
  for (const a of alerts) counts[a.type]++;

  const typeOrder: AlertType[] = ['critical', 'warning', 'stale-waiver', 'chronic-contradiction', 'long-dwell'];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        By type
      </span>
      {typeOrder.map((type) => {
        const meta = ALERT_META[type];
        const count = counts[type];
        return (
          <span
            key={type}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: count > 0 ? meta.bgColor : SHELL.GRAY_BG,
              color: count > 0 ? meta.textColor : SHELL.GRAY_TEXT,
              borderRadius: RADIUS.pill,
              padding: '4px 12px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {meta.label}
            <span
              style={{
                background: count > 0 ? meta.textColor : SHELL.GRAY_TEXT,
                color: count > 0 ? meta.bgColor : SHELL.GRAY_BG,
                borderRadius: RADIUS.pill,
                padding: '1px 7px',
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {count}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function AlertTypeBadge({ type }: { type: AlertType }) {
  const meta = ALERT_META[type];
  return (
    <span
      style={{
        display: 'inline-block',
        background: meta.bgColor,
        color: meta.textColor,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {meta.badge}
    </span>
  );
}

function ActionChip({ action }: { action: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.BLUE_BG,
        color: COLORS.navy,
        border: `1px solid ${SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {action}
    </span>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const meta = ALERT_META[alert.type];
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${meta.lineColor}`,
        borderLeft: `3px solid ${meta.textColor}`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <AlertTypeBadge type={alert.type} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.ink,
            lineHeight: 1.3,
          }}
        >
          {alert.instanceName}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}bb`,
            lineHeight: 1.5,
          }}
        >
          {alert.detail}
        </span>
      </div>
      <ActionChip action={alert.action} />
    </div>
  );
}

function AlertGroup({ type, alerts }: { type: AlertType; alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  const meta = ALERT_META[type];

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${meta.lineColor}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${meta.lineColor}`,
          background: meta.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: meta.textColor,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {meta.label}
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: meta.textColor,
            fontWeight: 700,
          }}
        >
          {alerts.length} alert{alerts.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {alerts.map((alert) => {
          const card = <AlertCard alert={alert} />;
          return <div key={alert.id}>{card}</div>;
        })}
      </div>
    </section>
  );
}

function AlertList({ alerts }: { alerts: Alert[] }) {
  const typeOrder: AlertType[] = ['critical', 'warning', 'stale-waiver', 'chronic-contradiction', 'long-dwell'];

  return (
    <>
      {typeOrder.map((type) => {
        const group = alerts.filter((a) => a.type === type);
        const section = <AlertGroup type={type} alerts={group} />;
        return <div key={type}>{section}</div>;
      })}
    </>
  );
}

function AllClearState() {
  return (
    <div
      style={{
        background: COLORS.mintSoft,
        border: `1px solid ${COLORS.mintInk}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.xl} ${SPACING.lg}`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          color: COLORS.mintInk,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        All clear — no active alerts
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.mintInk}aa`,
          marginTop: SPACING.sm,
        }}
      >
        All instances are healthy, waivers are current, and no chronic contradictions or long-dwell patterns detected.
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsDashboardPage() {
  const alerts = buildAllAlerts();

  const critical = alerts.filter((a) => severityBucket(a.type) === 'critical').length;
  const warning = alerts.filter((a) => severityBucket(a.type) === 'warning').length;
  const informational = alerts.filter((a) => severityBucket(a.type) === 'informational').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Triage"
        title="Alerts dashboard"
        subtitle="Unified triage view — all active alerts across critical health, warning health, stale waivers, chronic contradictions, and long-dwell instances. Sorted by severity."
      >
        <AlertsHeader
          total={alerts.length}
          critical={critical}
          warning={warning}
          informational={informational}
        />
        {alerts.length === 0 ? (
          <AllClearState />
        ) : (
          <>
            <AlertsSummaryBar alerts={alerts} />
            <AlertList alerts={alerts} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
