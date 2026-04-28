// PDEL8 · Deliverable Evidence Trace Panel.
//
// Server Component that renders the deterministic evidence trace for a
// program-deliverable artifact. Reads only from the prebuilt
// DeliverableEvidenceTrace view-model.
//
// No state, no effects, no model calls, no Date.now reads, no fetches.
// Approval implication is advisory only — the panel never flips an
// approval status.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import { EvidenceChip } from '@/components/abarva/EvidenceChip';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';
import type {
  DeliverableEvidenceApprovalImplication,
  DeliverableEvidenceClaim,
  DeliverableEvidenceGap,
  DeliverableEvidenceSource,
  DeliverableEvidenceTrace,
  DeliverableEvidenceTraceStatus,
} from '@/lib/programs/deliverable-evidence-trace';

export interface DeliverableEvidenceTracePanelProps {
  trace: DeliverableEvidenceTrace;
}

export function DeliverableEvidenceTracePanel({
  trace,
}: DeliverableEvidenceTracePanelProps) {
  return (
    <section
      data-deliverable-evidence-trace-panel="pdel8"
      data-trace-status={trace.status}
      aria-label="Deliverable evidence trace"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        fontFamily: FONT.body,
        color: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PanelHeader trace={trace} />
      <div
        style={{
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        <SummaryStrip trace={trace} />
        <ClaimGroup
          label="Supported"
          tone="navy"
          claims={trace.supportedClaims}
          emptyHint="No matching evidence has reached usable_as_evidence."
          dataKey="supported"
        />
        <ClaimGroup
          label="Partially supported"
          tone="amber"
          claims={trace.partiallySupportedClaims}
          emptyHint="No partial-grade evidence (cited / quality_checked) is matched."
          dataKey="partial"
        />
        <ClaimGroup
          label="Unsupported"
          tone="muted"
          claims={trace.unsupportedClaims}
          emptyHint="No intermediate-state evidence is matched."
          dataKey="unsupported"
        />
        <ClaimGroup
          label="Stale"
          tone="amber"
          claims={trace.staleClaims}
          emptyHint="No matching evidence is flagged stale."
          dataKey="stale"
        />
        <ClaimGroup
          label="Blocked"
          tone="red"
          claims={trace.blockedClaims}
          emptyHint="No matching evidence is blocked."
          dataKey="blocked"
        />
        <MissingGapsBlock gaps={trace.gaps} />
        <SourcesBlock sources={trace.sources} />
        <ApprovalImplicationBlock implication={trace.approvalImplication} />
      </div>
      <footer
        style={{
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          borderTop: BORDER.hairlineSoft,
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
        data-deliverable-evidence-trace-source="deterministic_evidence_trace_seed"
      >
        {trace.sourceCaption}
      </footer>
    </section>
  );
}

// --- Header ---------------------------------------------------------

function PanelHeader({ trace }: { trace: DeliverableEvidenceTrace }) {
  return (
    <header
      style={{
        padding: `${SPACING.md}px ${SPACING.lg}px`,
        borderBottom: BORDER.hairlineSoft,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          PDEL8 · Deliverable evidence trace
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
          {trace.artifactTitle}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
          }}
        >
          {trace.programCode} · {trace.tenantKey} · {trace.phaseBucket}
        </span>
      </div>
      <TraceStatusPill status={trace.status} />
    </header>
  );
}

function TraceStatusPill({ status }: { status: DeliverableEvidenceTraceStatus }) {
  const tone = traceStatusTone(status);
  return (
    <span
      data-trace-status-pill={status}
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function traceStatusTone(status: DeliverableEvidenceTraceStatus): {
  fg: string;
  bg: string;
  border: string;
} {
  if (status === 'supported') {
    return {
      fg: COLORS.navy,
      bg: COLORS.navySoft,
      border: `${COLORS.navy}33`,
    };
  }
  if (status === 'blocked') {
    return {
      fg: COLORS.red,
      bg: COLORS.redSoft,
      border: `${COLORS.red}33`,
    };
  }
  if (status === 'partially_supported' || status === 'stale') {
    return {
      fg: COLORS.amber,
      bg: COLORS.amberSoft,
      border: `${COLORS.amber}33`,
    };
  }
  return {
    fg: COLORS.muted,
    bg: COLORS.surface2,
    border: COLORS.borderSoft,
  };
}

// --- Summary --------------------------------------------------------

function SummaryStrip({ trace }: { trace: DeliverableEvidenceTrace }) {
  const cells: ReadonlyArray<{ key: string; label: string; value: number }> = [
    { key: 'supported', label: 'Supported', value: trace.summary.supportedCount },
    {
      key: 'partial',
      label: 'Partial',
      value: trace.summary.partiallySupportedCount,
    },
    {
      key: 'unsupported',
      label: 'Unsupported',
      value: trace.summary.unsupportedCount,
    },
    { key: 'stale', label: 'Stale', value: trace.summary.staleCount },
    { key: 'blocked', label: 'Blocked', value: trace.summary.blockedCount },
    {
      key: 'sources',
      label: 'Sources',
      value: trace.summary.sourceArtifactCount,
    },
  ];
  return (
    <div
      role="group"
      aria-label="Evidence trace summary"
      data-deliverable-evidence-trace-summary="true"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: SPACING.sm,
      }}
    >
      {cells.map((cell) => (
        <div
          key={cell.key}
          data-summary-cell={cell.key}
          style={{
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            background: COLORS.surface2,
            border: BORDER.hairlineSoft,
            borderRadius: RADIUS.md,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
            }}
          >
            {cell.label}
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
            {cell.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Claim group ----------------------------------------------------

type ToneKey = 'navy' | 'amber' | 'red' | 'muted';

function ClaimGroup({
  label,
  tone,
  claims,
  emptyHint,
  dataKey,
}: {
  label: string;
  tone: ToneKey;
  claims: readonly DeliverableEvidenceClaim[];
  emptyHint: string;
  dataKey: string;
}) {
  const toneColor = (() => {
    switch (tone) {
      case 'navy':
        return COLORS.navy;
      case 'amber':
        return COLORS.amber;
      case 'red':
        return COLORS.red;
      default:
        return COLORS.muted;
    }
  })();
  return (
    <section
      aria-label={`${label} evidence claims`}
      data-deliverable-evidence-claim-group={dataKey}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: toneColor,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: COLORS.mutedSoft,
          }}
        >
          {claims.length}
        </span>
      </header>
      {claims.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontStyle: 'italic',
            color: COLORS.muted,
          }}
        >
          {emptyHint}
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
          }}
        >
          {claims.map((claim) => (
            <ClaimRow key={claim.evidenceId} claim={claim} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ClaimRow({ claim }: { claim: DeliverableEvidenceClaim }) {
  return (
    <li
      data-evidence-claim-id={claim.evidenceId}
      data-evidence-claim-bucket={claim.bucket}
      data-evidence-claim-state={claim.ledgerState}
      style={{
        padding: `${SPACING.sm + 2}px ${SPACING.md}px`,
        background: COLORS.surface,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <EvidenceChip state={ledgerStateForChip(claim.ledgerState)} />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.10em',
            color: COLORS.muted,
          }}
        >
          {claim.evidenceId}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
          }}
        >
          {claim.scope} · {claim.citationKind}
        </span>
      </div>
      <span style={{ fontSize: 13, color: COLORS.body, lineHeight: 1.45 }}>
        {claim.claimText}
      </span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          color: COLORS.mutedSoft,
        }}
      >
        Citation · {claim.citationLocator}
      </span>
      {claim.blockReason !== undefined ? (
        <span
          data-evidence-claim-block-reason="true"
          style={{
            fontFamily: FONT.body,
            fontSize: 11,
            color: COLORS.red,
            lineHeight: 1.4,
          }}
        >
          Blocked · {claim.blockReason}
        </span>
      ) : null}
      {claim.staleNote !== undefined ? (
        <span
          data-evidence-claim-stale-note="true"
          style={{
            fontFamily: FONT.body,
            fontSize: 11,
            color: COLORS.amber,
            lineHeight: 1.4,
          }}
        >
          Stale · {claim.staleNote}
        </span>
      ) : null}
    </li>
  );
}

function ledgerStateForChip(
  state: DeliverableEvidenceClaim['ledgerState'],
):
  | 'usable_as_evidence'
  | 'cited'
  | 'quality_checked'
  | 'blocked'
  | 'partial'
  | 'not_seeded' {
  if (
    state === 'usable_as_evidence' ||
    state === 'cited' ||
    state === 'quality_checked' ||
    state === 'blocked'
  ) {
    return state;
  }
  // loaded / parsed / indexed / classified / scoped → partial (intermediate).
  return 'partial';
}

// --- Missing / structural gaps --------------------------------------

function MissingGapsBlock({
  gaps,
}: {
  gaps: readonly DeliverableEvidenceGap[];
}) {
  if (gaps.length === 0) return null;
  return (
    <section
      aria-label="Evidence gaps"
      data-deliverable-evidence-gap-block="true"
      style={{
        padding: `${SPACING.sm + 2}px ${SPACING.md}px`,
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amber}33`,
        borderRadius: RADIUS.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.amber,
        }}
      >
        Missing / unresolved gaps · {gaps.length}
      </span>
      <ul
        style={{
          listStyle: 'disc',
          paddingLeft: 18,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {gaps.map((gap, idx) => (
          <li
            key={`${gap.kind}-${idx}`}
            data-evidence-gap-kind={gap.kind}
            style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.45 }}
          >
            {gap.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Sources --------------------------------------------------------

function SourcesBlock({
  sources,
}: {
  sources: readonly DeliverableEvidenceSource[];
}) {
  return (
    <section
      aria-label="Source artifacts"
      data-deliverable-evidence-sources="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          Source artifacts
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: COLORS.mutedSoft,
          }}
        >
          {sources.length}
        </span>
      </header>
      {sources.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontStyle: 'italic',
            color: COLORS.muted,
          }}
        >
          No source artifacts contribute evidence to this deliverable today.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          {sources.map((source) => (
            <li
              key={source.sourceArtifactId}
              data-evidence-source-id={source.sourceArtifactId}
              data-evidence-source-usable={source.hasUsableEntry ? 'true' : 'false'}
              data-evidence-source-blocked={
                source.hasBlockedEntry ? 'true' : 'false'
              }
              data-evidence-source-stale={source.hasStaleEntry ? 'true' : 'false'}
              style={{
                padding: `${SPACING.xs + 2}px ${SPACING.md}px`,
                background: COLORS.surface,
                border: BORDER.hairlineSoft,
                borderRadius: RADIUS.md,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: 500,
                  color: COLORS.ink,
                }}
              >
                {source.sourceArtifactId}
              </span>
              <SourceUsabilityChip source={source} />
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: COLORS.mutedSoft,
                }}
              >
                {source.entryIds.length} entry
                {source.entryIds.length === 1 ? '' : 'ies'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SourceUsabilityChip({
  source,
}: {
  source: DeliverableEvidenceSource;
}) {
  const label = (() => {
    if (source.hasBlockedEntry && !source.hasUsableEntry) return 'blocked';
    if (source.hasUsableEntry && (source.hasBlockedEntry || source.hasStaleEntry))
      return 'partial';
    if (source.hasUsableEntry) return 'usable_as_evidence';
    if (source.hasStaleEntry) return 'partial';
    return 'partial';
  })();
  return <EvidenceChip state={label} />;
}

// --- Approval implication ------------------------------------------

function ApprovalImplicationBlock({
  implication,
}: {
  implication: DeliverableEvidenceApprovalImplication;
}) {
  const tone = recommendationTone(implication.recommendation);
  return (
    <section
      aria-label="Approval implication (advisory)"
      data-deliverable-evidence-approval-implication={implication.recommendation}
      data-advisory-only={implication.advisoryOnly ? 'true' : 'false'}
      style={{
        padding: SPACING.md,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: RADIUS.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: tone.fg,
          }}
        >
          Approval implication · advisory
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: tone.fg,
            background: COLORS.card,
            border: `1px solid ${tone.border}`,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
          }}
        >
          {implication.recommendation.replace(/_/g, ' ')}
        </span>
      </header>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: COLORS.body,
          lineHeight: 1.5,
        }}
      >
        {implication.rationale}
      </p>
      {implication.preconditions.length > 0 ? (
        <ul
          style={{
            listStyle: 'disc',
            paddingLeft: 18,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {implication.preconditions.map((line, idx) => (
            <li
              key={idx}
              data-approval-precondition-index={idx}
              style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.45 }}
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        Advisory only · this panel does not flip approval state.
      </span>
    </section>
  );
}

function recommendationTone(
  recommendation: DeliverableEvidenceApprovalImplication['recommendation'],
): { fg: string; bg: string; border: string } {
  if (recommendation === 'ready_for_review') {
    return {
      fg: COLORS.navy,
      bg: COLORS.navySoft,
      border: `${COLORS.navy}33`,
    };
  }
  if (recommendation === 'blocked_until_evidence_resolved') {
    return {
      fg: COLORS.red,
      bg: COLORS.redSoft,
      border: `${COLORS.red}33`,
    };
  }
  if (recommendation === 'no_supporting_evidence') {
    return {
      fg: COLORS.muted,
      bg: COLORS.surface2,
      border: COLORS.borderSoft,
    };
  }
  return {
    fg: COLORS.amber,
    bg: COLORS.amberSoft,
    border: `${COLORS.amber}33`,
  };
}
