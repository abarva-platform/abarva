'use client';

// PROG10 · Program Flagship Page Shell.
//
// Visual + structural shell for the flagship Program detail
// experience. Composes existing AbarVa primitives via slot props
// supplied by sibling lanes PROG11–14:
//   - phaseGateSlot              → PROG11
//   - workshopCanvasSlot         → PROG12
//   - deliverablesEvidenceSlot   → PROG13
//   - actionMissionStripSlot     → PROG14
//
// The shell does NOT replace ProgramCanonicalDetail. It is a NEW
// reference example for AbarVa's full operating experience: a
// calm executive program brief, workflow orientation strip, a
// two-column "what the page knows / what's missing" panel, and
// four composition slots.
//
// Canon discipline:
//   - Surface #FBFAF7, card #FFFFFF, border #E8E6E1
//   - Ink #0A0C12, body #1F2433, muted #525866
//   - NAVY accent #1B2B5C — no teal, no purple, no neon
//   - One selective dark navy panel (#0F1E3F) for the executive brief
//   - DM Sans body face. Calm hierarchy.
//
// Workflow contract: this surface is deterministic, seed-backed,
// and read-only. No mutations, no live model calls, no transitions.

import * as React from 'react';
import {
  buildProgramFlagshipView,
  type ProgramFlagshipMissingRow,
} from '@/lib/programs/program-flagship-view';

// ----- canon tokens (inline so this shell never drifts) ---------------

const SURFACE = '#FBFAF7';
const CARD = '#FFFFFF';
const BORDER = '#E8E6E1';
const INK = '#0A0C12';
const BODY = '#1F2433';
const MUTED = '#525866';
const NAVY = '#1B2B5C';
const NAVY_DARK_PANEL = '#0F1E3F';
const NAVY_SOFT = 'rgba(27,43,92,0.08)';

const FONT_BODY =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ----- props ----------------------------------------------------------

export interface ProgramFlagshipPageProps {
  tenantSlug: string;
  programSlug: string;
  programName?: string;
  tenantLabel?: string;
  programCode?: string;

  phaseGateSlot?: React.ReactNode;
  workshopCanvasSlot?: React.ReactNode;
  deliverablesEvidenceSlot?: React.ReactNode;
  actionMissionStripSlot?: React.ReactNode;
}

// ----- shared style fragments ----------------------------------------

const cardShellStyle: React.CSSProperties = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: '20px 22px',
};

const eyebrowStyle: React.CSSProperties = {
  fontFamily: FONT_BODY,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: MUTED,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: FONT_BODY,
  fontSize: 15,
  fontWeight: 600,
  color: INK,
  margin: 0,
};

// ----- agent badge (small label, never an avatar) --------------------

function AgentBadge({ label }: { label: string }) {
  return (
    <span
      data-component="ProgramFlagshipAgentBadge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: NAVY_SOFT,
        color: NAVY,
        fontFamily: FONT_BODY,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

// ----- unblockedBy chip (small, calm, no neon) -----------------------

function UnblockedByChip({
  unblockedBy,
}: {
  unblockedBy: ProgramFlagshipMissingRow['unblockedBy'];
}) {
  const label = unblockedBy.toUpperCase();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 6,
        border: `1px solid ${BORDER}`,
        background: SURFACE,
        color: MUTED,
        fontFamily: FONT_BODY,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.10em',
      }}
    >
      Unblocked by {label}
    </span>
  );
}

// ----- placeholder for unfilled slots --------------------------------

function SlotPlaceholder({ note }: { note: string }) {
  return (
    <div
      style={{
        ...cardShellStyle,
        borderStyle: 'dashed',
        color: MUTED,
        fontFamily: FONT_BODY,
        fontSize: 13,
      }}
    >
      {note}
    </div>
  );
}

// ----- main component -------------------------------------------------

