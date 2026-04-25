// PW1 · Program Workshop Mode shell.
//
// Server component. Three-region layout following PF2 (Program Phase
// Workspace Contract):
//
//   - Left journey rail (<=220px) - canonical six-phase rail with
//     completed / current / pending status.
//   - Center Nexus workshop canvas (~70%) - header, workshop title,
//     objective, agenda, attendees, pre-read, questions, tensions,
//     decisions, evidence to capture, expected outputs.
//   - Right compact context panel (<=320px) - evidence usable count,
//     gate implication, Steward verdict, honest "live ingestion not
//     wired" disclaimer, and two empty placeholders for future PW2+
//     surfaces.
//
// No client interactivity (no useState / useEffect). No fetch, no
// Date.now / Math.random / new Date. No imports from
// src/lib/nexus/**, src/lib/agent/**, src/lib/source/**,
// src/lib/auth/**, supabase/**, or src/lib/programs/mock.ts.
//
// All copy is composed deterministically from the view-model passed in.
// The component is rendered inside ProgramCanonicalDetail and never
// fabricates state of its own.

import type { ProgramWorkshopModeView } from '@/lib/programs/program-workshop-mode-view';

const COLORS = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#525866',
  mutedSoft: '#8B91A1',
  border: '#E8E6E1',
  borderSoft: '#F0EEEA',
  card: '#FFFFFF',
  surface: '#FBFAF7',
  surface2: '#F5F3EE',
  navy: '#1B2B5C',
  navySoft: 'rgba(27, 43, 92, 0.10)',
  amber: '#B45309',
  amberSoft: 'rgba(180, 83, 9, 0.10)',
} as const;

const FONT_BODY = 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = 'JetBrains Mono, SFMono-Regular, Menlo, monospace';

export interface ProgramWorkshopModeProps {
  view: ProgramWorkshopModeView;
}

export function ProgramWorkshopMode({ view }: ProgramWorkshopModeProps) {
  const { phase, nextWorkshop, agenda, rightContext, leftRail, honestDisclaimer } = view;

  return (
    <section
      data-program-workshop-mode="pw1"
      aria-label="Program workshop mode"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 0,
        fontFamily: FONT_BODY,
        color: COLORS.ink,
        overflow: 'hidden',
      }}
    >
      {/* Header band */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '14px 18px',
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          Program workshop mode · PW1 shell
        </span>
        <span style={{ fontSize: 13, color: COLORS.body }}>
          {view.programId} · P{phase.ordinal} {phase.name}
        </span>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 220px) minmax(0, 1fr) minmax(240px, 320px)',
          gap: 0,
        }}
      >
        {/* Left journey rail */}
        <LeftJourneyRail phases={leftRail.phases} />

        {/* Center canvas */}
        <CenterCanvas
          phaseName={phase.name}
          phaseOrdinal={phase.ordinal}
          nextWorkshop={nextWorkshop}
          agenda={agenda}
        />

        {/* Right context panel */}
        <RightContextPanel
          evidenceUsable={rightContext.evidenceUsable}
          gateImplication={rightContext.gateImplication}
          gatekeeperAgent={rightContext.gatekeeperAgent}
          honestDisclaimer={honestDisclaimer}
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Left journey rail
// ---------------------------------------------------------------------

function LeftJourneyRail({
  phases,
}: {
  phases: ProgramWorkshopModeView['leftRail']['phases'];
}) {
  return (
    <aside
      aria-label="Program journey rail"
      data-region="left-journey-rail"
      style={{
        borderRight: `1px solid ${COLORS.border}`,
        background: COLORS.surface2,
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxWidth: 220,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Journey
      </span>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {phases.map((p) => {
          const tone = phaseTone(p.status);
          return (
            <li
              key={`p${p.ordinal}`}
              data-phase-ordinal={p.ordinal}
              data-phase-status={p.status}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: tone.bg,
                border: `1px solid ${tone.border}`,
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  color: tone.accent,
                  letterSpacing: '0.08em',
                }}
              >
                P{p.ordinal}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: p.status === 'current' ? 600 : 500,
                  color: tone.fg,
                  lineHeight: 1.4,
                }}
              >
                {p.name}
              </span>
            </li>
          );
        })}
      </ol>
      <span
        style={{
          marginTop: 6,
          fontSize: 10,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
          lineHeight: 1.45,
        }}
      >
        Canonical six-phase rail. Status is deterministic from seed.
      </span>
    </aside>
  );
}

