// PROG13 · Program Deliverables × Evidence Trace Panel.
//
// Client component (no effects, no fetches, no state) that renders the
// deterministic deliverables-by-phase view with version state and
// evidence state chips, missing-input bullets, and an advisory approval
// implication line per row.
//
// No fake downloads, no fake approvals, no model-generated content
// claims, no model calls. The current deliverable is a deterministic
// highlight only — clicking a row does nothing, by design.

'use client';

import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';
import {
  buildProgramDeliverablesEvidenceView,
  type DeliverableEntry,
  type DeliverableEvidenceState,
  type DeliverablePhaseGroup,
  type DeliverableVersionState,
} from '@/lib/programs/program-deliverables-evidence-view';

export interface ProgramDeliverablesEvidencePanelProps {
  programLabel?: string;
}

export function ProgramDeliverablesEvidencePanel({
  programLabel,
}: ProgramDeliverablesEvidencePanelProps) {
  const view = buildProgramDeliverablesEvidenceView({ programLabel });

  const currentDeliverable = findCurrentDeliverable(view.phaseGroups);

  return (
    <section
      data-program-deliverables-evidence-panel="prog13"
      data-program-label={view.programLabel}
      aria-label="Program deliverables · evidence trace"
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
      <PanelHeader
        programLabel={view.programLabel}
        totalDeliverables={view.totalDeliverables}
        evidenceCoveragePercent={view.evidenceCoveragePercent}
        currentDeliverableLabel={currentDeliverable?.label ?? null}
      />
      <div
        style={{
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xl,
        }}
      >
        {view.phaseGroups.map((group) => (
          <PhaseGroupSection key={group.phaseId} group={group} />
        ))}
      </div>
      <footer
        style={{
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          borderTop: BORDER.hairlineSoft,
          background: COLORS.surface,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontStyle: 'italic',
            color: COLORS.muted,
            lineHeight: 1.5,
          }}
        >
          {view.caveat}
        </p>
        <p
          style={{
            margin: 0,
            marginTop: SPACING.xs,
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
          }}
        >
          Generated · {view.generatedAt}
        </p>
      </footer>
    </section>
  );
}

// ---------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------

