'use client';

// I1 · INT-IDX-LIBRARY — Client island for the Intelligence Index Sentinel panel.
//
// Handles all client-side interactivity for the Intelligence index:
//   1. AgentColumn action dispatch (A/B navigate via router, C opens modal)
//   2. PatternSubmitModal state (open/close + form)
//
// No data fetching, no live model calls, no Date.now / Math.random.
// The view data (agentQuote, agentContext, actions) comes from the server-side
// INTELLIGENCE_INDEX_VIEW fixture and is passed as props to avoid importing
// the fixture in the client bundle unnecessarily.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentColumn, type AgentAction } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── PatternSubmitModal ───────────────────────────────────────────────────────

interface PatternSubmitModalProps {
  onClose: () => void;
}

function PatternSubmitModal({ onClose }: PatternSubmitModalProps) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState<'T1' | 'T2' | 'T3' | null>(null);
  const [problem, setProblem] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (name.trim() === '' || tier === null) return;
    setSubmitted(true);
    setTimeout(() => onClose(), 2500);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: 6,
    padding: '8px 12px',
    fontFamily: SHELL.SANS,
    fontSize: 13,
    background: SHELL.PAPER,
    color: SHELL.INK,
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
    display: 'block',
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(12,26,58,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: 32,
          maxWidth: 520,
          width: '100%',
          margin: '10vh auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            Submit a Pattern
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.1em',
            }}
          >
            Sn · Pattern submission
          </div>
        </div>

        {submitted ? (
          /* Success state */
          <div>
            <div
              style={{
                padding: '14px 16px',
                background: SHELL.MINT_BG,
                border: `1px solid ${SHELL.MINT_LINE}`,
                borderRadius: 8,
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.MINT_TEXT,
                marginBottom: 20,
              }}
            >
              ✓ Submitted — Sentinel will begin review within one cycle.
            </div>
            <button
              onClick={onClose}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.08em',
                color: SHELL.INK_SOFT,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          /* Form */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pattern name */}
            <div>
              <label style={labelStyle}>Pattern name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Predictive Churn Signal"
              />
            </div>

            {/* Tier */}
            <div>
              <label style={labelStyle}>Tier</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['T1', 'T2', 'T3'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    style={{
                      padding: '5px 16px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      background: tier === t ? SHELL.INK : SHELL.GRAY_BG,
                      color: tier === t ? SHELL.PAPER : SHELL.INK_SOFT,
                      transition: 'background 120ms ease, color 120ms ease',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem statement */}
            <div>
              <label style={labelStyle}>Problem statement</label>
              <textarea
                rows={3}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                style={inputStyle}
                placeholder="Describe the problem this pattern addresses…"
              />
            </div>

            {/* Evidence links */}
            <div>
              <label style={labelStyle}>Evidence links (optional)</label>
              <textarea
                rows={2}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                style={inputStyle}
                placeholder="https://…"
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button
                onClick={onClose}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: SHELL.INK_SOFT,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={name.trim() === '' || tier === null}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  background: name.trim() === '' || tier === null ? SHELL.GRAY_BG : SHELL.INK,
                  color: name.trim() === '' || tier === null ? SHELL.INK_MUTED : SHELL.PAPER,
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 18px',
                  cursor: name.trim() === '' || tier === null ? 'not-allowed' : 'pointer',
                  transition: 'background 120ms ease, color 120ms ease',
                }}
              >
                Submit for Sentinel review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IntelligenceIndexSentinelPanel ──────────────────────────────────────────

interface IntelligenceIndexSentinelPanelProps {
  agentQuote: string;
  agentContext: string;
  actions: AgentAction[];
}

export function IntelligenceIndexSentinelPanel({
  agentQuote,
  agentContext,
  actions,
}: IntelligenceIndexSentinelPanelProps) {
  const router = useRouter();
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  return (
    <>
      <AgentColumn
        agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
        quote={agentQuote}
        agentContext={agentContext}
        actions={actions}
        surface="intelligence"
        onActionClick={(letter) => {
          if (letter === 'A') router.push('/intelligence?filter=validated');
          else if (letter === 'B') router.push('/intelligence?filter=in-review');
          else if (letter === 'C') setShowSubmitModal(true);
        }}
      />
      {showSubmitModal && (
        <PatternSubmitModal onClose={() => setShowSubmitModal(false)} />
      )}
    </>
  );
}