function phaseTone(status: 'completed' | 'current' | 'pending') {
  switch (status) {
    case 'current':
      return {
        bg: COLORS.navySoft,
        border: 'rgba(27, 43, 92, 0.30)',
        accent: COLORS.navy,
        fg: COLORS.ink,
      };
    case 'completed':
      return {
        bg: COLORS.borderSoft,
        border: COLORS.border,
        accent: COLORS.muted,
        fg: COLORS.body,
      };
    case 'pending':
      return {
        bg: COLORS.card,
        border: COLORS.borderSoft,
        accent: COLORS.mutedSoft,
        fg: COLORS.muted,
      };
  }
}

// ---------------------------------------------------------------------
// Center canvas
// ---------------------------------------------------------------------

function CenterCanvas({
  phaseName,
  phaseOrdinal,
  nextWorkshop,
  agenda,
}: {
  phaseName: string;
  phaseOrdinal: number;
  nextWorkshop: ProgramWorkshopModeView['nextWorkshop'];
  agenda: string[];
}) {
  if (nextWorkshop === null) {
    return (
      <main
        aria-label="Nexus workshop canvas"
        data-region="center-canvas"
        style={{
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
          }}
        >
          Nexus · workshop canvas
        </span>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
          No workshop is recommended for this program in P{phaseOrdinal} {phaseName}.
          Workshop ingestion is not wired in PW1; live capture lands in PW2.
        </p>
      </main>
    );
  }

  return (
    <main
      aria-label="Nexus workshop canvas"
      data-region="center-canvas"
      style={{
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {/* Header: phase + workshop title + objective */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          Nexus · workshop canvas · P{phaseOrdinal} {phaseName}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT_BODY,
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.3,
          }}
        >
          {nextWorkshop.title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: COLORS.body,
            lineHeight: 1.6,
          }}
        >
          {nextWorkshop.objective.text}
        </p>
      </header>

      {/* Agenda */}
      <CanvasBlock label="Agenda">
        {agenda.length === 0 ? (
          <EmptyLine text="No agenda items composed for this workshop." />
        ) : (
          <ul
            style={{
              listStyle: 'disc',
              paddingLeft: 18,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {agenda.map((line, i) => (
              <li
                key={`agenda-${i}`}
                style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}
              >
                {line}
              </li>
            ))}
          </ul>
        )}
      </CanvasBlock>

      {/* Required attendees */}
      <CanvasBlock label="Required attendees">
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {nextWorkshop.requiredAttendees.map((a, i) => (
            <li
              key={`req-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 180px) 1fr',
                gap: 10,
                alignItems: 'baseline',
              }}
            >
              <RoleChip role={a.role} />
              <span style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}>
                {a.reason}
              </span>
            </li>
          ))}
        </ul>
      </CanvasBlock>

      {/* Optional SMEs */}
      {nextWorkshop.optionalSmes.length > 0 ? (
        <CanvasBlock label="Optional SMEs">
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {nextWorkshop.optionalSmes.map((a, i) => (
              <li
                key={`sme-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(140px, 180px) 1fr',
                  gap: 10,
                  alignItems: 'baseline',
                }}
              >
                <RoleChip role={a.role} />
                <span style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}>
                  {a.reason}
                </span>
              </li>
            ))}
          </ul>
        </CanvasBlock>
      ) : null}

      {/* Pre-read */}
      <CanvasBlock label="Pre-read">
        <BulletList items={nextWorkshop.preReadList} />
      </CanvasBlock>

      {/* Questions to ask */}
      <CanvasBlock label="Questions to ask">
        <BulletList items={nextWorkshop.questionsToAsk} />
      </CanvasBlock>

      {/* Likely tensions */}
      <CanvasBlock label="Likely tensions">
        <BulletList items={nextWorkshop.likelyTensions} />
      </CanvasBlock>

      {/* Decisions needed */}
      <CanvasBlock label="Decisions needed">
        <BulletList items={nextWorkshop.decisionsNeeded} />
      </CanvasBlock>

      {/* Evidence to capture */}
      <CanvasBlock label="Evidence to capture">
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {nextWorkshop.evidenceToCapture.map((e, i) => (
            <li
              key={`evidence-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr',
                gap: 10,
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: e.required ? COLORS.navy : COLORS.mutedSoft,
                }}
              >
                {e.required ? 'Required' : 'Optional'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>
                  {e.label}
                </span>
                <span
                  style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.45 }}
                >
                  {e.reason}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CanvasBlock>

      {/* Expected outputs */}
      <CanvasBlock label="Expected outputs">
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {nextWorkshop.expectedOutputs.map((o, i) => (
            <li
              key={`output-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: 10,
                alignItems: 'baseline',
              }}
            >
              <OutputKindChip kind={o.kind} />
              <span style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}>
                {o.description}
              </span>
            </li>
          ))}
        </ul>
      </CanvasBlock>
    </main>
  );
}

function CanvasBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: ReadonlyArray<string> }) {
  if (items.length === 0) {
    return <EmptyLine text="None." />;
  }
  return (
    <ul
      style={{
        listStyle: 'disc',
        paddingLeft: 18,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {items.map((line, i) => (
        <li
          key={`bullet-${i}`}
          style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}
        >
          {line}
        </li>
      ))}
    </ul>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <span style={{ fontSize: 12, color: COLORS.mutedSoft, fontStyle: 'italic' }}>
      {text}
    </span>
  );
}

function RoleChip({ role }: { role: string }) {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: COLORS.navy,
        background: COLORS.navySoft,
        border: `1px solid rgba(27, 43, 92, 0.20)`,
        borderRadius: 6,
        padding: '2px 8px',
        display: 'inline-block',
      }}
    >
      {role.replace(/_/g, ' ')}
    </span>
  );
}

function OutputKindChip({ kind }: { kind: string }) {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: COLORS.muted,
        background: COLORS.borderSoft,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        padding: '2px 8px',
        display: 'inline-block',
      }}
    >
      {kind.replace(/_/g, ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------
// Right context panel
// ---------------------------------------------------------------------

function RightContextPanel({
  evidenceUsable,
  gateImplication,
  gatekeeperAgent,
  honestDisclaimer,
}: {
  evidenceUsable: number;
  gateImplication: string;
  gatekeeperAgent: 'steward';
  honestDisclaimer: string;
}) {
  return (
    <aside
      aria-label="Workshop context panel"
      data-region="right-context-panel"
      style={{
        borderLeft: `1px solid ${COLORS.border}`,
        background: COLORS.surface,
        padding: '14px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 320,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        Workshop context
      </span>

      {/* Evidence usable count */}
      <div
        style={{
          padding: '10px 12px',
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
          }}
        >
          Evidence usable
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.ink,
            lineHeight: 1.2,
          }}
        >
          {evidenceUsable}
        </span>
        <span style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.45 }}>
          Deterministic count from the workshop readiness record.
        </span>
      </div>

      {/* Gate implication */}
      <div
        style={{
          padding: '10px 12px',
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `3px solid ${COLORS.amber}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.amber,
            fontWeight: 700,
          }}
        >
          Gate implication
        </span>
        <p style={{ margin: 0, fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}>
          {gateImplication}
        </p>
      </div>

      {/* Steward verdict */}
      <div
        style={{
          padding: '10px 12px',
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `3px solid ${COLORS.navy}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
        data-gatekeeper-agent={gatekeeperAgent}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          Steward verdict
        </span>
        <span style={{ fontSize: 12, color: COLORS.body, lineHeight: 1.5 }}>
          Steward is the gatekeeper agent for this workshop. Live verdict
          ingestion is not wired in PW1.
        </span>
      </div>

      {/* Honest disclaimer */}
      <div
        style={{
          padding: '10px 12px',
          background: COLORS.surface2,
          border: `1px dashed ${COLORS.border}`,
          borderRadius: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: COLORS.muted,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          {honestDisclaimer}
        </span>
      </div>

      {/* Future placeholders */}
      <div
        style={{
          padding: '10px 12px',
          background: COLORS.card,
          border: `1px dashed ${COLORS.borderSoft}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
          }}
        >
          Live workshop notes
        </span>
        <span style={{ fontSize: 11, color: COLORS.mutedSoft, fontStyle: 'italic' }}>
          Coming soon · PW2 wires Maestro-typed capture.
        </span>
      </div>

      <div
        style={{
          padding: '10px 12px',
          background: COLORS.card,
          border: `1px dashed ${COLORS.borderSoft}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
          }}
        >
          Deliverable refinement
        </span>
        <span style={{ fontSize: 11, color: COLORS.mutedSoft, fontStyle: 'italic' }}>
          Coming soon · PW3 wires Stub → Outline → Rich promotion.
        </span>
      </div>
    </aside>
  );
}
