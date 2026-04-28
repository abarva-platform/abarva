'use client';

// SHELL-B — Program Detail Page adapted to AppShell.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { PhaseStrip } from '@/components/shell/PhaseStrip';
import type { PhaseStripSlot } from '@/components/shell/PhaseStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ProgramDetailView } from '@/lib/programs/programs-types';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgramDetailPageProps {
  view: ProgramDetailView;
}

// ─── Gate pill ────────────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramDetailView['gateStatus'] }) {
  let bg: string;
  let color: string;
  let label: string;

  switch (status) {
    case 'pending':
      bg = SHELL.PEACH_BG;
      color = SHELL.PEACH_TEXT;
      label = 'Gate Pending';
      break;
    case 'open':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Open';
      break;
    case 'approved':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Approved';
      break;
    default:
      bg = SHELL.GRAY_BG;
      color = SHELL.GRAY_TEXT;
      label = status === 'idle' ? 'Idle' : 'Gate N/A';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Gate criteria ────────────────────────────────────────────────────────────

function GateCriteriaList({
  criteria,
}: {
  criteria: NonNullable<ProgramDetailView['phasePanel']['gateCriteria']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Gate criteria
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {criteria.map((g, i) => (
          <div
            key={`gc-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 12px',
              borderRadius: 7,
              background: g.met
                ? SHELL.MINT_BG
                : SHELL.PEACH_BG,
              border: `1px solid ${g.met ? SHELL.MINT_LINE : SHELL.PEACH_LINE}`,
            }}
          >
            {/* Circle icon */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                flexShrink: 0,
                background: g.met ? SHELL.MINT_TEXT : 'transparent',
                border: g.met ? 'none' : `1.5px solid ${SHELL.INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {g.met && (
                <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>
              )}
            </div>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: g.met ? SHELL.MINT_TEXT : SHELL.INK,
                lineHeight: 1.4,
              }}
            >
              {g.criterion}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: g.met ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
              }}
            >
              {g.met ? 'Met' : 'Open'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

function DeliverablesList({
  deliverables,
}: {
  deliverables: NonNullable<ProgramDetailView['phasePanel']['deliverables']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Deliverables
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {deliverables.map((d, i) => {
          const statusDotColor =
            d.status === 'done'
              ? SHELL.MINT_TEXT
              : d.status === 'blocked'
              ? SHELL.RUST_TEXT
              : SHELL.AMBER_DOT;

          return (
            <div
              key={`del-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 12px',
                borderRadius: 7,
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusDotColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK,
                  flex: 1,
                  lineHeight: 1.4,
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: statusDotColor,
                }}
              >
                {d.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SuggestedActionOverlay ───────────────────────────────────────────────────

interface SuggestedActionOverlayProps {
  action: { letter: 'A' | 'B' | 'C'; text: string; detail?: string; frame: 1 | 2 | 3 };
  onAdvance: () => void;
  onDismiss: () => void;
}

function SuggestedActionOverlay({ action, onAdvance, onDismiss }: SuggestedActionOverlayProps) {
  const ghostBtn: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 10,
    color: 'rgba(250,247,241,0.8)',
    background: 'none',
    border: '1px solid rgba(250,247,241,0.3)',
    borderRadius: 6,
    padding: '7px 14px',
    cursor: 'pointer',
    letterSpacing: '0.06em',
  };
  const solidBtn: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 10,
    color: SHELL.INK,
    background: SHELL.PAPER,
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    cursor: 'pointer',
    letterSpacing: '0.06em',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 320,
        background: SHELL.INK,
        borderRadius: 12,
        padding: '20px 24px',
        width: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
        zIndex: 800,
      }}
    >
      {action.frame === 1 && (
        <>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: 'rgba(250,247,241,0.7)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Nexus suggests
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 15,
              color: SHELL.PAPER,
              lineHeight: 1.4,
              marginBottom: 4,
            }}
          >
            {action.text}
          </div>
          {action.detail && (
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: 'rgba(250,247,241,0.7)',
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {action.detail}
            </div>
          )}
          {!action.detail && <div style={{ marginBottom: 16 }} />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={ghostBtn} onClick={onDismiss}>Dismiss</button>
            <button style={solidBtn} onClick={onAdvance}>Proceed →</button>
          </div>
        </>
      )}

      {action.frame === 2 && (
        <>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: 'rgba(250,247,241,0.7)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Confirm action
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 15,
              color: SHELL.PAPER,
              lineHeight: 1.4,
              marginBottom: 6,
            }}
          >
            Are you sure you want to: {action.text}?
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: 'rgba(250,247,241,0.7)',
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            This will be logged in the program activity stream.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={ghostBtn} onClick={onDismiss}>← Back</button>
            <button style={solidBtn} onClick={onAdvance}>Confirm and proceed</button>
          </div>
        </>
      )}

      {action.frame === 3 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: SHELL.MINT_TEXT,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: SHELL.MINT_TEXT,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Action logged
            </span>
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 14,
              color: SHELL.PAPER,
              lineHeight: 1.4,
              marginBottom: 6,
            }}
          >
            {action.text}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: 'rgba(250,247,241,0.7)',
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            Added to the program activity stream. Nexus will follow up.
          </div>
          <button style={solidBtn} onClick={onDismiss}>Close</button>
        </>
      )}
    </div>
  );
}

// ─── FileUploadOverlay ────────────────────────────────────────────────────────

interface FileUploadOverlayProps {
  programName: string;
  onClose: () => void;
}

function FileUploadOverlay({ programName: _programName, onClose }: FileUploadOverlayProps) {
  const [uploadState, setUploadState] = useState<{
    name: string;
    size: string;
    stage: 'uploading' | 'parsing' | 'done';
  } | null>(null);

  const simulateUpload = () => {
    if (uploadState) return; // already running
    const fileName = 'Workshop-5-Output-Apr2026.pdf';
    setUploadState({ name: fileName, size: '1.2 MB', stage: 'uploading' });
    setTimeout(
      () => setUploadState((s) => (s ? { ...s, stage: 'parsing' } : null)),
      1200,
    );
    setTimeout(
      () => setUploadState((s) => (s ? { ...s, stage: 'done' } : null)),
      2800,
    );
  };

  const progressPct =
    uploadState?.stage === 'uploading'
      ? 33
      : uploadState?.stage === 'parsing'
      ? 70
      : 100;

  const insightChips: Array<{ label: string; bg: string }> = [
    { label: 'Value hypothesis gap identified', bg: SHELL.PEACH_BG },
    { label: 'Workshop 5 completion criteria confirmed', bg: SHELL.MINT_BG },
    { label: 'Privacy boundary reference found', bg: SHELL.BLUE_BG },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: SHELL.PAPER,
        borderLeft: `1px solid ${SHELL.CARD_LINE}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 900,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SHELL.INK,
          }}
        >
          Upload document
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: SHELL.SANS,
            fontSize: 18,
            color: SHELL.INK_MUTED,
            lineHeight: 1,
            padding: '0 2px',
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Upload zone / progress */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
        {!uploadState ? (
          <div
            onClick={simulateUpload}
            style={{
              margin: 24,
              border: `2px dashed ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: SHELL.PAPER_SOFT,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 15,
                color: SHELL.INK,
                marginBottom: 6,
              }}
            >
              Drop a file here
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_MUTED,
              }}
            >
              or click to browse · PDF, DOCX, PPTX up to 25MB
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 24px 0' }}>
            {/* File info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  color: SHELL.INK,
                }}
              >
                {uploadState.name}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.06em',
                }}
              >
                {uploadState.size}
              </span>
            </div>

            {/* Stage indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    uploadState.stage === 'done' ? SHELL.MINT_TEXT : SHELL.AMBER_DOT,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color:
                    uploadState.stage === 'done' ? SHELL.MINT_TEXT : SHELL.INK_MUTED,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                }}
              >
                {uploadState.stage === 'uploading' && 'Uploading...'}
                {uploadState.stage === 'parsing' && 'Nexus is parsing document...'}
                {uploadState.stage === 'done' && 'Document parsed · 3 insights extracted'}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: SHELL.CARD_LINE,
                marginBottom: 20,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: SHELL.MINT_TEXT,
                  width: `${progressPct}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* Insight chips (shown when done) */}
            {uploadState.stage === 'done' && (
              <>
                <div
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: SHELL.INK_MUTED,
                    marginBottom: 10,
                  }}
                >
                  Extracted insights
                </div>
                <div style={{ marginBottom: 20 }}>
                  {insightChips.map((chip) => (
                    <div
                      key={chip.label}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        color: SHELL.INK,
                        background: chip.bg,
                        padding: '4px 10px',
                        borderRadius: 10,
                        marginBottom: 6,
                        display: 'inline-block',
                        marginRight: 4,
                      }}
                    >
                      {chip.label}
                    </div>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 11,
                    color: SHELL.PAPER,
                    background: SHELL.INK,
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                  }}
                >
                  Add to program evidence →
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Nexus advisory */}
      <div
        style={{
          background: SHELL.PAPER_SOFT,
          padding: '12px 16px',
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 4,
          }}
        >
          Nexus
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            lineHeight: 1.5,
          }}
        >
          Documents are parsed for evidence and linked to the current phase. Nexus will flag
          relevant gate criteria.
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProgramDetailPage({ view }: ProgramDetailPageProps) {
  const router = useRouter();

  const phaseLabel = PHASE_LABEL_MAP[view.viewingPhase] ?? `Phase ${view.viewingPhase}`;

  // Map ProgramPhaseSlot to PhaseStripSlot
  const stripPhases: PhaseStripSlot[] = view.phases.map((s) => ({
    id: s.id as PhaseStripSlot['id'],
    label: s.label,
    state: s.state,
  }));

  const handlePhaseSelect = (id: PhaseStripSlot['id']) => {
    router.push(`/programs/${view.programId}?phase=${id}`, { scroll: false });
  };

  // Cast actions for AgentColumn
  const agentActions = view.workbench.actions.map((a) => ({
    letter: a.letter as 'A' | 'B' | 'C',
    text: a.text,
    detail: a.detail,
  }));

  // ── overlay state ──────────────────────────────────────────────────────────
  const [suggestedAction, setSuggestedAction] = useState<{
    letter: 'A' | 'B' | 'C';
    text: string;
    detail?: string;
    frame: 1 | 2 | 3;
  } | null>(null);

  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleActionClick = (letter: 'A' | 'B' | 'C') => {
    const action = view.workbench.actions.find((a) => a.letter === letter);
    if (action) {
      setSuggestedAction({
        letter: action.letter as 'A' | 'B' | 'C',
        text: action.text,
        detail: action.detail,
        frame: 1,
      });
    }
  };

  return (
    <AppShell
      surface="programs"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `${view.displayId} · P${view.viewingPhase} ${phaseLabel}`,
      }}
      middleStrip={
        <PhaseStrip phases={stripPhases} onPhaseSelect={handlePhaseSelect} />
      }
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' }}
        quote={view.workbench.prose}
        agentContext={view.workbench.title}
        actions={agentActions}
        onActionClick={handleActionClick}
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Program header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                fontWeight: 700,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.06em',
              }}
            >
              {view.displayId}
            </span>
            <GatePill status={view.gateStatus} />
            {/* Upload affordance */}
            <button
              onClick={() => setShowFileUpload(true)}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_SOFT,
                background: 'none',
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 5,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              ↑ Upload document
            </button>
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 600,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {view.name}
          </h1>
        </div>

        {/* Gate criteria */}
        {view.phasePanel.gateCriteria && view.phasePanel.gateCriteria.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <GateCriteriaList criteria={view.phasePanel.gateCriteria} />
          </div>
        )}

        {/* Deliverables */}
        {view.phasePanel.deliverables && view.phasePanel.deliverables.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <DeliverablesList deliverables={view.phasePanel.deliverables} />
          </div>
        )}

        {/* Blocker note */}
        {view.phasePanel.blockerNote && (
          <div
            style={{
              marginBottom: 20,
              padding: '10px 14px',
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 7,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.PEACH_TEXT,
              lineHeight: 1.5,
            }}
          >
            {view.phasePanel.blockerNote}
          </div>
        )}

        {/* Linked source event */}
        {view.linkedSourceEvent && (
          <div>
            <span
              style={{
                display: 'inline-block',
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                padding: '3px 10px',
                borderRadius: 999,
                border: `1px solid ${SHELL.CARD_LINE}`,
                background: SHELL.CARD_WHITE,
              }}
            >
              {'→ '}{view.linkedSourceEvent}
            </span>
          </div>
        )}
      </div>

      {/* Overlays */}
      {suggestedAction && (
        <SuggestedActionOverlay
          action={suggestedAction}
          onAdvance={() =>
            setSuggestedAction((s) =>
              s ? { ...s, frame: (s.frame < 3 ? s.frame + 1 : 3) as 1 | 2 | 3 } : null,
            )
          }
          onDismiss={() => setSuggestedAction(null)}
        />
      )}

      {showFileUpload && (
        <FileUploadOverlay
          programName={view.name}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </AppShell>
  );
}
