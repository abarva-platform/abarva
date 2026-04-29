// /admin/reasoning/fixture-lint — Fixture quality lint view.
//
// Server component. Runs the pure fixture-quality lint over every typed
// instance fixture and renders the resulting issues grouped by severity.
// The lint is the editorial counterpart to the template coverage audit:
// where coverage answers "do these templates fire?", the fixture lint
// answers "are these instances internally consistent with their pattern?".
//
// No client JS — values are computed at request time from static fixtures.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  lintFixtures,
  summarizeLintReport,
  type FixtureLintIssue,
} from '@/lib/reasoning/fixture-quality-lint';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fixture quality lint · AbarVa Admin',
};

// ─── Headline tiles ───────────────────────────────────────────────────────────

function HeadlineTile({
  label,
  primary,
  sub,
  tone,
}: {
  label: string;
  primary: string;
  sub?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  const accent =
    tone === 'good'
      ? COLORS.mintInk
      : tone === 'warn'
        ? COLORS.coralInk
        : tone === 'bad'
          ? COLORS.coralInk
          : COLORS.ink;
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minHeight: 120,
      }}
    >
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
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 36,
          color: accent,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {primary}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

// ─── Issue list ───────────────────────────────────────────────────────────────

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

function SeverityPill({ severity }: { severity: FixtureLintIssue['severity'] }) {
  const palette =
    severity === 'error'
      ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
      : { bg: COLORS.skyPale, fg: COLORS.navy };
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
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {severity}
    </span>
  );
}

function IssueTable({
  title,
  intro,
  issues,
  emptyMessage,
}: {
  title: string;
  intro: string;
  issues: FixtureLintIssue[];
  emptyMessage: string;
}) {
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
          {title}
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          {intro}
        </div>
      </header>
      {issues.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}99`,
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Severity</th>
                <th style={HEADER_CELL}>Instance</th>
                <th style={HEADER_CELL}>Message</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, idx) => (
                <tr key={`${issue.instanceId}-${idx}`}>
                  <td style={BODY_CELL}>
                    <SeverityPill severity={issue.severity} />
                  </td>
                  <td style={MONO_CELL}>{issue.instanceId}</td>
                  <td style={BODY_CELL}>{issue.message}</td>
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

export default function ReasoningFixtureLintPage() {
  const report = lintFixtures();
  const summary = summarizeLintReport(report);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open reasoning telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Fixture quality"
        title="Fixture quality lint"
        subtitle="Walks every typed instance fixture and reports drift relative to its bound lifecycle pattern: bogus pattern IDs, current-stage drift, evidence references that don't resolve, deliverable phases outside 0–6, and unresolvable cross-instance links."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: SPACING.md,
          }}
        >
          <HeadlineTile
            label="Instances scanned"
            primary={`${summary.totalInstances}`}
            sub="source events + program instances"
          />
          <HeadlineTile
            label="Errors"
            primary={`${summary.errors.length}`}
            sub={
              summary.errors.length === 0
                ? 'No structural drift detected — green-on-master canary'
                : 'Pattern-shape drift on at least one instance'
            }
            tone={summary.errors.length === 0 ? 'good' : 'bad'}
          />
          <HeadlineTile
            label="Warnings"
            primary={`${summary.warnings.length}`}
            sub={
              summary.warnings.length === 0
                ? 'No cross-instance link drift detected'
                : 'Cross-instance links that do not resolve'
            }
            tone={summary.warnings.length === 0 ? 'good' : 'warn'}
          />
        </div>

        <a
          href="/admin/reasoning"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.sm,
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.sm} ${SPACING.md}`,
            textDecoration: 'none',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ fontWeight: 600 }}>Back to reasoning telemetry</span>
          <span style={{ color: `${COLORS.ink}88` }}>cache, latency, feedback</span>
        </a>

        <IssueTable
          title="Errors"
          intro="Structural drift between an instance and its bound lifecycle pattern. These break gate evaluation, contradiction detection, and synthesis context."
          issues={summary.errors}
          emptyMessage="No errors. The fixture corpus is internally consistent with the pattern shape."
        />

        <IssueTable
          title="Warnings"
          intro="Cross-instance link references that don't resolve. Typically a typo on a programId or sourceEventId."
          issues={summary.warnings}
          emptyMessage="No warnings. Every cross-instance link resolves to a known instance."
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
