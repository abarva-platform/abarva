// Intelligence decision-home empty state.
//
// P1-1 (synthetic pilot rehearsal, 2026-05-22): a brand-new tenant — Northwind
// in the rehearsal — resolves an `industryKey` from its `industry_code` and
// the spine function key from the industry → function map, but it has no OWN
// registered substrate. Without this empty state, the route would resolve
// Apex's `(retail, customer_care)` binding and render Apex's named content
// labelled with Northwind's name (cross-tenant content leak).
//
// This component renders an honest "Intelligence for {tenant} is not yet
// populated" panel with a link to the onboarding runbook. It does NOT
// fabricate industry-level content; the empty state is the fallback when
// no audited substrate exists for THIS tenant.
//
// Pure server component. AbarVa locked palette only — cream `#F8F7F4`,
// established serif/body fonts. No new colours.

import { SHELL } from '@/lib/shell/shell-tokens';

interface IntelligenceEmptyStateProps {
  /** The active tenant's display name, e.g. "Northwind Retail". */
  tenantName: string;
  /**
   * Optional industry label, e.g. "retail". Surfaced so the empty state can
   * say "Intelligence for Northwind Retail (retail) is not yet populated";
   * omit when not resolved.
   */
  industryLabel?: string | null;
}

export function IntelligenceEmptyState({
  tenantName,
  industryLabel,
}: IntelligenceEmptyStateProps) {
  return (
    <div
      data-testid="intelligence-decision-empty-state"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: SHELL.SANS,
        color: SHELL.INK_SOFT,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 800,
        }}
      >
        Intelligence · Which AI bet to make first
      </span>
      <h1
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 28,
          lineHeight: 1.18,
          color: SHELL.INK,
          fontWeight: 'normal',
        }}
      >
        Intelligence for {tenantName} is not yet populated.
      </h1>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.6,
          color: SHELL.INK_SOFT,
        }}
      >
        The function-aware bet-selection surface binds an audited tenant
        substrate to the curated Domain Function Pack. {tenantName} has no
        substrate registered yet
        {industryLabel ? ` for the ${industryLabel} vertical` : ''}, so the
        surface will not render another tenant&apos;s analysis labelled with
        your name. That would be dishonest — and a cross-tenant content leak.
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.6,
          color: SHELL.INK_SOFT,
        }}
      >
        To populate Intelligence: add a baseline metric set for your function,
        or run the new-tenant onboarding flow that wires the substrate, the
        spine function, and the bound pack together.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
        <a
          href="/docs/pilot/ONBOARDING-NEW-TENANT.md"
          data-testid="intelligence-empty-runbook-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: SHELL.INK,
            color: SHELL.PAPER,
            padding: '10px 16px',
            fontFamily: SHELL.MONO,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          New-tenant onboarding runbook
        </a>
        <a
          href="/admin/setup"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: 'transparent',
            color: SHELL.INK,
            padding: '10px 16px',
            fontFamily: SHELL.MONO,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: `1px solid ${SHELL.INK}`,
          }}
        >
          Open Admin Setup
        </a>
      </div>
    </div>
  );
}
