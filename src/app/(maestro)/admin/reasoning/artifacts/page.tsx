// /admin/reasoning/artifacts — Artifact tracker.
//
// Server component. For each source event instance, resolves the pattern's
// expectedArtifacts and cross-references with instance.artifacts to surface
// submitted, draft, and missing artifacts across the corpus.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { ExpectedArtifact } from '@/lib/intelligence/seed-types';
import type { SourceArtifactRef } from '@/lib/source/source-event-instance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Artifact tracker · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

type ArtifactStatus = 'submitted' | 'draft' | 'missing';

interface ArtifactRow {
  expectedArtifact: ExpectedArtifact;
  status: ArtifactStatus;
  /** The matching instance artifact ref, if any */
  ref: SourceArtifactRef | undefined;
}

interface InstanceBlock {
  instanceId: string;
  instanceName: string;
  patternId: string;
  rows: ArtifactRow[];
  submittedCount: number;
  draftCount: number;
  missingCount: number;
  totalCount: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

const STATUS_ORDER: Record<ArtifactStatus, number> = {
  missing: 0,
  draft: 1,
  submitted: 2,
};

function computeBlocks(): InstanceBlock[] {
  const blocks: InstanceBlock[] = [];

  for (const instance of SOURCE_EVENT_INSTANCES) {
    const pattern = findLifecyclePattern(instance.patternId);
    if (!pattern || pattern.expectedArtifacts.length === 0) continue;

    // Build a lookup: expectedArtifactId → SourceArtifactRef
    const refByExpected = new Map<string, SourceArtifactRef>();
    for (const ref of instance.artifacts) {
      if (ref.expectedArtifactId) {
        refByExpected.set(ref.expectedArtifactId, ref);
      }
    }

    const rows: ArtifactRow[] = pattern.expectedArtifacts.map((expected) => {
      const ref = refByExpected.get(expected.id);
      let status: ArtifactStatus;
      if (!ref) {
        status = 'missing';
      } else if (ref.status === 'draft') {
        status = 'draft';
      } else {
        // 'approved' | 'locked' → submitted
        status = 'submitted';
      }
      return { expectedArtifact: expected, status, ref };
    });

    // Sort: missing first, then draft, then submitted
    rows.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

    const submittedCount = rows.filter((r) => r.status === 'submitted').length;
    const draftCount = rows.filter((r) => r.status === 'draft').length;
    const missingCount = rows.filter((r) => r.status === 'missing').length;

    blocks.push({
      instanceId: instance.id,
      instanceName: instance.name,
      patternId: instance.patternId,
      rows,
      submittedCount,
      draftCount,
      missingCount,
      totalCount: rows.length,
    });
  }

  return blocks;
}

function computeTotals(blocks: InstanceBlock[]): {
  total: number;
  submitted: number;
  draft: number;
  missing: number;
} {
  let total = 0;
  let submitted = 0;
  let draft = 0;
  let missing = 0;
  for (const b of blocks) {
    total += b.totalCount;
    submitted += b.submittedCount;
    draft += b.draftCount;
    missing += b.missingCount;
  }
  return { total, submitted, draft, missing };
}

// ─── UI components ────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  background: SHELL.PAPER_SOFT,
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: SHELL.INK,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: SHELL.INK_MID,
};

function StatusPill({ status }: { status: ArtifactStatus }) {
  const palette =
    status === 'submitted'
      ? { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT, label: 'Submitted' }
      : status === 'draft'
        ? { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT, label: 'Draft' }
        : { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT, label: 'Missing' };

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
        fontWeight: 700,
        letterSpacing: '0.03em',
      }}
    >
      {palette.label}
    </span>
  );
}

function RequiredBadge({ required }: { required: string }) {
  // required maps to ExpectedArtifact.requirement field
  const isRequired = required === 'required';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isRequired ? `${COLORS.ink}12` : `${COLORS.ink}07`,
        color: isRequired ? SHELL.INK : SHELL.INK_SOFT,
        borderRadius: RADIUS.sm,
        padding: '2px 7px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {required}
    </span>
  );
}

function StageChip({ stageId }: { stageId: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.BLUE_BG,
        color: SHELL.INK_MID,
        borderRadius: RADIUS.sm,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {stageId}
    </span>
  );
}

function SubmittedPill({
  submitted,
  total,
}: {
  submitted: number;
  total: number;
  missing: number;
}) {
  const ratio = total === 0 ? 1 : submitted / total;
  const palette =
    ratio === 1
      ? { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT }
      : ratio >= 0.5
        ? { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT }
        : { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT };

  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '3px 12px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {submitted}/{total} submitted
    </span>
  );
}

function SummaryStrip({
  totals,
}: {
  totals: { total: number; submitted: number; draft: number; missing: number };
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.md,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: SHELL.INK,
          fontWeight: 700,
        }}
      >
        {totals.total} total expected
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: SHELL.MINT_TEXT }}>
        {totals.submitted} submitted
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: SHELL.PEACH_TEXT }}>
        {totals.draft} draft
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: SHELL.RUST_TEXT }}>
        {totals.missing} missing
      </span>
    </div>
  );
}

function InstanceSection({ block }: { block: InstanceBlock }) {
  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Instance header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          background: SHELL.PAPER_SOFT,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: SHELL.INK,
              margin: 0,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {block.instanceName}
          </h2>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: SHELL.INK_SOFT,
            }}
          >
            {block.instanceId} · {block.patternId}
          </span>
        </div>
        <SubmittedPill
          submitted={block.submittedCount}
          total={block.totalCount}
          missing={block.missingCount}
        />
      </header>

      {/* Artifact table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Artifact ID</th>
              <th style={HEADER_CELL}>Label</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Requirement</th>
              <th style={HEADER_CELL}>Status</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.expectedArtifact.id}>
                <td style={MONO_CELL}>{row.expectedArtifact.id}</td>
                <td style={BODY_CELL}>{row.expectedArtifact.label}</td>
                <td style={BODY_CELL}>
                  <StageChip stageId={row.expectedArtifact.stageId} />
                </td>
                <td style={BODY_CELL}>
                  <RequiredBadge required={row.expectedArtifact.requirement} />
                </td>
                <td style={BODY_CELL}>
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px dashed ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: SHELL.INK_SOFT,
        lineHeight: 1.5,
      }}
    >
      No instances with expected artifacts found — check that lifecycle patterns
      have <code style={{ fontFamily: TYPOGRAPHY.mono }}>expectedArtifacts</code> populated.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArtifactTrackerPage() {
  const blocks = computeBlocks();
  const totals = computeTotals(blocks);

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
        title="Artifact tracker"
        subtitle="Expected vs submitted artifacts across all instances. Identifies missing and draft artifacts."
      >
        {blocks.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SummaryStrip totals={totals} />
            {blocks.map((block) => (
              <div key={block.instanceId}>
                <InstanceSection block={block} />
              </div>
            ))}
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
