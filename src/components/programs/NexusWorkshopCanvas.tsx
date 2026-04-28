'use client';

// PROG12 · Nexus Workshop / Center Canvas.
//
// Workshop briefing surface for the center of the Program page. Renders
// the next workshop's objective, agenda, attendees, tensions, decisions
// needed, evidence to capture, expected outputs, and a placeholder for
// proposed program updates.
//
// Read-only and deterministic. NO live notes, NO model summarisation,
// NO fake decisions, NO runtime writes. Calls
// buildNexusWorkshopCanvasView internally; takes only an optional
// programLabel override.

import {
  buildNexusWorkshopCanvasView,
  type NexusWorkshopCanvasViewModel,
  type SmeRole,
  type WorkshopReadinessState,
} from '@/lib/programs/nexus-workshop-canvas-view';

const COLORS = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#525866',
  border: '#E8E6E1',
  borderSoft: '#F0EEEA',
  card: '#FFFFFF',
  surface: '#FBFAF7',
  navy: '#1B2B5C',
  navySoft: 'rgba(27, 43, 92, 0.08)',
  navyStrong: 'rgba(27, 43, 92, 0.16)',
  amber: '#B45309',
  amberSoft: 'rgba(180, 83, 9, 0.10)',
  red: '#9A1F1F',
  redSoft: 'rgba(154, 31, 31, 0.10)',
} as const;

const FONT_BODY = 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif';

export interface NexusWorkshopCanvasProps {
  programLabel?: string;
}

const SME_ROLE_LABELS: Record<SmeRole, string> = {
  'business-sponsor': 'Business sponsor',
  'data-architect': 'Data architect',
  'change-lead': 'Change lead',
  'platform-owner': 'Platform owner',
  'analytics-lead': 'Analytics lead',
  'product-lead': 'Product lead',
  'security-officer': 'Security officer',
  'finance-partner': 'Finance partner',
};

export function NexusWorkshopCanvas({ programLabel }: NexusWorkshopCanvasProps) {
  const view = buildNexusWorkshopCanvasView(
    programLabel !== undefined ? { programLabel } : undefined,
  );

  return (
    <section
      data-nexus-workshop-canvas="prog12"
      aria-label="Nexus workshop canvas"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        fontFamily: FONT_BODY,
        color: COLORS.ink,
        overflow: 'hidden',
      }}
    >
      <CanvasHeader view={view} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
          padding: 16,
          background: COLORS.surface,
        }}
      >
        <LeftColumn view={view} />
        <RightColumn view={view} />
      </div>

      <footer
        style={{
          padding: '14px 24px',
          borderTop: `1px solid ${COLORS.border}`,
          background: COLORS.card,
          fontSize: 12,
          fontStyle: 'italic',
          color: COLORS.muted,
          lineHeight: 1.55,
        }}
      >
        {view.caveat}
      </footer>
    </section>
  );
}

// ---------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------

function CanvasHeader({ view }: { view: NexusWorkshopCanvasViewModel }) {
  return (
    <header
      style={{
        background: COLORS.card,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              fontWeight: 500,
            }}
          >
            Workshop {view.workshopNumber} · {view.phaseLabel}
          </span>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.ink,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {view.workshopTitle}
          </h2>
          <span
            style={{
              fontSize: 13,
              color: COLORS.muted,
              marginTop: 2,
            }}
          >
            Anchor: Nexus · {view.programLabel}
          </span>
        </div>
        <ReadinessChip state={view.readinessState} />
      </div>

      <p
        style={{
          fontSize: 15,
          color: COLORS.body,
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 760,
        }}
      >
        {view.objective}
      </p>
    </header>
  );
}

function ReadinessChip({ state }: { state: WorkshopReadinessState }) {
  const styles: Record<
    WorkshopReadinessState,
    { bg: string; fg: string; label: string }
  > = {
    ready: { bg: COLORS.navySoft, fg: COLORS.navy, label: 'Ready' },
    partial: { bg: COLORS.amberSoft, fg: COLORS.amber, label: 'Partial' },
    blocked: { bg: COLORS.redSoft, fg: COLORS.red, label: 'Blocked' },
  };
  const s = styles[state];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        background: s.bg,
        color: s.fg,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.02em',
      }}
    >
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------
// Left column
// ---------------------------------------------------------------------

function LeftColumn({ view }: { view: NexusWorkshopCanvasViewModel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="Agenda">
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {view.agenda.map((item) => (
            <li
              key={item.itemId}
              style={{
                display: 'flex',
                gap: 10,
                paddingBottom: 10,
                borderBottom: `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: COLORS.navy,
                  marginTop: 8,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: COLORS.ink,
                    }}
                  >
                    {item.label}
                  </span>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>
                    {item.durationMinutes} min
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: COLORS.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {item.questionToAsk}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Attendees">
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {view.attendees.map((row) => (
            <li
              key={row.role}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                paddingBottom: 8,
                borderBottom: `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: COLORS.ink,
                    fontWeight: 500,
                    flex: 1,
                    minWidth: 140,
                  }}
                >
                  {SME_ROLE_LABELS[row.role]}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: row.required ? COLORS.navySoft : COLORS.borderSoft,
                    color: row.required ? COLORS.navy : COLORS.muted,
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  {row.required ? 'Required' : 'Optional'}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: row.confirmed ? COLORS.navy : COLORS.amber,
                    fontWeight: 500,
                    minWidth: 100,
                    textAlign: 'right',
                  }}
                >
                  {row.confirmed ? '✓ Confirmed' : '• Not confirmed'}
                </span>
              </div>
              {row.reasonIfMissing !== null && (
                <span
                  style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: COLORS.muted,
                    paddingLeft: 2,
                  }}
                >
                  {row.reasonIfMissing}
                </span>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Likely tensions">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {view.tensions.map((t) => (
            <div
              key={t.tensionId}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.borderSoft}`,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: COLORS.ink,
                }}
              >
                {t.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: COLORS.body,
                  lineHeight: 1.5,
                }}
              >
                {t.description}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------
// Right column
// ---------------------------------------------------------------------

function RightColumn({ view }: { view: NexusWorkshopCanvasViewModel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="Decisions needed">
        <ol
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            counterReset: 'decision',
          }}
        >
          {view.decisionsNeeded.map((d, idx) => (
            <li
              key={d.decisionId}
              style={{
                display: 'flex',
                gap: 12,
                paddingBottom: 10,
                borderBottom: `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  borderRadius: 999,
                  background: COLORS.navySoft,
                  color: COLORS.navy,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {idx + 1}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: COLORS.ink,
                  }}
                >
                  {d.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: COLORS.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {d.rationale}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Evidence to capture">
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {view.evidenceToCapture.map((e) => (
            <li
              key={e.evidenceId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                paddingBottom: 8,
                borderBottom: `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <span
                style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}
              >
                {e.label}
              </span>
              <span style={{ fontSize: 12, color: COLORS.muted }}>
                Source: {e.source}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Expected outputs">
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {view.expectedOutputs.map((o) => (
            <li
              key={o.outputId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                paddingBottom: 8,
                borderBottom: `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: COLORS.ink,
                  fontWeight: 500,
                  flex: 1,
                  minWidth: 160,
                }}
              >
                {o.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: COLORS.navySoft,
                  color: COLORS.navy,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {o.artifactType}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div
        style={{
          background: COLORS.navySoft,
          border: `1px solid ${COLORS.navyStrong}`,
          borderRadius: 10,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Proposed program updates
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: COLORS.body,
            lineHeight: 1.55,
          }}
        >
          {view.proposedUpdatesPlaceholder}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}
