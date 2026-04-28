'use client';

// RibbonSynthesis · Shell Layout Spec v2 §5.2 — Mode B teaser bar
//
// A compact 40px horizontal strip anchored at the top of the working canvas.
// Shows a truncated version of the current synthesis quote plus the agent
// identity, and exposes a "Chat" button to summon the AtlasDrawer.
//
// When the drawer is open the button flips to a "Close" affordance.
//
// Shell Layout Spec v2 §5.2 · April 2026

import { SHELL } from '@/lib/shell/shell-tokens';

export interface RibbonSynthesisProps {
  /** Agent initials shown in the small glyph circle. */
  agentInitials: string;
  /** Agent display name (Nexus, Steward, etc.). */
  agentName: string;
  /** Synthesis quote — truncated to one line in the ribbon. */
  quote: string;
  /** Whether the AtlasDrawer is currently open. */
  isOpen: boolean;
  /** Called when the Chat / Close button is clicked. */
  onToggle: () => void;
}

export function RibbonSynthesis({
  agentInitials,
  agentName,
  quote,
  isOpen,
  onToggle,
}: RibbonSynthesisProps) {
  // Strip HTML tags from the quote for the plain-text ribbon display.
  const plainQuote = quote.replace(/<[^>]+>/g, '');

  return (
    <div
      style={{
        height: 40,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: '0 20px',
        background: SHELL.INK,
        borderBottom: '1px solid rgba(250,247,241,0.12)',
      }}
    >
      {/* Agent glyph */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: SHELL.PAPER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 9,
            fontWeight: 600,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          {agentInitials}
        </span>
      </div>

      {/* Agent name chip */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: 'rgba(250,247,241,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          flexShrink: 0,
        }}
      >
        {agentName}
      </span>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 12,
          background: 'rgba(250,247,241,0.15)',
          flexShrink: 0,
        }}
      />

      {/* Truncated synthesis quote */}
      <span
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 12.5,
          fontStyle: 'italic',
          color: 'rgba(250,247,241,0.70)',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          lineHeight: 1,
          letterSpacing: '-0.005em',
        }}
      >
        {plainQuote}
      </span>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? `Close ${agentName} chat` : `Chat with ${agentName}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 12px',
          borderRadius: 14,
          background: isOpen
            ? 'rgba(250,247,241,0.12)'
            : 'rgba(250,247,241,0.14)',
          border: '1px solid rgba(250,247,241,0.20)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
      >
        {/* Chat bubble icon */}
        {!isOpen && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path
              d="M1 1.5h9v6H7l-1.5 2-1.5-2H1V1.5z"
              stroke="rgba(250,247,241,0.7)"
              strokeWidth="1.2"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: 'rgba(250,247,241,0.75)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {isOpen ? 'Close ×' : `Chat ${agentName}`}
        </span>
      </button>
    </div>
  );
}
