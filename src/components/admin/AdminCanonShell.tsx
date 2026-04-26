'use client';

// DES8 · AdminCanonShell.
//
// Canonical Admin page shell + workflow orientation primitive.
//
// Wraps an admin page with a calm AbarVa visual frame:
//   - warm off-white surface (`#FBFAF7`)
//   - DM Sans typography
//   - generous whitespace
//   - navy (`#1B2B5C`) as the single accent — no teal, no green,
//     no purple, no neon
//
// Adds a one-line workflow strip below the header so every admin
// surface answers the canonical workflow questions
// (`pageQuestion`, `primaryAgent`, `whatIsKnown`, `whatIsMissing`,
// `recommendedNextAction`, `caveat`) defined in
// `docs/product/page-workflow-catalog/11_PAGE_DATA_CONTRACT_STANDARD.md`.
//
// Pure visual + structural component. No data fetching, no model
// calls, no agent runtime imports. All colors are hand-rendered to
// the AbarVa canon to keep the file self-contained for static
// hygiene checks.

import * as React from 'react';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type AdminAgentKey = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export interface AdminCanonShellWorkflowMeta {
  /** Single primary user question the page exists to answer. */
  pageQuestion: string;
  /** Anchor agent for the surface. */
  primaryAgent: AdminAgentKey;
  /** Optional 1-line summary of what the page knows today. */
  whatIsKnown?: string;
  /** Optional 1-line summary of what is missing. */
  whatIsMissing?: string;
  /** Optional verb-led recommended next action. */
  recommendedNextAction?: string;
  /** Optional deterministic / live-status caveat. */
  caveat?: string;
}

export interface AdminCanonShellProps {
  /** Optional eyebrow line, e.g. "Admin · Production". */
  eyebrow?: string;
  /** Page title. Required. */
  title: string;
  /** 1–2 sentence page summary rendered below the title. */
  description?: string;
  /** Optional workflow metadata strip below the header. */
  workflow?: AdminCanonShellWorkflowMeta;
  /** Optional top-right action slot (buttons, links, etc.). */
  actions?: React.ReactNode;
  /** Page content. */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------
// Local color tokens — hand-rendered to AbarVa canon. These match
// `src/lib/design/abarva-theme.ts` exactly. Hand-rendering keeps the
// file self-contained for static color-hygiene tests and avoids any
// risk of accidental token drift.
// ---------------------------------------------------------------------

const COLOR_SURFACE = '#FBFAF7';
const COLOR_CARD = '#FFFFFF';
const COLOR_BORDER = '#E8E6E1';
const COLOR_INK = '#0A0C12';
const COLOR_BODY = '#1F2433';
const COLOR_MUTED = '#525866';
const COLOR_NAVY = '#1B2B5C';

const FONT_BODY =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export function AdminCanonShell(props: AdminCanonShellProps) {
  const { eyebrow, title, description, workflow, actions, children } = props;

  return (
    <div
      data-canon="admin-shell"
      style={{
        background: COLOR_SURFACE,
        minHeight: '100vh',
        padding: '32px 32px 64px',
        fontFamily: FONT_BODY,
        color: COLOR_BODY,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Header row: eyebrow + title + description on the left, actions slot on the right. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow ? (
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: COLOR_MUTED,
                  marginBottom: 8,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <h1
              style={{
                fontFamily: FONT_BODY,
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 1.2,
                color: COLOR_INK,
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              {title}
            </h1>
            {description ? (
              <p
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: 1.55,
                  color: COLOR_BODY,
                  maxWidth: 720,
                  margin: '12px 0 0 0',
                }}
              >
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
              }}
            >
              {actions}
            </div>
          ) : null}
        </div>

        {/* Workflow orientation strip. */}
        {workflow ? (
          <div
            data-canon="admin-shell-workflow"
            style={{
              marginTop: 20,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 18,
              background: COLOR_CARD,
              border: `1px solid ${COLOR_BORDER}`,
              borderRadius: 12,
              padding: '14px 18px',
              fontFamily: FONT_BODY,
              fontSize: 13,
              lineHeight: 1.45,
              color: COLOR_BODY,
            }}
          >
            <WorkflowField
              label="Anchor"
              value={capitalizeAgent(workflow.primaryAgent)}
            />
            <WorkflowField label="Question" value={workflow.pageQuestion} />
            {workflow.whatIsKnown ? (
              <WorkflowField label="Known" value={workflow.whatIsKnown} />
            ) : null}
            {workflow.whatIsMissing ? (
              <WorkflowField label="Missing" value={workflow.whatIsMissing} />
            ) : null}
            {workflow.recommendedNextAction ? (
              <WorkflowField
                label="Next"
                value={workflow.recommendedNextAction}
              />
            ) : null}
            {workflow.caveat ? (
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 12,
                  color: COLOR_MUTED,
                  marginLeft: 'auto',
                }}
              >
                {workflow.caveat}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Content area. */}
        <div style={{ marginTop: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function WorkflowField({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLOR_NAVY,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: 13,
          color: COLOR_BODY,
        }}
      >
        {value}
      </span>
    </span>
  );
}

function capitalizeAgent(agent: AdminAgentKey): string {
  return agent.charAt(0).toUpperCase() + agent.slice(1);
}
