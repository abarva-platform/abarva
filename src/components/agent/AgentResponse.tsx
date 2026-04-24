'use client';

// AgentResponse · File 08 Sections 4.6, 4.7, 7, 9, 10, 12 rendering contract
//
// Single component that reads a `RenderedResponse` and produces the UI
// every agent bubble shows. This is the Stage-7 renderer; Codex's Stage-6
// assembly produces the shape, Code (this file) renders it.
//
// Layout per §4.6 output:
//   1. SparsitySignal (§4.7, §10.4) — first if sparsity_flag
//   2. Response text with citation placeholders resolved inline to
//      <AgentCitation> pills/superscripts (§9)
//   3. Follow-up action chips (§5 closers, §6 rendering)
//   4. Handoff affordance (§12.2) as explicit button
//
// What this file does NOT do: invoke Claude, retrieve context, load
// patterns. It assumes the `RenderedResponse` is already assembled.
// Codex's runtime produces the shape; this component trusts it.

import type { ReactNode } from 'react';
import type { Citation, RenderedResponse } from '@/lib/agent/renderedResponse';
import { AgentCitation } from './AgentCitation';
import { SparsitySignal } from './SparsitySignal';
import { HandoffAffordance } from './HandoffAffordance';

interface AgentResponseProps {
  response: RenderedResponse;
  /**
   * Accent color for citations and follow-up chips. Defaults to Nexus
   * teal; consumers in other zones pass Sentinel purple / Atlas amber /
   * Steward blue.
   */
  accent?: string;
  /**
   * Optional click handler for follow-up action chips. When the chip's
   * kind is `next_turn`, the consumer typically routes back through the
   * agent's intake pipeline with the label as input.
   */
  onFollowUp?: (actionId: string) => void;
  /**
   * When true, citations render as compact superscripts where possible
   * (see AgentCitation). Use for dense prose; disable for section layouts.
   */
  compactCitations?: boolean;
}

/**
 * Resolves citation placeholders in response_text to inline React nodes.
 * Placeholder grammar: `{{cite:<target_type>:<target_id>}}` — emitted by
 * Claude at Stage 5 and preserved through Stage 6 assembly.
 *
 * Unresolved placeholders (hallucinated, stripped by Stage 6) would never
 * reach this function per §4.6 failure semantics; if one does we render
 * it as plain broken text so the reader sees the bug rather than a gap.
 */
function renderWithCitations(
  text: string,
  citations: Citation[],
  accent: string,
  compact: boolean,
): ReactNode[] {
  const byPlaceholder = new Map<string, Citation>(citations.map((c) => [c.placeholder, c]));
  // Also allow matching by `{{cite:type:id}}` fallback if the placeholder
  // field was filled with the canonical form.
  const byCanonical = new Map<string, Citation>(
    citations.map((c) => [`{{cite:${c.target_type}:${c.target_id}}}`, c]),
  );

  const parts: ReactNode[] = [];
  const regex = /\{\{cite:[a-z_]+:[^}]+\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const placeholder = match[0];
    const citation = byPlaceholder.get(placeholder) ?? byCanonical.get(placeholder);
    if (citation) {
      parts.push(
        <AgentCitation key={`cite-${keyCounter++}`} citation={citation} accent={accent} compact={compact} />,
      );
    } else {
      // §4.6 failure: stripped placeholder that leaked through. Render as
      // visibly broken text.
      parts.push(
        <span
          key={`cite-broken-${keyCounter++}`}
          className="citation-broken"
          title="Unresolved citation placeholder"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#c97b5b', background: 'rgba(201,123,91,0.08)', padding: '0 4px', borderRadius: 3 }}
        >
          {placeholder}
        </span>,
      );
    }
    lastIndex = match.index + placeholder.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function AgentResponse({
  response,
  accent = '#0E9F8C',
  onFollowUp,
  compactCitations = true,
}: AgentResponseProps) {
  const rendered = renderWithCitations(response.response_text, response.citations, accent, compactCitations);

  return (
    <div className="agent-response" style={{ fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      {response.sparsity_flag ? <SparsitySignal /> : null}

      <div
        className="agent-response-body"
        style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: '#1a1612',
          whiteSpace: 'pre-wrap',
        }}
      >
        {rendered}
      </div>

      {response.follow_up_actions.length > 0 ? (
        <div
          className="agent-response-followups"
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(26,22,18,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#8a7e72',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Next
          </div>
          {response.follow_up_actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                if (action.kind === 'navigate' && action.target) {
                  if (typeof window !== 'undefined') window.location.assign(action.target);
                  return;
                }
                onFollowUp?.(action.id);
              }}
              className="agent-followup-chip"
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid rgba(26,22,18,0.12)',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                color: '#1a1612',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent;
                e.currentTarget.style.background = `${accent}0A`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26,22,18,0.12)';
                e.currentTarget.style.background = '#FFFFFF';
              }}
            >
              <span style={{ display: 'block', fontWeight: 500 }}>{action.label}</span>
              {action.sub ? (
                <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: '#8a7e72' }}>{action.sub}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {response.handoff_affordance ? (
        <div style={{ marginTop: 12 }}>
          <HandoffAffordance affordance={response.handoff_affordance} />
        </div>
      ) : null}
    </div>
  );
}
