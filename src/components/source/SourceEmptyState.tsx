import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SHELL } from '@/lib/shell/shell-tokens';

// The Source events portfolio empty state.
//
// Renders as a single full-width centered panel inside the working pane.
// (The earlier version dropped a fixed-width AgentColumn — built for a ROW
// layout — into AppShell's COLUMN flexbox, which collapsed the working pane
// to zero height and left the right ~70% of the screen blank white.)
//
// P1-2 (synthetic pilot rehearsal, 2026-05-22): tenant-named — a brand-new
// tenant lands here with zero source events. The empty state names the tenant
// explicitly and points at the onboarding runbook, so a Northwind user sees
// "No source events for Northwind Retail yet — see runbook" instead of an
// anonymous "no events" panel that could read as a broken surface.

const NEXT_STEPS: ReadonlyArray<{ label: string; detail: string; href: string }> = [
  {
    label: 'Review setup connectors',
    detail: 'Confirm contract, spend, and telemetry connectors are configured before sourcing.',
    href: '/admin/setup',
  },
  {
    label: 'Portfolio guide',
    detail: 'How the 10-stage sourcing lifecycle tracker works, end to end.',
    href: '/source/learn',
  },
  {
    label: 'New-tenant onboarding runbook',
    detail: 'How a brand-new tenant wires the ingest pipeline so source events appear here.',
    href: '/docs/pilot/ONBOARDING-NEW-TENANT.md',
  },
];

interface SourceEmptyStateProps {
  /** Active tenant display name — used to make the empty-state copy honest and tenant-named. */
  tenantName?: string;
}

export function SourceEmptyState({ tenantName }: SourceEmptyStateProps = {}) {
  const displayName = tenantName?.trim() || 'this tenant';
  return (
    <SourceWorkingPane>
      <div
        data-testid="source-events-empty-state"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '72vh',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            maxWidth: 560,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              fontWeight: 800,
            }}
          >
            Source · Events portfolio
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 30,
              lineHeight: 1.18,
              color: SHELL.INK,
              fontWeight: 'normal',
            }}
          >
            No source events for {displayName} yet
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: SHELL.SANS,
              fontSize: 14,
              lineHeight: 1.6,
              color: SHELL.INK_SOFT,
            }}
          >
            Source events arrive via the ingest pipeline. Create your first
            sourcing event below, or see the new-tenant onboarding runbook for
            how to wire the ingest pipeline that populates this queue.
          </p>
          <a
            href="/source/new"
            data-testid="source-empty-start-event"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 6,
              borderRadius: 999,
              background: SHELL.INK,
              color: SHELL.PAPER,
              padding: '11px 20px',
              fontFamily: SHELL.MONO,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Start IT sourcing event
          </a>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            maxWidth: 560,
            width: '100%',
            marginTop: 30,
            textAlign: 'left',
          }}
        >
          {NEXT_STEPS.map((step) => (
            <a
              key={step.label}
              href={step.href}
              style={{
                display: 'grid',
                gap: 5,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 12,
                background: SHELL.CARD_WHITE,
                padding: '13px 15px',
                textDecoration: 'none',
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
                {step.label}
              </span>
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: SHELL.INK_MUTED,
                }}
              >
                {step.detail}
              </span>
            </a>
          ))}
        </div>
      </div>
    </SourceWorkingPane>
  );
}
