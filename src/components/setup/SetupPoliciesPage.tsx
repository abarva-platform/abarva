'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { POLICIES_FIXTURE, POLICIES_AGENT_VOICE, type PolicyItem } from '@/lib/setup/shell-setup-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', href: '/admin' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', active: true, href: '/admin/policies' },
  { key: 'tenant', label: 'Tenant', href: '/admin/tenant' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

function statusPillStyle(status: PolicyItem['status']): { bg: string; text: string; label: string } {
  if (status === 'active') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Active' };
  if (status === 'review-due') return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Review due' };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Draft' };
}

function cardStyle(status: PolicyItem['status']): React.CSSProperties {
  if (status === 'review-due') {
    return {
      padding: '12px 16px',
      borderRadius: 7,
      marginBottom: 8,
      border: '1px solid ' + SHELL.PEACH_LINE,
      background: SHELL.PEACH_BG,
    };
  }
  if (status === 'draft') {
    return {
      padding: '12px 16px',
      borderRadius: 7,
      marginBottom: 8,
      border: '1px solid ' + SHELL.GRAY_LINE,
      background: SHELL.GRAY_BG,
    };
  }
  return {
    padding: '12px 16px',
    borderRadius: 7,
    marginBottom: 8,
    border: '1px solid ' + SHELL.CARD_LINE,
    background: SHELL.CARD_WHITE,
  };
}

// ─── Policy Review Modal ──────────────────────────────────────────────────────

interface PolicyReviewModalProps {
  policy: PolicyItem;
  onClose: () => void;
}

const CHECKLIST_ITEMS = [
  'Policy text reviewed and approved as current',
  'Scope and applicability confirmed',
  'Owner and next-review date updated',
  'Stakeholder sign-off received',
];

function PolicyReviewModal({ policy, onClose }: PolicyReviewModalProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<'none' | 'update' | ''>('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  const pill = statusPillStyle(policy.status);
  const allChecked = checkedItems.length === CHECKLIST_ITEMS.length;
  const canComplete = allChecked && outcome !== '';

  function toggleItem(item: string) {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  function handleComplete() {
    setCompleted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(12,26,58,0.40)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: SHELL.CARD_WHITE,
          borderRadius: 12,
          border: `1px solid ${SHELL.CARD_LINE}`,
          maxWidth: 500,
          width: '100%',
          padding: '28px 28px 24px',
          boxShadow: '0 12px 48px rgba(12,26,58,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
              lineHeight: 1,
            }}
          >
            Policy Review
          </div>
          <h2
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontWeight: 700,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {policy.name}
          </h2>
        </div>

        {/* Status row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: pill.text,
              background: pill.bg,
              borderRadius: 10,
              padding: '3px 9px',
              lineHeight: 1,
            }}
          >
            {pill.label}
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
            }}
          >
            Last reviewed: {policy.lastReviewed === '—' ? 'Never' : policy.lastReviewed}
          </span>
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 8,
            }}
          >
            Review checklist
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CHECKLIST_ITEMS.map((item) => {
              const checked = checkedItems.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleItem(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 7,
                    border: `1px solid ${checked ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
                    background: checked ? SHELL.MINT_BG : SHELL.CARD_WHITE,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 120ms ease, border-color 120ms ease',
                  }}
                >
                  {/* Circle icon */}
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `1.5px solid ${checked ? SHELL.MINT_TEXT : SHELL.CARD_LINE}`,
                      background: checked ? SHELL.MINT_TEXT : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#fff',
                      fontSize: 11,
                      lineHeight: 1,
                    }}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 13,
                      color: checked ? SHELL.MINT_TEXT : SHELL.INK,
                      lineHeight: 1.4,
                    }}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Outcome field */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 8,
            }}
          >
            Review Outcome
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['none', 'update'] as const).map((opt) => {
              const label = opt === 'none' ? 'No changes needed' : 'Update required';
              const selected = outcome === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setOutcome(opt)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: `1px solid ${selected ? SHELL.INK : SHELL.CARD_LINE}`,
                    background: selected ? SHELL.INK : 'transparent',
                    color: selected ? '#fff' : SHELL.INK_MUTED,
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    fontWeight: selected ? 600 : 400,
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    transition: 'all 120ms ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes field */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Review notes (optional)
          </div>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this review…"
            style={{
              width: '100%',
              borderRadius: 7,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.PAPER,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK,
              padding: '8px 12px',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Completion message */}
        {completed && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.MINT_TEXT,
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            ✓ Policy review logged · next review scheduled for {policy.nextReview}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 7,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: 'transparent',
              color: SHELL.INK_MUTED,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={!canComplete || completed}
            style={{
              padding: '8px 18px',
              borderRadius: 7,
              border: 'none',
              background: canComplete && !completed ? SHELL.INK : SHELL.GRAY_BG,
              color: canComplete && !completed ? '#fff' : SHELL.GRAY_TEXT,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 600,
              cursor: canComplete && !completed ? 'pointer' : 'not-allowed',
              transition: 'background 120ms ease',
            }}
          >
            Complete review
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Policy Card ──────────────────────────────────────────────────────────────

function PolicyCard({
  item,
  onStartReview,
}: {
  item: PolicyItem;
  onStartReview: (policy: PolicyItem) => void;
}) {
  const pill = statusPillStyle(item.status);
  const canReview = item.status === 'review-due' || item.status === 'draft';

  return (
    <div style={cardStyle(item.status)}>
      {/* Top row: name + status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 600,
            color: SHELL.INK,
            lineHeight: 1.3,
          }}
        >
          {item.name}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: pill.text,
            background: pill.bg,
            borderRadius: 10,
            padding: '3px 9px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {pill.label}
        </span>
      </div>

      {/* Bottom row: category · last reviewed · next review · owner · start review */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {item.category}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          Last: {item.lastReviewed}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
          }}
        >
          Next: {item.nextReview}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_SOFT,
          }}
        >
          {item.owner}
        </span>
        {canReview && (
          <button
            onClick={() => onStartReview(item)}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.PEACH_TEXT,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            → Start review
          </button>
        )}
      </div>
    </div>
  );
}

export function SetupPoliciesPage() {
  const [reviewPolicy, setReviewPolicy] = useState<PolicyItem | null>(null);

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Setup · Policies · 5 items',
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Setup Orchestrator' }}
        quote={POLICIES_AGENT_VOICE.quote}
        actions={POLICIES_AGENT_VOICE.actions}
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
        {/* Eyebrow + header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
              lineHeight: 1,
            }}
          >
            Setup
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 24,
              fontWeight: 700,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Policies · 5 items
          </h1>
        </div>

        {/* Policy cards */}
        <div>
          {POLICIES_FIXTURE.map((policy) => (
            <PolicyCard key={policy.id} item={policy} onStartReview={setReviewPolicy} />
          ))}
        </div>
      </div>

      {/* Policy review modal */}
      {reviewPolicy && (
        <PolicyReviewModal policy={reviewPolicy} onClose={() => setReviewPolicy(null)} />
      )}
    </AppShell>
  );
}