export function ProgramFlagshipPage(props: ProgramFlagshipPageProps) {
  const {
    tenantSlug,
    programSlug,
    programName,
    tenantLabel,
    programCode,
    phaseGateSlot,
    workshopCanvasSlot,
    deliverablesEvidenceSlot,
    actionMissionStripSlot,
  } = props;

  const view = buildProgramFlagshipView({
    tenantSlug,
    programSlug,
    programName,
    tenantLabel,
    programCode,
  });

  return (
    <main
      data-component="ProgramFlagshipPage"
      style={{
        background: SURFACE,
        minHeight: '100%',
        padding: '32px 28px 48px',
        fontFamily: FONT_BODY,
        color: BODY,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Section 1 — Executive Program Brief (selective dark navy panel) */}
        <section
          data-section="executive-brief"
          style={{
            background: NAVY_DARK_PANEL,
            color: '#FFFFFF',
            borderRadius: 16,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {view.brief.tenantLabel} · {view.brief.programCode}
            </span>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap',
              }}
            >
              as of {view.brief.asOf}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: FONT_BODY,
              fontSize: 24,
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '-0.005em',
            }}
          >
            {view.brief.programName}
          </h1>

          <p
            style={{
              margin: 0,
              fontFamily: FONT_BODY,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 820,
            }}
          >
            {view.brief.briefSummary}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.10)',
                color: '#FFFFFF',
                fontFamily: FONT_BODY,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
              }}
            >
              Phase · {view.brief.currentPhaseLabel}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.10)',
                color: '#FFFFFF',
                fontFamily: FONT_BODY,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'capitalize',
              }}
            >
              Health · {view.brief.programHealth}
            </span>
          </div>
        </section>

        {/* Section 2 — Workflow orientation strip */}
        <section
          data-section="workflow-orientation"
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={eyebrowStyle}>Anchor agent</span>
            <AgentBadge label="Nexus" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={eyebrowStyle}>Question</span>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 14,
                color: BODY,
                lineHeight: 1.45,
              }}
            >
              {view.pageQuestion}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={eyebrowStyle}>Next</span>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 600,
                color: NAVY,
                lineHeight: 1.45,
              }}
            >
              {view.recommendedNextAction.verb}
            </span>
          </div>
        </section>

        {/* Section 3 — What the page knows / what's missing */}
        <section
          data-section="knows-missing"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          <div style={cardShellStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 style={sectionTitleStyle}>What AbarVa knows</h2>
              <span style={eyebrowStyle}>
                {view.whatThePageKnows.length} signals
              </span>
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {view.whatThePageKnows.map((row, idx) => (
                <li
                  key={row.key}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 0',
                    borderTop:
                      idx === 0 ? 'none' : `1px solid ${BORDER}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 13,
                      color: MUTED,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 14,
                      fontWeight: 600,
                      color: INK,
                      textAlign: 'right',
                    }}
                  >
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div style={cardShellStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 style={sectionTitleStyle}>What&apos;s missing</h2>
              <span style={eyebrowStyle}>
                {view.whatThePageIsMissing.length} gaps
              </span>
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {view.whatThePageIsMissing.map((row, idx) => (
                <li
                  key={row.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '12px 0',
                    borderTop:
                      idx === 0 ? 'none' : `1px solid ${BORDER}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 14,
                        fontWeight: 600,
                        color: INK,
                      }}
                    >
                      {row.label}
                    </span>
                    <UnblockedByChip unblockedBy={row.unblockedBy} />
                  </div>
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 13,
                      color: MUTED,
                      lineHeight: 1.5,
                    }}
                  >
                    {row.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 4 — Phase journey + gate canvas slot */}
        <section data-section="phase-gate">
          {phaseGateSlot ?? (
            <SlotPlaceholder note="Phase journey & gate canvas — provided by PROG11." />
          )}
        </section>

        {/* Section 5 — Nexus workshop canvas slot */}
        <section data-section="workshop-canvas">
          {workshopCanvasSlot ?? (
            <SlotPlaceholder note="Nexus workshop canvas — provided by PROG12." />
          )}
        </section>

        {/* Section 6 — Deliverables + evidence panel slot */}
        <section data-section="deliverables-evidence">
          {deliverablesEvidenceSlot ?? (
            <SlotPlaceholder note="Deliverables & evidence — provided by PROG13." />
          )}
        </section>

        {/* Section 7 — Agent action / mission resume strip slot */}
        <section data-section="action-mission-strip">
          {actionMissionStripSlot ?? (
            <SlotPlaceholder note="Action & mission strip — provided by PROG14." />
          )}
        </section>

        {/* Footer caveat */}
        <p
          style={{
            margin: '8px 4px 0',
            fontFamily: FONT_BODY,
            fontSize: 12,
            fontStyle: 'italic',
            color: MUTED,
            lineHeight: 1.55,
          }}
        >
          {view.caveat}
        </p>
      </div>
    </main>
  );
}

export default ProgramFlagshipPage;
