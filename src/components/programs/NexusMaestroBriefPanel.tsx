// MW3 · Nexus Maestro Brief Panel.
//
// Server component. Pure presentation layer over the MW2 deterministic
// workshop-readiness read model. Renders one `WorkshopReadiness` record
// as the Client Maestro / Nexus pre-workshop brief surface.
//
// No 'use client', no useState, no useEffect, no fetch, no Date.now,
// no Math.random, no model calls, no live workshop ingestion. The
// panel is a faithful presentation of the deterministic record passed
// in as `readiness` — nothing is invented.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/lib/auth/**
//   - supabase/**

import {
  type WorkshopEvidenceRequest,
  type WorkshopOutput,
  type WorkshopParticipantRole,
  type WorkshopReadiness,
} from '@/lib/programs/workshop-readiness';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  TYPE,
} from '@/lib/design/abarva-theme';

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

export interface NexusMaestroBriefPanelProps {
  readiness: WorkshopReadiness;
}

export function NexusMaestroBriefPanel({
  readiness,
}: NexusMaestroBriefPanelProps): JSX.Element {
  return (
    <section
      data-mw3="nexus-maestro-brief"
      data-workshop-id={readiness.id}
      data-workshop-type={readiness.type}
      aria-label="Nexus Maestro pre-workshop brief"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderLeft: `3px solid ${COLORS.navy}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.lg}px ${SPACING.xl}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <Header readiness={readiness} />
      <NextWorkshopSection readiness={readiness} />
      <ObjectiveSection readiness={readiness} />
      <AttendeesSection
        label="Required attendees"
        items={readiness.requiredAttendees}
        toneFg={COLORS.navy}
        emptyFallback="(not yet wired in MW2 read model)"
      />
      <AttendeesSection
        label="Optional SMEs"
        items={readiness.optionalSmes}
        toneFg={COLORS.muted}
        emptyFallback="(no SMEs surfaced for this workshop type)"
      />
      <SimpleListSection
        label="Pre-read"
        items={readiness.preReadList}
        emptyFallback="(not yet wired in MW2 read model)"
      />
      <SimpleListSection
        label="Questions to ask"
        items={readiness.questionsToAsk}
        emptyFallback="(not yet wired in MW2 read model)"
      />
      <SimpleListSection
        label="Likely tensions"
        items={readiness.likelyTensions}
        emptyFallback="(not yet wired in MW2 read model)"
      />
      <SimpleListSection
        label="Decisions needed"
        items={readiness.decisionsNeeded}
        emptyFallback="(not yet wired in MW2 read model)"
      />
      <EvidenceSection items={readiness.evidenceToCapture} />
      <ExpectedOutputsSection items={readiness.expectedOutputs} />
      <NexusBriefSection brief={readiness.nexusPreparationBrief} />
      <StewardGateSection implication={readiness.stewardGateImplication} />
      <Disclaimer />
    </section>
  );
}

export default NexusMaestroBriefPanel;

// ---------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------

function Header({ readiness }: { readiness: WorkshopReadiness }) {
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        borderBottom: BORDER.hairlineSoft,
        paddingBottom: SPACING.md,
      }}
    >
      <span
        style={{
          ...TYPE.eyebrow,
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        Workshop brief · {readiness.programCode}
      </span>
      <h2
        style={{
          ...TYPE.h2,
          margin: 0,
        }}
      >
        {readiness.tenantName} · {readiness.title}
      </h2>
    </header>
  );
}

function NextWorkshopSection({ readiness }: { readiness: WorkshopReadiness }) {
  const phaseLabel = `Phase ${readiness.objective.ties_to_phase_spec}`;
  return (
    <SectionShell label="Next workshop">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: SPACING.md,
        }}
      >
        <Metric label="Title" value={readiness.title} />
        <Metric label="Type" value={workshopTypeLabel(readiness.type)} />
        <Metric label="Phase" value={phaseLabel} />
        <Metric
          label="Recommended for gate"
          value={
            readiness.objective.ties_to_gate
              ? readiness.objective.ties_to_gate
              : 'No canonical hard gate at risk'
          }
        />
      </div>
      <p
        style={{
          ...TYPE.body,
          margin: 0,
          color: COLORS.body,
        }}
      >
        Why now: {readiness.stewardGateImplication}
      </p>
    </SectionShell>
  );
}

function ObjectiveSection({ readiness }: { readiness: WorkshopReadiness }) {
  return (
    <SectionShell label="Objective">
      <p style={{ ...TYPE.body, margin: 0, color: COLORS.ink }}>
        {readiness.objective.text}
      </p>
    </SectionShell>
  );
}

function AttendeesSection({
  label,
  items,
  toneFg,
  emptyFallback,
}: {
  label: string;
  items: ReadonlyArray<{ role: WorkshopParticipantRole; reason: string }>;
  toneFg: string;
  emptyFallback: string;
}) {
  return (
    <SectionShell label={label}>
      {items.length === 0 ? (
        <FallbackLine text={emptyFallback} />
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
          {items.map((entry, idx) => (
            <li
              key={`${label}-${entry.role}-${idx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                gap: SPACING.md,
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: toneFg,
                }}
              >
                {participantRoleLabel(entry.role)}
              </span>
              <span style={{ ...TYPE.body, color: COLORS.body }}>
                {entry.reason}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function SimpleListSection({
  label,
  items,
  emptyFallback,
}: {
  label: string;
  items: ReadonlyArray<string>;
  emptyFallback: string;
}) {
  return (
    <SectionShell label={label}>
      {items.length === 0 ? (
        <FallbackLine text={emptyFallback} />
      ) : (
        <ul
          style={{
            listStyle: 'disc',
            paddingLeft: SPACING.lg,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          {items.map((item, idx) => (
            <li
              key={`${label}-${idx}`}
              style={{ ...TYPE.body, color: COLORS.body }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function EvidenceSection({
  items,
}: {
  items: ReadonlyArray<WorkshopEvidenceRequest>;
}) {
  return (
    <SectionShell label="Evidence to capture">
      {items.length === 0 ? (
        <FallbackLine text="(not yet wired in MW2 read model)" />
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
          {items.map((entry, idx) => {
            const tone = entry.required
              ? { fg: COLORS.navy, bg: COLORS.navySoft }
              : { fg: COLORS.muted, bg: COLORS.surface2 };
            return (
              <li
                key={`evidence-${idx}-${entry.label}`}
                style={{
                  border: BORDER.hairlineSoft,
                  borderRadius: RADIUS.md,
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SPACING.xs,
                  background: COLORS.surface,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.sm,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: tone.fg,
                      background: tone.bg,
                      padding: '2px 8px',
                      borderRadius: RADIUS.pill,
                    }}
                  >
                    {entry.required ? 'Required' : 'Optional'}
                  </span>
                  <span
                    style={{
                      ...TYPE.body,
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    {entry.label}
                  </span>
                </div>
                <span style={{ ...TYPE.caption, color: COLORS.muted }}>
                  {entry.reason}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}

function ExpectedOutputsSection({
  items,
}: {
  items: ReadonlyArray<WorkshopOutput>;
}) {
  return (
    <SectionShell label="Expected outputs">
      {items.length === 0 ? (
        <FallbackLine text="(not yet wired in MW2 read model)" />
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
          {items.map((entry, idx) => (
            <li
              key={`output-${idx}-${entry.kind}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                gap: SPACING.md,
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: COLORS.navy,
                }}
              >
                {outputKindLabel(entry.kind)}
              </span>
              <span style={{ ...TYPE.body, color: COLORS.body }}>
                {entry.description}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function NexusBriefSection({ brief }: { brief: string }) {
  return (
    <SectionShell label="Nexus preparation brief">
      <p
        style={{
          ...TYPE.body,
          margin: 0,
          color: COLORS.ink,
          background: COLORS.navySoft,
          border: BORDER.hairlineSoft,
          borderRadius: RADIUS.md,
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          whiteSpace: 'pre-line',
        }}
      >
        {brief}
      </p>
    </SectionShell>
  );
}

function StewardGateSection({ implication }: { implication: string }) {
  return (
    <SectionShell label="Steward gate implication">
      <p
        style={{
          ...TYPE.body,
          margin: 0,
          color: COLORS.body,
          fontStyle: 'italic',
        }}
      >
        {implication}
      </p>
    </SectionShell>
  );
}

function Disclaimer() {
  return (
    <p
      style={{
        ...TYPE.caption,
        margin: 0,
        color: COLORS.mutedSoft,
        fontStyle: 'italic',
        borderTop: BORDER.hairlineSoft,
        paddingTop: SPACING.md,
      }}
    >
      Live workshop ingestion is not wired; this brief is rendered from
      the deterministic workshop readiness read model.
    </p>
  );
}

// ---------------------------------------------------------------------
// Sub-primitives
// ---------------------------------------------------------------------

function SectionShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-mw3-section={slugifyLabel(label)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <span style={{ ...TYPE.eyebrow, color: COLORS.muted }}>{label}</span>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        {label}
      </span>
      <span
        style={{
          ...TYPE.body,
          fontWeight: 600,
          color: COLORS.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function FallbackLine({ text }: { text: string }) {
  return (
    <span
      style={{
        ...TYPE.caption,
        color: COLORS.mutedSoft,
        fontStyle: 'italic',
      }}
    >
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------

function workshopTypeLabel(type: WorkshopReadiness['type']): string {
  switch (type) {
    case 'current_state_discovery':
      return 'Current-state discovery';
    case 'use_case_framing':
      return 'Use-case framing';
    case 'data_foundation_assessment':
      return 'Data foundation assessment';
    case 'value_framing':
      return 'Value framing';
    case 'governance_risk_review':
      return 'Governance and risk review';
    case 'architecture_solution_design':
      return 'Architecture and solution design';
    case 'operating_model_alignment':
      return 'Operating model alignment';
    case 'adoption_change_readiness':
      return 'Adoption and change readiness';
    case 'executive_decision_review':
      return 'Executive decision review';
  }
}

function participantRoleLabel(role: WorkshopParticipantRole): string {
  switch (role) {
    case 'client_maestro':
      return 'Client Maestro';
    case 'executive_sponsor':
      return 'Executive sponsor';
    case 'business_owner':
      return 'Business owner';
    case 'technical_lead':
      return 'Technical lead';
    case 'data_owner':
      return 'Data owner';
    case 'compliance_reviewer':
      return 'Compliance reviewer';
    case 'abarva_sme':
      return 'AbarVa SME';
    case 'abarva_consultant':
      return 'AbarVa consultant';
  }
}

function outputKindLabel(kind: WorkshopOutput['kind']): string {
  switch (kind) {
    case 'decision_record':
      return 'Decision record';
    case 'updated_charter':
      return 'Updated charter';
    case 'updated_design_pack':
      return 'Updated design pack';
    case 'value_ledger_entry':
      return 'Value ledger entry';
    case 'risk_register_entry':
      return 'Risk register entry';
    case 'evidence_capture':
      return 'Evidence capture';
    case 'next_session_recommendation':
      return 'Next-session recommendation';
    case 'executive_readout':
      return 'Executive readout';
  }
}

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
