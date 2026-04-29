// /admin/reasoning/coverage — Template coverage audit view.
//
// Server component. Runs the pure template-coverage audit over every
// lifecycle pattern × template × bound fixture instance, and renders the
// covered/uncovered state per template grouped by pattern. The headline
// tile shows global "covered / total" so operators can see at a glance
// how sparse the keyword-based detection actually is on the demo corpus.
//
// No client JS — values are computed at request time from static fixtures.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  auditAll,
  groupByPattern,
  type PatternCoverageGroup,
  type CoverageSummary,
  type TemplateCoverageRow,
} from '@/lib/reasoning/template-coverage-audit';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Template coverage audit · AbarVa Admin',
};

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ─── Headline tiles ───────────────────────────────────────────────────────────

function HeadlineTile({
  label,
  primary,
  sub,
}: {
  label: string;
  primary: string;
  sub?: string;
}) {
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
          fontSize: 32,
          color: COLORS.ink,
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

function HeadlineGrid({
  totalSummary,
  contradictions,
  failureModes,
  contradictionsBound,
  failureModesBound,
}: {
  totalSummary: { totalTemplates: number; coveredTemplates: number; coverageRatio: number };
  contradictions: CoverageSummary;
  failureModes: CoverageSummary;
  contradictionsBound: CoverageSummary;
  failureModesBound: CoverageSummary;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <HeadlineTile
        label="Templates with coverage"
        primary={`${totalSummary.coveredTemplates} / ${totalSummary.totalTemplates}`}
        sub={`${formatPct(totalSummary.coverageRatio)} of all templates fire on at least one bound instance`}
      />
      <HeadlineTile
        label="Contradictions"
        primary={`${contradictions.coveredTemplates} / ${contradictions.totalTemplates}`}
        sub={`bound-only ${formatPct(contradictionsBound.coverageRatio)} (${contradictionsBound.coveredTemplates}/${contradictionsBound.totalTemplates})`}
      />
      <HeadlineTile
        label="Failure modes"
        primary={`${failureModes.coveredTemplates} / ${failureModes.totalTemplates}`}
        sub={`bound-only ${formatPct(failureModesBound.coverageRatio)} (${failureModesBound.coveredTemplates}/${failureModesBound.totalTemplates})`}
      />
      <HeadlineTile
        label="Detection method"
        primary="Keyword"
        sub="≥ 2 keywords from detectionHint must match the evidence map"
      />
    </div>
  );
}

// ─── Coverage chip ────────────────────────────────────────────────────────────

function CoverageChip({ row }: { row: TemplateCoverageRow }) {
  const covered = row.coverage === 'covered';
  const bg = covered ? COLORS.mintSoft : COLORS.coralSoft;
  const fg = covered ? COLORS.mintInk : COLORS.coralInk;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'lowercase',
      }}
    >
      {covered ? `covered · ${row.firedOnInstances.length}/${row.totalInstancesTested}` : 'uncovered'}
    </span>
  );
}

function InstanceCountBadge({ count }: { count: number }) {
  const empty = count === 0;
  return (
    <span
      style={{
        display: 'inline-block',
        background: empty ? `${COLORS.ink}08` : COLORS.skyPale,
        color: empty ? `${COLORS.ink}99` : COLORS.navy,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {empty ? 'no fixtures bound' : `${count} fixture${count === 1 ? '' : 's'}`}
    </span>
  );
}

// ─── Per-pattern table ────────────────────────────────────────────────────────

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

function PatternGroupTable({
  group,
  kind,
}: {
  group: PatternCoverageGroup;
  kind: 'contradictions' | 'failure modes';
}) {
  const coveredCount = group.rows.filter((r) => r.coverage === 'covered').length;
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
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}77`,
              letterSpacing: '0.04em',
            }}
          >
            {group.patternId}
          </div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {group.patternLabel}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: SPACING.sm, alignItems: 'center' }}>
          <InstanceCountBadge count={group.instanceCount} />
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}88`,
            }}
          >
            {coveredCount}/{group.rows.length} {kind} covered
          </span>
        </div>
      </header>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>Template</th>
            <th style={HEADER_CELL}>Label</th>
            <th style={HEADER_CELL}>Fired on</th>
            <th style={HEADER_CELL}>Coverage</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <tr key={`${row.patternId}::${row.templateId}`}>
              <td style={MONO_CELL}>{row.templateId}</td>
              <td style={BODY_CELL}>{row.label}</td>
              <td style={MONO_CELL}>
                {row.firedOnInstances.length === 0
                  ? '—'
                  : row.firedOnInstances.join(', ')}
              </td>
              <td style={BODY_CELL}>
                <CoverageChip row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CategorySection({
  title,
  intro,
  groups,
  kind,
}: {
  title: string;
  intro: string;
  groups: PatternCoverageGroup[];
  kind: 'contradictions' | 'failure modes';
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      <header>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}aa`,
            margin: `${SPACING.xs} 0 0`,
            lineHeight: 1.5,
          }}
        >
          {intro}
        </p>
      </header>
      {groups.map((group) => (
        <PatternGroupTable key={group.patternId} group={group} kind={kind} />
      ))}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReasoningCoveragePage() {
  const audit = auditAll();
  const contradictionGroups = groupByPattern(audit.contradictions);
  const failureModeGroups = groupByPattern(audit.failureModes);

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
        eyebrow="Reasoning · Template coverage"
        title="Template coverage audit"
        subtitle="Which contradiction and failure-mode templates actually fire against the fixture corpus, and which sit dormant because their detectionHint keywords never appear in any evidence map."
      >
        <HeadlineGrid
          totalSummary={{
            totalTemplates: audit.summary.totalTemplates,
            coveredTemplates: audit.summary.coveredTemplates,
            coverageRatio: audit.summary.coverageRatio,
          }}
          contradictions={audit.summary.contradictions}
          failureModes={audit.summary.failureModes}
          contradictionsBound={audit.summary.contradictionsBound}
          failureModesBound={audit.summary.failureModesBound}
        />

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

        <CategorySection
          title="Contradiction templates"
          intro="Each row pairs one contradiction template with the fixture instances bound to its pattern. A template is 'covered' when at least one bound instance produces a detection."
          groups={contradictionGroups}
          kind="contradictions"
        />

        <CategorySection
          title="Failure-mode templates"
          intro="Same audit applied to FailureMode entries on each pattern. Detection runs the failure-mode detector against the instance evidence map."
          groups={failureModeGroups}
          kind="failure modes"
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
