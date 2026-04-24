'use client';

// HandoffAffordance · File 08 Section 12
//
// The explicit "hand to another agent" button that renders at the tail
// of an agent response when `handoff_affordance` is set. Per §12.4 this
// is the ONLY way handoffs happen — no silent agent swapping, always
// user-initiated.
//
// Click behavior per §12.3: context travels via sessionStorage keyed by
// the target agent, then the user navigates to `target_href`. The target
// agent's Stage 2 intake reads the session key to populate
// `handoff_context`, uses it, and clears the key.
//
// Why sessionStorage and not URL: URL would leak the carried context to
// logs and the browser history. Session is tab-scoped and ephemeral —
// matches the "handoff is a conversation action, not a bookmarkable
// state" spirit of §12.

import type { HandoffAffordance as HandoffShape } from '@/lib/agent/renderedResponse';

const AGENT_LABELS: Record<HandoffShape['to_agent'], { name: string; glyph: string; accent: string }> = {
  nexus: { name: 'Nexus', glyph: '\u2731', accent: '#0E9F8C' },
  sentinel: { name: 'Sentinel', glyph: '\u25C8', accent: '#9B6DFF' },
  atlas: { name: 'Atlas', glyph: '\u25B2', accent: '#F59E0B' },
  steward: { name: 'Steward', glyph: '\u25C6', accent: '#3B82F6' },
};

const SESSION_KEY = (agent: string) => `abarva.handoff.${agent}`;

interface HandoffAffordanceProps {
  affordance: HandoffShape;
}

export function HandoffAffordance({ affordance }: HandoffAffordanceProps) {
  const target = AGENT_LABELS[affordance.to_agent];

  function onClick() {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        SESSION_KEY(affordance.to_agent),
        JSON.stringify({
          reason: affordance.reason,
          context_carried: affordance.context_carried,
          origin_href: typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
          ts: new Date().toISOString(),
        }),
      );
    } catch {
      // sessionStorage disabled (private mode, quota) — the target agent
      // will open without handoff context and disclose that fact. Don't
      // block the navigation.
    }
    window.location.assign(affordance.target_href);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="agent-handoff-affordance"
      data-to-agent={affordance.to_agent}
      title={`${affordance.reason} \u00b7 carries: ${affordance.context_carried}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: `${target.accent}10`,
        border: `1px solid ${target.accent}55`,
        borderRadius: 10,
        color: target.accent,
        cursor: 'pointer',
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        fontSize: 13,
        fontWeight: 500,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${target.accent}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${target.accent}10`;
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: target.accent,
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {target.glyph}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span style={{ fontWeight: 600 }}>{`Hand to ${target.name} \u2192`}</span>
        <span style={{ fontSize: 11, color: '#6d625a', fontWeight: 400 }}>
          {affordance.reason}
        </span>
      </span>
    </button>
  );
}

/**
 * Read the handoff context stashed by a previous agent before navigation.
 * Call this from the target agent's intake (Stage 2) to populate
 * `handoff_context` per §12.3. Clears the session key on read so the
 * handoff is one-shot.
 */
export function consumeHandoffContext(agent: HandoffShape['to_agent']): {
  reason: string;
  context_carried: string;
  origin_href: string | null;
  ts: string;
} | null {
  if (typeof window === 'undefined') return null;
  const key = SESSION_KEY(agent);
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    window.sessionStorage.removeItem(key);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