function PanelHeader({
  programLabel,
  totalDeliverables,
  evidenceCoveragePercent,
  currentDeliverableLabel,
}: {
  programLabel: string;
  totalDeliverables: number;
  evidenceCoveragePercent: number;
  currentDeliverableLabel: string | null;
}) {
  return (
    <header
      style={{
        padding: SPACING.lg,
        borderBottom: BORDER.hairlineSoft,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
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
        Deliverables · Evidence trace
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 600,
          color: COLORS.ink,
          letterSpacing: '-0.005em',
        }}
      >
        Deliverables by phase
      </h2>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: '0.06em',
          color: COLORS.mutedSoft,
        }}
      >
        {programLabel}
      </span>
      <div
        style={{
          marginTop: SPACING.xs,
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
        }}
      >
        <StatChip
          label="Total deliverables"
          value={String(totalDeliverables)}
        />
        <StatChip
          label="Evidence coverage"
          value={`${evidenceCoveragePercent}%`}
        />
        {currentDeliverableLabel !== null ? (
          <StatChip label="Current focus" value={currentDeliverableLabel} />
        ) : null}
      </div>
      <ProgressBar percent={evidenceCoveragePercent} />
    </header>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
        padding: `${SPACING.xs}px ${SPACING.sm + 2}px`,
        background: COLORS.surface2,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        fontSize: 12,
        color: COLORS.body,
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
        {label}
      </span>
      <span style={{ fontWeight: 600, color: COLORS.ink }}>{value}</span>
    </span>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label="Evidence coverage"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      data-evidence-coverage-bar="true"
      style={{
        marginTop: SPACING.xs,
        width: '100%',
        height: 6,
        background: COLORS.border,
        borderRadius: RADIUS.pill,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          background: COLORS.navy,
          borderRadius: RADIUS.pill,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Phase group
// ---------------------------------------------------------------------

function PhaseGroupSection({ group }: { group: DeliverablePhaseGroup }) {
  return (
    <section
      data-phase-group={group.phaseId}
      data-phase-order={group.order}
      aria-label={`${group.phaseLabel} phase deliverables`}
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
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            background: COLORS.surface2,
            border: BORDER.hairlineSoft,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
          }}
        >
          Phase {group.order}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {group.phaseLabel}
        </h3>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: COLORS.mutedSoft,
          }}
        >
          {group.deliverables.length}
        </span>
      </header>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {group.deliverables.map((deliverable) => (
          <DeliverableRow
            key={deliverable.deliverableId}
            deliverable={deliverable}
          />
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------

function DeliverableRow({ deliverable }: { deliverable: DeliverableEntry }) {
  const showDetails =
    deliverable.isCurrent ||
    deliverable.missingInputs.length > 0 ||
    deliverable.approvalImplication.length > 0;

  return (
    <li
      data-deliverable-id={deliverable.deliverableId}
      data-deliverable-current={deliverable.isCurrent ? 'true' : 'false'}
      data-deliverable-version-state={deliverable.versionState}
      data-deliverable-evidence-state={deliverable.evidenceState}
      style={{
        background: deliverable.isCurrent ? '#FAFAF9' : COLORS.card,
        border: BORDER.hairlineSoft,
        borderLeft: deliverable.isCurrent
          ? `3px solid ${COLORS.navy}`
          : BORDER.hairlineSoft,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm + 2}px ${SPACING.md}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
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
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.ink,
          }}
        >
          {deliverable.label}
        </span>
        <VersionLabelChip versionLabel={deliverable.versionLabel} />
        <VersionStateChip state={deliverable.versionState} />
        <EvidenceStateChip state={deliverable.evidenceState} />
        {deliverable.isCurrent ? <CurrentChip /> : null}
      </div>
      {showDetails ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
            marginTop: SPACING.xs,
          }}
        >
          {deliverable.missingInputs.length > 0 ? (
            <div
              data-deliverable-missing-inputs="true"
              style={{
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
                  color: COLORS.muted,
                }}
              >
                Missing inputs
              </span>
              <ul
                style={{
                  listStyle: 'disc',
                  margin: 0,
                  paddingLeft: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {deliverable.missingInputs.map((input, idx) => (
                  <li
                    key={`${deliverable.deliverableId}-missing-${idx}`}
                    style={{
                      fontSize: 12,
                      color: COLORS.body,
                      lineHeight: 1.45,
                    }}
                  >
                    {input}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {deliverable.approvalImplication.length > 0 ? (
            <span
              data-deliverable-approval-implication="true"
              style={{
                fontStyle: 'italic',
                fontSize: 12,
                color: COLORS.muted,
                lineHeight: 1.5,
              }}
            >
              {deliverable.approvalImplication}
            </span>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------
// Chips
// ---------------------------------------------------------------------

function VersionLabelChip({ versionLabel }: { versionLabel: string }) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: '0.06em',
        color: COLORS.muted,
        background: COLORS.surface2,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
      }}
    >
      {versionLabel}
    </span>
  );
}

function VersionStateChip({ state }: { state: DeliverableVersionState }) {
  const tone = versionStateTone(state);
  return (
    <span
      data-version-state-chip={state}
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        textDecoration: state === 'superseded' ? 'line-through' : 'none',
      }}
    >
      {state.replace(/-/g, ' ')}
    </span>
  );
}

function versionStateTone(state: DeliverableVersionState): {
  fg: string;
  bg: string;
  border: string;
} {
  if (state === 'approved') {
    return {
      fg: COLORS.navy,
      bg: COLORS.navySoft,
      border: `${COLORS.navy}33`,
    };
  }
  if (state === 'in-review') {
    return {
      fg: COLORS.amber,
      bg: COLORS.amberSoft,
      border: `${COLORS.amber}33`,
    };
  }
  if (state === 'superseded') {
    return {
      fg: COLORS.mutedSoft,
      bg: COLORS.surface2,
      border: COLORS.borderSoft,
    };
  }
  // draft
  return {
    fg: COLORS.muted,
    bg: COLORS.surface2,
    border: COLORS.borderSoft,
  };
}

function EvidenceStateChip({ state }: { state: DeliverableEvidenceState }) {
  const tone = evidenceStateTone(state);
  return (
    <span
      data-evidence-state-chip={state}
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
      }}
    >
      Evidence · {state}
    </span>
  );
}

function evidenceStateTone(state: DeliverableEvidenceState): {
  fg: string;
  bg: string;
  border: string;
} {
  if (state === 'complete') {
    return {
      fg: COLORS.navy,
      bg: COLORS.navySoft,
      border: `${COLORS.navy}33`,
    };
  }
  if (state === 'partial') {
    return {
      fg: COLORS.amber,
      bg: COLORS.amberSoft,
      border: `${COLORS.amber}33`,
    };
  }
  // missing
  return {
    fg: COLORS.red,
    bg: COLORS.redSoft,
    border: `${COLORS.red}33`,
  };
}

function CurrentChip() {
  return (
    <span
      data-current-chip="true"
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLORS.navy,
        background: COLORS.navySoft,
        border: `1px solid ${COLORS.navy}33`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
      }}
    >
      Current
    </span>
  );
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function findCurrentDeliverable(
  groups: readonly DeliverablePhaseGroup[],
): DeliverableEntry | null {
  for (const group of groups) {
    for (const deliverable of group.deliverables) {
      if (deliverable.isCurrent) return deliverable;
    }
  }
  return null;
}
