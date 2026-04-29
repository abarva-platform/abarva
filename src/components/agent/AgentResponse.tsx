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
import { getHonestDisclosureViewModel } from '@/lib/agent/rendered-response-ui';
import { AgentMarkdown } from '@/lib/agent/markdownRenderer';
import { AgentCitation } from './AgentCitation';
import { SparsitySignal } from './SparsitySignal';
import { HandoffAffordance } from './HandoffAffordance';
import { HonestDisclosureBanner } from './HonestDisclosureBanner';
import { ConfidenceQualifier } from './ConfidenceQualifier';

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
 * Builds the placeholder→React-node map that <AgentMarkdown> uses to
 * substitute `{{cite:type:id}}` placeholders inline. Both the original
 * placeholder text (`citation.placeholder`) and the canonical form
 * (`{{cite:type:id}}`) are mapped to the same pill so either grammar
 * resolves correctly.
 *
 * Unresolved placeholders (hallucinated, stripped by Stage 6) would never
 * reach this function per §4.6 failure semantics; if one does the
 * markdown renderer will surface it as literal text — visibly broken,
 * which is the desired failure mode.
 */
function buildCitationNodeMap(
  citations: Citation[],
  accent: string,
  compact: boolean,
): Map<string, ReactNode> {
  const map = new Map<string, ReactNode>();
  citations.forEach((citation, idx) => {
    const node = (
      <AgentCitation
        key={`cite-${idx}`}
        citation={citation}
        accent={accent}
        compact={compact}
      />
    );
    map.set(citation.placeholder, node);
    map.set(`{{cite:${citation.target_type}:${citation.target_id}}}`, node);
  });
  return map;
}

export function AgentResponse({
  response,
  accent = '#0E9F8C',
  onFollowUp,
  compactCitations = true,
}: AgentResponseProps) {
  const citationNodes = buildCitationNodeMap(response.citations, accent, compactCitations);
  const viewModel = getHonestDisclosureViewModel(response);

  return (
    <div className="agent-response" style={{ fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      {viewModel.bannerKind ? (
        <div style={{ marginBottom: 12 }}>
          <HonestDisclosureBanner
            kind={viewModel.bannerKind}
            detail={viewModel.bannerDetail}
            qualityIssue={viewModel.qualityIssueLabel}
          />
        </div>
      ) : null}

      {response.sparsity_flag ? (
        <SparsitySignal evidenceSummary={viewModel.sparsityEvidenceSummary} />
      ) : null}

      <div
        className="agent-response-body"
        style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: '#1a1612',
        }}
      >
        <AgentMarkdown text={response.response_text} inlineNodes={citationNodes} />
      </div>

      {viewModel.confidence
        || viewModel.contextCategoriesUsed.length > 0
        || viewModel.missingInputs.length > 0 ? (
        <div
          className="agent-response-disclosure-footer"
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px dashed rgba(26,22,18,0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#5a5148',
          }}
        >
          {viewModel.confidence ? (
            <ConfidenceQualifier
              tier={viewModel.confidence.tier}
              accent={accent}
              detail={viewModel.confidence.reason}
            />
          ) : null}

          {viewModel.contextCategoriesUsed.length > 0 ? (
            <div className="agent-context-used" aria-label="Context used" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#8a7e72',
                }}
              >
                Context used
              </span>
              {viewModel.contextCategoriesUsed.map((label) => (
                <span
                  key={`ctx-${label}`}
                  className="agent-context-chip"
                  style={{
                    padding: '1px 8px',
                    borderRadius: 999,
                    background: 'rgba(26,22,18,0.04)',
                    border: '1px solid rgba(26,22,18,0.08)',
                    color: '#3d342d',
                    fontSize: 11,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {viewModel.missingInputs.length > 0 ? (
            <div className="agent-missing-inputs" aria-label="Missing inputs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#8a7e72',
                }}
              >
                Missing
              </span>
              {viewModel.missingInputs.slice(0, 3).map((label) => (
                <span
                  key={`miss-${label}`}
                  className="agent-missing-chip"
                  style={{
                    padding: '1px 8px',
                    borderRadius: 999,
                    background: 'rgba(217,119,6,0.08)',
                    border: '1px solid rgba(217,119,6,0.18)',
                    color: '#7c4a04',
                    fontSize: 11,
                  }}
                >
                  {label}
                </span>
              ))}
              {viewModel.missingInputs.length > 3 ? (
                <span style={{ fontSize: 11, color: '#8a7e72' }}>
                  +{viewModel.missingInputs.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

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
